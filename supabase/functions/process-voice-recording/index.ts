import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptionSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

interface VoiceAnalysisResult {
  transcription: string;
  segments: TranscriptionSegment[];
  speakers: string[];
  keywords: string[];
  sentiment: {
    overall: string;
    score: number;
    perSpeaker?: Record<string, { sentiment: string; score: number }>;
  };
  topics: string[];
  actionItems: string[];
  summary?: string;
  voiceCharacteristics?: {
    speaker: string;
    pitch: string;
    pace: string;
    energy: string;
    emotionalTone: string;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      recordingId,
      audioUrl,
      recordingType = 'meeting',
      participants = [],
      extractSignature = false,
      deviceSource
    } = await req.json();

    if (!recordingId && !audioUrl) {
      return new Response(JSON.stringify({ error: 'Recording ID or audio URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[process-voice-recording] Processing recording ${recordingId || 'from URL'} for user ${user.id}`);

    // Get recording details if ID provided
    let recording: any = null;
    let fileUrl = audioUrl;
    
    if (recordingId) {
      const { data, error } = await supabase
        .from('voice_recording_sessions')
        .select('*')
        .eq('id', recordingId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Recording not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      recording = data;
      fileUrl = recording.file_url;

      // Update status
      await supabase
        .from('voice_recording_sessions')
        .update({ 
          transcription_status: 'processing',
          status: 'processing' 
        })
        .eq('id', recordingId);
    }

    // Use existing transcription function for the heavy lifting
    const transcribeResponse = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioUrl: fileUrl,
        diarization: recordingType === 'meeting',
        speakerCount: participants.length || 2,
      }),
    });

    if (!transcribeResponse.ok) {
      throw new Error('Transcription failed');
    }

    const transcriptionResult = await transcribeResponse.json();

    // Analyze the transcription with AI
    const analysisPrompt = `Analyze this transcription from a ${recordingType} recording.

TRANSCRIPTION:
${transcriptionResult.transcription || transcriptionResult.text}

${transcriptionResult.segments ? `SPEAKER SEGMENTS:\n${JSON.stringify(transcriptionResult.segments, null, 2)}` : ''}

ANALYSIS REQUIREMENTS:
1. Identify all unique speakers
2. Extract key topics discussed
3. Identify any action items or commitments made
4. Analyze sentiment per speaker if diarization is available
5. Extract important keywords and phrases
6. Provide a brief summary (2-3 sentences)
7. For each speaker, analyze voice characteristics if segments are provided:
   - Pitch (high/medium/low)
   - Pace (fast/moderate/slow)
   - Energy level (high/medium/low)
   - Emotional tone (confident, anxious, friendly, neutral, etc.)

Return a comprehensive JSON analysis.`;

    const model = selectModel('balanced', 'google');
    
    const aiResponse = await callAI({
      model,
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert at analyzing voice recordings and conversations. Provide structured analysis in JSON format.' 
        },
        { role: 'user', content: analysisPrompt }
      ],
      userId: user.id,
      functionName: 'process-voice-recording',
      profileId: recording?.profile_id,
      temperature: 0.3,
      maxTokens: 4000,
      metadata: {
        recordingType,
        durationSeconds: recording?.duration_seconds,
        deviceSource,
      }
    });

    const analysis = parseAIJson<VoiceAnalysisResult>(aiResponse.content, {
      transcription: transcriptionResult.transcription || transcriptionResult.text || '',
      segments: [],
      speakers: [],
      keywords: [],
      sentiment: { overall: 'neutral', score: 0.5 },
      topics: [],
      actionItems: [],
    });

    // Update recording with results
    if (recordingId) {
      await supabase
        .from('voice_recording_sessions')
        .update({
          transcription: analysis.transcription || transcriptionResult.transcription || transcriptionResult.text,
          transcription_status: 'completed',
          speaker_diarization: analysis.segments || transcriptionResult.segments,
          detected_speakers: analysis.speakers,
          keywords_detected: analysis.keywords,
          sentiment_analysis: analysis.sentiment,
          status: 'analyzed',
          metadata: {
            ...recording?.metadata,
            topics: analysis.topics,
            actionItems: analysis.actionItems,
            summary: analysis.summary,
            voiceCharacteristics: analysis.voiceCharacteristics,
            aiModel: aiResponse.model,
            costCents: aiResponse.costCents,
          }
        })
        .eq('id', recordingId);

      // If voice signature extraction requested, create biometric samples
      if (extractSignature && analysis.speakers.length > 0 && recording?.profile_id) {
        for (const speaker of analysis.speakers) {
          const speakerSegments = (analysis.segments || []).filter(s => s.speaker === speaker);
          if (speakerSegments.length > 0) {
            await supabase.from('biometric_samples').insert({
              user_id: user.id,
              profile_id: recording.profile_id,
              biometric_type: 'voice',
              source_type: 'voice_recording',
              source_id: recordingId,
              source_url: fileUrl,
              features: {
                speaker,
                characteristics: analysis.voiceCharacteristics?.find(v => v.speaker === speaker),
                segmentCount: speakerSegments.length,
              },
              quality_score: 0.7, // Base quality, would be refined by voice biometric analysis
              status: 'pending',
            });
          }
        }
      }
    }

    // Log device sync
    if (deviceSource) {
      await supabase.from('device_sync_log').insert({
        user_id: user.id,
        device_id: `${deviceSource}-${Date.now()}`,
        device_type: deviceSource,
        sync_type: 'voice',
        metadata: {
          recordingType,
          speakerCount: analysis.speakers.length,
          durationSeconds: recording?.duration_seconds,
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      transcription: analysis.transcription,
      speakers: analysis.speakers,
      topics: analysis.topics,
      actionItems: analysis.actionItems,
      summary: analysis.summary,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[process-voice-recording] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process recording' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
