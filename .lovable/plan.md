

# Edge Function Comprehensive Audit - Phase 20

## Executive Summary

Found **3 critical schema issues** and **60+ error handling issues** across the edge functions.

---

## Critical Schema Issues (Must Fix)

| Function | Issue | Fix Required |
|----------|-------|--------------|
| `entity-resolution-engine` (L188-193) | Uses `profileA.location` / `profileB.location` | Replace with `profileA.city` / `profileB.city` or combined city/country logic |
| `shadow-network-analyzer` (L265-269) | Uses `profileA.location` / `profileB.location` | Replace with `profileA.city` / `profileB.city` |
| `match-biometrics` (L120, L130) | Uses `profile?.name` | Replace with `` `${profile?.first_name} ${profile?.last_name}`.trim() `` |

---

## Medium Priority Issues

| Function | Issue | Note |
|----------|-------|------|
| `enrichment-orchestrator` (L181, 224, 291) | Uses `profile.email` | This is passed TO other functions - may need to fetch from contact_methods first |
| `entity-resolution-engine` (L247, 383) | Uses `profile.email` | Used for email domain grouping - needs contact_methods join |
| `enrich-hunter` (L93) | Uses `profile?.email` | Fallback if email not passed - needs contact_methods |

---

## Error Handling Issues (60+ Functions)

Many functions still use `error.message` or `error?.message` without proper `instanceof Error` guards. Key examples:

- `network-cascade-modeler`, `influence-propagation-engine`, `predictive-opportunity-scanner`
- `security-threat-analyzer`, `linguistic-deception-analyzer`, `churn-prediction-engine`
- `omniscient-orchestrator`, `threat-actor-profiler`, `cross-modal-deception-engine`
- `cult-tactics-engine`, `cross-domain-correlator`, `subliminal-messaging-engine`
- And 50+ more functions

**Pattern to apply:**
```typescript
// BEFORE
} catch (error: any) {
  return new Response(JSON.stringify({ error: error.message }), ...);

// AFTER  
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new Response(JSON.stringify({ error: message }), ...);
```

---

## Implementation Priority

### Phase 20A: Critical Schema (3 functions)
1. `entity-resolution-engine` - Fix `location` → `city/country`
2. `shadow-network-analyzer` - Fix `location` → `city/country`  
3. `match-biometrics` - Fix `name` → `first_name/last_name`

### Phase 20B: Email Schema (3 functions)
4. `enrichment-orchestrator` - Fetch email from contact_methods
5. `entity-resolution-engine` - Fetch email from contact_methods
6. `enrich-hunter` - Adjust fallback logic

### Phase 20C: Error Handling (60+ functions)
- Batch apply `instanceof Error` guards to all catch blocks

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Location schema mismatch | 2 | Critical |
| Name schema mismatch | 1 | Critical |
| Email schema mismatch | 3-6 | Medium |
| Error handling without guards | 60+ | Low |
| **Total Issues** | **70+** | - |

