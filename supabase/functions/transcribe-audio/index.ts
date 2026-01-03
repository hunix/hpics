import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId, fileUrl } = await req.json();
    
    if (!recordingId || !fileUrl) {
      throw new Error('Recording ID and file URL are required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase
      .from('meeting_recordings')
      .update({ status: 'processing' })
      .eq('id', recordingId);

    console.log('Fetching audio file from:', fileUrl);

    // Fetch the audio file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }
    const audioBlob = await audioResponse.blob();

    console.log('Audio file fetched, size:', audioBlob.size);

    // Prepare form data for ElevenLabs Scribe
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');
    formData.append('model_id', 'scribe_v1');
    formData.append('tag_audio_events', 'true');
    formData.append('diarize', 'true');

    console.log('Sending to ElevenLabs Scribe...');

    // Call ElevenLabs Scribe API
    const transcriptionResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${transcriptionResponse.status}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    console.log('Transcription completed');

    // Extract transcription text
    const transcription = transcriptionResult.text || '';
    
    // Process words with speaker info if available
    const transcriptionWithSpeakers = transcriptionResult.words?.map((word: any) => ({
      text: word.text,
      start: word.start,
      end: word.end,
      speaker: word.speaker || null,
    })) || [];

    // Extract audio events
    const audioEvents = transcriptionResult.audio_events || [];

    // Calculate duration from last word timestamp
    const lastWord = transcriptionResult.words?.[transcriptionResult.words.length - 1];
    const durationSeconds = lastWord ? Math.ceil(lastWord.end) : null;

    // Update the recording with transcription
    const { error: updateError } = await supabase
      .from('meeting_recordings')
      .update({
        transcription,
        transcription_with_speakers: transcriptionWithSpeakers,
        audio_events: audioEvents,
        duration_seconds: durationSeconds,
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      transcription,
      wordCount: transcriptionWithSpeakers.length,
      duration: durationSeconds,
      speakers: [...new Set(transcriptionWithSpeakers.map((w: any) => w.speaker).filter(Boolean))],
      audioEvents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Transcription error:', error);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
