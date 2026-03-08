

# Codebase Scan: Schema Mismatches, Leak Fixes & AI Legibility

## Confirmed Issues

### Issue 1: `ai-chat-query` Edge Function — `company` Column Mismatch (Data Query Failure)

**File:** `supabase/functions/ai-chat-query/index.ts`

Three distinct `company` mismatches:
- **Line 82:** `select('id, first_name, last_name, company, communications(occurred_at)')` — `company` does not exist on `profiles`; should be `organization`
- **Line 97:** `p.company` reference in follow-up list — always `undefined`
- **Line 104:** `profiles(first_name, last_name, company)` join select — should be `organization`
- **Line 111:** Type cast `{ company?: string }` — should be `{ organization?: string }`

This means the AI chat query never shows organization names in follow-up or top contact context, degrading AI response quality.

### Issue 2: `tas-com-community-detector` — `company` Column Mismatch (Silent Null)

**File:** `supabase/functions/tas-com-community-detector/index.ts`

- **Line 85:** `select('id, first_name, last_name, job_title, company, city, tags')` — `company` doesn't exist, returns null
- **Line 182:** `company: contact.company` — always undefined
- **Lines 298, 304, 360:** Community detection uses `company` for similarity matching — all comparisons fail because values are null

This means company-based community clustering is entirely broken.

### Issue 3: Model Default Should Be `gemini-3-flash-preview`

Per the AI gateway instructions, the default model should be `google/gemini-3-flash-preview` (not `gemini-2.5-flash`). The model selector already has this as fallback (line 254 of `model-selector.ts`), but the `ai-chat-query` function hardcodes `gemini-2.5-flash` on lines 146 and 181. This is not a bug per se — 2.5-flash works — but updating to the recommended default improves response quality at similar cost.

### Issue 4: `ai-chat-query` Missing Health Check

Per edge function standards (custom instructions §2.4), every edge function must have a GET-based health check. `ai-chat-query` has no GET handler and no `healthCheck` query param check.

---

## Implementation Plan

### Batch 1: Fix `ai-chat-query` schema + model + health check (1 file)

1. Change `company` → `organization` in select queries (lines 82, 104)
2. Change `p.company` → `p.organization` (line 97)
3. Change type cast `company` → `organization` (line 111)
4. Update model to `google/gemini-3-flash-preview` (lines 146, 181)
5. Add health check handler for GET requests at top of handler

### Batch 2: Fix `tas-com-community-detector` schema (1 file)

1. Change `company` → `organization` in select (line 85)
2. Change `company: contact.company` → `organization: contact.organization` in graph building (line 182)
3. Update all references: `m.company` → `m.organization`, `nodeAttrs.company` → `nodeAttrs.organization`, etc. (lines 298, 304, 360)

**Total: 2 files, ~20 line changes.**

