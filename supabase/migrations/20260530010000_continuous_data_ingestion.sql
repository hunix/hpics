-- Phase 11: Continuous data ingestion from all sources.
-- Adds tables for Instagram, LinkedIn, SMS, and source health tracking.
-- Adds push-notification columns to gmail_config and outlook_config.

BEGIN;

-- ── Gmail: add push-notification tracking columns ──────────────────────────

ALTER TABLE public.gmail_config
  ADD COLUMN IF NOT EXISTS push_history_id   TEXT,
  ADD COLUMN IF NOT EXISTS push_expiration   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS push_enabled_at   TIMESTAMPTZ;

COMMENT ON COLUMN public.gmail_config.push_history_id  IS 'Gmail history ID at the time the Pub/Sub watch was registered.';
COMMENT ON COLUMN public.gmail_config.push_expiration  IS 'When the Gmail Pub/Sub watch expires (renew before this).';
COMMENT ON COLUMN public.gmail_config.push_enabled_at  IS 'When push notifications were last activated for this account.';

-- ── Outlook: add webhook subscription tracking columns ─────────────────────

ALTER TABLE public.outlook_config
  ADD COLUMN IF NOT EXISTS webhook_subscription_id     TEXT,
  ADD COLUMN IF NOT EXISTS webhook_subscription_expiry TIMESTAMPTZ;

COMMENT ON COLUMN public.outlook_config.webhook_subscription_id     IS 'Microsoft Graph subscription ID for change notifications.';
COMMENT ON COLUMN public.outlook_config.webhook_subscription_expiry IS 'When the MS Graph subscription expires (max ~4230 min).';

-- ── Instagram ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.instagram_profile (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT,
  full_name   TEXT,
  bio         TEXT,
  website     TEXT,
  raw_data    JSONB       NOT NULL DEFAULT '{}'::JSONB,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);
ALTER TABLE public.instagram_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_profile_owner ON public.instagram_profile
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.instagram_connections (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT        NOT NULL,
  connection_type TEXT        NOT NULL CHECK (connection_type IN ('follower','following')),
  connected_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, username, connection_type)
);
CREATE INDEX IF NOT EXISTS idx_ig_conn_user ON public.instagram_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_ig_conn_type ON public.instagram_connections(user_id, connection_type);
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_connections_owner ON public.instagram_connections
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.instagram_messages (
  id           TEXT        NOT NULL,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id      TEXT        NOT NULL,
  chat_name    TEXT,
  sender_name  TEXT,
  timestamp_ms BIGINT,
  content      TEXT,
  message_type TEXT        NOT NULL DEFAULT 'text',
  raw_payload  JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ig_msg_user     ON public.instagram_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ig_msg_chat     ON public.instagram_messages(user_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_ig_msg_ts       ON public.instagram_messages(timestamp_ms DESC);
ALTER TABLE public.instagram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_messages_owner ON public.instagram_messages
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.instagram_activity (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT        NOT NULL,
  title         TEXT,
  timestamp_ms  BIGINT,
  raw_payload   JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ig_act_user ON public.instagram_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_ig_act_type ON public.instagram_activity(user_id, activity_type);
ALTER TABLE public.instagram_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_activity_owner ON public.instagram_activity
  USING (auth.uid() = user_id);

-- ── LinkedIn ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.linkedin_profile (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_data    JSONB       NOT NULL DEFAULT '{}'::JSONB,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);
ALTER TABLE public.linkedin_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_profile_owner ON public.linkedin_profile
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.linkedin_connections (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name   TEXT,
  last_name    TEXT,
  email        TEXT,
  company      TEXT,
  position     TEXT,
  connected_on DATE,
  profile_url  TEXT,
  raw_data     JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);
CREATE INDEX IF NOT EXISTS idx_li_conn_user  ON public.linkedin_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_li_conn_email ON public.linkedin_connections(user_id, email);
ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_connections_owner ON public.linkedin_connections
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.linkedin_messages (
  id                   UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id      TEXT,
  conversation_title   TEXT,
  from_name            TEXT,
  sender_profile_url   TEXT,
  sent_at              TIMESTAMPTZ,
  subject              TEXT,
  content              TEXT,
  folder               TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, conversation_id, sent_at, from_name)
);
CREATE INDEX IF NOT EXISTS idx_li_msg_user ON public.linkedin_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_li_msg_conv ON public.linkedin_messages(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_li_msg_sent ON public.linkedin_messages(sent_at DESC);
ALTER TABLE public.linkedin_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_messages_owner ON public.linkedin_messages
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.linkedin_positions (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  title        TEXT,
  description  TEXT,
  location     TEXT,
  started_on   TEXT,
  finished_on  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_li_pos_user ON public.linkedin_positions(user_id);
ALTER TABLE public.linkedin_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_positions_owner ON public.linkedin_positions
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.linkedin_education (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name TEXT,
  start_date  TEXT,
  end_date    TEXT,
  degree_name TEXT,
  activities  TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.linkedin_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_education_owner ON public.linkedin_education
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.linkedin_skills (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name)
);
ALTER TABLE public.linkedin_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_skills_owner ON public.linkedin_skills
  USING (auth.uid() = user_id);

-- ── Android SMS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sms_messages (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number  TEXT        NOT NULL,
  contact_name  TEXT,
  body          TEXT,
  sent_at       TIMESTAMPTZ,
  message_type  TEXT        NOT NULL DEFAULT 'received'
                  CHECK (message_type IN ('sent','received')),
  source        TEXT        NOT NULL DEFAULT 'sms_backup_restore',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Deduplicate on (user_id, phone_number, sent_at, body hash)
  UNIQUE (user_id, phone_number, sent_at, body)
);
CREATE INDEX IF NOT EXISTS idx_sms_user        ON public.sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_phone       ON public.sms_messages(user_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_sent_at     ON public.sms_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_contact     ON public.sms_messages(user_id, contact_name);
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY sms_messages_owner ON public.sms_messages
  USING (auth.uid() = user_id);

-- ── Source health log ───────────────────────────────────────────────────────
-- One row per source per user, updated on each sync. Used by the Android
-- Data Sync page to show live status.

CREATE TABLE IF NOT EXISTS public.source_health_log (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name    TEXT        NOT NULL,
  last_synced_at TIMESTAMPTZ,
  record_count   BIGINT      NOT NULL DEFAULT 0,
  status         TEXT        NOT NULL DEFAULT 'ok'
                   CHECK (status IN ('ok','warning','error','never')),
  error_message  TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_name)
);
CREATE INDEX IF NOT EXISTS idx_shl_user   ON public.source_health_log(user_id);
CREATE INDEX IF NOT EXISTS idx_shl_status ON public.source_health_log(user_id, status);
ALTER TABLE public.source_health_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY source_health_owner ON public.source_health_log
  USING (auth.uid() = user_id);

-- ── pg_cron: renew webhook subscriptions every 4 hours ─────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'renew-webhook-subscriptions',
      '0 */4 * * *',
      $$
        SELECT net.http_post(
          url    := current_setting('app.supabase_url', true) || '/functions/v1/renew-webhook-subscriptions',
          body   := '{}'::jsonb,
          headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
          )
        );
      $$
    ) ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule;
  END IF;
END;
$$;

COMMIT;
