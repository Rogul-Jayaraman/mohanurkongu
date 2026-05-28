# Context Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            End Users                                        │
│                                                                            │
│  ┌─────────────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  Matrimony User     │    │  Mandapam Visitor  │    │  Admin Staff    │  │
│  │  (browse, shortlist,│    │  (browse halls,    │    │  (verify, manage│  │
│  │   create profile,   │    │   check packages,  │    │   users, view   │  │
│  │   express interest) │    │   book hall)       │    │   analytics)    │  │
│  └──────────┬──────────┘    └──────────┬─────────┘    └────────┬────────┘  │
│             │                          │                       │           │
└─────────────┼──────────────────────────┼───────────────────────┼───────────┘
              │                          │                       │
              │           HTTPS          │           HTTPS       │
              ▼                          ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Mohanur Kongu Manamaalai                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Frontend (React 19 SPA)                     │   │
│  │   ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │   │
│  │   │ Landing &  │  │   Auth   │  │Matrimony │  │   Admin     │    │   │
│  │   │ Maaligai   │  │  Pages   │  │  Pages   │  │   Pages     │    │   │
│  │   │ (static)   │  │          │  │ (stubs)  │  │  (stubs)    │    │   │
│  │   └────────────┘  └──────────┘  └──────────┘  └──────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼ API (via Axios)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Backend (Express 5)                               │   │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │   │ Auth Module│  │  Account   │  │  Profile   │  │  Mandapam  │   │   │
│  │   │ EXECUTED   │  │  Module    │  │  Module    │  │  Module    │   │   │
│  │   │            │  │  PARTIAL   │  │  MISSING   │  │  MISSING   │   │   │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
              │                                   │
              ▼                                   ▼
┌──────────────────────────┐   ┌──────────────────────────────────────┐
│      PostgreSQL 16       │   │           Redis 7                     │
│                          │   │                                      │
│  Accounts ───────────────┤   │  BullMQ Queues:                     │
│  Credentials              │   │  ┌────────────────────────────────┐ │
│  Sessions                 │   │  │ email.queue  │  audit.queue   │ │
│  Verifications            │   │  │ otp.queue    │  background    │ │
│  Roles (seed)             │   │  └────────────────────────────────┘ │
│  Plans (seed)             │   │                                      │
│  Counter (seed)           │   │  BullMQ Workers:                    │
│                           │   │  - email.worker.ts                 │
│  (Tables created via      │   │  - otp.worker.ts                   │
│   Prisma schema but       │   │  - audit.worker.ts                 │
│   unused: profiles,       │   │  - background.worker.ts            │
│   mandapams, bookings,    │   │                                      │
│   packages, communities,  │   └──────────────────────────────────────┘
│   translations, devices)  │
└──────────────────────────┘
```
