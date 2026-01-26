import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  sessionId: string;
  action: 'start' | 'continue' | 'pause' | 'cancel';
  maxItemsPerRun?: number;
}

interface VoiceAnalysisSession {
  id: string;
  user_id: string;
  profile_id: string | null;
  status: string;
  processing_mode: string;
  whisper_model: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  skipped_items: number;
  started_at: string | null;
}

interface VoiceAnalysisItem {
  id: string;
  session_id: string;
  media_id: string | null;
  recording_id: string | null;
  source: string;
  file_url: string;
  file_name: string;
  status: string;
  queue_position: number;
  retry_count: number;
  max_retries: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'process-voice-analysis-runner', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // deno-lint-ignore no-explicit-any
    const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

    // Validate auth
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
    const { sessionId, action, maxItemsPerRun = 50 } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[VoiceRunner] Session ${sessionId}, action: ${action}, user: ${user.id}`);

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('voice_analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle pause/cancel actions
    if (action === 'pause') {
      await supabase.from('voice_analysis_sessions')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      return new Response(JSON.stringify({ status: 'paused', message: 'Session paused' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === 'cancel') {
      await supabase.from('voice_analysis_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      return new Response(JSON.stringify({ status: 'cancelled', message: 'Session cancelled' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if already completed or cancelled
    if (session.status === 'completed' || session.status === 'cancelled') {
      return new Response(JSON.stringify({ 
        error: "Session already finished", 
        status: session.status 
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch pending items
    const { data: pendingItems, error: itemsError } = await supabase
      .from('voice_analysis_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'pending')
      .order('queue_position', { ascending: true })
      .limit(maxItemsPerRun);

    if (itemsError) {
      console.error('[VoiceRunner] Error fetching items:', itemsError);
      return new Response(JSON.stringify({ error: "Failed to fetch items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pendingCount = pendingItems?.length || 0;
    console.log(`[VoiceRunner] Session ${sessionId}: ${pendingCount} pending items`);

    // If no pending items, mark session complete
    if (pendingCount === 0) {
      await supabase.from('voice_analysis_sessions')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      return new Response(JSON.stringify({ 
        status: 'completed', 
        message: 'All items processed', 
        pendingCount: 0 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update session to running
    await supabase.from('voice_analysis_sessions')
      .update({ 
        status: 'running', 
        started_at: session.started_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Start background processing
    // @ts-ignore - EdgeRuntime available in Deno
    EdgeRuntime.waitUntil(processItemsInBackground(
      supabase, 
      session as VoiceAnalysisSession, 
      (pendingItems || []) as VoiceAnalysisItem[]
    ));

    return new Response(JSON.stringify({ 
      status: 'processing', 
      pendingCount, 
      hasMore: pendingCount >= maxItemsPerRun 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error('[VoiceRunner] Error:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// deno-lint-ignore no-explicit-any
async function processItemsInBackground(
  supabase: any,
  session: VoiceAnalysisSession,
  items: VoiceAnalysisItem[]
) {
  console.log(`[VoiceRunner] Processing ${items.length} items in background for session ${session.id}`);

  for (const item of items) {
    try {
      // Check if session is paused or cancelled
      const { data: currentSession } = await supabase
        .from('voice_analysis_sessions')
        .select('status')
        .eq('id', session.id)
        .single();

      if (currentSession?.status === 'paused' || currentSession?.status === 'cancelled') {
        console.log(`[VoiceRunner] Session ${session.id} is ${currentSession.status}, stopping`);
        break;
      }

      // Update item to running
      await supabase.from('voice_analysis_items')
        .update({ 
          status: 'running'
        })
        .eq('id', item.id);

      // Update session current item
      await supabase.from('voice_analysis_sessions')
        .update({ current_item_id: item.id })
        .eq('id', session.id);

      const startTime = Date.now();

      // Call the voice transcription function based on source
      let transcriptionResult;
      
      if (item.source === 'voice_recording_sessions') {
        // Use process-voice-recording for in-app recordings
        const { data, error } = await supabase.functions.invoke('process-voice-recording', {
          body: { 
            audioUrl: item.file_url, 
            recordingId: item.recording_id 
          }
        });
        
        if (error) throw error;
        transcriptionResult = data;
      } else {
        // Use transcribe-voice-note for media files (WhatsApp, etc.)
        const { data, error } = await supabase.functions.invoke('transcribe-voice-note', {
          body: { 
            audioUrl: item.file_url,
            mediaId: item.media_id,
            profileId: session.profile_id
          }
        });
        
        if (error) throw error;
        transcriptionResult = data;
      }

      const processingTimeMs = Date.now() - startTime;

      // Update item to completed
      await supabase.from('voice_analysis_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processing_time_ms: processingTimeMs,
          transcription_text: transcriptionResult?.transcription || transcriptionResult?.text || null,
          detected_language: transcriptionResult?.language || transcriptionResult?.detectedLanguage || null
        })
        .eq('id', item.id);

      // Increment session progress
      await supabase.rpc('increment_voice_session_progress', {
        p_session_id: session.id,
        p_is_completed: true,
        p_is_failed: false,
        p_is_skipped: false,
        p_cost_cents: transcriptionResult?.costCents || 0
      });

      console.log(`[VoiceRunner] Completed item ${item.id} in ${processingTimeMs}ms`);

    } catch (error) {
      console.error(`[VoiceRunner] Failed item ${item.id}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Fetch current retry count
      const { data: itemData } = await supabase
        .from('voice_analysis_items')
        .select('retry_count, max_retries')
        .eq('id', item.id)
        .single();

      const shouldRetry = itemData && itemData.retry_count < itemData.max_retries;

      // Update item status
      await supabase.from('voice_analysis_items')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          error_message: errorMessage,
          error_type: classifyErrorType(errorMessage),
          can_retry: shouldRetry,
          retry_count: (itemData?.retry_count || 0) + 1,
          completed_at: shouldRetry ? null : new Date().toISOString()
        })
        .eq('id', item.id);

      // Only increment failed count if not retrying
      if (!shouldRetry) {
        await supabase.rpc('increment_voice_session_progress', {
          p_session_id: session.id,
          p_is_completed: false,
          p_is_failed: true,
          p_is_skipped: false,
          p_cost_cents: 0
        });
      }
    }
  }

  // Check if there are more pending items
  const { data: remaining } = await supabase
    .from('voice_analysis_items')
    .select('id')
    .eq('session_id', session.id)
    .eq('status', 'pending')
    .limit(1);

  if (!remaining?.length) {
    // Mark session completed
    await supabase.from('voice_analysis_sessions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        current_item_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);
    
    console.log(`[VoiceRunner] Session ${session.id} completed`);
  } else {
    // Clear current item but keep session running
    await supabase.from('voice_analysis_sessions')
      .update({ 
        current_item_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);
  }

  console.log(`[VoiceRunner] Background processing finished for session ${session.id}`);
}

function classifyErrorType(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('timeout')) return 'timeout';
  if (msg.includes('no transcription') || msg.includes('no speech')) return 'empty';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('not accessible')) return 'network';
  if (msg.includes('webgpu') || msg.includes('wasm') || msg.includes('ml engine')) return 'ml';
  
  return 'unknown';
}
