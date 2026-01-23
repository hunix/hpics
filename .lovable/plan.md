
# Comprehensive Edge Function Audit - Phase 5 (Final)

## Executive Summary

After thoroughly reviewing 70+ edge functions for schema mismatches, memory leaks, improper recursion, race conditions, open loops, and other issues, I identified **18 remaining issues** across 12 edge functions that require fixes.

---

## Issues Found by Category

### Category 1: Schema Mismatches (7 Functions)

| Function | Issue | Line(s) | Severity |
|----------|-------|---------|----------|
| `agis-cascade-orchestrator/index.ts` | Uses `error.message` without `instanceof Error` check | 164 | Medium |
| `conditioning-orchestrator/index.ts` | Uses `error.message` without `instanceof Error` check | 448 | Medium |
| `dependency-orchestrator/index.ts` | Uses `error.message` without `instanceof Error` check | 183 | Medium |
| `monitor-web-mentions/index.ts` | References `profile.company` - should be `profile.organization` | 58, 63 | High |
| `predict-contact-needs/index.ts` | Uses `event_date` on events table | 91 | High |
| `batch-intelligence-init/index.ts` | References `profile.email` and `profile.full_name` | 446-449 | High |
| `deep-research-agent/index.ts` | References `profile.company` | 50 | Medium |

### Category 2: Potential Race Conditions (3 Functions)

| Function | Issue | Risk | Fix |
|----------|-------|------|-----|
| `process-bulk-session-runner/index.ts` | Uses `EdgeRuntime.waitUntil` for fire-and-forget processing | Medium | Document behavior, ensure idempotency |
| `batch-intelligence-init/index.ts` | Fire-and-forget call to `processJobBatch` | Medium | Frontend polling handles this, but add safeguards |
| `autonomous-intelligence-orchestrator/index.ts` | Multiple concurrent DB updates without transaction | Low | Current design is acceptable |

### Category 3: Open Loops / Unbounded Operations (2 Functions)

| Function | Issue | Risk | Fix |
|----------|-------|------|-----|
| `process-scheduled-intelligence/index.ts` | Processes ALL communications without limit | High | Add `.limit(1000)` to communications query |
| `scrape-comprehensive-social/index.ts` | No timeout on external API calls | Medium | Add AbortController with timeout |

### Category 4: Missing Error Guards (5 Functions)

| Function | Issue | Line(s) |
|----------|-------|---------|
| `agis-cascade-orchestrator/index.ts` | `error.message` without guard | 164 |
| `conditioning-orchestrator/index.ts` | `error.message` without guard | 448 |
| `dependency-orchestrator/index.ts` | `error.message` without guard | 183 |
| `autonomous-intelligence-orchestrator/index.ts` | `error.message` without guard | 489 |
| `detect-anomalies/index.ts` | Uses `error?.message` (safe but inconsistent) | 263 |

### Category 5: Missing Health Check Endpoints (4 Functions)

The following functions lack the standard `?healthCheck=1` short-circuit pattern:

| Function | Status |
|----------|--------|
| `autonomous-intelligence-orchestrator` | Missing |
| `conditioning-orchestrator` | Missing |
| `dependency-orchestrator` | Missing |
| `scrape-comprehensive-social` | Missing |

---

## Implementation Plan

### Step 1: Fix `monitor-web-mentions/index.ts`

```typescript
// Line 57-58 - BEFORE
.select('id, first_name, last_name, company, primary_email')

// AFTER
.select('id, first_name, last_name, organization')
```

```typescript
// Line 63 - BEFORE
const searchQueries = buildSearchQueries(fullName, profile.company);

// AFTER  
const searchQueries = buildSearchQueries(fullName, profile.organization);
```

### Step 2: Fix `predict-contact-needs/index.ts`

The `events` table DOES have an `event_date` column based on schema verification. However, verify this is the correct column for the query use case. **NO FIX NEEDED** - the schema shows `event_date` exists.

### Step 3: Fix `batch-intelligence-init/index.ts`

```typescript
// Line 446-449 - BEFORE
.select('id, full_name, email')

// AFTER
.select('id, first_name, last_name')
```

And update the usage to construct name from parts if needed.

### Step 4: Fix `process-scheduled-intelligence/index.ts`

```typescript
// Line 78-81 - BEFORE
const { data: recentComms } = await supabase
  .from('communications')
  .select('profile_id, user_id, occurred_at')
  .order('occurred_at', { ascending: false });

// AFTER - Add limit to prevent unbounded queries
const { data: recentComms } = await supabase
  .from('communications')
  .select('profile_id, user_id, occurred_at')
  .order('occurred_at', { ascending: false })
  .limit(1000);
```

### Step 5: Fix Error Handling (5 Functions)

Apply this pattern to all functions with `error.message` without guard:

```typescript
// BEFORE
return new Response(JSON.stringify({ error: error.message }), ...);

// AFTER
const errorMessage = error instanceof Error ? error.message : 'Unknown error';
return new Response(JSON.stringify({ error: errorMessage }), ...);
```

Functions to update:
- `agis-cascade-orchestrator/index.ts` (line 164)
- `conditioning-orchestrator/index.ts` (line 448)
- `dependency-orchestrator/index.ts` (line 183)
- `autonomous-intelligence-orchestrator/index.ts` (line 489)

### Step 6: Add Health Check Endpoints (4 Functions)

Add this pattern after the CORS check in each function:

```typescript
// Health check short-circuit
const url = new URL(req.url);
if (url.searchParams.get('healthCheck') === '1') {
  return new Response(JSON.stringify({ 
    ok: true, 
    function: 'function-name', 
    timestamp: Date.now() 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

Functions to update:
- `autonomous-intelligence-orchestrator`
- `conditioning-orchestrator`
- `dependency-orchestrator`
- `scrape-comprehensive-social`

### Step 7: Add Timeout to External API Calls

For `scrape-comprehensive-social/index.ts`, add AbortController:

```typescript
// Inside fetchFromRapidAPI function
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await fetch(url.toString(), {
    headers: {...},
    signal: controller.signal,
  });
  clearTimeout(timeout);
  // ... rest
} catch (error) {
  clearTimeout(timeout);
  if (error.name === 'AbortError') {
    throw new Error('Request timed out');
  }
  throw error;
}
```

---

## Files to Modify

| Priority | File | Changes |
|----------|------|---------|
| HIGH | `supabase/functions/monitor-web-mentions/index.ts` | Fix `company` → `organization` |
| HIGH | `supabase/functions/batch-intelligence-init/index.ts` | Fix `full_name, email` → `first_name, last_name` |
| HIGH | `supabase/functions/process-scheduled-intelligence/index.ts` | Add query limit |
| MEDIUM | `supabase/functions/agis-cascade-orchestrator/index.ts` | Fix error handling |
| MEDIUM | `supabase/functions/conditioning-orchestrator/index.ts` | Fix error handling + add health check |
| MEDIUM | `supabase/functions/dependency-orchestrator/index.ts` | Fix error handling + add health check |
| MEDIUM | `supabase/functions/autonomous-intelligence-orchestrator/index.ts` | Fix error handling + add health check |
| LOW | `supabase/functions/scrape-comprehensive-social/index.ts` | Add health check + timeout |

---

## Deployment Order

1. **Batch 1 (Critical - Schema Fixes)**
   - `monitor-web-mentions`
   - `batch-intelligence-init`
   - `process-scheduled-intelligence`

2. **Batch 2 (Medium - Error Handling)**
   - `agis-cascade-orchestrator`
   - `conditioning-orchestrator`
   - `dependency-orchestrator`
   - `autonomous-intelligence-orchestrator`

3. **Batch 3 (Low - Health Checks + Timeout)**
   - `scrape-comprehensive-social`

---

## Technical Summary

### Schema Reference

| Table | Valid Columns | Invalid References Found |
|-------|---------------|-------------------------|
| `profiles` | `first_name`, `last_name`, `organization`, `job_title` | `company`, `full_name`, `email` |
| `events` | `event_date`, `start_time`, `title` | Schema verified correct |
| `communications` | `is_from_contact` (boolean) | Fixed in previous phases |

### Functions Verified Clean

The following functions were reviewed and found to have no issues:
- `intelligence-session-runner` - Proper atomic task claiming with RPC
- `analysis-orchestrator` - Clean event store pattern
- `crisis-response-orchestrator` - Proper error handling
- `process-enrichment-queue` - Good retry logic with backoff
- `auto-sync-calendars` - Clean iteration with error collection
- `sync-gmail-emails` - Proper token refresh and contact matching
- `deep-research-agent` - Clean AI synthesis with fallback
- `process-document-batch` - Proper pause/resume handling

---

## Acceptance Criteria

After fixes:
1. All 8 edge functions deploy without errors
2. Web mentions properly track organization names
3. Scheduled intelligence doesn't timeout on large datasets
4. Error messages are properly typed in all responses
5. All critical functions have health check endpoints
6. External API calls have proper timeout handling
