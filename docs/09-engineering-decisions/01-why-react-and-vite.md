# ADR-01: Why React 19 + Vite 6

## Context
Need a frontend framework for a bilingual matrimony + mandapam booking SPA. Requirements: rapid development, component reusability, large ecosystem, good TypeScript support.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **React 19 + Vite 6** | Fastest build tool, HMR, React ecosystem | CSR-only SEO limitations |
| Next.js 15 | SSR, SEO, file-based routing | More complex, slower builds, server cost |
| Vue 3 + Vite | Lighter than React, good DX | Smaller ecosystem, team unfamiliar |
| SvelteKit | Fastest, least boilerplate | Small ecosystem, hiring challenge |
| Angular 19 | Opinionated, enterprise-ready | Heavy, steep learning curve |

## Decision
**React 19 + Vite 6**. React's ecosystem (TanStack Query, React Router, i18next) was already established. Vite provides near-instant HMR and fast production builds.

## Consequences
- ✅ Fast development iteration with HMR
- ✅ Access to mature React ecosystem
- ✅ Simple deployment (static files)
- ❌ SEO requires extra effort (MetadataManager)
- ❌ Initial load slower than SSR (JS bundle must download)

## When to Revisit
- If SEO for public profiles becomes critical → consider Next.js with SSG for public pages
- If bundle size grows excessively → consider code splitting + lazy loading
