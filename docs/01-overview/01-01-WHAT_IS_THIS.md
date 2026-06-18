# What Is This Project?

A web platform that runs **two products** from a single codebase:

1. **Manamaalai** — a Tamil matrimony service (profile browsing, shortlisting, matchmaking)
2. **Maaligai** — a hall/mandapam booking service (calendar view, reservations, payments)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM CONTEXT                                   │
│                                                                         │
│   ┌──────────┐    ┌──────────────────┐    ┌──────────────────────┐      │
│   │ BROWSER  │───▶│                  │    │  POSTGRESQL          │      │
│   │ (React)  │    │   NGINX          │    │  ┌────────────────┐  │      │
│   │ Mobile   │    │   (reverse proxy)│    │  │ accounts       │  │      │
│   │ Responsve│    │                  │    │  │ profiles       │  │      │
│   └──────────┘    └────────┬─────────┘    │  │ bookings       │  │      │
│                            │              │  │ calendar       │  │      │
│                            ▼              │  │ financial      │  │      │
│                     ┌──────────────┐       │  │ payments       │  │      │
│                     │   EXPRESS    │       │  └────────────────┘  │      │
│                     │   BACKEND    │───▶   └──────────────────────┘      │
│                     │  (Node.js)   │                                     │
│                     └──────┬───────┘    ┌──────────────────────┐      │
│                            │            │  REDIS               │      │
│                            └───────────▶│  ┌────────────────┐  │      │
│                                         │  │ sessions       │  │      │
│                                         │  │ cache          │  │      │
│                                         │  │ BullMQ queues  │  │      │
│                                         │  └────────────────┘  │      │
│                                         └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Who Uses This?

| User Type | Can Do |
|-----------|--------|
| **Anonymous visitor** | Browse public profiles (limited), view halls |
| **Registered user** | Create profile, shortlist, message, book halls |
| **Admin** | Approve/reject profiles, manage bookings, view analytics |
| **Super admin** | All admin + manage other admins |

## Two Products, One Codebase

| Aspect | Manamaalai (Matrimony) | Maaligai (Hall Booking) |
|--------|----------------------|------------------------|
| Primary entity | Profile (person) | Mandapam (hall) |
| Key action | Browse → Shortlist → Connect | View calendar → Book → Pay |
| Business model | Freemium (BRONZE→PLATINUM) | Per-booking fee |
| Data retention | Profiles live years | Bookings expire after event |

## What Makes This Project Interesting?

- **Pipeline pattern**: Every major operation (login, booking, profile upsert) runs through a composable step pipeline with PRE→transaction→POST boundaries
- **Full i18n**: English + Tamil with transliteration support
- **State machines**: Account, OTP, profile, and booking each have explicit state machines with documented transitions
- **Caching**: 3-layer strategy (React Query → Redis → PostgreSQL) with tag-based invalidation

## What This Documentation Covers

- **Architecture** (section 03): How everything fits together — with ASCII diagrams
- **Business logic** (section 06): State machines, rules, and edge cases for every entity
- **Development guides** (section 04): How to add routes, pipelines, translations
- **Pipeline index** (section 05): Links to all 61 pipeline files in `05-pipelines/`
- **Operations** (section 07): Deploy, monitor, troubleshoot
