# Pipeline 11: Catalog Entity

> **For beginners**: CRUD operations for hall facilities and addons — create,
> read, update, delete. Each entity supports English + Tamil names.

## Purpose

Unified CRUD for facilities and addons — both share the exact same pattern (create/update/delete/list with bilingual translations). Discriminated by `entityType` parameter. Replaces `MandapamService` facility + addon CRUD methods.

## Actor & Entry

| Route | Method | entityType | action |
|-------|--------|------------|--------|
| `/admin/mandapam/facilities` | GET | `facility` | `LIST` |
| `/admin/mandapam/facilities` | POST | `facility` | `CREATE` |
| `/admin/mandapam/facilities/:id` | PATCH | `facility` | `UPDATE` |
| `/admin/mandapam/facilities/:id` | DELETE | `facility` | `DELETE` |
| `/admin/mandapam/addons` | GET | `addon` | `LIST` |
| `/admin/mandapam/addons` | POST | `addon` | `CREATE` |
| `/admin/mandapam/addons/:id` | PATCH | `addon` | `UPDATE` |
| `/admin/mandapam/addons/:id` | DELETE | `addon` | `DELETE` |

**Allowed Roles:** `ADMIN` | **Rate Limiter:** `adminMutationLimiter` for mutations

## Entity Configuration

| Property | Facility | Addon |
|----------|----------|-------|
| Table | `mandapam_facility` | `mandapam_addon_service` |
| Translation table | `mandapam_facility_translation` | `mandapam_addon_service_translation` |
| FK field | `facilityId` | `addonId` |
| Unique key name | `facilityId_language` | `addonId_language` |
| Base fields | `iconName`, `status` | `iconName`, `status` |
| Extra fields | — | `pricingType` (PER_EVENT/PER_HOUR/PER_DAY), `supportsQuantity` (boolean) |
| Response entity key | `facility` / `facilities` | `addon` / `addons` |

## High-Level Architecture

```
  ┌─ GET|POST|PATCH|DELETE /admin/mandapam/facilities[/:id] ───────────┐
  │  GET|POST|PATCH|DELETE /admin/mandapam/addons[/:id]                │
  │                                                                     │
  │  ctx = { entityType, action, id?, input? }                         │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S4], ctx)                                   │
  │                                                                       │
  │  S1. resolveEntity(ctx)  [only for UPDATE/DELETE]                   │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  Loads entity from the correct table based on entityType     │   │
  │  │  if !entity → 404 NOT_FOUND (MANDAPAM_FACILITY / ADDON)     │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S2. validateEntityInput(ctx)                                        │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  Uses entityType to pick correct Zod schema:                  │   │
  │  │  ┌────────────────────────────────────────────────────────┐  │   │
  │  │  │ facility: createFacilitySchema / updateFacilitySchema  │  │   │
  │  │  │ addon:    createAddonSchema    / updateAddonSchema     │  │   │
  │  │  └────────────────────────────────────────────────────────┘  │   │
  │  │  Parses ctx.input against schema to get validated data       │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  $transaction (S3) — only for CREATE/UPDATE/DELETE:                │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  entityCrudWithTranslations(ctx, {                          │   │
  │  │    entityType: ctx.entityType,                              │   │
  │  │    action: ctx.action                                       │   │
  │  │  })                                                          │   │
  │  │                                                              │   │
  │  │  ┌── CREATE ────────────────────────────────────────────┐   │   │
  │  │  │  INSERT main entity                                    │   │   │
  │  │  │  for each translation: INSERT translation             │   │   │
  │  │  └───────────────────────────────────────────────────────┘   │   │
  │  │  ┌── UPDATE ────────────────────────────────────────────┐   │   │
  │  │  │  UPDATE main entity fields (only if !== undefined)    │   │   │
  │  │  │  for each translation: UPSERT translation            │   │   │
  │  │  └───────────────────────────────────────────────────────┘   │   │
  │  │  ┌── DELETE ────────────────────────────────────────────┐   │   │
  │  │  │  Check existence → DELETE (cascade deletes trans.)   │   │   │
  │  │  └───────────────────────────────────────────────────────┘   │   │
  │  │  ┌── LIST ──────────────────────────────────────────────┐   │   │
  │  │  │  SELECT * INCLUDE translations ORDER BY createdAt    │   │   │
  │  │  └───────────────────────────────────────────────────────┘   │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S4. setEntityResponse(ctx)                                          │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  CREATED/UPDATED: { [entityType]: entity }                   │   │
  │  │  DELETED:         { deleted: true }                          │   │
  │  │  LIST:            { [entityType+'s']: entities[] }          │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
      { facility/facilities/addon/addons }  or  { deleted: true }
```

## Low-Level Architecture — Step by Step

### S3: entityCrudWithTranslations

```
====================================================================================
S3: entityCrudWithTranslations(ctx, config)  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Config per entityType:

  facility: { table: mandapam_facility, translationTable: mandapam_facility_translation,
              fkName: 'facilityId', uniqueKey: 'facilityId_language',
              mainFields: ['iconName'], extraFields: [] }
  addon:    { table: mandapam_addon_service, translationTable: mandapam_addon_service_translation,
              fkName: 'addonId', uniqueKey: 'addonId_language',
              mainFields: ['iconName'], extraFields: ['pricingType', 'supportsQuantity'] }

CREATE:
  mainData = { iconName: ctx.input.iconName }
  if entityType === 'addon':
    mainData.pricingType = ctx.input.pricingType ?? 'PER_EVENT'
    mainData.supportsQuantity = ctx.input.supportsQuantity ?? false

  entity = tx[config.table].create({ data: mainData })

  for each t in ctx.input.name:
    tx[config.translationTable].create({
      data: { [config.fkName]: entity.id, language: t.language, name: t.value }
    })

UPDATE:
  updateData = {}
  if ctx.input.iconName !== undefined: updateData.iconName = ctx.input.iconName
  if ctx.input.status !== undefined:   updateData.status = ctx.input.status
  if entityType === 'addon':
    if ctx.input.pricingType !== undefined:      updateData.pricingType = ctx.input.pricingType
    if ctx.input.supportsQuantity !== undefined: updateData.supportsQuantity = ctx.input.supportsQuantity

  if Object.keys(updateData).length > 0:
    tx[config.table].update({ where: { id }, data: updateData })

  if ctx.input.name:
    for each t in ctx.input.name:
      tx[config.translationTable].upsert({
        where: { [config.uniqueKey]: { [config.fkName]: ctx.id, language: t.language } },
        update: { name: t.value },
        create: { [config.fkName]: ctx.id, language: t.language, name: t.value }
      })

DELETE:
  existing = tx[config.table].findUnique({ where: { id: ctx.id } })
  if !existing → throw 404
  tx[config.table].delete({ where: { id: ctx.id } })  // cascade deletes translations

LIST:
  entities = tx[config.table].findMany({
    include: { translations: true },
    orderBy: { createdAt: 'desc' }
  })
====================================================================================
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/entity-crud-with-translations.step.ts` | Shared: generic CREATE/UPDATE/DELETE/LIST |

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| Entity not found (UPDATE/DELETE) | S1 | 404 | MANDAPAM_FACILITY_NOT_FOUND / ADDON_NOT_FOUND |
| Validation failed | S2 | 400 | VALIDATION_ERROR |
```
