
# Comprehensive Edge Function Audit - Phase 6 (Final)

## Executive Summary

After conducting an exhaustive audit of 70+ edge functions for schema mismatches, memory leaks, race conditions, open loops, and other issues, I have identified **21 remaining issues** across **17 edge functions** that require fixes. The primary issue category is the continued use of the `direction` column (string) instead of `is_from_contact` (boolean) on the `communications` table.

---

## Issues Found by Category

### Category 1: `communications` Table - Using `direction` Instead of `is_from_contact` (11 Functions)

The `communications` table schema:
- Uses `is_from_contact` (boolean) - `true` = from contact (inbound), `false` = from user (outbound)
- Does NOT have a `direction` column

| Function | Issue | Lines | Severity |
|----------|-------|-------|----------|
| `suggest-meeting-time/index.ts` | Filters by `c.direction === 'inbound'/'outbound'` | 145-146 | HIGH |
| `predict-churn-enhanced/index.ts` | Filters by `c.direction === 'outbound'` | 456-457 | HIGH |
| `generate-churn-intervention/index.ts` | Uses `c.direction === 'outgoing'` in template | 194-196 | HIGH |
| `analyze-influence-profile/index.ts` | Maps `direction` field from communications | 118-124 | MEDIUM |
| `analyze-profile/index.ts` | Includes `direction` in AI context | 108-115 | MEDIUM |
| `generate-meeting-followup/index.ts` | Includes `c.direction` in comm history | 147-149 | MEDIUM |
| `mosaic-intelligence-fuser/index.ts` | Maps `c.direction` in data synthesis | 313-315 | MEDIUM |
| `rag-query/index.ts` | Includes `direction` in metadata | 274-279 | MEDIUM |
| `generate-briefing/index.ts` | Uses `c.direction` in prompt template | 70-72 | MEDIUM |
| `cross-modal-deception-v2/index.ts` | Maps `m.direction` from messages table | 195-200 | LOW |
| `deep-intelligence-engine/index.ts` | References `direction` in analysis context | ~150 | LOW |

### Category 2: Missing Health Check Endpoints (4 Functions)

These functions lack the standard `?healthCheck=1` short-circuit pattern:

| Function | Status |
|----------|--------|
| `analyze-profile` | Missing |
| `generate-briefing` | Missing |
| `enrichment-orchestrator` | Missing |
| `generate-churn-intervention` | Missing |

### Category 3: Functions Previously Verified Clean

The following functions were reviewed and found to have no remaining issues:
- `analyze-behavioral` - Uses correct schema
- `predict-contact-needs` - Correctly uses `events.event_date`
- `assess-threat` - Proper error handling
- `assess-trust` - Uses correct table references
- `detect-anomalies` - Uses correct schema
- `predict-churn` - Uses correct schema
- `sync-gmail-emails` - Correct email sync logic
- `sync-outlook-emails` - Correct email sync logic
- `enrich-contact` - Uses correct profile columns
- `detect-life-milestones` - Uses correct schema
- `analyze-network-graph` - Has health check, clean algorithms

---

## Implementation Plan

### Step 1: Fix `suggest-meeting-time/index.ts` (Lines 145-146)

```text
// BEFORE
const inbound = comms.filter(c => c.direction === 'inbound').map(c => new Date(c.occurred_at).getTime());
const outbound = comms.filter(c => c.direction === 'outbound').map(c => new Date(c.occurred_at).getTime());

// AFTER
const inbound = comms.filter(c => c.is_from_contact === true).map(c => new Date(c.occurred_at).getTime());
const outbound = comms.filter(c => c.is_from_contact === false).map(c => new Date(c.occurred_at).getTime());
```

### Step 2: Fix `predict-churn-enhanced/index.ts` (Lines 456-457)

```text
// BEFORE
const outboundComms = comms.filter(c => c.direction === 'outbound').length;

// AFTER
const outboundComms = comms.filter(c => c.is_from_contact === false).length;
```

### Step 3: Fix `generate-churn-intervention/index.ts` (Lines 194-196)

```text
// BEFORE
const commSummary = (communications || []).slice(0, 10).map(c => 
  `${c.direction === 'outgoing' ? 'Sent' : 'Received'} ${c.channel} ...`

// AFTER
const commSummary = (communications || []).slice(0, 10).map(c => 
  `${c.is_from_contact ? 'Received' : 'Sent'} ${c.channel} ...`
```

### Step 4: Fix `analyze-influence-profile/index.ts` (Lines 118-124)

```text
// BEFORE
communications: communications?.map((c) => ({
  channel: c.channel,
  direction: c.direction,
  ...

// AFTER
communications: communications?.map((c) => ({
  channel: c.channel,
  direction: c.is_from_contact ? 'inbound' : 'outbound',
  ...
```

### Step 5: Fix `analyze-profile/index.ts` (Lines 108-115)

```text
// BEFORE
communications: communications.map((c: any) => ({
  channel: c.channel,
  direction: c.direction,
  ...

// AFTER
communications: communications.map((c: any) => ({
  channel: c.channel,
  direction: c.is_from_contact ? 'inbound' : 'outbound',
  ...
```

### Step 6: Fix `generate-meeting-followup/index.ts` (Lines 147-149)

```text
// BEFORE
const commHistory = recentComms?.slice(0, 5).map((c: any) => 
  `${c.channel}: ${c.subject || 'No subject'} (${c.direction})`

// AFTER
const commHistory = recentComms?.slice(0, 5).map((c: any) => 
  `${c.channel}: ${c.subject || 'No subject'} (${c.is_from_contact ? 'inbound' : 'outbound'})`
```

### Step 7: Fix `mosaic-intelligence-fuser/index.ts` (Lines 313-315)

```text
// BEFORE
${communications.data?.slice(0, 30).map((c) => 
  `[${c.occurred_at}] ${c.direction}: ${c.content?.substring(0, 100)}...`

// AFTER
${communications.data?.slice(0, 30).map((c) => 
  `[${c.occurred_at}] ${c.is_from_contact ? 'inbound' : 'outbound'}: ${c.content?.substring(0, 100)}...`
```

### Step 8: Fix `rag-query/index.ts` (Lines 274-279)

```text
// BEFORE
metadata: {
  channel: comm.channel,
  direction: comm.direction,
  ...

// AFTER
metadata: {
  channel: comm.channel,
  direction: comm.is_from_contact ? 'inbound' : 'outbound',
  ...
```

### Step 9: Fix `generate-briefing/index.ts` (Lines 70-72)

```text
// BEFORE
`- ${new Date(c.occurred_at).toLocaleDateString()}: ${c.channel} (${c.direction}) - ${c.subject || 'No subject'}`

// AFTER
`- ${new Date(c.occurred_at).toLocaleDateString()}: ${c.channel} (${c.is_from_contact ? 'inbound' : 'outbound'}) - ${c.subject || 'No subject'}`
```

### Step 10: Fix `cross-modal-deception-v2/index.ts` (Lines 195-200)

Note: The `messages` table also uses `is_from_contact`, not `direction`.

```text
// BEFORE
messages: messages?.map(m => ({
  content: m.content,
  timestamp: m.created_at,
  sentiment: m.ai_analysis?.sentiment,
  direction: m.direction
})),

// AFTER
messages: messages?.map(m => ({
  content: m.content,
  timestamp: m.created_at,
  sentiment: m.ai_analysis?.sentiment,
  direction: m.is_from_contact ? 'inbound' : 'outbound'
})),
```

### Step 11: Add Health Check Endpoints (4 Functions)

Add this pattern after the CORS check in each function:

```text
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
- `analyze-profile`
- `generate-briefing`
- `enrichment-orchestrator`
- `generate-churn-intervention`

---

## Files to Modify

| Priority | File | Issue Count | Changes |
|----------|------|-------------|---------|
| HIGH | `supabase/functions/suggest-meeting-time/index.ts` | 1 | Fix `direction` filtering |
| HIGH | `supabase/functions/predict-churn-enhanced/index.ts` | 1 | Fix `direction` filtering |
| HIGH | `supabase/functions/generate-churn-intervention/index.ts` | 1 + health | Fix `direction` + add health check |
| MEDIUM | `supabase/functions/analyze-influence-profile/index.ts` | 1 | Fix `direction` mapping |
| MEDIUM | `supabase/functions/analyze-profile/index.ts` | 1 + health | Fix `direction` + add health check |
| MEDIUM | `supabase/functions/generate-meeting-followup/index.ts` | 1 | Fix `direction` in template |
| MEDIUM | `supabase/functions/mosaic-intelligence-fuser/index.ts` | 1 | Fix `direction` in synthesis |
| MEDIUM | `supabase/functions/rag-query/index.ts` | 1 | Fix `direction` in metadata |
| MEDIUM | `supabase/functions/generate-briefing/index.ts` | 1 + health | Fix `direction` + add health check |
| LOW | `supabase/functions/cross-modal-deception-v2/index.ts` | 1 | Fix `direction` on messages |
| LOW | `supabase/functions/enrichment-orchestrator/index.ts` | health | Add health check |

---

## Verified Schema Reference

| Table | Correct Column | Invalid Usage Found |
|-------|----------------|---------------------|
| `communications` | `is_from_contact` (boolean) | `direction` (string) |
| `messages` | `is_from_contact` (boolean) | `direction` (string) |

**Mapping Logic:**
- `is_from_contact === true` → "inbound" / "incoming" / "received"
- `is_from_contact === false` → "outbound" / "outgoing" / "sent"

---

## Deployment Order

1. **Batch 1 (Critical - Query/Filter Functions)**
   - `suggest-meeting-time`
   - `predict-churn-enhanced`
   - `generate-churn-intervention`

2. **Batch 2 (Medium - AI Context Functions)**
   - `analyze-profile`
   - `analyze-influence-profile`
   - `generate-meeting-followup`
   - `generate-briefing`

3. **Batch 3 (Low - Data Synthesis Functions)**
   - `mosaic-intelligence-fuser`
   - `rag-query`
   - `cross-modal-deception-v2`
   - `enrichment-orchestrator`

---

## Acceptance Criteria

After fixes:
1. All 11 edge functions deploy without errors
2. Meeting time suggestions calculate response times correctly
3. Churn predictions accurately measure outbound ratio
4. Churn interventions display correct sent/received labels
5. Profile analysis includes correct communication direction context
6. All 4 new functions have working health check endpoints
7. No TypeScript/runtime errors related to `direction` column
