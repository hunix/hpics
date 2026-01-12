-- Fix the overly permissive INSERT policy on data_access_events
-- Replace with a proper user-based policy

DROP POLICY IF EXISTS "System can insert access events" ON data_access_events;

CREATE POLICY "Users can insert their own access events"
ON data_access_events FOR INSERT
WITH CHECK (auth.uid() = user_id);