# Troubleshooting: Memory Leaks

## Symptoms
- Browser memory grows over time (Chrome Task Manager)
- Tab crashes after extended use
- Performance degradation over session
- `useEffect` cleanup not running

## Root Causes

| Cause | Pattern | Fix |
|---|---|---|
| **Unsubscribed observers** | `setInterval`, `addEventListener`, `IntersectionObserver` without cleanup | Clean up in useEffect return |
| **Closure references** | Event handlers referencing large objects | Nullify references |
| **Large cached data** | TanStack Query `gcTime` too high | Reduce gcTime |
| **Detached DOM nodes** | Conditional rendering without key | Add stable keys |
| **Image blobs** | URL.createObjectURL not revoked | Revoke in cleanup |
| **Timers** | setTimeout/setInterval not cleared | Clear in cleanup |

## Debugging

```bash
# 1. Chrome DevTools → Performance → Record heap
# 2. Chrome DevTools → Memory → Heap snapshot
#    Take snapshot A, interact, take snapshot B, diff

# 3. Check for detached DOM nodes
#    Memory → Search for "Detached"

# 4. Add manual GC trigger:
#    Chrome DevTools → Performance → Collect garbage

# 5. Monitor with:
performance.memory  # In console
```

## Fix Patterns

### Fix 1: Cleanup useEffect
```typescript
useEffect(() => {
    const timer = setInterval(() => { ... }, 1000)
    const observer = new IntersectionObserver(() => { ... })
    observer.observe(element)
    
    return () => {
        clearInterval(timer)     // ✅ Clean up timer
        observer.disconnect()    // ✅ Clean up observer
    }
}, [])
```

### Fix 2: Revoke Object URLs
```typescript
useEffect(() => {
    const url = URL.createObjectURL(blob)
    // Use url...
    
    return () => {
        URL.revokeObjectURL(url)  // ✅ Release memory
    }
}, [blob])
```

### Fix 3: TanStack Query Cache Management
```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 30 * 60 * 1000,  // 30 min — not excessive
            // For large datasets, consider:
            // gcTime: 5 * 60 * 1000,
        },
    },
})
```

## Prevention
- ✅ Always return cleanup from useEffect
- ✅ Revoke object URLs after use
- ✅ Clear timers and observers
- ✅ Use stable keys for lists
- ✅ Reduce TanStack Query `gcTime` for large data
- ✅ Use `useCallback` to prevent unnecessary effect re-runs
