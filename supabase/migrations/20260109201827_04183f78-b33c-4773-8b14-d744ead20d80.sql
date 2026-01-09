-- Phase 1: Security Hardening
-- 1.1 Fix Security Definer Views - Convert to SECURITY INVOKER

-- Drop and recreate contact_storage_stats with security_invoker
DROP VIEW IF EXISTS public.contact_storage_stats;
CREATE VIEW public.contact_storage_stats 
WITH (security_invoker = on) 
AS SELECT 
    profile_id,
    user_id,
    first_name,
    last_name,
    avatar_url,
    media_bytes,
    media_count,
    document_bytes,
    document_count,
    message_count,
    total_bytes
FROM contact_storage_stats_mv;

-- Drop and recreate prediction_accuracy_stats with security_invoker
DROP VIEW IF EXISTS public.prediction_accuracy_stats;
CREATE VIEW public.prediction_accuracy_stats 
WITH (security_invoker = on) 
AS SELECT 
    user_id,
    model_used,
    risk_level,
    count(*) AS total_predictions,
    count(*) FILTER (WHERE (actual_outcome IS NOT NULL)) AS verified_predictions,
    round(avg(accuracy_score) FILTER (WHERE (accuracy_score IS NOT NULL)), 4) AS avg_accuracy,
    count(*) FILTER (WHERE ((risk_score >= 70) AND (actual_outcome = 'churned'::text))) AS true_positives,
    count(*) FILTER (WHERE ((risk_score < 30) AND (actual_outcome = 'retained'::text))) AS true_negatives,
    count(*) FILTER (WHERE ((risk_score >= 70) AND (actual_outcome = 'retained'::text))) AS false_positives,
    count(*) FILTER (WHERE ((risk_score < 30) AND (actual_outcome = 'churned'::text))) AS false_negatives,
    round(
        CASE
            WHEN (count(*) FILTER (WHERE (actual_outcome IS NOT NULL)) > 0) THEN ((100.0 * (count(*) FILTER (WHERE (((risk_score >= 70) AND (actual_outcome = 'churned'::text)) OR ((risk_score < 30) AND (actual_outcome = 'retained'::text)))))::numeric) / (NULLIF(count(*) FILTER (WHERE (actual_outcome IS NOT NULL)), 0))::numeric)
            ELSE NULL::numeric
        END, 2) AS accuracy_percentage
FROM churn_predictions
GROUP BY user_id, model_used, risk_level;

-- 1.2 Fix Materialized View API Exposure - Revoke direct access
REVOKE SELECT ON public.contact_storage_stats_mv FROM anon, authenticated;

-- Grant select only on the secure view
GRANT SELECT ON public.contact_storage_stats TO authenticated;
GRANT SELECT ON public.prediction_accuracy_stats TO authenticated;

-- 1.3 Fix Permissive RLS Policies
-- Fix immutable_audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.immutable_audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.immutable_audit_logs;
CREATE POLICY "Service role can insert audit logs" ON public.immutable_audit_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to insert their own audit logs (for client-side logging)
CREATE POLICY "Users can insert own audit logs" ON public.immutable_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix sensitive_data_access_log INSERT policy  
DROP POLICY IF EXISTS "System can insert access logs" ON public.sensitive_data_access_log;
DROP POLICY IF EXISTS "Service role can insert access logs" ON public.sensitive_data_access_log;
CREATE POLICY "Service role can insert access logs" ON public.sensitive_data_access_log
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to insert their own access logs
CREATE POLICY "Users can insert own access logs" ON public.sensitive_data_access_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3.3 Add Database Trigger for Auto-Queue Media Enrichment
CREATE OR REPLACE FUNCTION public.queue_media_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue facial biometrics for images
  IF NEW.mime_type LIKE 'image/%' THEN
    INSERT INTO enrichment_queue (
      user_id, profile_id, enrichment_type, 
      source_type, source_id, priority, status, scheduled_for
    ) VALUES (
      NEW.user_id, NEW.profile_id, 'facial_biometrics',
      'media', NEW.id, 5, 'pending', now()
    );
  END IF;
  
  -- Queue voice biometrics for audio
  IF NEW.mime_type LIKE 'audio/%' THEN
    INSERT INTO enrichment_queue (
      user_id, profile_id, enrichment_type, 
      source_type, source_id, priority, status, scheduled_for
    ) VALUES (
      NEW.user_id, NEW.profile_id, 'voice_biometrics',
      'media', NEW.id, 5, 'pending', now()
    );
  END IF;
  
  -- Queue video analysis for videos
  IF NEW.mime_type LIKE 'video/%' THEN
    INSERT INTO enrichment_queue (
      user_id, profile_id, enrichment_type, 
      source_type, source_id, priority, status, scheduled_for
    ) VALUES (
      NEW.user_id, NEW.profile_id, 'media_analysis',
      'media', NEW.id, 5, 'pending', now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on media table
DROP TRIGGER IF EXISTS auto_queue_media_enrichment ON public.media;
CREATE TRIGGER auto_queue_media_enrichment
  AFTER INSERT ON public.media
  FOR EACH ROW EXECUTE FUNCTION public.queue_media_enrichment();