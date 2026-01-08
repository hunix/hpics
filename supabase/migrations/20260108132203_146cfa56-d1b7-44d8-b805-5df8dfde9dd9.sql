-- Add scheduled job for enrichment queue processing (every 15 minutes)
SELECT cron.schedule(
  'enrichment-queue-processor',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yibszncvwmefwamayfty.supabase.co/functions/v1/process-enrichment-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnN6bmN2d21lZndhbWF5ZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDgyNDUsImV4cCI6MjA4MzAyNDI0NX0.GP7FB9tmWEtfc4r1azsbBzD8Fx12cQD7exz8A6k86vI"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);

-- Add scheduled job for nightly relationship inference (4 AM daily)
SELECT cron.schedule(
  'nightly-relationship-inference',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yibszncvwmefwamayfty.supabase.co/functions/v1/infer-relationships',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnN6bmN2d21lZndhbWF5ZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDgyNDUsImV4cCI6MjA4MzAyNDI0NX0.GP7FB9tmWEtfc4r1azsbBzD8Fx12cQD7exz8A6k86vI"}'::jsonb,
    body := '{"mode": "full_scan", "scheduled": true}'::jsonb
  ) AS request_id;
  $$
);

-- Add scheduled job for weekly behavioral model training (Saturday 5 AM)
SELECT cron.schedule(
  'weekly-behavioral-training',
  '0 5 * * 6',
  $$
  SELECT net.http_post(
    url := 'https://yibszncvwmefwamayfty.supabase.co/functions/v1/train-behavior-model',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnN6bmN2d21lZndhbWF5ZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDgyNDUsImV4cCI6MjA4MzAyNDI0NX0.GP7FB9tmWEtfc4r1azsbBzD8Fx12cQD7exz8A6k86vI"}'::jsonb,
    body := '{"mode": "all_profiles", "scheduled": true}'::jsonb
  ) AS request_id;
  $$
);

-- Add scheduled job for weekly OSINT scans on high-priority contacts (Sunday 3 AM)
SELECT cron.schedule(
  'weekly-osint-scan',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://yibszncvwmefwamayfty.supabase.co/functions/v1/osint-scan',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnN6bmN2d21lZndhbWF5ZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDgyNDUsImV4cCI6MjA4MzAyNDI0NX0.GP7FB9tmWEtfc4r1azsbBzD8Fx12cQD7exz8A6k86vI"}'::jsonb,
    body := '{"mode": "high_priority", "scheduled": true}'::jsonb
  ) AS request_id;
  $$
);

-- Add scheduled job for daily threat assessment on flagged contacts (1 AM daily)
SELECT cron.schedule(
  'daily-threat-assessment',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yibszncvwmefwamayfty.supabase.co/functions/v1/assess-threat',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnN6bmN2d21lZndhbWF5ZnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDgyNDUsImV4cCI6MjA4MzAyNDI0NX0.GP7FB9tmWEtfc4r1azsbBzD8Fx12cQD7exz8A6k86vI"}'::jsonb,
    body := '{"mode": "flagged_contacts", "scheduled": true}'::jsonb
  ) AS request_id;
  $$
);

-- Add OSINT tracking columns to profiles if not exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_osint_scan TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS osint_scan_priority INTEGER DEFAULT 0;

-- Add backfill status to document_embeddings if not exist
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS backfill_status TEXT DEFAULT 'pending';