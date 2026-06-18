# Pipeline 10: Package Update

> **For beginners**: Updates a hall's pricing package — changes rates,
> adds or removes pricing options, and updates related records like
> snapshots.

## Purpose

Updates an existing mandapam package with multi-language translations, function list sync, new pricing tier creation, and status toggle. Single-write pipeline (read queries use direct Prisma). Replaces `MandapamService.updatePackage()`.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/admin/mandapam/packages/:id` | PATCH | `adminMutationLimiter` (60/window) |

**Allowed Roles:** `ADMIN`

## High-Level Architecture

```
  ┌─ PATCH /admin/mandapam/packages/:id ───────────────────────────────┐
  │  ctx = { id, input: { displayName?, functions?, pricing?,        │
  │                       status? } }                                  │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S6], ctx)                                   │
  │                                                                       │
  │  PRE-TRANSACTION (S1-S2):                                            │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S1. resolvePackageById(ctx)                                 │   │
  │  │     └── SELECT package + translations + functions + pricings │   │
  │  │         if !existing → 404 MANDAMAP_PACKAGE_NOT_FOUND       │   │
  │  │                                                              │   │
  │  │ S2. validatePackageUpdateData(ctx)                          │   │
  │  │     └── Validate TranslationPair arrays have valid language  │   │
  │  │         Validate function refs are UUIDs (when id present)   │   │
  │  │         Validate pricing.amount > 0                          │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  $transaction (S3-S5):                                              │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S3. upsertPackageTranslations(ctx)                           │   │
  │  │     └── for each t in input.displayName:                     │   │
  │  │           UPSERT mandapam_package_translation                │   │
  │  │           WHERE packageId_language = { id, t.language }      │   │
  │  │           UPDATE displayName = t.value                       │   │
  │  │           CREATE IF NOT EXISTS                               │   │
  │  │                                                              │   │
  │  │ S4. syncFunctionList(ctx)                                    │   │
  │  │     └── for each fn in input.functions:                      │   │
  │  │           ┌── fn.id PRESENT → UPDATE status + UPSERT name   │   │
  │  │           └── fn.id ABSENT  → CREATE + INSERT translations  │   │
  │  │                                                              │   │
  │  │ S5. createNewPricingTier(ctx)  [conditional: if pricing]    │   │
  │  │     └── meta = PACKAGE_METADATA[existing.code]              │   │
  │  │         INSERT mandapam_package_pricing (packageId,         │   │
  │  │           pricingType: meta.pricingType, amount, currency)  │   │
  │  │                                                              │   │
  │  │ S6. updatePackageStatus(ctx)  [conditional: if status]      │   │
  │  │     └── UPDATE mandapam_package SET status = input.status   │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  POST-TRANSACTION (S7):                                             │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S7. setPackageResponse(ctx)                                  │   │
  │  │     └── Refetch package with all relations → { package }     │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
                       { package: MandapamPackage }
```

## Low-Level Architecture — Step by Step

### S1: resolvePackageById

```
====================================================================================
S1: resolvePackageById  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id (package UUID)

Prisma query:
  existing = prisma.mandapamPackage.findUnique({
    where: { id },
    include: {
      translations: true,
      functions: { include: { translations: true } },
      pricings: { where: { isActive: true } }
    }
  })

  if !existing → throw AppError(404, MANDAMAP_PACKAGE_NOT_FOUND)

Output: ctx.existingPackage = existing (full package with relations)
====================================================================================
```

### S4: syncFunctionList

```
====================================================================================
S4: syncFunctionList  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id (packageId), ctx.input.functions[]
        Schema: [{ id?: string, name: TranslationPair[], status?: boolean }]

Logic:
  for each fn in ctx.input.functions:
    if fn.id:
      // UPDATE existing function
      existingFn = tx.mandapamPackageFunction.findUnique({ where: { id: fn.id } })
      if !existingFn || existingFn.packageId !== ctx.id:
        continue  // skip orphaned references

      tx.mandapamPackageFunction.update({
        where: { id: fn.id },
        data: { status: fn.status ?? existingFn.status }
      })

      if fn.name:
        for each t in fn.name:
          tx.mandapamPackageFunctionTranslation.upsert({
            where: { functionId_language: { functionId: fn.id, language: t.language } },
            update: { name: t.value },
            create: { functionId: fn.id, language: t.language, name: t.value }
          })
    else:
      // CREATE new function
      newFn = tx.mandapamPackageFunction.create({
        data: { packageId: ctx.id, status: fn.status ?? true }
      })
      for each t in fn.name:
        tx.mandapamPackageFunctionTranslation.create({
          data: { functionId: newFn.id, language: t.language, name: t.value }
        })

Output: none
====================================================================================
```

### S5: createNewPricingTier

```
====================================================================================
S5: createNewPricingTier  [INSIDE $transaction — conditional: input.pricing provided]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.existingPackage.code, ctx.input.pricing

PACKAGE_METADATA = {
  STANDARD: { bookingType: 'HOURLY',    durationType: 'CUSTOM_HOURS', pricingType: 'HOURLY' },
  ROYAL:    { bookingType: 'DAY_BASED', durationType: 'FIXED_DAY',   pricingType: 'FIXED',  durationValue: 1 },
  GRAND:    { bookingType: 'DAY_BASED', durationType: 'FIXED_DAY',   pricingType: 'FIXED',  durationValue: 2 },
}

Logic:
  meta = PACKAGE_METADATA[ctx.existingPackage.code]

  tx.mandapamPackagePricing.create({
    data: {
      packageId: ctx.id,
      pricingType: meta.pricingType,
      amount: ctx.input.pricing.amount,
      currencyCode: ctx.input.pricing.currencyCode ?? 'INR',
      isActive: ctx.input.pricing.isActive ?? true,
    }
  })

Output: none
====================================================================================
```

## Dependencies

None (all steps are pipeline-specific — package operations are unique)

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| Package not found | S1 | 404 | MANDAMAP_PACKAGE_NOT_FOUND |
| Invalid language code in translations | S2 | 400 | VALIDATION_ERROR |
| Negative pricing amount | S2 | 400 | VALIDATION_ERROR |
```
