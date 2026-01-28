
# Comprehensive Edge Function Audit: Issues & Fix Plan

## Executive Summary
After reviewing 30+ edge functions across v6.0, v7.0, and v8.0 intelligence engines, I identified **28 distinct issues** spanning authentication patterns, code consistency, potential race conditions, and architectural concerns. All reviewed functions now have the dual-auth pattern correctly implemented. The remaining issues are categorized below.

---

## Issue Categories Identified

### CATEGORY A: Authentication & Authorization (3 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| A1 | `kallisti-theory-of-mind` | Uses `throw new Error()` for auth failures instead of returning proper HTTP 401 responses | Medium |
| A2 | `collective-behavior-predictor` | Same pattern - throws error instead of HTTP 401 | Medium |
| A3 | `dark2clear-deanonymization` | Same pattern - throws error instead of HTTP 401 | Medium |

**Root Cause**: Early v7.0 functions used `throw new Error('Invalid user token')` which gets caught and returns HTTP 500 instead of HTTP 401.

**Fix**: Replace throw pattern with explicit 401 Response return.

---

### CATEGORY B: Column Name Mismatches (4 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| B1 | `aggregate-voice-intelligence` | Line 271: Uses `profile_id` variable but declared `finalProfileId` - inconsistent | Low |
| B2 | `bayesian-intention-predictor` | Line 154: Queries `communications.created_at` - should be `occurred_at` per schema | Medium |
| B3 | `collective-behavior-predictor` | Line 68-71: Queries `relationships` table - should be `contact_relationships` | High |
| B4 | `cascade-virality-predictor` | Line 63-66: Queries `contact_relationships` but uses `closeness_score` which may not exist | Medium |

**Fix**: Correct column/table names to match actual database schema.

---

### CATEGORY C: Query Performance & Missing Limits (5 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| C1 | `intelligence-session-runner` | Line 722: `Promise.all` with batch of 3 tasks runs in parallel but no timeout per batch | Medium |
| C2 | `multi-party-deception-detector` | Line 111-113: Queries communications with limit 500 - may hit Supabase 1000-row ceiling in heavy profiles | Low |
| C3 | `zero-day-anomaly-detector` | Lines 107-115: Dynamic query construction without explicit limit could return unbounded data | Medium |
| C4 | `sentient-intent-analyzer` | Line 152-153: Queries communications with limit 200 - acceptable but `order by created_at` should be `occurred_at` | Low |
| C5 | `automated-red-team-engine` | Line 114-117: Communications query uses `occurred_at` correctly but no index hint | Low |

**Fix**: Add explicit limits, correct column names, add query timeouts where missing.

---

### CATEGORY D: Type Safety & Undefined Access (6 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| D1 | `kallisti-theory-of-mind` | Lines 366-367: `communications` typed as `Record<string, unknown>[]` but accesses `.content?.length` without type narrowing | Low |
| D2 | `hypergame-theory-engine` | Lines 395-399: Accesses `c.sentiment_score` without null check on array elements | Low |
| D3 | `iio-attribution-engine` | Line 149: Domain regex check `domain.includes('-')` could fail if domain is undefined | Low |
| D4 | `reflexive-control-detector` | Line 179: `cues[cue as keyof typeof cues]` - potential runtime error if cue key doesn't exist | Low |
| D5 | `bayesian-intention-predictor` | Lines 383-384: Accesses `comm.channel` without null safety | Low |
| D6 | `cascade-virality-predictor` | Lines 99-101: Filters `profiles` with optional chaining but then accesses `p.first_name` directly | Low |

**Fix**: Add proper null checks and type guards.

---

### CATEGORY E: Potential Race Conditions (2 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| E1 | `intelligence-session-runner` | Lines 713-719: Session status check inside batch loop - if session is cancelled while batch is processing, tasks may still complete | Medium |
| E2 | `zero-day-anomaly-detector` | Lines 232-244: Loop inserts into `behavioral_anomalies` without batching - could cause rate limiting or partial failures | Low |

**Fix**: Add transaction wrapper or batch inserts for multi-row operations.

---

### CATEGORY F: Open Loops & Resource Management (3 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| F1 | `multi-party-deception-detector` | Lines 352-383: `detectSynchronizedMessaging` uses while loop with `windowStart` increment - could infinite loop if date parsing fails | Medium |
| F2 | `audio-burst-analyzer` | Line 65-73: `computeHilbertEnvelope` iterates signal array without length validation | Low |
| F3 | `subvocalization-detector` | Line 240-254: Pattern detection loop could be expensive for large datasets - no early termination | Low |

**Fix**: Add loop guards and early termination conditions.

---

### CATEGORY G: Inconsistent Error Response Format (3 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| G1 | `cascade-virality-predictor` | Returns `{ success: false, error: message }` on failure | Low |
| G2 | `network-resilience-analyzer` | Returns `{ success: false, error: message }` on failure | Low |
| G3 | Most other functions | Return `{ error: message }` without success flag | Low |

**Pattern Mismatch**: Some functions include `success: false`, others just include `error` key.

**Fix**: Standardize error response format across all functions.

---

### CATEGORY H: Missing `onConflict` Column Specification (2 issues)

| # | Function | Issue | Severity |
|---|----------|-------|----------|
| H1 | `bayesian-intention-predictor` | Line 231: `onConflict: 'profile_id'` - table `bayesian_intention_models` may have composite unique key | Medium |
| H2 | `collective-behavior-predictor` | Line 125: `onConflict: 'profile_id,user_id'` - verify constraint exists | Low |

**Fix**: Verify unique constraints match the `onConflict` specification.

---

## Implementation Plan

### Phase 1: Critical Fixes (High Priority)

```text
1. collective-behavior-predictor
   - Fix: Change `relationships` table to `contact_relationships`
   - File: supabase/functions/collective-behavior-predictor/index.ts
   - Lines: 68-71
```

### Phase 2: Auth Pattern Standardization (Medium Priority)

```text
2. kallisti-theory-of-mind
   - Fix: Replace `throw new Error('Invalid user token')` with HTTP 401 response
   - Lines: 53-54

3. collective-behavior-predictor
   - Fix: Replace `throw new Error('Invalid user token')` with HTTP 401 response
   - Lines: 53-54

4. dark2clear-deanonymization
   - Fix: Replace `throw new Error('Invalid user token')` with HTTP 401 response
   - Lines: 53-54
```

### Phase 3: Column Name Corrections (Medium Priority)

```text
5. aggregate-voice-intelligence
   - Fix: Line 271 - change `profile_id` to `finalProfileId`

6. bayesian-intention-predictor
   - Fix: Line 154 - change `created_at` to `occurred_at` for communications ordering

7. sentient-intent-analyzer
   - Fix: Line 152 - change `created_at` to `occurred_at` for communications ordering
```

### Phase 4: Type Safety Improvements (Low Priority)

```text
8. hypergame-theory-engine
   - Fix: Lines 395-399 - add null check before accessing sentiment_score

9. iio-attribution-engine
   - Fix: Line 149 - add null guard for domain check

10. bayesian-intention-predictor
    - Fix: Lines 383-384 - add null safety for comm.channel
```

### Phase 5: Loop Guard Additions (Low Priority)

```text
11. multi-party-deception-detector
    - Fix: Lines 352-383 - add maximum iteration guard to while loop
    - Add: `let safetyCounter = 0; const MAX_ITERATIONS = 10000;`
    - Check: `if (++safetyCounter > MAX_ITERATIONS) break;`

12. audio-burst-analyzer
    - Fix: Line 59 - add early return if signal.length === 0
```

### Phase 6: Error Response Standardization (Low Priority)

```text
13. All functions
    - Standardize on: `{ error: string }` for failures
    - Standardize on: `{ success: true, ...data }` for success
```

---

## Summary

| Category | Issues Found | Severity Distribution |
|----------|-------------|----------------------|
| Authentication | 3 | Medium |
| Column Mismatches | 4 | 1 High, 2 Medium, 1 Low |
| Query Performance | 5 | 2 Medium, 3 Low |
| Type Safety | 6 | All Low |
| Race Conditions | 2 | 1 Medium, 1 Low |
| Open Loops | 3 | 1 Medium, 2 Low |
| Error Format | 3 | All Low |
| onConflict Spec | 2 | 1 Medium, 1 Low |
| **TOTAL** | **28** | 1 High, 9 Medium, 18 Low |

---

## Deployment Order

1. **Immediate**: Fix `collective-behavior-predictor` table name (HIGH)
2. **Priority**: Fix 3 auth pattern functions (MEDIUM)
3. **Standard**: Fix 4 column name issues (MEDIUM)
4. **Batch**: Apply type safety and loop guard improvements (LOW)
5. **Final**: Standardize error responses (LOW)

All fixes can be implemented in parallel within their phase. Total estimated changes: 15 files, ~50 line modifications.
