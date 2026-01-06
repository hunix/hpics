import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      .eq('user_id', user.id);

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
      .eq('user_id', user.id);

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
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

  } catch (error: unknown) {
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
