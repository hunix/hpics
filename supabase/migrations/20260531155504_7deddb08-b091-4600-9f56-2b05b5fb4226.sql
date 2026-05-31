BEGIN;

-- Extend existing tables
ALTER TABLE public.gmail_config
  ADD COLUMN IF NOT EXISTS push_history_id TEXT,
  ADD COLUMN IF NOT EXISTS push_expiration TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS push_enabled_at TIMESTAMPTZ;

ALTER TABLE public.outlook_config
  ADD COLUMN IF NOT EXISTS webhook_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS webhook_subscription_expiry TIMESTAMPTZ;

-- Helper to make user-owned table with full CRUD policies
-- (inlined per table for clarity)

-- Instagram profile
CREATE TABLE IF NOT EXISTS public.instagram_profile (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT, full_name TEXT, bio TEXT, website TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instagram_profile TO authenticated;
GRANT ALL ON public.instagram_profile TO service_role;
ALTER TABLE public.instagram_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_profile_sel ON public.instagram_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ig_profile_ins ON public.instagram_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_profile_upd ON public.instagram_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_profile_del ON public.instagram_profile FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Instagram connections
CREATE TABLE IF NOT EXISTS public.instagram_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('follower','following')),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, username, connection_type)
);
CREATE INDEX IF NOT EXISTS idx_ig_conn_user ON public.instagram_connections(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instagram_connections TO authenticated;
GRANT ALL ON public.instagram_connections TO service_role;
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_conn_sel ON public.instagram_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ig_conn_ins ON public.instagram_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_conn_upd ON public.instagram_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_conn_del ON public.instagram_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Instagram messages
CREATE TABLE IF NOT EXISTS public.instagram_messages (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL, chat_name TEXT, sender_name TEXT,
  timestamp_ms BIGINT, content TEXT, message_type TEXT NOT NULL DEFAULT 'text',
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ig_msg_user ON public.instagram_messages(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instagram_messages TO authenticated;
GRANT ALL ON public.instagram_messages TO service_role;
ALTER TABLE public.instagram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_msg_sel ON public.instagram_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ig_msg_ins ON public.instagram_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_msg_upd ON public.instagram_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_msg_del ON public.instagram_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Instagram activity
CREATE TABLE IF NOT EXISTS public.instagram_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, title TEXT, timestamp_ms BIGINT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instagram_activity TO authenticated;
GRANT ALL ON public.instagram_activity TO service_role;
ALTER TABLE public.instagram_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_act_sel ON public.instagram_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ig_act_ins ON public.instagram_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_act_upd ON public.instagram_activity FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ig_act_del ON public.instagram_activity FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LinkedIn profile
CREATE TABLE IF NOT EXISTS public.linkedin_profile (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  raw_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_profile TO authenticated;
GRANT ALL ON public.linkedin_profile TO service_role;
ALTER TABLE public.linkedin_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_profile_sel ON public.linkedin_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY li_profile_ins ON public.linkedin_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_profile_upd ON public.linkedin_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_profile_del ON public.linkedin_profile FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LinkedIn connections
CREATE TABLE IF NOT EXISTS public.linkedin_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT, last_name TEXT, email TEXT, company TEXT,
  position TEXT, connected_on DATE, profile_url TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);
CREATE INDEX IF NOT EXISTS idx_li_conn_user ON public.linkedin_connections(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_connections TO authenticated;
GRANT ALL ON public.linkedin_connections TO service_role;
ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_conn_sel ON public.linkedin_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY li_conn_ins ON public.linkedin_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_conn_upd ON public.linkedin_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_conn_del ON public.linkedin_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LinkedIn messages
CREATE TABLE IF NOT EXISTS public.linkedin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT, conversation_title TEXT, from_name TEXT,
  sender_profile_url TEXT, sent_at TIMESTAMPTZ, subject TEXT, content TEXT, folder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, conversation_id, sent_at, from_name)
);
CREATE INDEX IF NOT EXISTS idx_li_msg_user ON public.linkedin_messages(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_messages TO authenticated;
GRANT ALL ON public.linkedin_messages TO service_role;
ALTER TABLE public.linkedin_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_msg_sel ON public.linkedin_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY li_msg_ins ON public.linkedin_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_msg_upd ON public.linkedin_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_msg_del ON public.linkedin_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LinkedIn positions
CREATE TABLE IF NOT EXISTS public.linkedin_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT, title TEXT, description TEXT, location TEXT,
  started_on TEXT, finished_on TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_positions TO authenticated;
GRANT ALL ON public.linkedin_positions TO service_role;
ALTER TABLE public.linkedin_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_pos_sel ON public.linkedin_positions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY li_pos_ins ON public.linkedin_positions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_pos_upd ON public.linkedin_positions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_pos_del ON public.linkedin_positions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LinkedIn education
CREATE TABLE IF NOT EXISTS public.linkedin_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name TEXT, start_date TEXT, end_date TEXT,
  degree_name TEXT, activities TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_education TO authenticated;
GRANT ALL ON public.linkedin_education TO service_role;
ALTER TABLE public.linkedin_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_edu_sel ON public.linkedin_education FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY li_edu_ins ON public.linkedin_education FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_edu_upd ON public.linkedin_education FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_edu_del ON public.linkedin_education FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LinkedIn skills
CREATE TABLE IF NOT EXISTS public.linkedin_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_skills TO authenticated;
GRANT ALL ON public.linkedin_skills TO service_role;
ALTER TABLE public.linkedin_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY li_skl_sel ON public.linkedin_skills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY li_skl_ins ON public.linkedin_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_skl_upd ON public.linkedin_skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY li_skl_del ON public.linkedin_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SMS messages
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL, contact_name TEXT, body TEXT,
  sent_at TIMESTAMPTZ,
  message_type TEXT NOT NULL DEFAULT 'received' CHECK (message_type IN ('sent','received')),
  source TEXT NOT NULL DEFAULT 'sms_backup_restore',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, phone_number, sent_at, body)
);
CREATE INDEX IF NOT EXISTS idx_sms_user    ON public.sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_phone   ON public.sms_messages(user_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_sent_at ON public.sms_messages(sent_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_messages TO authenticated;
GRANT ALL ON public.sms_messages TO service_role;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY sms_sel ON public.sms_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sms_ins ON public.sms_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY sms_upd ON public.sms_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY sms_del ON public.sms_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Source health log
CREATE TABLE IF NOT EXISTS public.source_health_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ, record_count BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','warning','error','never')),
  error_message TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_health_log TO authenticated;
GRANT ALL ON public.source_health_log TO service_role;
ALTER TABLE public.source_health_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY shl_sel ON public.source_health_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY shl_ins ON public.source_health_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY shl_upd ON public.source_health_log FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY shl_del ON public.source_health_log FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMIT;