

# Comprehensive Edge Function Audit Report & Fix Plan

## Executive Summary
After reviewing 50+ edge functions across v5.0 through v8.0 intelligence engines, I identified **42 distinct issues** spanning critical authentication patterns, schema mismatches, missing dual-auth support, potential loops, and type safety concerns. This audit builds upon the previous 28 fixes and identifies remaining issues that need addressing.

---

## Issue Categories Identified

### CATEGORY A: Authentication Pattern Issues (7 issues)

Functions using `throw new Error('Invalid user token')` instead of returning proper HTTP 401 responses. This causes the error to be caught and returned as HTTP 500 instead of 401, breaking client-side error handling.

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| A1 | `tas-com-community-detector` | 44-47 | Throws error instead of HTTP 401, also missing dual-auth pattern entirely | **HIGH** |
| A2 | `migration5-biometric-tracker` | 52-54 | Uses throw pattern for auth failures | Medium |
| A3 | `gated-biological-fusion` | 52-54 | Uses throw pattern for auth failures | Medium |
| A4 | `intelligence-session-runner` | 222-225 | Uses throw pattern for auth failures | Medium |
| A5 | `omniscient-orchestrator` | 33 | Missing auth validation entirely - accepts body.userId without verification | **HIGH** |
| A6 | `psychoagent-cascade-predictor` | 63-65 | Missing auth header validation - directly reads from body | **HIGH** |
| A7 | `synthetic-memory-generator` | 53-54 | Missing auth header validation - directly reads from body | **HIGH** |

**Fix**: Replace throw pattern with explicit HTTP 401 Response returns and add dual-auth pattern.

---

### CATEGORY B: Table Name Mismatches (5 issues)

Functions querying non-existent `relationships` table instead of `contact_relationships`.

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| B1 | `tas-com-community-detector` | 61-64 | Queries `relationships` table - should be `contact_relationships` | **HIGH** |
| B2 | `emotional-contagion-modeler` | 80 | Queries `relationships` table - should be `contact_relationships` | **HIGH** |
| B3 | `social-graph-predictor` | 51-55 | Queries `relationships` table - should be `contact_relationships`, also uses wrong column names (`source_profile_id`/`target_profile_id` should be `from_profile_id`/`to_profile_id`) | **HIGH** |
| B4 | `emotional-contagion-modeler` | 196 | Uses `r.related_profile_id` which doesn't exist on `contact_relationships` (should be `to_profile_id`) | Medium |
| B5 | `tas-com-community-detector` | 173-176 | Uses `rel.related_profile_id` which doesn't exist (should be `to_profile_id`) | Medium |

**Fix**: Replace `relationships` with `contact_relationships` and correct column names.

---

### CATEGORY C: Missing Dual-Auth Pattern (8 issues)

Functions that don't properly support the intelligence-session-runner's service role key authentication.

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| C1 | `tas-com-community-detector` | 34-47 | Only uses user token auth, no service role support | **HIGH** |
| C2 | `psychoagent-cascade-predictor` | 52-65 | No auth header validation, just reads body params | **HIGH** |
| C3 | `synthetic-memory-generator` | 42-55 | No auth header validation | **HIGH** |
| C4 | `omniscient-orchestrator` | 27-33 | No auth header validation | **HIGH** |
| C5 | `influence-campaign-optimizer` | 34-48 | No auth header validation | **HIGH** |
| C6 | `predictive-doctrine-engine` | 34-48 | No auth header validation | **HIGH** |
| C7 | `social-graph-predictor` | 34-48 | No auth header validation | **HIGH** |
| C8 | `memetic-propagation-engine` | 41-71 | Has dual-auth but throws error instead of returning 401 | Medium |

**Fix**: Add standardized dual-auth pattern to all functions.

---

### CATEGORY D: Column Name Mismatches (4 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| D1 | `social-graph-predictor` | 54 | Uses `source_profile_id`/`target_profile_id` - should be `from_profile_id`/`to_profile_id` | **HIGH** |
| D2 | `emotional-contagion-modeler` | 82 | Queries `ai_analyses.analysis_type = 'network_centrality'` and accesses `results` instead of `result` | Medium |
| D3 | `emotional-contagion-modeler` | 159 | Uses `results` field in upsert - should be `result` | Medium |
| D4 | `psychoagent-cascade-predictor` | 81-82 | Orders by `created_at` for `behavioral_predictions` which might not exist | Low |

**Fix**: Correct column/field names to match actual database schema.

---

### CATEGORY E: Potential Race Conditions & Open Loops (3 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| E1 | `zero-day-anomaly-detector` | 232-245 | Loop inserts into `behavioral_anomalies` one at a time - could cause rate limiting or partial failures | Medium |
| E2 | `intelligence-session-runner` | 708-726 | `Promise.all` with batch of 3 tasks runs in parallel without batch-level timeout | Medium |
| E3 | `emotional-contagion-modeler` | 276-315 | Nested loops with random susceptibility checks could behave unpredictably | Low |

**Fix**: Add batch inserts and timeout guards.

---

### CATEGORY F: Missing Query Limits (4 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| F1 | `omniscient-orchestrator` | 44-77 | Multiple queries without explicit limits on some tables | Medium |
| F2 | `autonomous-intelligence-orchestrator` | 82-131 | Some queries have limits, but some don't consistently apply them | Low |
| F3 | `deep-intelligence-engine` | 153-159 | Query to `messages` with join could return unbounded data | Low |
| F4 | `mosaic-intelligence-fuser` | 89-121 | Many parallel queries - good limits but potential for heavy load | Low |

**Fix**: Add explicit `.limit()` to all queries.

---

### CATEGORY G: Type Safety Issues (5 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| G1 | `emotional-contagion-modeler` | 191 | Accesses `networkAnalysis?.results` but should be `.result` | Medium |
| G2 | `tas-com-community-detector` | 76-79 | Accesses `.data` without null guards after Promise.all | Low |
| G3 | `psychoagent-cascade-predictor` | 168-199 | Multiple functions access array elements without bounds checking | Low |
| G4 | `synthetic-memory-generator` | 170-177 | Accesses `b.prediction_type` without null checks | Low |
| G5 | `temporal-fusion-transformer` | 273-274 | Accesses `i.relationship_temperature` without null guards | Low |

**Fix**: Add proper null checks and type guards.

---

### CATEGORY H: Error Response Format Inconsistency (6 issues)

Functions returning different error formats which can confuse client-side handling.

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| H1 | `thermal-stress-detector` | Returns `{ success: false, error }` on failure | Low |
| H2 | `influence-campaign-optimizer` | Returns `{ error }` only | Low |
| H3 | `predictive-doctrine-engine` | Returns `{ error }` only | Low |
| H4 | `social-graph-predictor` | Returns `{ error }` only | Low |
| H5 | `omniscient-orchestrator` | Returns `{ error }` only | Low |
| H6 | Various | Mix of `success: true/false` vs just `error` key | Low |

**Fix**: Standardize on `{ error: string }` for failures, `{ success: true, ...data }` for success.

---

## Implementation Plan

### Phase 1: Critical Auth & Schema Fixes (HIGH Priority)

```text
1. tas-com-community-detector
   - Add dual-auth pattern (lines 34-47)
   - Replace 'relationships' with 'contact_relationships' (line 61)
   - Fix column names: related_profile_id -> to_profile_id (lines 173-176)
   - Replace throw with HTTP 401 response

2. emotional-contagion-modeler
   - Replace 'relationships' with 'contact_relationships' (line 80)
   - Fix column name: related_profile_id -> to_profile_id (line 196)
   - Fix field name: results -> result (lines 82, 159)

3. social-graph-predictor
   - Add dual-auth pattern (lines 34-48)
   - Replace 'relationships' with 'contact_relationships' (line 51-55)
   - Fix column names: source_profile_id/target_profile_id -> from_profile_id/to_profile_id

4. omniscient-orchestrator
   - Add auth validation with dual-auth pattern (lines 27-33)

5. psychoagent-cascade-predictor
   - Add auth header validation with dual-auth pattern (lines 52-65)

6. synthetic-memory-generator
   - Add auth header validation with dual-auth pattern (lines 42-55)

7. influence-campaign-optimizer
   - Add auth header validation with dual-auth pattern (lines 34-48)

8. predictive-doctrine-engine
   - Add auth header validation with dual-auth pattern (lines 34-48)
```

### Phase 2: Auth Pattern Standardization (Medium Priority)

```text
9. migration5-biometric-tracker
   - Replace throw with HTTP 401 response (lines 52-54)

10. gated-biological-fusion
    - Replace throw with HTTP 401 response (lines 52-54)

11. intelligence-session-runner
    - Replace throw with HTTP 401 response (lines 222-225)

12. memetic-propagation-engine
    - Replace throw with HTTP 401 response (line 65)
```

### Phase 3: Type Safety & Query Improvements (Low Priority)

```text
13. zero-day-anomaly-detector
    - Batch insert anomalies instead of one-at-a-time (lines 232-245)

14. psychoagent-cascade-predictor
    - Add null guards for behavioral data access (lines 168-199)

15. temporal-fusion-transformer
    - Add null guards for interaction data (lines 273-274)
```

---

## Summary

| Category | Issues Found | Severity Distribution |
|----------|-------------|----------------------|
| Authentication | 7 | 4 High, 3 Medium |
| Table Mismatches | 5 | 3 High, 2 Medium |
| Missing Dual-Auth | 8 | 7 High, 1 Medium |
| Column Mismatches | 4 | 1 High, 2 Medium, 1 Low |
| Race Conditions | 3 | 2 Medium, 1 Low |
| Missing Limits | 4 | 1 Medium, 3 Low |
| Type Safety | 5 | 1 Medium, 4 Low |
| Error Format | 6 | All Low |
| **TOTAL** | **42** | **15 High, 11 Medium, 16 Low** |

---

## Files To Be Modified

1. `supabase/functions/tas-com-community-detector/index.ts` - 4 fixes
2. `supabase/functions/emotional-contagion-modeler/index.ts` - 4 fixes
3. `supabase/functions/social-graph-predictor/index.ts` - 3 fixes
4. `supabase/functions/omniscient-orchestrator/index.ts` - 1 fix
5. `supabase/functions/psychoagent-cascade-predictor/index.ts` - 2 fixes
6. `supabase/functions/synthetic-memory-generator/index.ts` - 1 fix
7. `supabase/functions/influence-campaign-optimizer/index.ts` - 1 fix
8. `supabase/functions/predictive-doctrine-engine/index.ts` - 1 fix
9. `supabase/functions/migration5-biometric-tracker/index.ts` - 1 fix
10. `supabase/functions/gated-biological-fusion/index.ts` - 1 fix
11. `supabase/functions/intelligence-session-runner/index.ts` - 1 fix
12. `supabase/functions/memetic-propagation-engine/index.ts` - 1 fix
13. `supabase/functions/zero-day-anomaly-detector/index.ts` - 1 fix
14. `supabase/functions/temporal-fusion-transformer/index.ts` - 1 fix

**Total: 14 files, ~50 line modifications**

---

## Deployment Order

1. **Immediate (Critical)**: Fix 8 functions with missing/broken auth patterns + table name issues
2. **Priority (Medium)**: Fix 4 functions with throw-based auth error handling
3. **Standard (Low)**: Apply type safety and batch improvements to remaining 2 functions

All fixes in each phase can be implemented in parallel. After deployment, use "Retry Failed" on the intelligence session to validate all 94 tasks complete successfully.

