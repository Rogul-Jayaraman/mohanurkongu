# Glossary

Every domain term, its pronunciation, meaning, and where to find it in code.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GLOSSARY ORGANIZATION                                │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │  TAMIL DOMAIN TERMS (matrimony-specific)                     │      │
│   │  ┌──────────┬──────────────┬────────────────────────────┐   │      │
│   │  │ Kulam    │ KU-lum       │ Clan / caste group         │   │      │
│   │  │ Kuladeivam│ KU-la-DAY-vum│ Family deity              │   │      │
│   │  │ Gotram   │ GO-thrum     │ Lineage (patrilineal)      │   │      │
│   │  │ Rasi     │ RA-si        │ Zodiac sign                │   │      │
│   │  │ Nakshatra│ nak-SHA-tra  │ Birth star (27 types)      │   │      │
│   │  │ Dosham   │ DO-sham      │ Astrological flaw          │   │      │
│   │  │ Lagnam   │ LAG-nam      │ Ascendant / marriage chart  │   │      │
│   │  │ Panchangam│ pan-CHAN-gam│ Hindu calendar almanac     │   │      │
│   │  └──────────┴──────────────┴────────────────────────────┘   │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │  PRODUCT NAMES                                                  │      │
│   │  Maaligai → hall/venue booking service                         │      │
│   │  Manamaalai → matrimony/matchmaking service                    │      │
│   │  Mandapam → bookable hall/venue                                │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │  TECHNICAL TERMS                                                 │      │
│   │  Pipeline, BullMQ, Prisma, Zod, i18n, etc.                     │      │
│   └─────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tamil Domain Terms

| Term | Pronunciation | Meaning | Code Location |
|------|-------------|---------|---------------|
| Kulam | KU-lum | Clan / caste group | `schema.prisma` → Profile model |
| Kuladeivam | KU-la-DAY-vum | Family deity | `schema.prisma` → Profile model |
| Gotram | GO-thrum | Patrilineal lineage | `schema.prisma` → Profile model |
| Rasi | RA-si | Zodiac sign (12 types) | `schema.prisma` → Rasi enum |
| Nakshatra | nak-SHA-tra | Birth star (27 types) | `schema.prisma` → Nakshatram enum |
| Dosham | DO-sham | Astrological flaw (yes/no) | `schema.prisma` → Profile model |
| Lagnam | LAG-nam | Ascendant sign | `schema.prisma` → Profile model |
| Panchangam | pan-CHAN-gam | Hindu calendar almanac | `schema.prisma` → Profile model |
| Maaligai | MAA-li-gai | Palace/hall (product name) | `backend/src/modules/mandapam/` |
| Manamaalai | MA-na-MAA-lai | Marriage (product name) | `frontend brand for profile/matchmaking` |
| Mandapam | MAN-da-pam | Wedding hall | `schema.prisma` → Mandapam model |
| Murai | MU-rai | Relationship eligibility | `schema.prisma` → Profile.murai |
| Adaiyaalam | a-DAI-ya-lam | Identifying mark | `schema.prisma` → Profile.adaiyaalam |
| Suyamariyadai | SU-ya-ma-ri-ya-dai | Self-respect marriage | `schema.prisma` → Profile.suyamariyadai |
| Varisai | va-ri-SAI | Birth order | `schema.prisma` → Profile.varisai |

## Product Names

| Term | Meaning | Backend Module | Frontend Module |
|------|---------|---------------|-----------------|
| Maaligai | Hall/venue booking service | `backend/src/modules/mandapam/` | `frontend/src/pages/maali gai/` |
| Manamaalai | Matrimony/matchmaking service | `backend/src/modules/profile/` | `frontend/src/pages/user/` |
| Mandapam | A bookable hall/venue entity | Model in schema.prisma | Mandapam components |

## Technical Terms

| Term | Meaning | Code Location |
|------|---------|---------------|
| Pipeline | Composible step chain (Context → Step1 → ... → StepN) | `backend/src/common/pipeline/` |
| BullMQ | Redis-backed job queue for background tasks | `backend/src/common/queue/` |
| Prisma | Type-safe ORM for PostgreSQL | `backend/prisma/` |
| Zod | Runtime schema validation library | DTO files across modules |
| i18n | Internationalization (English + Tamil) | `frontend/src/i18n/` |
| React Query | Server-state management + caching | `frontend/src/hooks/` |
| Middleware guard | `requireAuth`, `optionalAuth`, `requireRole` | `backend/src/common/middleware/` |
| DTO | Data Transfer Object (Zod schema for shape + validation) | `backend/src/*/*.dto.ts` |
| AppError | Custom error class with code + HTTP status + i18n key | `backend/src/common/errors/` |
| Context | Pipeline state object passed through steps | `backend/src/common/pipeline/types.ts` |
