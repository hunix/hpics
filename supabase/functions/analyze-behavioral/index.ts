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
    const { profileId, userId, videoUrl, analysisType, localEndpoint } = await req.json();
    
    if (!profileId || !userId) {
      throw new Error('Profile ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, bio, job_title, organization')
      .eq('id', profileId)
      .single();

    // Fetch any transcribed recordings for text-based analysis
    const { data: recordings } = await supabase
      .from('meeting_recordings')
      .select('transcription, transcription_with_speakers')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);

    const transcriptions = recordings?.map(r => r.transcription).filter(Boolean).join('\n\n') || '';

    const systemPrompt = `You are an expert behavioral psychologist and analyst specializing in understanding human behavior patterns through communication analysis. Your task is to analyze the provided transcriptions and available data to identify behavioral patterns, personality indicators, and psychological insights.

Focus on:
1. Communication Style - How they express themselves, vocabulary choices, sentence structure
2. Personality Indicators - Based on Big Five traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
3. Decision-Making Patterns - How they approach choices and problem-solving
4. Interpersonal Dynamics - How they interact with others, leadership vs follower tendencies
5. Stress Responses - How they handle pressure or difficult topics
6. Values and Motivations - What drives them based on their communication
7. Cognitive Patterns - Logical vs emotional reasoning, detail-oriented vs big-picture

Provide actionable insights for relationship building and professional interactions.`;

    const userPrompt = `Analyze the following person and their communication patterns:

Person: ${profile?.first_name} ${profile?.last_name || ''}
Role: ${profile?.job_title || 'Unknown'} at ${profile?.organization || 'Unknown'}
Bio: ${profile?.bio || 'Not available'}

Analysis Type: ${analysisType || 'screening'}

Transcriptions from meetings/conversations:
${transcriptions || 'No transcriptions available - provide general guidance based on profile.'}

Provide a comprehensive behavioral analysis in JSON format with the following structure:
{
  "personality_indicators": {
    "openness": { "score": 0-100, "evidence": ["..."], "description": "..." },
    "conscientiousness": { "score": 0-100, "evidence": ["..."], "description": "..." },
    "extraversion": { "score": 0-100, "evidence": ["..."], "description": "..." },
    "agreeableness": { "score": 0-100, "evidence": ["..."], "description": "..." },
    "neuroticism": { "score": 0-100, "evidence": ["..."], "description": "..." }
  },
  "behavioral_patterns": {
    "communication_style": { "type": "...", "characteristics": ["..."], "recommendations": ["..."] },
    "decision_making": { "style": "...", "speed": "...", "factors": ["..."] },
    "interpersonal_dynamics": { "role": "...", "strengths": ["..."], "challenges": ["..."] },
    "stress_indicators": { "triggers": ["..."], "coping_mechanisms": ["..."] },
    "values": ["..."],
    "motivations": ["..."]
  },
  "interaction_recommendations": ["..."],
  "red_flags": ["..."],
  "strengths": ["..."],
  "confidence_score": 0-100,
  "summary": "..."
}`;

    let analysisResult;
    let aiModelUsed = 'lovable-ai/gemini-2.5-flash';

    // Try local endpoint first if provided
    if (localEndpoint) {
      try {
        console.log('Attempting local AI endpoint:', localEndpoint);
        const localResponse = await fetch(`${localEndpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (localResponse.ok) {
          const localResult = await localResponse.json();
          analysisResult = localResult.choices?.[0]?.message?.content;
          aiModelUsed = `local/${localEndpoint}`;
          console.log('Local AI analysis successful');
        }
      } catch (localError) {
        console.log('Local endpoint failed, falling back to Lovable AI:', localError);
      }
    }

    // Fall back to Lovable AI Gateway
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
          model: 'google/gemini-2.5-flash',
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
      // Extract JSON from potential markdown code blocks
      const jsonMatch = analysisResult.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, analysisResult];
      parsedAnalysis = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError);
      parsedAnalysis = { raw_text: analysisResult, parse_error: true };
    }

    // Store the analysis
    const { data: analysis, error: insertError } = await supabase
      .from('behavioral_analyses')
      .insert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: analysisType || 'screening',
        video_url: videoUrl,
        personality_indicators: parsedAnalysis.personality_indicators || null,
        behavioral_patterns: parsedAnalysis.behavioral_patterns || null,
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
    console.error('Behavioral analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
