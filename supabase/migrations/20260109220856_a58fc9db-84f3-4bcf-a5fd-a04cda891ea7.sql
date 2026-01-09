-- ==============================================
-- PHASE 1: CRITICAL SECURITY FIXES (FINAL)
-- ==============================================

-- Views already fixed in previous migration, now just revoke access to materialized view
REVOKE ALL ON public.contact_storage_stats_mv FROM anon;
REVOKE ALL ON public.contact_storage_stats_mv FROM public;