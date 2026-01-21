import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'transcribe-audio', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId, fileUrl } = await req.json();
    
    if (!recordingId || !fileUrl) {
      throw new Error('Recording ID and file URL are required');
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

    let transcription = '';
    let transcriptionWithSpeakers: any[] = [];
    let audioEvents: any[] = [];
    let durationSeconds: number | null = null;
    let transcriptionMethod = 'elevenlabs';

    // Try ElevenLabs first
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (ELEVENLABS_API_KEY) {
      try {
        // Prepare form data for ElevenLabs Scribe
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.mp3');
        formData.append('model_id', 'scribe_v1');
        formData.append('tag_audio_events', 'true');
        formData.append('diarize', 'true');

        console.log('Sending to ElevenLabs Scribe...');

        // Call ElevenLabs Scribe API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const transcriptionResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!transcriptionResponse.ok) {
          const errorText = await transcriptionResponse.text();
          console.error('ElevenLabs API error:', transcriptionResponse.status, errorText);
          
          // If 401/403, immediately fall back to Lovable AI
          if (transcriptionResponse.status === 401 || transcriptionResponse.status === 403) {
            console.log('ElevenLabs auth failed, falling back to Lovable AI...');
            throw new Error('ElevenLabs auth failed');
          }
          throw new Error(`ElevenLabs API error: ${transcriptionResponse.status}`);
        }

        const transcriptionResult = await transcriptionResponse.json();
        console.log('ElevenLabs transcription completed');

        // Extract transcription text
        transcription = transcriptionResult.text || '';
        
        // Process words with speaker info if available
        transcriptionWithSpeakers = transcriptionResult.words?.map((word: any) => ({
          text: word.text,
          start: word.start,
          end: word.end,
          speaker: word.speaker || null,
        })) || [];

        // Extract audio events
        audioEvents = transcriptionResult.audio_events || [];

        // Calculate duration from last word timestamp
        const lastWord = transcriptionResult.words?.[transcriptionResult.words.length - 1];
        durationSeconds = lastWord ? Math.ceil(lastWord.end) : null;

      } catch (elevenLabsError) {
        console.log('ElevenLabs failed, using Lovable AI fallback:', elevenLabsError instanceof Error ? elevenLabsError.message : 'Unknown error');
        transcriptionMethod = 'lovable-ai';
      }
    } else {
      console.log('No ElevenLabs API key, using Lovable AI...');
      transcriptionMethod = 'lovable-ai';
    }

    // Fallback to Lovable AI for transcription
    if (transcriptionMethod === 'lovable-ai') {
      console.log('Using Lovable AI (Gemini) for transcription...');
      
      try {
        // Get a service-level user ID for tracking (from recording owner or fallback)
        const { data: recording } = await supabase
          .from('meeting_recordings')
          .select('user_id')
          .eq('id', recordingId)
          .single();
        
        const userId = recording?.user_id || 'system';
        
        // Convert blob to base64 for Lovable AI (limit to ~750KB for base64)
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const maxBytes = Math.min(uint8Array.length, 750000);
        let base64Audio = '';
        for (let i = 0; i < maxBytes; i++) {
          base64Audio += String.fromCharCode(uint8Array[i]);
        }
        base64Audio = btoa(base64Audio);
        
        const result = await callAI({
          model: 'google/gemini-2.5-flash',
          userId,
          functionName: 'transcribe-audio',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Transcribe this audio completely. Identify different speakers if multiple people are talking. Format as a clean transcript with speaker labels (Speaker 1, Speaker 2, etc.) if applicable. Return the full transcription text.'
                },
                {
                  type: 'file',
                  data: base64Audio,
                  mimeType: audioBlob.type || 'audio/mpeg',
                }
              ]
            }
          ],
          temperature: 0.1,
          maxTokens: 8000,
        });

        transcription = typeof result === 'string' ? result : (result as any).content || '';
        console.log('Lovable AI transcription completed, length:', transcription.length);
        
      } catch (aiError) {
        console.error('Lovable AI transcription failed:', aiError);
        transcription = '[Transcription failed - audio could not be processed]';
      }
    }

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
      method: transcriptionMethod,
      wordCount: transcriptionWithSpeakers.length || transcription.split(/\s+/).length,
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
