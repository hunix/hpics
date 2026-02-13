
-- Fix Security Definer Views: Set to SECURITY INVOKER so RLS is respected
ALTER VIEW public.v_mice_assessments SET (security_invoker = on);
ALTER VIEW public.v_behavioral_predictions SET (security_invoker = on);
ALTER VIEW public.v_network_analyses SET (security_invoker = on);
ALTER VIEW public.v_biometric_templates SET (security_invoker = on);
ALTER VIEW public.v_audit_trail SET (security_invoker = on);
