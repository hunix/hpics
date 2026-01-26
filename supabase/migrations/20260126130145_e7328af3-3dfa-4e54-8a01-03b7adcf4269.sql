-- Fix function search path for security
ALTER FUNCTION public.increment_voice_session_progress(UUID, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER)
SET search_path = public;

ALTER FUNCTION public.update_voice_session_updated_at()
SET search_path = public;