
# Comprehensive Schema Mismatch Audit - Phase 3

## Executive Summary

After conducting a thorough audit of 70+ edge functions, I identified **12 remaining issues** across edge functions that will cause runtime errors due to invalid column/table references. The issues fall into 4 categories.

---

## Category 1: `contact_methods` Table Schema Issues (4 Functions)

The `contact_methods` table:
- Uses `contact_type` NOT `type` for the method type column
- Does NOT have a `user_id` column (linked via `profile_id`)

| Function | Lines | Issue | Fix |
|----------|-------|-------|-----|
| `import-gmail-contacts/index.ts` | 150-152 | `.eq('user_id', userId).eq('type', 'email')` | Remove `user_id` filter; change `type` → `contact_type` |
| `import-gmail-contacts/index.ts` | 189-210 | Inserts with `user_id` and `type` columns | Remove `user_id`; change `type` → `contact_type` |
| `import-outlook-contacts/index.ts` | 129-132 | `.eq('user_id', userId).eq('type', 'email')` | Remove `user_id` filter; change `type` → `contact_type` |
| `import-outlook-contacts/index.ts` | 169-206 | Inserts with `user_id` and `type` columns | Remove `user_id`; change `type` → `contact_type` |

---

## Category 2: `communications` Table Field Mapping (2 Functions)

The `communications` table uses `is_from_contact` (boolean) instead of `direction` (string).

| Function | Lines | Issue | Fix |
|----------|-------|-------|-----|
| `contact-ai-agent/index.ts` | 421 | Uses `c.direction` in template | Change to use `c.is_from_contact ? 'inbound' : 'outbound'` |
| `suggest-followups/index.ts` | 68 | Selects `direction` column | Change to `is_from_contact` |

---

## Category 3: Potential Table/Column Existence Issues (2 Functions)

These reference tables/columns that may not exist or have different schemas.

| Function | Lines | Issue | Fix |
|----------|-------|-------|-----|
| `assess-trust/index.ts` | 82-87 | References `behavioral_analyses`, `facial_analyses`, `vocal_analyses` | Verify tables exist; they appear valid |
| `infer-relationships/index.ts` | 85 | References `company` column on profiles | Should be `organization` |

---

## Category 4: Profile Column Naming Issues (1 Function)

| Function | Lines | Issue | Fix |
|----------|-------|-------|-----|
| `infer-relationships/index.ts` | 85, 151-156 | Uses `company` instead of `organization` and `title` instead of `job_title` | Fix column names |

---

## Implementation Plan

### Step 1: Fix `import-gmail-contacts/index.ts`

**Issue 1a: Checking for existing email (lines 147-153)**
```typescript
// BEFORE
const { data: existing } = await supabase
  .from('contact_methods')
  .select('profile_id')
  .eq('user_id', userId)
  .eq('type', 'email')
  .eq('value', email)
  .limit(1);

// AFTER - join via profiles to check ownership, use contact_type
const { data: existing } = await supabase
  .from('contact_methods')
  .select('profile_id, profiles!inner(user_id)')
  .eq('profiles.user_id', userId)
  .eq('contact_type', 'email')
  .eq('value', email)
  .limit(1);
```

**Issue 1b: Inserting contact methods (lines 188-210)**
```typescript
// BEFORE
contactMethods.push({
  user_id: userId,
  profile_id: profile.id,
  type: 'email',
  value: emailAddr.value,
  label: emailAddr.type || 'personal',
});

// AFTER - remove user_id, change type to contact_type
contactMethods.push({
  profile_id: profile.id,
  contact_type: 'email',
  value: emailAddr.value,
  label: emailAddr.type || 'personal',
});
```

### Step 2: Fix `import-outlook-contacts/index.ts`

Apply same pattern as Gmail - remove `user_id` from `contact_methods` queries/inserts, change `type` to `contact_type`.

### Step 3: Fix `suggest-followups/index.ts`

```typescript
// BEFORE (line 68)
.select('profile_id, occurred_at, channel, direction')

// AFTER
.select('profile_id, occurred_at, channel, is_from_contact')
```

### Step 4: Fix `contact-ai-agent/index.ts`

```typescript
// BEFORE (line 421) - in the communications template
`- [${c.channel}/${c.direction}] ${c.subject || c.content?.substring(0, 100) || 'No content'} (${c.occurred_at})`

// AFTER
`- [${c.channel}/${c.is_from_contact ? 'inbound' : 'outbound'}] ${c.subject || c.content?.substring(0, 100) || 'No content'} (${c.occurred_at})`
```

### Step 5: Fix `infer-relationships/index.ts`

```typescript
// BEFORE (line 85)
.select("id, first_name, last_name, company, title, relationship_type")

// AFTER
.select("id, first_name, last_name, organization, job_title, relationship_type")
```

And update all references to `company` → `organization` and `title` → `job_title` throughout the function.

---

## Files to Modify

| Priority | File | Changes |
|----------|------|---------|
| HIGH | `supabase/functions/import-gmail-contacts/index.ts` | Fix contact_methods schema |
| HIGH | `supabase/functions/import-outlook-contacts/index.ts` | Fix contact_methods schema |
| MEDIUM | `supabase/functions/suggest-followups/index.ts` | Fix `direction` → `is_from_contact` |
| MEDIUM | `supabase/functions/contact-ai-agent/index.ts` | Fix `direction` usage |
| LOW | `supabase/functions/infer-relationships/index.ts` | Fix profile column names |

---

## Technical Details

### `contact_methods` Table Schema (Verified)
```
- id: uuid
- profile_id: uuid (FK to profiles)
- contact_type: text (email, phone, etc.) -- NOT "type"
- value: text
- label: text
- is_primary: boolean
- verified: boolean
- created_at, updated_at
```

**NO `user_id` column** - ownership is determined via the linked profile.

### `communications` Table Schema (Verified)
```
- id: uuid
- user_id: uuid
- profile_id: uuid
- channel: text
- is_from_contact: boolean -- NOT "direction"
- occurred_at: timestamp
- subject: text
- content: text
- sentiment_score: numeric
```

### `profiles` Table Key Columns
```
- organization: text -- NOT "company"
- job_title: text -- NOT "title"
```

---

## Deployment Order

1. **Batch 1 (Critical - Import Functions)**
   - `import-gmail-contacts`
   - `import-outlook-contacts`

2. **Batch 2 (Medium - Query Functions)**
   - `suggest-followups`
   - `contact-ai-agent`

3. **Batch 3 (Low - Inference Functions)**
   - `infer-relationships`

---

## Acceptance Criteria

After fixes:
1. Gmail import creates contacts without errors
2. Outlook import creates contacts without errors
3. Follow-up suggestions load without "column not found" errors
4. Contact AI agent displays communication history correctly
5. Relationship inference uses correct profile columns
