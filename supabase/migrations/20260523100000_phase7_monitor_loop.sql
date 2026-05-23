-- Phase 7: monitor-loop persistence + Telegram watcher tables + pg_cron job.

BEGIN;

-- ---------------------------------------------------------------------------
-- intel_watch_terms: per-user list of names/aliases/emails to look out for.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intel_watch_terms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  term       TEXT NOT NULL,
  source_hint TEXT,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, term)
);
CREATE INDEX IF NOT EXISTS intel_watch_terms_user_idx ON public.intel_watch_terms (user_id);
ALTER TABLE public.intel_watch_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watch terms" ON public.intel_watch_terms
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- monitor_preferences: which monitor stages each user wants to run.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monitor_preferences (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  news_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  breach_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.monitor_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own monitor prefs" ON public.monitor_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- monitor_runs: audit trail of monitor-loop invocations.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monitor_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stages        TEXT[] NOT NULL DEFAULT '{}',
  payload       JSONB,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS monitor_runs_user_idx ON public.monitor_runs (user_id, started_at DESC);
ALTER TABLE public.monitor_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own monitor runs" ON public.monitor_runs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Telegram watcher tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_watch_channels (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_chat_id   BIGINT NOT NULL,
  channel_username  TEXT,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  last_update_id    BIGINT,
  last_polled_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel_chat_id)
);
ALTER TABLE public.telegram_watch_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tg channels" ON public.telegram_watch_channels
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.telegram_channel_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id    UUID NOT NULL REFERENCES public.telegram_watch_channels(id) ON DELETE CASCADE,
  message_id    BIGINT NOT NULL,
  posted_at     TIMESTAMPTZ NOT NULL,
  text          TEXT,
  matched_terms TEXT[] NOT NULL DEFAULT '{}',
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel_id, message_id)
);
CREATE INDEX IF NOT EXISTS tg_posts_user_posted_idx ON public.telegram_channel_posts (user_id, posted_at DESC);
ALTER TABLE public.telegram_channel_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own tg posts" ON public.telegram_channel_posts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- pg_cron job: tick monitor-loop every 15 minutes.
-- The Supabase project must have pg_cron + pg_net extensions enabled.
-- The job calls monitor-loop with the service role key so it can fan out
-- across all users with watch terms configured.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    PERFORM cron.unschedule('monitor-loop-tick')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitor-loop-tick');
    PERFORM cron.schedule(
      'monitor-loop-tick',
      '*/15 * * * *',
      $$
        SELECT net.http_post(
          url     := current_setting('app.settings.supabase_url') || '/functions/v1/monitor-loop',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
          ),
          body    := jsonb_build_object('source', 'pg_cron')
        );
      $$
    );
  END IF;
END
$$;

COMMIT;
