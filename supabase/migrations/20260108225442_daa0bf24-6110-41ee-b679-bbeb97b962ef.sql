-- Phase G: Scheduled Automation via pg_cron

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Daily proactive insights generation (runs at 6 AM UTC)
SELECT cron.schedule(
  'daily-proactive-insights',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-intelligence',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('task', 'proactive_insights')
  );
  $$
);

-- 2. Weekly relationship lifecycle analysis (runs every Sunday at 2 AM UTC)
SELECT cron.schedule(
  'weekly-lifecycle-analysis',
  '0 2 * * 0',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-intelligence',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('task', 'lifecycle_analysis')
  );
  $$
);

-- 3. Daily churn prediction verification (runs at 3 AM UTC)
SELECT cron.schedule(
  'daily-churn-verification',
  '0 3 * * *',
  $$
  SELECT public.verify_churn_prediction_outcomes();
  $$
);

-- 4. Hourly anomaly detection (runs every hour)
SELECT cron.schedule(
  'hourly-anomaly-detection',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/detect-communication-anomalies',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('timeframeDays', 7)
  );
  $$
);

-- 5. Daily storage snapshot (runs at midnight UTC)
SELECT cron.schedule(
  'daily-storage-snapshot',
  '0 0 * * *',
  $$
  SELECT public.create_storage_snapshot(user_id)
  FROM (SELECT DISTINCT user_id FROM public.profiles) users;
  $$
);

-- 6. Weekly cache cleanup (runs every Sunday at 1 AM UTC)
SELECT cron.schedule(
  'weekly-cache-cleanup',
  '0 1 * * 0',
  $$
  SELECT public.clean_expired_cache();
  $$
);

-- 7. Daily materialized view refresh (runs at 4 AM UTC)
SELECT cron.schedule(
  'daily-mv-refresh',
  '0 4 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.contact_storage_stats_mv;
  $$
);

-- 8. Bi-weekly cross-contact pattern detection (runs every other Monday at 5 AM UTC)
SELECT cron.schedule(
  'biweekly-cross-contact-patterns',
  '0 5 1,15 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/detect-cross-contact-patterns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('scope', 'all')
  );
  $$
);

-- Create table to track scheduled job executions
CREATE TABLE IF NOT EXISTS public.scheduled_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on scheduled_job_logs
ALTER TABLE public.scheduled_job_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view job logs
CREATE POLICY "Admins can view job logs" ON public.scheduled_job_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_job_logs_job_name ON public.scheduled_job_logs(job_name, started_at DESC);