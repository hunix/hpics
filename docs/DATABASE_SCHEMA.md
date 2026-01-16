# HPICS Database Schema Reference

> Data Model and Schema Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Contact Tables](#contact-tables)
4. [Intelligence Tables](#intelligence-tables)
5. [AGIS Tables](#agis-tables)
6. [Biometric Tables](#biometric-tables)
7. [Hardware Tables](#hardware-tables)
8. [Analysis Tables](#analysis-tables)
9. [Communication Tables](#communication-tables)
10. [Security Tables](#security-tables)
11. [Relationships](#relationships)
12. [Row Level Security](#row-level-security)

---

## Overview

### Database Statistics

| Metric | Count |
|--------|-------|
| Total Tables | 428 |
| Core Tables | 45 |
| Intelligence Tables | 85 |
| AGIS Tables | 72 |
| Biometric Tables | 28 |
| Hardware Tables | 35 |
| Analysis Tables | 55 |
| Supporting Tables | 108 |

### Schema Design Principles

1. **User Isolation**: All tables include `user_id` for RLS
2. **Soft Deletes**: Most tables use `is_deleted` flag
3. **Audit Trail**: `created_at`, `updated_at` on all tables
4. **Normalization**: 3NF with strategic denormalization for performance
5. **Indexing**: Composite indexes on common query patterns

---

## Core Tables

### `profiles`

Main contact profiles table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `email` | text | Primary email |
| `phone` | text | Primary phone |
| `company` | text | Company name |
| `title` | text | Job title |
| `avatar_url` | text | Profile photo URL |
| `bio` | text | Biography |
| `date_of_birth` | date | Birth date |
| `gender` | text | Gender |
| `nationality` | text | Nationality |
| `location` | jsonb | Location data |
| `social_links` | jsonb | Social media links |
| `tags` | text[] | Tags array |
| `importance_score` | integer | Contact importance |
| `relationship_type` | text | Relationship category |
| `status` | text | Contact status |
| `clearance_level` | text | Access clearance |
| `created_at` | timestamptz | Created timestamp |
| `updated_at` | timestamptz | Updated timestamp |

**Indexes:**
- `profiles_user_id_idx` on `user_id`
- `profiles_email_idx` on `email`
- `profiles_name_idx` on `(first_name, last_name)`
- `profiles_importance_idx` on `importance_score`

---

### `relationships`

Contact-to-contact relationships.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id_1` | uuid | First contact |
| `profile_id_2` | uuid | Second contact |
| `relationship_type` | text | Type (family, friend, etc.) |
| `relationship_subtype` | text | Subtype details |
| `strength` | numeric | Relationship strength 0-1 |
| `direction` | text | Directional relationship |
| `start_date` | date | Relationship start |
| `end_date` | date | Relationship end |
| `notes` | text | Additional notes |
| `metadata` | jsonb | Extra data |
| `created_at` | timestamptz | Created timestamp |

**Indexes:**
- `relationships_profiles_idx` on `(profile_id_1, profile_id_2)`
- `relationships_type_idx` on `relationship_type`

---

### `communications`

Communication records with contacts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Contact profile |
| `channel` | text | Communication channel |
| `direction` | text | Inbound/outbound |
| `subject` | text | Subject line |
| `content` | text | Message content |
| `sentiment_score` | numeric | Sentiment -1 to 1 |
| `importance` | text | Importance level |
| `is_read` | boolean | Read status |
| `occurred_at` | timestamptz | When it occurred |
| `metadata` | jsonb | Extra data |
| `created_at` | timestamptz | Created timestamp |

---

### `groups`

Contact groups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `name` | text | Group name |
| `description` | text | Description |
| `color` | text | Display color |
| `icon` | text | Display icon |
| `is_smart` | boolean | Smart group flag |
| `smart_filters` | jsonb | Filter criteria |
| `member_count` | integer | Cached count |
| `created_at` | timestamptz | Created timestamp |

### `group_members`

Group membership.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_id` | uuid | Group reference |
| `profile_id` | uuid | Contact reference |
| `added_at` | timestamptz | When added |

---

## Contact Tables

### `contact_details`

Extended contact information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `profile_id` | uuid | Contact reference |
| `detail_type` | text | Type of detail |
| `label` | text | Display label |
| `value` | text | Detail value |
| `is_primary` | boolean | Primary flag |
| `verified` | boolean | Verified status |
| `metadata` | jsonb | Extra data |

---

### `contact_financial`

Financial information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `profile_id` | uuid | Contact reference |
| `estimated_net_worth` | numeric | Net worth estimate |
| `income_bracket` | text | Income range |
| `bank_accounts` | jsonb | Known accounts |
| `investments` | jsonb | Investment info |
| `properties` | jsonb | Property holdings |
| `vehicles` | jsonb | Vehicle ownership |
| `debts` | jsonb | Known debts |
| `confidence_score` | numeric | Data confidence |

---

### `contact_psychological`

Psychological profiles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `profile_id` | uuid | Contact reference |
| `big_five` | jsonb | OCEAN scores |
| `dark_triad` | jsonb | Dark triad scores |
| `attachment_style` | text | Attachment type |
| `cognitive_style` | text | Thinking patterns |
| `decision_style` | text | Decision making |
| `risk_tolerance` | numeric | Risk appetite |
| `emotional_triggers` | text[] | Known triggers |
| `motivators` | text[] | Key motivators |
| `analysis_date` | timestamptz | Last analyzed |
| `confidence` | numeric | Analysis confidence |

---

### `contact_timeline`

Life events and milestones.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `profile_id` | uuid | Contact reference |
| `event_type` | text | Event category |
| `title` | text | Event title |
| `description` | text | Event description |
| `start_date` | date | Event start |
| `end_date` | date | Event end |
| `location` | text | Event location |
| `importance` | text | Importance level |
| `metadata` | jsonb | Extra data |

---

## Intelligence Tables

### `ai_analyses`

AI analysis results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Contact reference |
| `analysis_type` | text | Type of analysis |
| `result` | jsonb | Analysis results |
| `confidence` | numeric | Result confidence |
| `model_used` | text | AI model used |
| `tokens_used` | integer | Token consumption |
| `cost_cents` | integer | Cost in cents |
| `generated_at` | timestamptz | When generated |

---

### `action_recommendations`

AI-generated action recommendations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Related contact |
| `recommendation_type` | text | Recommendation type |
| `title` | text | Recommendation title |
| `description` | text | Full description |
| `suggested_action` | text | Suggested action |
| `priority_score` | numeric | Priority 0-100 |
| `urgency` | text | Urgency level |
| `success_probability` | numeric | Success estimate |
| `expires_at` | timestamptz | Expiration time |
| `status` | text | Current status |
| `actioned_at` | timestamptz | When actioned |
| `outcome_recorded` | jsonb | Recorded outcome |

---

### `network_analysis_results`

Network analysis outputs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `analysis_type` | text | Analysis type |
| `nodes` | jsonb | Node data |
| `edges` | jsonb | Edge data |
| `metrics` | jsonb | Calculated metrics |
| `communities` | jsonb | Detected communities |
| `generated_at` | timestamptz | When generated |

---

### `influence_strategies`

Influence operation strategies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Target contact |
| `goal_type` | text | Goal category |
| `strategy_name` | text | Strategy name |
| `steps` | jsonb | Strategy steps |
| `objection_handlers` | jsonb | Objection responses |
| `optimal_timing` | jsonb | Timing recommendations |
| `success_probability` | numeric | Success estimate |
| `status` | text | Strategy status |
| `created_at` | timestamptz | Created timestamp |

---

## AGIS Tables

### `agis_global_state`

Global AGIS system state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `phase_health_scores` | jsonb | Per-phase health |
| `system_readiness_score` | numeric | Overall readiness |
| `active_objectives` | jsonb | Current objectives |
| `cross_phase_correlations` | jsonb | Phase correlations |
| `success_rate` | numeric | Overall success rate |
| `last_synthesis_at` | timestamptz | Last synthesis run |
| `updated_at` | timestamptz | Last update |

---

### `agis_cascade_rules`

Cross-phase cascade rules.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `rule_name` | text | Rule name |
| `source_phase` | integer | Trigger phase |
| `source_table` | text | Trigger table |
| `trigger_condition` | jsonb | Trigger criteria |
| `target_phase` | integer | Target phase |
| `target_action` | text | Action to take |
| `action_params` | jsonb | Action parameters |
| `priority` | integer | Rule priority |
| `cooldown_minutes` | integer | Cooldown period |
| `is_active` | boolean | Active status |
| `trigger_count` | integer | Times triggered |
| `last_triggered_at` | timestamptz | Last trigger time |

---

### `agis_cascade_events`

Cascade event log.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `trigger_phase` | integer | Source phase |
| `trigger_event_type` | text | Event type |
| `trigger_source_id` | uuid | Source record |
| `affected_phases` | integer[] | Affected phases |
| `cascade_path` | jsonb | Execution path |
| `execution_log` | jsonb | Execution details |
| `outcome_status` | text | Final status |
| `started_at` | timestamptz | Start time |
| `completed_at` | timestamptz | End time |

---

### `agis_objective_tracking`

AGIS objective tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Related contact |
| `objective_name` | text | Objective name |
| `objective_type` | text | Objective type |
| `starting_phase` | integer | Initial phase |
| `current_phase` | integer | Current phase |
| `phase_progression` | jsonb | Phase history |
| `target_outcome` | jsonb | Target state |
| `achieved_outcomes` | jsonb | Achieved items |
| `completion_percentage` | numeric | Progress 0-100 |
| `blockers` | jsonb | Current blockers |
| `is_active` | boolean | Active status |
| `completed_at` | timestamptz | Completion time |

---

### `agis_phase_synergies`

Phase synergy tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `phase_a` | integer | First phase |
| `phase_b` | integer | Second phase |
| `synergy_type` | text | Synergy type |
| `synergy_score` | numeric | Synergy strength |
| `interaction_count` | integer | Interactions |
| `successful_cascades` | integer | Successful cascades |
| `last_interaction_at` | timestamptz | Last interaction |

---

## Biometric Tables

### `biometric_enrollments`

Biometric enrollment records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Contact reference |
| `modality` | text | Biometric type |
| `quality_score` | numeric | Sample quality |
| `embedding` | bytea | Encrypted embedding |
| `sample_count` | integer | Number of samples |
| `enrolled_at` | timestamptz | Enrollment time |
| `last_verified_at` | timestamptz | Last verification |
| `status` | text | Enrollment status |

---

### `biometric_matches`

Biometric match results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `source_sample` | text | Source sample ref |
| `modality` | text | Biometric type |
| `matched_profile_id` | uuid | Matched contact |
| `confidence` | numeric | Match confidence |
| `match_time_ms` | integer | Processing time |
| `matched_at` | timestamptz | Match timestamp |

---

### `face_embeddings`

Facial recognition embeddings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `profile_id` | uuid | Contact reference |
| `embedding` | vector(512) | Face embedding |
| `quality_score` | numeric | Image quality |
| `pose` | jsonb | Face pose angles |
| `source_image_url` | text | Source image |
| `created_at` | timestamptz | Created timestamp |

---

### `voice_signatures`

Voice biometric data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `profile_id` | uuid | Contact reference |
| `embedding` | bytea | Voice embedding |
| `duration_seconds` | numeric | Sample duration |
| `sample_rate` | integer | Audio sample rate |
| `quality_metrics` | jsonb | Quality data |
| `created_at` | timestamptz | Created timestamp |

---

## Hardware Tables

### `hardware_devices`

Registered hardware devices.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `device_type` | text | Device category |
| `device_name` | text | Display name |
| `model` | text | Device model |
| `connection_type` | text | Connection method |
| `connection_params` | jsonb | Connection config |
| `status` | text | Current status |
| `last_seen_at` | timestamptz | Last communication |
| `firmware_version` | text | Firmware version |
| `capabilities` | text[] | Device capabilities |
| `configuration` | jsonb | Device config |
| `created_at` | timestamptz | Registration time |

---

### `hardware_alerts`

Hardware-generated alerts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `device_id` | uuid | Source device |
| `alert_type` | text | Alert category |
| `severity` | text | Severity level |
| `message` | text | Alert message |
| `data` | jsonb | Alert data |
| `is_acknowledged` | boolean | Ack status |
| `acknowledged_at` | timestamptz | Ack time |
| `created_at` | timestamptz | Alert time |

---

### `aerial_missions`

Drone mission records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `drone_device_id` | uuid | Drone reference |
| `mission_id` | uuid | Mission reference |
| `waypoints` | jsonb | Flight waypoints |
| `flight_path` | jsonb | Actual path |
| `status` | text | Mission status |
| `altitude_meters` | numeric | Flight altitude |
| `speed_mps` | numeric | Flight speed |
| `weather_conditions` | jsonb | Weather data |
| `started_at` | timestamptz | Start time |
| `completed_at` | timestamptz | End time |

---

## Analysis Tables

### `analysis_events`

Immutable analysis event log.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Related contact |
| `event_type` | text | Event type |
| `analysis_type` | text | Analysis type |
| `raw_result` | jsonb | Full result |
| `key_insights` | text[] | Key findings |
| `confidence_score` | numeric | Result confidence |
| `source_type` | text | Data source type |
| `source_id` | uuid | Source reference |
| `previous_hash` | text | Chain hash |
| `event_hash` | text | This event hash |
| `sequence_number` | integer | Sequence order |
| `created_at` | timestamptz | Event time |

---

### `analysis_aggregates`

Aggregated analysis state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Contact reference |
| `aggregate_type` | text | Aggregate type |
| `current_state` | jsonb | Current state |
| `total_events` | integer | Event count |
| `average_confidence` | numeric | Avg confidence |
| `last_event_id` | uuid | Last event ref |
| `needs_rebuild` | boolean | Rebuild flag |
| `updated_at` | timestamptz | Last update |

---

### `media`

Media file records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `profile_id` | uuid | Related contact |
| `media_type` | text | Type (image/video/audio) |
| `file_url` | text | Storage URL |
| `thumbnail_url` | text | Thumbnail URL |
| `file_size` | integer | Size in bytes |
| `mime_type` | text | MIME type |
| `duration_seconds` | numeric | Duration if applicable |
| `metadata` | jsonb | File metadata |
| `analysis_status` | text | Analysis status |
| `created_at` | timestamptz | Upload time |

---

## Security Tables

### `audit_logs`

System audit trail.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Acting user |
| `action` | text | Action performed |
| `resource_type` | text | Resource type |
| `resource_id` | uuid | Resource ID |
| `old_value` | jsonb | Previous value |
| `new_value` | jsonb | New value |
| `ip_address` | text | Client IP |
| `user_agent` | text | Client UA |
| `session_id` | text | Session ID |
| `created_at` | timestamptz | Action time |

---

### `encryption_keys`

Field encryption keys (encrypted).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID |
| `key_type` | text | Key type |
| `encrypted_key` | bytea | Encrypted key |
| `key_version` | integer | Key version |
| `is_active` | boolean | Active status |
| `created_at` | timestamptz | Creation time |
| `rotated_at` | timestamptz | Last rotation |

---

## Relationships

### Entity Relationship Overview

```
profiles (contacts)
├── relationships → profiles
├── communications
├── contact_details
├── contact_financial
├── contact_psychological
├── contact_timeline
├── biometric_enrollments
├── media
├── ai_analyses
├── action_recommendations
└── analysis_events

groups
└── group_members → profiles

hardware_devices
├── hardware_alerts
└── aerial_missions

agis_global_state
├── agis_cascade_rules
├── agis_cascade_events
├── agis_objective_tracking
└── agis_phase_synergies
```

---

## Row Level Security

### Standard RLS Pattern

All tables enforce user isolation:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User can only see their own rows
CREATE POLICY "Users can view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- User can only insert their own rows
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User can only update their own rows
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
USING (auth.uid() = user_id);

-- User can only delete their own rows
CREATE POLICY "Users can delete own data"
ON table_name FOR DELETE
USING (auth.uid() = user_id);
```

### Profile Access Patterns

Some tables use profile-based access:

```sql
-- Access via profile ownership
CREATE POLICY "Access via owned profiles"
ON contact_details FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);
```

---

*For API documentation, see [API_REFERENCE.md](./API_REFERENCE.md)*  
*For feature details, see [FEATURES_CATALOG.md](./FEATURES_CATALOG.md)*
