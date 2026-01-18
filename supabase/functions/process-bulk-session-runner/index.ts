import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  sessionId: string;
  action: 'continue' | 'process_all' | 'process_batch';
  maxItemsPerRun?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // deno-lint-ignore no-explicit-any
    const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: RequestBody = await req.json();
    const { sessionId, maxItemsPerRun = 50 } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: session, error: sessionError } = await supabase
      .from('bulk_analysis_sessions').select('*').eq('id', sessionId).eq('user_id', user.id).single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return new Response(JSON.stringify({ error: "Session already finished", status: session.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: pendingItems } = await supabase
      .from('bulk_analysis_items').select('*').eq('session_id', sessionId).eq('status', 'pending')
      .order('priority_score', { ascending: false }).order('queue_position', { ascending: true }).limit(maxItemsPerRun);

    const pendingCount = pendingItems?.length || 0;
    console.log(`[BackendRunner] Session ${sessionId}: ${pendingCount} pending items`);

    if (pendingCount === 0) {
      await supabase.from('bulk_analysis_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId);
      return new Response(JSON.stringify({ status: 'completed', message: 'All items processed', pendingCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from('bulk_analysis_sessions')
      .update({ status: 'running', started_at: session.started_at || new Date().toISOString() }).eq('id', sessionId);

    // @ts-ignore - EdgeRuntime available in Deno
    EdgeRuntime.waitUntil(processItemsInBackground(supabase, session, pendingItems || []));

    return new Response(JSON.stringify({ status: 'processing', pendingCount, hasMore: pendingCount >= maxItemsPerRun }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error('[BackendRunner] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// deno-lint-ignore no-explicit-any
async function processItemsInBackground(supabase: any, session: any, items: any[]) {
  console.log(`[BackendRunner] Processing ${items.length} items in background`);

  for (const item of items) {
    try {
      const { data: currentSession } = await supabase.from('bulk_analysis_sessions').select('status').eq('id', session.id).single();
      if (currentSession?.status === 'paused' || currentSession?.status === 'cancelled') break;

      await supabase.from('bulk_analysis_items').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', item.id);

      let mediaUrl = item.media_url;
      if (item.storage_path && !mediaUrl) {
        const bucket = item.media_type === 'document' ? 'documents' : 'media';
        const { data: signedUrlData } = await supabase.storage.from(bucket).createSignedUrl(item.storage_path, 3600);
        mediaUrl = signedUrlData?.signedUrl;
      }

      if (!mediaUrl) throw new Error('Could not get media URL');

      const startTime = Date.now();
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-media-deep', {
        body: { mediaUrl, mediaType: item.media_type, profileId: item.profile_id, modes: session.analysis_modes, 
                context: session.analysis_context, depth: session.analysis_depth, mediaId: item.media_id }
      });

      if (analysisError) throw analysisError;

      const costCents = analysisResult?.costCents || 1;
      await supabase.from('bulk_analysis_items').update({
        status: 'completed', completed_at: new Date().toISOString(), processing_time_ms: Date.now() - startTime,
        actual_cost_cents: costCents, result: analysisResult, analysis_id: analysisResult?.analysisId
      }).eq('id', item.id);

      await supabase.rpc('increment_bulk_session_progress', { p_session_id: session.id, p_cost_cents: costCents, p_is_completed: true, p_is_failed: false });
      console.log(`[BackendRunner] Completed item ${item.id}`);

    } catch (error) {
      console.error(`[BackendRunner] Failed item ${item.id}:`, error);
      const { data: itemData } = await supabase.from('bulk_analysis_items').select('retry_count, max_retries').eq('id', item.id).single();
      const shouldRetry = itemData && itemData.retry_count < itemData.max_retries;

      await supabase.from('bulk_analysis_items').update({
        status: shouldRetry ? 'pending' : 'failed', error_message: error instanceof Error ? error.message : 'Unknown',
        retry_count: (itemData?.retry_count || 0) + 1, completed_at: shouldRetry ? null : new Date().toISOString()
      }).eq('id', item.id);

      if (!shouldRetry) await supabase.rpc('increment_bulk_session_progress', { p_session_id: session.id, p_cost_cents: 0, p_is_completed: false, p_is_failed: true });
    }
  }

  const { data: remaining } = await supabase.from('bulk_analysis_items').select('id').eq('session_id', session.id).eq('status', 'pending').limit(1);
  if (!remaining?.length) {
    await supabase.from('bulk_analysis_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', session.id);
  }
  console.log(`[BackendRunner] Background processing finished`);
}
