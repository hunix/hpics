-- Fix RLS policies for service role operations in edge functions
-- This allows edge functions using service_role key to write to tables

-- detected_items
CREATE POLICY "Service role can insert detected items"
ON public.detected_items FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update detected items"
ON public.detected_items FOR UPDATE
TO service_role
USING (true);

-- unknown_persons
CREATE POLICY "Service role can insert unknown persons"
ON public.unknown_persons FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update unknown persons"
ON public.unknown_persons FOR UPDATE
TO service_role
USING (true);

-- extracted_documents
CREATE POLICY "Service role can insert extracted documents"
ON public.extracted_documents FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update extracted documents"
ON public.extracted_documents FOR UPDATE
TO service_role
USING (true);

-- media
CREATE POLICY "Service role can update media"
ON public.media FOR UPDATE
TO service_role
USING (true);

-- ai_request_cache
CREATE POLICY "Service role can manage ai cache"
ON public.ai_request_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- bulk_analysis_items
CREATE POLICY "Service role can manage bulk items"
ON public.bulk_analysis_items FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- bulk_analysis_sessions
CREATE POLICY "Service role can manage bulk sessions"
ON public.bulk_analysis_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- mosaic_metadata_sessions
CREATE POLICY "Service role can manage mosaic sessions"
ON public.mosaic_metadata_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ai_usage_logs (commonly used by edge functions)
CREATE POLICY "Service role can manage ai usage logs"
ON public.ai_usage_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- enrichment_queue (commonly used by edge functions)
CREATE POLICY "Service role can manage enrichment queue"
ON public.enrichment_queue FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- contact_activity_feed (commonly used by edge functions)
CREATE POLICY "Service role can manage activity feed"
ON public.contact_activity_feed FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- intelligence_alerts (commonly used by edge functions)
CREATE POLICY "Service role can manage intelligence alerts"
ON public.intelligence_alerts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);