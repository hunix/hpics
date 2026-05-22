import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const __url = new URL(req.url);
  if (__url.searchParams.get("healthCheck") === "1") {
    return new Response(JSON.stringify({ ok: true, function: "transcribe-voice-note", timestamp: Date.now() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth header for getClaims
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate JWT using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const userId = claimsData.claims.sub as string;
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { voiceNoteId, audioUrl } = await req.json();

    if (!voiceNoteId || !audioUrl) {
      return new Response(JSON.stringify({ error: "Missing voiceNoteId or audioUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await supabase
      .from('voice_notes')
      .update({ transcription_status: 'processing' })
      .eq('id', voiceNoteId)
      .eq('user_id', userId);

    // Use ElevenLabs Scribe for transcription
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!elevenLabsKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    // Download audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error("Failed to download audio file");
    }
    
    const audioBlob = await audioResponse.blob();
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('model_id', 'scribe_v1');

    // Transcribe with ElevenLabs
    const transcribeResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
      },
      body: formData,
    });

    if (!transcribeResponse.ok) {
      const errorData = await transcribeResponse.json();
      throw new Error(errorData.detail?.message || 'Transcription failed');
    }

    const transcriptionData = await transcribeResponse.json();
    const transcription = transcriptionData.text || '';

    // Update voice note with transcription
    await supabase
      .from('voice_notes')
      .update({ 
        transcription,
        transcription_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', voiceNoteId)
      .eq('user_id', userId);

    // Get voice note details for biometric matching
    const { data: voiceNote } = await supabase
      .from('voice_notes')
      .select('profile_id')
      .eq('id', voiceNoteId)
      .single();

    // Queue voice biometric matching if transcription is substantial
    if (transcription && transcription.split(/\s+/).length >= 10 && voiceNote?.profile_id) {
      try {
        // Create a biometric match record for voice analysis
        await supabase.from('biometric_matches').insert({
          user_id: userId,
          source_type: 'voice_note',
          source_id: voiceNoteId,
          match_type: 'voice',
          auto_tagged: false,
          confidence_score: 0, // Will be updated when match-biometrics runs
          alternative_matches: { 
            pending_analysis: true,
            word_count: transcription.split(/\s+/).length,
            audio_url: audioUrl 
          },
        });
        console.log(`Queued voice biometric matching for voice note ${voiceNoteId}`);
      } catch (bioError) {
        console.log(`Voice biometric queue error for ${voiceNoteId}:`, bioError);
        // Non-blocking - don't fail the main process
      }
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'transcribe-voice-note',
      model_name: 'scribe_v1',
      provider: 'elevenlabs',
      status: 'success',
      estimated_cost_cents: 1,
      prompt_summary: `Voice note transcription: ${transcription.substring(0, 100)}...`,
    });

    return new Response(JSON.stringify({
      success: true,
      transcription,
      wordCount: transcription.split(/\s+/).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Transcribe voice note error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to update status to failed
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const body = await new Response(req.clone().body).json().catch(() => ({}));
      
      if (body.voiceNoteId) {
        await supabase
          .from('voice_notes')
          .update({ 
            transcription_status: 'failed',
            transcription_error: message,
          })
          .eq('id', body.voiceNoteId);
      }
    } catch {}
    
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
