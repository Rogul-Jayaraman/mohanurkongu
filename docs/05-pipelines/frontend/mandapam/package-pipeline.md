# Pipeline 6: package (Frontend)

> **For beginners**: Frontend side of viewing and selecting hall packages.
> Shows price tiers, included amenities, and handles selection for the
> booking form.

## Purpose

Consolidates ALL package operations — 3 reads (admin list, admin by ID, public list) and 2 writes (update package, delete function). Packages have no CREATE operation on the frontend (seeded via DB). This pipeline merges what were previously 2 pipeline ideas (list + update) into one co-located domain file.

**Backend Mirror:** Controller handlers (`adminGetAllPackages`, `adminGetPackageById`, `getPublicPackages`) + `packageUpdatePipeline` + `packageDeleteFunctionPipeline`

## Actor & Entry

| Export | Used By | Role | API |
|---|---|---|---|
| `listAdminPackagesPipeline()` | `PackageManagement.tsx`, `useBookingForm.ts` | ADMIN | `adminGetAllPackages()` |
| `getAdminPackagePipeline(id)` | `PackageManagement.tsx` (view details) | ADMIN | `adminGetPackageById()` |
| `listPublicPackagesPipeline(lang)` | `Packages.tsx` (public) | PUBLIC | `getPublicPackages()` |
| `updatePackagePipeline(id, dto)` | `EditPackageModal.tsx` | ADMIN | `adminUpdatePackage()` |
| `deleteFunctionPipeline(packageId, fnId)` | `PackageManagement.tsx` | ADMIN | `adminDeletePackageFunction()` |

## High-Level Architecture

```
  PackageManagement.tsx / EditPackageModal.tsx / Packages.tsx
       │
       │  useAdminPackages(), usePublicPackages(), useUpdatePackage()
       ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  package.pipeline.ts                                           │
  │                                                                 │
  │  ┌──────────────────┐    ┌───────────────────┐                 │
  │  │  READ OPS (3)    │    │  WRITE OPS (2)    │                 │
  │  │                  │    │                   │                 │
  │  │  adminList()     │    │  updatePackage()  │                 │
  │  │  adminById()     │    │  deleteFunction() │                 │
  │  │  publicList()    │    │                   │                 │
  │  │                  │    │  Pattern:          │                 │
  │  │  Pattern:         │    │   API → invalidate│                 │
  │  │   API → return   │    │   → toast → return│                 │
  │  └──────────────────┘    └───────────────────┘                 │
  └─────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

### Export 1: listAdminPackagesPipeline

```
listAdminPackagesPipeline()
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminGetAllPackages()                │
│   │  → GET /admin/mandapam/packages                              │
│   │  ← { packages: MandapamPackage[] }                           │
│   │                                                              │
│   │  Each package includes:                                      │
│   │  {                                                           │
│   │    id, code, bookingType, durationType, durationValue,       │
│   │    status, createdAt, updatedAt,                             │
│   │    translations: [{ language, displayName }],                │
│   │    functions: [{ id, name: [{ language, name }],            │
│   │                 status, sortOrder }],                        │
│   │    pricings: [{ amount, currencyCode, isActive,             │
│   │                pricingType }],                               │
│   │  }                                                           │
│   │                                                              │
│   │  Backend: direct prisma call (not a pipeline)               │
│   │    prisma.mandamapPackage.findMany({ include: {              │
│   │      translations, functions: { include: { translations } }, │
│   │      pricings } })                                          │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { packages }
```

### Export 2: getAdminPackagePipeline

```
getAdminPackagePipeline(id: string)
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminGetPackageById(id)              │
│   │  → GET /admin/mandapam/packages/{id}                        │
│   │  ← { package: MandapamPackage }                              │
│   │                                                              │
│   │  Note: Same shape as list response but single package        │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { package }
```

### Export 3: listPublicPackagesPipeline

```
listPublicPackagesPipeline(language?: string)
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts (via publicApi — no auth)              │
│   │                                                              │
│   │  const response = await getPublicPackages(language || 'EN') │
│   │  → GET /mandapam/packages?language=EN                       │
│   │  ← { packages: PublicPackage[] }                            │
│   │                                                              │
│   │  Transformed to frontend PublicPackage:                      │
│   │  {                                                           │
│   │    code: string,                                             │
│   │    bookingType: string,                                      │
│   │    durationType: string,                                     │
│   │    durationValue: number | null,                             │
│   │    displayName: string,        // localized                  │
│   │    functions: [{ name: string }],  // localized             │
│   │    pricing: { amount, currencyCode, pricingType } | null    │
│   │  }                                                           │
│   │                                                              │
│   │  Backend: prisma + manual mapping (not a pipeline)          │
│   │    → filters: status: true,                                 │
│   │    → includes translations filtered by language              │
│   │    → maps to PublicPackage shape                             │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { packages }
```

### Export 4: updatePackagePipeline

```
updatePackagePipeline(id: string, dto: UpdatePackageDto)
│
│  INPUT: UpdatePackageDto
│  {
│    displayName?: TranslationPair[],
│    functions?: { id?, name: TranslationPair[], status? }[],
│    pricing?: { amount?, currencyCode?, isActive? },
│    status?: boolean,
│  }
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminUpdatePackage(id, dto)          │
│   │  → PATCH /admin/mandapam/packages/{id}                      │
│   │    Body: UpdatePackageDto                                    │
│   │  ← { package: MandapamPackage }                              │
│   │                                                              │
│   │  Backend: packageUpdatePipeline(id, input)                   │
│   │    → update translations → upsert functions →                │
│   │      manage pricing → setBookingResponse                    │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { package }
```

### Export 5: deleteFunctionPipeline

```
deleteFunctionPipeline(packageId: string, functionId: string)
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminDeletePackageFunction(          │
│   │    packageId, functionId)                                    │
│   │  → DELETE /admin/mandapam/packages/{id}/functions/{fnId}    │
│   │  ← { deleted: boolean }                                      │
│   │                                                              │
│   │  Backend: packageDeleteFunctionPipeline(functionId)          │
│   │    → find function → delete → return { deleted: true }      │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { deleted }
```

## React Query Hooks

```typescript
// useMandapamQueries.ts

export function useAdminPackages() {
  return useQuery({
    queryKey: queryKeys.mandapam.packages(),
    queryFn: () => listAdminPackagesPipeline(),
    staleTime: 60_000,  // 1 minute — packages change infrequently
  });
}

export function useAdminPackage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mandapam.package(id!),
    queryFn: () => getAdminPackagePipeline(id!),
    enabled: !!id,
  });
}

export function usePublicPackages(language?: string) {
  return useQuery({
    queryKey: ['mandapam', 'public', 'packages', language],
    queryFn: () => listPublicPackagesPipeline(language),
    staleTime: 120_000,  // 2 minutes — public data changes less often
  });
}

// useMandapamMutations.ts

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; dto: UpdatePackageDto }) =>
      updatePackagePipeline(args.id, args.dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.packages() });
      toast.success('Package updated');
    },
    onError: (err) => showErrorToast(err),
  });
}

export function useDeletePackageFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { packageId: string; functionId: string }) =>
      deleteFunctionPipeline(args.packageId, args.functionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.packages() });
      toast.success('Function deleted');
    },
    onError: (err) => showErrorToast(err),
  });
}
```

## Component Usage

```typescript
// PackageManagement.tsx (simplified)
const { data: packagesData } = useAdminPackages();
const deleteFn = useDeletePackageFunction();

// packagesData.packages → render PackageGrid

const handleDeleteFunction = async (packageId: string, functionId: string) => {
  await deleteFn.mutateAsync({ packageId, functionId });
};

// EditPackageModal.tsx (simplified)
const updatePackage = useUpdatePackage();

const handleSave = async () => {
  await updatePackage.mutateAsync({ id: packageId, dto: formData });
  onClose();
};

// useBookingForm.ts (simplified)
const { data: packagesData } = useAdminPackages();
const packageInfo = useMemo(() => {
  // Find package matching current bookingType
  return packagesData?.packages.find(
    p => p.bookingType === currentBookingType && p.status
  );
}, [packagesData, currentBookingType]);

// Packages.tsx (public — simplified)
const { data: pkgData } = usePublicPackages(language);
// pkgData.packages → render package cards
```

## Error Matrix

| Export | HTTP | Backend Error Code | User Message |
|---|---|---|---|
| `updatePackage` | 404 | `MANDAPAM_PACKAGE_NOT_FOUND` | Package not found |
| `updatePackage` | 400 | `VALIDATION_ERROR` | Invalid package data |
| `deleteFunction` | 404 | `MANDAPAM_FUNCTION_NOT_FOUND` | Function not found |
| `updatePackage` | 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/package.pipeline.ts` | Pipeline implementation |
| `frontend/src/api/mandapam.api.ts` | HTTP functions (adminGetAllPackages, adminGetPackageById, getPublicPackages, adminUpdatePackage, adminDeletePackageFunction) |
| `frontend/src/queries/useMandapamQueries.ts` | Query hooks |
| `frontend/src/queries/useMandapamMutations.ts` | Mutation hooks |
| `frontend/src/components/features/admin/mandapam/packages/PackageManagement.tsx` | Admin package list + delete |
| `frontend/src/components/features/admin/mandapam/packages/EditPackageModal.tsx` | Package update |
| `frontend/src/components/modals/admin/booking/useBookingForm.ts` | Package query for pricing |
| `frontend/src/components/features/maaligai/Packages.tsx` | Public package display |
