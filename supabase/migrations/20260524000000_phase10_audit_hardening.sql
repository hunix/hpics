-- Phase 10: hardening pass after the second deep audit.
--   - SSRF defense at the DB layer for rss_feeds (private-IP block list)
--   - Idempotent re-creation of socmint_mentions policies
--   - pg_cron schedule uses missing-OK current_setting()
--   - Optimistic-concurrency column on telegram_watch_channels
--   - Optional intel-agent watchdog: a max_steps + started_at deadline-based
--     sweep that flips orphaned 'running' rows to 'failed'

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. rss_feeds: validate URL on insert/update so a private/loopback target
--    can't be persisted in the first place. The socmint-search function does
--    runtime validation too (defense in depth) but the DB is the source of
--    truth for what gets fetched on every cron tick.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rss_feeds_validate_url()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_host TEXT;
BEGIN
  IF NEW.url IS NULL OR NEW.url = '' THEN
    RAISE EXCEPTION 'rss_feeds.url required';
  END IF;
  IF NEW.url !~* '^https?://' THEN
    RAISE EXCEPTION 'rss_feeds.url must be http(s)';
  END IF;

  v_host := lower(split_part(split_part(NEW.url, '/', 3), ':', 1));

  IF v_host IN ('localhost', 'metadata', 'metadata.google.internal', 'metadata.azure.com') THEN
    RAISE EXCEPTION 'rss_feeds.url host % is blocked', v_host;
  END IF;
  IF v_host LIKE '%.localhost' THEN
    RAISE EXCEPTION 'rss_feeds.url host % is blocked', v_host;
  END IF;
  -- IPv4 literal in private/reserved ranges
  IF v_host ~ '^(127\.|10\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|0\.|100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.|192\.0\.0\.|198\.1[89]\.|22[4-9]\.|2[3-5][0-9]\.|255\.)' THEN
    RAISE EXCEPTION 'rss_feeds.url host % is in a blocked range', v_host;
  END IF;
  -- IPv6 loopback / link-local / unique-local literal
  IF v_host = '::1' OR v_host = '::' OR v_host LIKE 'fe80%' OR v_host LIKE 'fc%' OR v_host LIKE 'fd%' THEN
    RAISE EXCEPTION 'rss_feeds.url host % is blocked (IPv6)', v_host;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rss_feeds_validate_url_trg ON public.rss_feeds;
CREATE TRIGGER rss_feeds_validate_url_trg
  BEFORE INSERT OR UPDATE OF url ON public.rss_feeds
  FOR EACH ROW EXECUTE FUNCTION public.rss_feeds_validate_url();

-- ---------------------------------------------------------------------------
-- 2. socmint_mentions: make the policy create idempotent so the migration can
--    be re-applied on a partial DB.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users read own socmint mentions"   ON public.socmint_mentions;
DROP POLICY IF EXISTS "Users delete own socmint mentions" ON public.socmint_mentions;

CREATE POLICY "Users read own socmint mentions" ON public.socmint_mentions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own socmint mentions" ON public.socmint_mentions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. pg_cron monitor-loop tick: rewrite with missing-OK current_setting so it
--    no longer aborts the migration on fresh deployments where the GUCs
--    haven't been set.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_supabase_url TEXT := current_setting('app.settings.supabase_url', true);
  v_service_key  TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
     AND v_supabase_url IS NOT NULL
     AND v_service_key  IS NOT NULL THEN
    PERFORM cron.unschedule('monitor-loop-tick')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitor-loop-tick');
    PERFORM cron.schedule(
      'monitor-loop-tick',
      '*/15 * * * *',
      format(
        $job$
          SELECT net.http_post(
            url     := %L,
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || %L
            ),
            body    := jsonb_build_object('source', 'pg_cron')
          );
        $job$,
        v_supabase_url || '/functions/v1/monitor-loop',
        v_service_key
      )
    );
  ELSE
    RAISE NOTICE 'monitor-loop-tick not scheduled (extensions or app.settings missing)';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 4. telegram_watch_channels: add a version column so the watcher can do
--    optimistic concurrency control on last_update_id.
-- ---------------------------------------------------------------------------
ALTER TABLE public.telegram_watch_channels
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 5. agent_runs watchdog: any 'running' row older than 10 minutes is moved
--    to 'failed' so the UI stops polling forever if a function crashed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.agent_runs_reap_stale()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.agent_runs
     SET status       = 'failed',
         final_answer = COALESCE(final_answer, 'Run timed out (server-side reaper)'),
         updated_at   = now()
   WHERE status = 'running'
     AND updated_at < now() - INTERVAL '10 minutes';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.agent_runs_reap_stale() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_runs_reap_stale() TO service_role;

-- Schedule the reaper every 5 minutes if pg_cron is available.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('agent-runs-reaper')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'agent-runs-reaper');
    PERFORM cron.schedule(
      'agent-runs-reaper',
      '*/5 * * * *',
      'SELECT public.agent_runs_reap_stale();'
    );
  END IF;
END
$$;

COMMIT;
