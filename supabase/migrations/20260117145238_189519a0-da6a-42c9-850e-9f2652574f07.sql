-- Add default value for user_id to prevent RLS violations
ALTER TABLE public.bulk_analysis_sessions 
ALTER COLUMN user_id SET DEFAULT auth.uid();