# Pipeline 7: catalog-entity (Frontend)

> **For beginners**: Frontend side of the hall/showcase catalog. Fetches
> and displays available halls with images, pricing, and filtering.

## Purpose

Consolidates ALL catalog entity CRUD operations — 2 entities (facility and addon) × 5 operations each (list, create, update, delete) = 10 exports, plus 2 public catalog reads. This was 2 separate pipeline ideas merged because facility and addon share identical patterns.

**Backend Mirror:** `catalogEntityPipeline` + controller handlers (`adminGetAllFacilities`, `adminCreateFacility`, etc.)

## Actor & Entry

| Export | Used By | Role | API |
|---|---|---|---|
| `listFacilitiesPipeline()` | `FacilityGrid`, useBookingForm → addons | ADMIN | `adminGetAllFacilities()` |
| `createFacilityPipeline(dto)` | `FacilityModal` (create) | ADMIN | `adminCreateFacility()` |
| `updateFacilityPipeline(id, dto)` | `FacilityModal` (edit), `PackageManagement` (toggle status) | ADMIN | `adminUpdateFacility()` |
| `deleteFacilityPipeline(id)` | `FacilityGrid` → `PackageManagement` | ADMIN | `adminDeleteFacility()` |
| `listAddonsPipeline()` | `AddonGrid`, `AddonSection` | ADMIN | `adminGetAllAddons()` |
| `createAddonPipeline(dto)` | `AddonModal` (create) | ADMIN | `adminCreateAddon()` |
| `updateAddonPipeline(id, dto)` | `AddonModal` (edit), `PackageManagement` (toggle status) | ADMIN | `adminUpdateAddon()` |
| `deleteAddonPipeline(id)` | `AddonGrid` → `PackageManagement` | ADMIN | `adminDeleteAddon()` |
| `listPublicFacilitiesPipeline(lang)` | `Packages.tsx` (public) | PUBLIC | `getPublicFacilities()` |
| `listPublicAddonsPipeline(lang)` | `Packages.tsx` (public) | PUBLIC | `getPublicAddons()` |

## High-Level Architecture

```
  FacilityGrid / AddonGrid / FacilityModal / AddonModal / Packages.tsx
       │
       │  useFacilities() / useAddons() / useCreateFacility() / ...
       ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  catalog-entity.pipeline.ts                                         │
  │                                                                     │
  │  ┌──────────────────────────┐  ┌──────────────────────────┐        │
  │  │       FACILITY (5 ops)   │  │        ADDON (5 ops)     │        │
  │  │                          │  │                          │        │
  │  │  listFacilitiesPipeline  │  │  listAddonsPipeline      │        │
  │  │  createFacilityPipeline  │  │  createAddonPipeline     │        │
  │  │  updateFacilityPipeline  │  │  updateAddonPipeline     │        │
  │  │  deleteFacilityPipeline  │  │  deleteAddonPipeline     │        │
  │  │                          │  │                          │        │
  │  │  Pattern:                │  │  Pattern:                │        │
  │  │   API → return           │  │   API → return           │        │
  │  └──────────────────────────┘  └──────────────────────────┘        │
  │                                                                     │
  │  ┌─────────────────────────────────────────────────────────┐       │
  │  │           PUBLIC CATALOG (2 ops)                         │       │
  │  │  listPublicFacilitiesPipeline / listPublicAddonsPipeline │       │
  │  └─────────────────────────────────────────────────────────┘       │
  └─────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

All 10 pipelines follow the same pattern. Example shown for facility (addon is identical):

### Export 1-4: Facility CRUD

```
listFacilitiesPipeline()
│
├── STEP 1: execute-api.step.ts
│   → adminGetAllFacilities()
│   → GET /admin/mandapam/facilities
│   ← { facilities: MandapamFacility[] }
│
└── RETURN: { items: MandapamFacility[] }

createFacilityPipeline(dto: CreateFacilityDto)
│
├── STEP 1: execute-api.step.ts
│   → adminCreateFacility(dto)
│   → POST /admin/mandapam/facilities
│     Body: { iconName, chargeType?, name: [{ language, value }] }
│   ← { facility: MandapamFacility }
│
└── RETURN: { item: MandapamFacility }

updateFacilityPipeline(id, dto: UpdateFacilityDto)
│
├── STEP 1: execute-api.step.ts
│   → adminUpdateFacility(id, dto)
│   → PATCH /admin/mandapam/facilities/{id}
│   ← { facility: MandapamFacility }
│
└── RETURN: { item: MandapamFacility }

deleteFacilityPipeline(id)
│
├── STEP 1: execute-api.step.ts
│   → adminDeleteFacility(id)
│   → DELETE /admin/mandapam/facilities/{id}
│   ← { deleted: boolean }
│
└── RETURN: { deleted: boolean }
```

### Export 5-8: Addon CRUD (same pattern, `adminGetAllAddons` etc.)

### Export 9-10: Public Catalog

```
listPublicFacilitiesPipeline(language?: string)
│
├── STEP 1: execute-api.step.ts (via publicApi — no auth)
│   → getPublicFacilities(language || 'EN')
│   → GET /mandapam/facilities?language=EN
│   ← { facilities: PublicFacility[] }
│
└── RETURN: { items: PublicFacility[] }
```

## React Query Hooks

```typescript
// useMandapamQueries.ts
export function useFacilities() { ... }
export function useAddons() { ... }
export function usePublicFacilities(language?: string) { ... }
export function usePublicAddons(language?: string) { ... }

// useMandapamMutations.ts
export function useCreateFacility() { ... }
export function useUpdateFacility() { ... }
export function useDeleteFacility() { ... }
export function useCreateAddon() { ... }
export function useUpdateAddon() { ... }
export function useDeleteAddon() { ... }
```

## Component Usage

```typescript
// FacilityGrid (simplified)
const { data: facData } = useFacilities();
const deleteFac = useDeleteFacility();
// facData.items → render FacilityCards
<button onClick={() => deleteFac.mutate(facility.id)}>Delete</button>

// FacilityModal (simplified)
const createFacility = useCreateFacility();
const updateFacility = useUpdateFacility();

const handleSave = async () => {
  if (isEdit) {
    await updateFacility.mutateAsync({ id: facility!.id, dto: payload });
  } else {
    await createFacility.mutateAsync(payload);
  }
  onSuccess();
  onClose();
};

// AddonSection (in NewBooking/useBookingForm)
const { data: addonData } = useAddons();
const availableAddons = addonData?.items.filter(a => a.status) ?? [];

// Packages.tsx (public)
const { data: facData } = usePublicFacilities(langCode);
const { data: addonData } = usePublicAddons(langCode);
// facData.items → render facility icons
// addonData.items → render addon icons
```

## Error Matrix

All catalog entity operations share the same error pattern:

| HTTP | Backend Error Code | User Message |
|---|---|---|
| 404 | `NOT_FOUND` | [Entity] not found |
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 409 | `CONFLICT` | [Entity] already exists |
| 500 | `INTERNAL_ERROR` | Something went wrong |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/catalog-entity.pipeline.ts` | 10 pipeline exports |
| `frontend/src/api/mandapam.api.ts` | HTTP functions (adminGetAllFacilities, adminCreateFacility, etc.) |
| `frontend/src/queries/useMandapamQueries.ts` | Query hooks |
| `frontend/src/queries/useMandapamMutations.ts` | Mutation hooks |
| `frontend/src/components/features/admin/mandapam/facilities/FacilityGrid.tsx` | Facility list |
| `frontend/src/components/features/admin/mandapam/facilities/FacilityModal.tsx` | Facility create/edit |
| `frontend/src/components/features/admin/mandapam/addons/AddonGrid.tsx` | Addon list |
| `frontend/src/components/features/admin/mandapam/addons/AddonModal.tsx` | Addon create/edit |
| `frontend/src/components/modals/admin/booking/AddonSection.tsx` | Addon selection in booking form |
| `frontend/src/components/features/maaligai/Packages.tsx` | Public catalog display |
