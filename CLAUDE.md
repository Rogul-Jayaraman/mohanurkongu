# Mohanur Kongu — Project Summary

## Goal
- Implement performance, SEO, and infrastructure improvements to the Mohanur Kongu web application without affecting UI/UX.

## Constraints & Preferences
- All optimizations must preserve final visual appearance and user interactions — zero visual regression.
- `font-display: swap` and React.lazy route splitting (with loading spinners) are acceptable — subtle timing changes are OK.
- Font families and weight ranges must match exactly what the app originally loads; removed Lora (unused) and Plus Jakarta Sans (unused).
- Gallery images/videos are deferred for later content upload/compression (confirmed by user).
- CSRF protection is not needed — architecture is inherently resistant (in-memory access tokens + `Authorization: Bearer` + `SameSite=Strict` on refresh cookie). Previous implementation caused 403 on all requests.

## Progress

### Done (All Sessions)
- WebP images for hero, auth pages, maaligai, office-bearers, logo, QR
- React.lazy + Suspense route splitting (8 routes) with loading spinners
- Prefetch landing page via `<link rel="prefetch">` and hover-based imports
- CSS consolidation: removed duplicate `--color-rosewood`, collapsed redundant rules
- Accessibility: skip-link (keyboard-first), ARIA labels for icon-only buttons
- Chunk splitting: vendor-react, vendor-mui, vendor-motion, vendor-i18n, vendor-charts, vendor-utils, vendor-animations (lottie-web)
- Dead code removal: unused components (EditPriceModal, NewPackageModal, PlanUpgradeModal, UnsavedChangesModal, AmountInput, LocationInput, PlanPurchaseHistoryDrawer)
- SEO: robots.txt (narrowed `/manamaalai/` block to protected routes only), sitemap.xml (11 URLs with lastmod/changefreq)
- SEO: usePageMetadata.ts rewritten — WebSite/BreadcrumbList/LocalBusiness/EventVenue/ContactPoint JSON-LD, Twitter Card, x-default hreflang
- SEO: index.html inline `<script>` for `<html lang="...">` before paint, robts meta, skip-link FOUC prevention
- Architecture review (20 roles across backend, frontend, infra, database, security, reliability)
- Admin role guards confirmed wired in all admin routes (`requireRole('ADMIN')`)
- Auth bugs from docs/incidents/ — directory does not exist in current codebase, cannot verify
- **Self-hosted Google Fonts**: 50 @font-face declarations downloaded as woff2 to `frontend/public/fonts/`, served via `fonts.css` (imported in `main.tsx`). Removed all external `<link>` + `@import` to Google Fonts. Removed unused font families (Poppins, Lato, Playfair Display, Tiro Tamil, Noto Sans Tamil) from `manamaalai.css` `@theme` — now matches `index.css` font stack (Manrope, Mukta Malar, Namdhinggo, Catamaran). Added preload for Manrope Latin subset in `index.html`. Removed `https://fonts.gstatic.com` from nginx CSP `font-src`.
- **Brotli + Gzip pre-compression**: `vite-plugin-compression` generates both `.br` and `.gz` for all JS/CSS assets >1 KB. `gzip_static on;` in frontend Dockerfile nginx config serves pre-compressed files. Brotli `.br` files are ready for CDN/nginx-brotli module.
- **Backend dep cleanup**: removed unused `swagger-jsdoc` + `swagger-ui-express`
- **Database indexes**: `@@index([maritalStatus])` on ProfileBasic, `@@index([customerId])` + `@@index([status, createdAt])` on MandapamBooking
- **BullMQ retry**: audit queue → `attempts: 3` + exponential backoff (email queue already had this)
- **Nginx hardening**: `worker_processes auto`, CSP, HSTS, rate limiting (50r/s, burst 100)
- **Build cache**: `frontend/.dockerignore`
- **Database backup script**: `scripts/backup-db.sh`

### Blocked
- Hero video compression: needs ffmpeg
- Gallery/images: deferred as future content work
- Profile photo responsive srcset: deferred
- Prerendering 8 public routes: Vite 6 incompatible with vite-plugin-prerender
- Brotli at nginx level: needs `ngx_brotli` module (`.br` files are already generated)
- Sentry error monitoring: skipped (no DSN provided)

## Key Decisions
- **Media access policy**: GET `/media/*` requires **NO authentication**. Images are public by design — membership gating is enforced at the API layer (profile/browse endpoints return only authorized profiles), not at the media serving layer. Auth protects upload/delete only.
- **No CSRF**: SPA uses in-memory access tokens (`Authorization: Bearer`). Refresh cookies use `SameSite=Strict`. Inherently CSRF-resistant.
- **`--color-rosewood`**: `#8B1D3D` (index.css wins). `--color-rosewood-dark`: `#6b0028` (separate hover state).
- **lottie-web cannot be replaced**: SVG track mattes break with lottie_light.
- **Translation loading**: eager (4,584 keys). Lazy deferred due to key-name FOUC risk.
- **Nginx CSP policy**: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://inputtools.google.com; frame-ancestors 'none'; base-uri 'self'`. `https://fonts.gstatic.com` removed because fonts are now self-hosted.
- **Rate limiting**: 50r/s global zone, burst 100 on SPA location only. API uses express-rate-limit internally.

## Relevant Files
- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- `frontend/index.html` — Google Fonts removed, fonts.css imported, preload for Manrope
- `frontend/src/hooks/usePageMetadata.ts`
- `frontend/src/assets/styles/fonts.css` — self-hosted @font-face declarations (50 rules)
- `frontend/src/assets/styles/index.css`
- `frontend/src/assets/styles/manamaalai.css` — Google Fonts @import removed, theme fonts aligned with index.css
- `frontend/public/fonts/` — 50 woff2 font files (4.61 MB total, mostly Material Symbols at 3.8 MB)
- `frontend/.dockerignore`
- `frontend/vite.config.ts` — vite-plugin-compression (gzip + brotli)
- `docker/frontend/Dockerfile` — gzip_static on
- `backend/package.json`
- `backend/src/database/prisma.ts`
- `backend/prisma/schema.prisma`
- `backend/src/common/utils/audit.ts`
- `docker/nginx/templates/default.conf.template`
- `scripts/backup-db.sh`
