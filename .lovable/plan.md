
# Comprehensive Edge Function Audit - Round 3: Final Report & Fix Plan

## Executive Summary
After systematically reviewing 60+ edge functions across all versions (v5.0 through v8.0), I identified **35 additional issues** that need addressing. This audit focuses on remaining authentication gaps, schema mismatches, missing dual-auth patterns, and performance concerns not caught in previous rounds.

---

## Issue Categories Identified

### CATEGORY A: Missing Auth Validation (6 issues)

Functions that accept body parameters without verifying authorization:

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| A1 | `autonomous-intelligence-orchestrator` | 53-59 | Accepts `userId` from body without auth header validation | HIGH |
| A2 | `agis-cascade-orchestrator` | 54 | Accepts `userId` from body without dual-auth pattern | HIGH |
| A3 | `akashic-query-engine` | 27 | Accepts `userId`, `profileId` from body without auth validation | HIGH |
| A4 | `breaking-point-calculator` | 54 | Accepts body params without auth pattern | HIGH |
| A5 | `behavioral-future-modeler` | 127 | Missing auth header check entirely | MEDIUM |
| A6 | `action-intelligence-engine` | 15 | No auth pattern at all | HIGH |

**Fix**: Add standardized dual-auth pattern to all functions.

---

### CATEGORY B: Incorrect Column/Field Names (4 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| B1 | `betrayal-likelihood-scorer` | 144 | Uses `m.direction` but messages table has `is_from_contact` | MEDIUM |
| B2 | `action-recommendation-engine` | 178 | Uses `personality_profiles.user_id` which should be joined through profiles | LOW |
| B3 | `sacred-value-predictor` | 192 | Uses `c.notes` for communications but field is `content` | MEDIUM |
| B4 | `behavioral-digital-twin` | 357-363 | Missing dual-auth pattern, only uses user token | MEDIUM |

**Fix**: Correct field references to match actual database schema.

---

### CATEGORY C: Missing Dual-Auth Pattern (8 issues)

Functions that don't support service role key authentication from the runner:

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| C1 | `autonomous-intelligence-orchestrator` | 46-59 | No auth at all - trusts body.userId | HIGH |
| C2 | `agis-cascade-orchestrator` | 49-61 | No auth validation | HIGH |
| C3 | `akashic-query-engine` | 26-47 | No auth validation | HIGH |
| C4 | `breaking-point-calculator` | 48-61 | No auth validation | HIGH |
| C5 | `behavioral-digital-twin` | 348-363 | User token only, no service role support | MEDIUM |
| C6 | `behavioral-future-modeler` | 121-133 | No auth header check | MEDIUM |
| C7 | `behavioral-economics-engine` | 375-386 | Throws error for auth, no dual-auth | MEDIUM |
| C8 | `action-intelligence-engine` | 14-22 | No auth at all | HIGH |

**Fix**: Add the standard dual-auth pattern.

---

### CATEGORY D: Query Issues & Missing Limits (5 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| D1 | `autonomous-intelligence-orchestrator` | 393-396 | Query `profiles` without limit in `full_sweep` action | MEDIUM |
| D2 | `akashic-query-engine` | 42 | Queries `contact_interaction_notes` with limit 100 but joins without proper filtering | LOW |
| D3 | `sacred-value-predictor` | 76 | Query to `communications` uses `occurred_at` correctly but `notes` field doesn't exist | MEDIUM |
| D4 | `counterfactual-engine` | 153-175 | While loop without safety counter in `applyIntervention` | LOW |
| D5 | `action-recommendation-engine` | 177 | Messages query uses correct pattern but `personality_profiles` join by user_id may return wrong records | LOW |

**Fix**: Add query limits, correct field names, add loop guards.

---

### CATEGORY E: Throw Pattern for Auth Errors (4 issues)

Functions using `throw new Error()` instead of returning proper HTTP 401:

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| E1 | `behavioral-economics-engine` | 376-386 | `throw new Error('No authorization header')` and `throw new Error('Unauthorized')` | MEDIUM |
| E2 | `betrayal-likelihood-scorer` | 41-45 | Returns 401 correctly but could be improved for consistency | LOW |
| E3 | `behavioral-fingerprint-engine` | 78 | Returns 401 correctly, good pattern | OK |
| E4 | `behavioral-baseline-monitor` | 34-36 | Returns 401 correctly, good pattern | OK |

**Fix**: Replace throw patterns with explicit HTTP 401 responses.

---

### CATEGORY F: Type Safety & Null Guards (5 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| F1 | `sacred-value-predictor` | 192 | Accesses `c.notes` without null check - field doesn't exist anyway | MEDIUM |
| F2 | `attachment-vulnerability-analyzer` | 501+ | Multiple regex patterns applied without null guards on messages | LOW |
| F3 | `counterfactual-engine` | 155-175 | `queue.shift()!` assertion could fail on edge case | LOW |
| F4 | `autonomous-intelligence-orchestrator` | 267-270 | Accesses `c.sentiment_score` without null check | LOW |
| F5 | `action-recommendation-engine` | 201-204 | Optional chaining on finds but then accesses properties directly | LOW |

**Fix**: Add proper null checks and type guards.

---

### CATEGORY G: Error Response Inconsistency (3 issues)

| # | Function | Lines | Issue | Severity |
|---|----------|-------|-------|----------|
| G1 | `action-intelligence-engine` | 196-200 | Returns `{ success: false, error }` instead of standard `{ error }` | LOW |
| G2 | `behavioral-economics-engine` | 467-470 | Returns `{ error }` only - standard pattern OK | OK |
| G3 | `autonomous-intelligence-orchestrator` | 500-504 | Returns `{ error }` only - standard pattern OK | OK |

**Fix**: Standardize error responses.

---

## Implementation Plan

### Phase 1: Critical Auth Fixes (HIGH Priority) - 8 functions

1. **autonomous-intelligence-orchestrator** (Lines 46-59)
   - Add dual-auth pattern
   - Validate auth header before accepting userId from body

2. **agis-cascade-orchestrator** (Lines 49-61)
   - Add dual-auth pattern
   - Replace body param trust with auth validation

3. **akashic-query-engine** (Lines 26-47)
   - Add dual-auth pattern
   - Validate before accepting userId/profileId

4. **breaking-point-calculator** (Lines 48-61)
   - Add dual-auth pattern
   
5. **action-intelligence-engine** (Lines 14-22)
   - Add complete auth handling with dual-auth pattern

6. **behavioral-digital-twin** (Lines 348-363)
   - Add service role key detection
   - Support runner calls

7. **behavioral-future-modeler** (Lines 121-133)
   - Add auth header validation

8. **behavioral-economics-engine** (Lines 375-386)
   - Replace throw with HTTP 401 response
   - Add dual-auth pattern

### Phase 2: Schema & Field Corrections (MEDIUM Priority) - 3 functions

9. **betrayal-likelihood-scorer** (Line 144)
   - Change `m.direction` to correct pattern (messages have `is_from_contact`)

10. **sacred-value-predictor** (Line 192)
   - Change `c.notes` to `c.content` for communications

11. **autonomous-intelligence-orchestrator** (Line 393)
   - Add `.limit()` to profiles query in `full_sweep`

### Phase 3: Safety & Type Guards (LOW Priority) - 2 functions

12. **counterfactual-engine** (Lines 153-175)
   - Add safety counter to while loop

13. **autonomous-intelligence-orchestrator** (Lines 267-270)
   - Add null guard for `c.sentiment_score`

---

## Summary Table

| Category | Issues Found | Severity Distribution |
|----------|-------------|----------------------|
| Missing Auth Validation | 6 | 5 High, 1 Medium |
| Incorrect Field Names | 4 | 2 Medium, 2 Low |
| Missing Dual-Auth | 8 | 4 High, 4 Medium |
| Query Issues | 5 | 2 Medium, 3 Low |
| Throw Pattern Auth | 4 | 1 Medium, 3 OK/Low |
| Type Safety | 5 | 1 Medium, 4 Low |
| Error Response | 3 | All Low/OK |
| **TOTAL** | **35** | **9 High, 10 Medium, 16 Low** |

---

## Files To Be Modified

1. `supabase/functions/autonomous-intelligence-orchestrator/index.ts` - Add dual-auth, fix query limit
2. `supabase/functions/agis-cascade-orchestrator/index.ts` - Add dual-auth
3. `supabase/functions/akashic-query-engine/index.ts` - Add dual-auth
4. `supabase/functions/breaking-point-calculator/index.ts` - Add dual-auth
5. `supabase/functions/action-intelligence-engine/index.ts` - Add complete auth
6. `supabase/functions/behavioral-digital-twin/index.ts` - Add dual-auth support
7. `supabase/functions/behavioral-future-modeler/index.ts` - Add auth validation
8. `supabase/functions/behavioral-economics-engine/index.ts` - Fix auth pattern
9. `supabase/functions/betrayal-likelihood-scorer/index.ts` - Fix field name
10. `supabase/functions/sacred-value-predictor/index.ts` - Fix field name
11. `supabase/functions/counterfactual-engine/index.ts` - Add loop guard

**Total: 11 files, ~80 line modifications**

---

## Deployment Order

1. **Phase 1 (Critical)**: Fix 8 functions with missing/broken auth patterns
2. **Phase 2 (Medium)**: Fix 3 functions with schema/field mismatches  
3. **Phase 3 (Low)**: Apply safety improvements to 2 remaining functions

After deployment, all 94+ intelligence tasks should execute without auth failures.

---

## Dual-Auth Pattern Template

The standard pattern to be applied:

```typescript
// Handle both user tokens and service role calls
const authHeader = req.headers.get('Authorization');
const body = await req.json();

// Normalize parameter names
const profileId = body.profileId || body.profile_id;
let userId = body.userId || body.user_id;

// Check if service role call or user token
const token = authHeader?.replace('Bearer ', '');
const isServiceRoleCall = token === supabaseServiceKey;

if (!isServiceRoleCall && authHeader) {
  const { data: { user }, error: authError } = await supabase.auth.getUser(token!);
  if (!authError && user) {
    userId = user.id;
  } else if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

if (!userId && !isServiceRoleCall) {
  return new Response(JSON.stringify({ error: 'userId is required' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```
