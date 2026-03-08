# SCHEMA_MAP — Authoritative Table Reference for AI Code Generation

> **Purpose**: This is the single source of truth for column names when writing code that queries the database. AI models and developers MUST reference this file instead of guessing column names.
>
> **Last verified against**: `src/integrations/supabase/types.ts` (auto-generated from live DB)

---

## Core Tables

### `profiles`
Primary contact/person table. One row per contact per user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | Owner |
| `first_name` | text | |
| `last_name` | text | |
| `organization` | text | |
| `job_title` | text | ⚠️ NOT `occupation` |
| `relationship_type` | text | enum |
| `relationship_subtype` | text | |
| `hierarchy_level` | text | |
| `notes` | text | |
| `avatar_url` | text | |
| `is_favorite` | boolean | |
| `is_active` | boolean | |
| `tags` | text[] | |
| `country` | text | |
| `city` | text | |
| `address` | text | |
| `bio` | text | |
| `linkedin_url` | text | |
| `engagement_score` | numeric | |
| `data_richness_score` | numeric | |
| `last_contact_date` | timestamptz | |
| `last_accessed_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `media`
Files uploaded per contact. ⚠️ Common hallucination target.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `file_url` | text | ⚠️ NOT `file_path` |
| `mime_type` | text | ⚠️ NOT `file_type` or `media_type` |
| `file_size` | integer | bytes |
| `storage_path` | text | Supabase storage path |
| `caption` | text | |
| `title` | text | |
| `file_name` | text | ⚠️ NOT `original_filename` |
| `media_type` | text | image/video/audio category |
| `thumbnail_url` | text | ⚠️ NOT `thumbnail_path` |
| `ai_metadata` | jsonb | |
| `ai_generation_status` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `messages`
Chat messages within conversations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `conversation_id` | uuid | FK→conversations |
| `content` | text | |
| `is_from_contact` | boolean | |
| `message_type` | text | |
| `media_url` | text | |
| `source` | text | |
| `metadata` | jsonb | |
| `sent_at` | timestamptz | |
| `created_at` | timestamptz | |

### `communications`
Logged communication events (calls, emails, meetings).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `channel` | text | enum |
| `direction` | text | 'inbound' or 'outbound' |
| `content` | text | |
| `subject` | text | |
| `occurred_at` | timestamptz | ⚠️ NOT `created_at` for timing |
| `duration_minutes` | integer | |
| `sentiment_score` | numeric | |
| `created_at` | timestamptz | |

### `contact_interaction_notes`
⚠️ This is the table for both "interactions" AND "notes". Do NOT look for separate `interactions` or `notes` tables.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `interaction_type` | text | |
| `interaction_date` | timestamptz | |
| `duration_minutes` | integer | |
| `location` | text | |
| `note_text` | text | ⚠️ NOT `notes` or `content` |
| `audio_url` | text | |
| `audio_transcription` | text | |
| `mood_observed` | text | |
| `topics_discussed` | text[] | |
| `action_items` | jsonb | |
| `promises_made` | jsonb | |
| `relationship_temperature` | numeric | |
| `notable_changes` | text | |
| `follow_up_needed` | boolean | |
| `follow_up_date` | date | |
| `follow_up_reason` | text | |
| `ai_extracted_insights` | jsonb | |
| `ai_processed_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `contact_observations`
Behavioral observations about contacts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `category` | text | |
| `title` | text | |
| `observation` | text | |
| `observation_date` | timestamptz | |
| `confidence_level` | text | |
| `ai_validation_status` | text | |
| `ai_validation_result` | jsonb | |
| `ai_confidence_score` | numeric | |
| `related_analysis_ids` | uuid[] | |
| `tags` | text[] | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `contact_relationships`
⚠️ This is the definitive relationship/association table. Do NOT use a `relationships` table.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `from_profile_id` | uuid | FK→profiles |
| `to_profile_id` | uuid | FK→profiles |
| `relationship_type` | text | |
| `subtype` | text | |
| `strength` | numeric | |
| `bidirectional` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `contact_methods`
Phone, email, social handles for a contact.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `profile_id` | uuid | FK→profiles |
| `contact_type` | text | 'email', 'phone', 'social' |
| `value` | text | |
| `label` | text | |
| `is_primary` | boolean | |
| `is_verified` | boolean | |
| `last_accessed_at` | timestamptz | |
| `created_at` | timestamptz | |

⚠️ No `user_id` column — access via `profiles.user_id` join.

### `ai_analyses`
AI analysis results.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `analysis_type` | text | |
| `result` | jsonb | ⚠️ Cast with `as unknown as T` |
| `generated_at` | timestamptz | |

### `psychological_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `attachment_style` | text | |
| `dark_triad_indicators` | jsonb | |
| `emotional_intelligence` | jsonb | |
| `vulnerability_map` | jsonb | |
| `leverage_points` | jsonb | |
| `action_plans` | jsonb | |
| `deception_analysis` | jsonb | |
| `influence_vectors` | jsonb | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `mice_assessments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `money_score` | numeric | |
| `ideology_score` | numeric | |
| `compromise_score` | numeric | |
| `ego_score` | numeric | |
| `primary_vulnerability` | text | |
| `recruitment_pathways` | jsonb | |
| `exploitation_scripts` | jsonb | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `dossiers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `title` | text | |
| `classification` | text | |
| `dossier_type` | text | |
| `content` | jsonb | |
| `sections` | jsonb | |
| `summary` | text | |
| `key_findings` | jsonb | |
| `risk_assessment` | jsonb | |
| `generated_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `conversations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `platform` | text | |
| `last_message_at` | timestamptz | |
| `created_at` | timestamptz | |

### `documents`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `profile_id` | uuid | FK→profiles |
| `title` | text | |
| `description` | text | |
| `document_type` | text | |
| `file_url` | text | |
| `file_size` | integer | |
| `storage_path` | text | |
| `created_at` | timestamptz | |

### `bulk_analysis_sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `session_name` | text | |
| `analysis_type` | text | |
| `status` | text | |
| `total_items` | integer | |
| `completed_items` | integer | |
| `failed_items` | integer | |
| `current_item_index` | integer | |
| `current_cost_cents` | integer | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `bulk_analysis_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `session_id` | uuid | FK→bulk_analysis_sessions |
| `profile_id` | uuid | FK→profiles |
| `status` | text | |
| `result` | jsonb | |
| `error_message` | text | |
| `processing_started_at` | timestamptz | |
| `processing_completed_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `platform_config`
System configuration key-value store.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `config_key` | text | |
| `config_value` | jsonb | ⚠️ NOT `override_value` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `automation_rules`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `rule_name` | text | |
| `trigger_type` | text | |
| `trigger_conditions` | jsonb | |
| `action_type` | text | |
| `action_params` | jsonb | |
| `is_active` | boolean | |
| `execution_count` | integer | |
| `success_count` | integer | |
| `failure_count` | integer | |
| `max_daily_executions` | integer | |
| `last_triggered_at` | timestamptz | |
| `last_error` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## ⚠️ Common Hallucination Traps

| Wrong Name | Correct Name | Table |
|------------|-------------|-------|
| `file_path` | `file_url` | media |
| `file_type` | `mime_type` | media |
| `original_filename` | `file_name` | media |
| `thumbnail_path` | `thumbnail_url` | media |
| `media_type` (as column for mime) | `mime_type` | media |
| `occupation` | `job_title` | profiles |
| `interactions` (table) | `contact_interaction_notes` | — |
| `notes` (table) | `contact_interaction_notes` | — |
| `observations` (table) | `contact_observations` | — |
| `relationships` (table) | `contact_relationships` | — |
| `override_value` | `config_value` | platform_config |
| `content` (for notes) | `note_text` | contact_interaction_notes |

---

## JSON Field Casting Rule

All JSONB fields from database queries MUST use double-cast:
```typescript
// ✅ CORRECT
const data = result as unknown as MyType[];

// ❌ WRONG — TypeScript error
const data = result as MyType[];
```
