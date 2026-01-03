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
    const { profileId, userId, videoUrl, recordingId, localEndpoint } = await req.json();
    
    if (!profileId || !userId) {
      throw new Error('Profile ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', profileId)
      .single();

    // Fetch transcription if available for cross-referencing
    let transcription = '';
    if (recordingId) {
      const { data: recording } = await supabase
        .from('meeting_recordings')
        .select('transcription, transcription_with_speakers')
        .eq('id', recordingId)
        .single();
      transcription = recording?.transcription || '';
    }

    const systemPrompt = `You are an expert in micro-expression analysis, facial action coding system (FACS), and deception detection. Analyze facial expressions and micro-expressions to understand emotional states, stress levels, and potential deception indicators.

Focus on:
1. Micro-expressions - Brief involuntary facial expressions (1/25 to 1/5 of a second)
2. Emotional Timeline - How emotions change throughout the interaction
3. Stress Indicators - Physical manifestations of stress or discomfort
4. Deception Indicators - Asymmetrical expressions, timing inconsistencies, eye behavior
5. Genuine vs Masked Emotions - Detecting when expressions are authentic or performed
6. Baseline Deviations - Changes from their normal expression patterns

Important: This analysis is for professional insight purposes. Always maintain ethical considerations.`;

    const userPrompt = `Provide a facial expression and micro-expression analysis for ${profile?.first_name} ${profile?.last_name || ''}.

${videoUrl ? `Video URL for reference: ${videoUrl}` : 'No video provided - provide framework and what to look for.'}

${transcription ? `Transcription for context and timeline reference:
${transcription.substring(0, 2000)}...` : ''}

Provide analysis in JSON format:
{
  "micro_expressions": [
    {
      "timestamp": "optional",
      "expression_type": "fear/surprise/anger/disgust/sadness/happiness/contempt",
      "duration": "micro/brief/sustained",
      "intensity": 0-100,
      "context": "what was being discussed",
      "interpretation": "what this likely indicates"
    }
  ],
  "emotional_timeline": [
    {
      "phase": "opening/middle/closing",
      "dominant_emotion": "...",
      "secondary_emotions": ["..."],
      "congruence_with_speech": true/false,
      "notes": "..."
    }
  ],
  "stress_indicators": {
    "overall_level": 0-100,
    "physical_signs": ["..."],
    "peak_moments": ["..."],
    "triggers": ["..."]
  },
  "deception_indicators": {
    "risk_level": "low/medium/high",
    "observed_signs": ["..."],
    "incongruent_moments": ["..."],
    "confidence": 0-100,
    "notes": "Important: These are potential indicators, not definitive proof"
  },
  "genuine_expressions": ["moments of authentic emotion"],
  "masked_expressions": ["moments where emotion may have been suppressed"],
  "baseline_observations": {
    "typical_expression": "...",
    "eye_contact_pattern": "...",
    "blink_rate": "normal/elevated/reduced"
  },
  "recommendations": ["how to interpret and use this information ethically"],
  "confidence_score": 0-100,
  "summary": "..."
}`;

    let analysisResult;
    let aiModelUsed = 'lovable-ai/gemini-2.5-pro';

    // Try local endpoint first if provided (for specialized vision models)
    if (localEndpoint) {
      try {
        console.log('Attempting local AI endpoint for facial analysis:', localEndpoint);
        const localResponse = await fetch(`${localEndpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 4000,
          }),
        });

        if (localResponse.ok) {
          const localResult = await localResponse.json();
          analysisResult = localResult.choices?.[0]?.message?.content;
          aiModelUsed = `local/${localEndpoint}`;
          console.log('Local AI facial analysis successful');
        }
      } catch (localError) {
        console.log('Local endpoint failed, falling back to Lovable AI:', localError);
      }
    }

    // Fall back to Lovable AI Gateway with vision-capable model
    if (!analysisResult) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('No AI API key available');
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', errorText);
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const result = await response.json();
      analysisResult = result.choices?.[0]?.message?.content;
    }

    // Parse the JSON response
    let parsedAnalysis;
    try {
      const jsonMatch = analysisResult.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, analysisResult];
      parsedAnalysis = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError);
      parsedAnalysis = { raw_text: analysisResult, parse_error: true };
    }

    // Store the analysis
    const { data: analysis, error: insertError } = await supabase
      .from('facial_analyses')
      .insert({
        profile_id: profileId,
        user_id: userId,
        video_url: videoUrl,
        source_recording_id: recordingId,
        micro_expressions: parsedAnalysis.micro_expressions || null,
        emotional_timeline: parsedAnalysis.emotional_timeline || null,
        stress_indicators: parsedAnalysis.stress_indicators || null,
        deception_indicators: parsedAnalysis.deception_indicators || null,
        confidence_score: parsedAnalysis.confidence_score || null,
        raw_analysis: parsedAnalysis,
        ai_model_used: aiModelUsed,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Facial analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
