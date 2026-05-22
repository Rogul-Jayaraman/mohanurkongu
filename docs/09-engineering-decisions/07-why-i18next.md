# ADR-07: Why i18next

## Context
Application requires full bilingual support (English + Tamil). All UI text, form labels, and error messages must be available in both languages with runtime switching.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **i18next** | Mature, namespace support, interpolation, plural rules | Larger library |
| react-intl (FormatJS) | ICU message syntax, smaller | Less flexible namespace organization |
| Custom context-based translation | Lightweight, full control | Re-inventing the wheel, missing edge cases |
| LinguiJS | Extract messages at build time | Complex setup, smaller community |

## Decision
**i18next + react-i18next**. The namespace system maps naturally to feature modules. Translation files are plain TypeScript objects (easy to edit). Runtime switching is instant.

## Consequences
- ✅ 14 namespaces organized by feature
- ✅ Instant language switching (no page reload)
- ✅ Plural handling and interpolation built in
- ✅ 48 translation files (24 EN + 24 TA)
- ❌ All translations bundled (not lazy-loaded — future optimization)
- ❌ Manual translation management (no automated translation tooling)

## When to Revisit
- If translation files grow too large → lazy load namespaces
- If needing professional translation workflow → add translation management platform
