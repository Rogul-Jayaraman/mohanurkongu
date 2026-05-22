# Troubleshooting: React Hydration Issues

## Symptoms
- `Text content did not match` console error
- `Hydration failed because the initial UI does not match what was rendered on the server` error
- Page flickers or shows wrong content briefly

## Root Cause

**This app is CSR-only (no SSR)**. Hydration issues should NOT occur. If you see hydration errors, the cause is:

| Cause | Why | Fix |
|---|---|---|
| **Using SSR framework API** | Importing `next/...` in Vite app | Remove SSR-specific imports |
| **Server rendering in Vite** | Vite's SSR mode accidentally enabled | Check `vite.config.ts` |
| **Misleading browser extension** | React DevTools or other extensions | Test in incognito |
| **Wrong React import** | Importing from `react-dom/server` | Use `react-dom/client` |

## Debugging Steps

```bash
# 1. Check package.json — no next, no remix, no gatsby
grep -r "next\|remix\|gatsby" frontend/package.json

# 2. Check vite.config.ts — no SSR plugin
cat frontend/vite.config.ts

# 3. Check index.html — no server-rendered content
cat frontend/index.html
# Should be: <div id="root"></div> (empty)

# 4. Check main.tsx — uses createRoot, not hydrateRoot
cat frontend/src/main.tsx
# Should be: createRoot(document.getElementById('root')!).render(...)
```

## Prevention

- ✅ Verify CSR-only: no SSR frameworks imported
- ✅ `createRoot` not `hydrateRoot` in main.tsx
- ✅ Empty `<div id="root">` in index.html
- ❌ Do not add SSR without migrating to Next.js
