import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";
import { getRAGContext } from "../_shared/rag-helper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, userId, videoUrl, analysisType, modelTier = 'balanced' } = await req.json();
    
    if (!profileId || !userId) {
      throw new Error('Profile ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch contact info and transcriptions in parallel
    const [profileResult, recordingsResult] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, bio, job_title, organization').eq('id', profileId).single(),
      supabase.from('meeting_recordings').select('transcription, transcription_with_speakers').eq('profile_id', profileId).eq('status', 'completed').order('created_at', { ascending: false }).limit(5),
    ]);

    const profile = profileResult.data;
    const transcriptions = recordingsResult.data?.map(r => r.transcription).filter(Boolean).join('\n\n') || '';

    const systemPrompt = `You are an expert behavioral psychologist and analyst specializing in understanding human behavior patterns through communication analysis. Your task is to analyze the provided transcriptions and available data to identify behavioral patterns, personality indicators, and psychological insights.

Focus on:
1. Communication Style - How they express themselves, vocabulary choices, sentence structure
2. Personality Indicators - Based on Big Five traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
3. Decision-Making Patterns - How they approach choices and problem-solving
4. Interpersonal Dynamics - How they interact with others, leadership vs follower tendencies
5. Stress Responses - How they handle pressure or difficult topics
6. Values and Motivations - What drives them based on their communication
7. Cognitive Patterns - Logical vs emotional reasoning, detail-oriented vs big-picture

Provide actionable insights for relationship building and professional interactions.
Respond with valid JSON only.`;

    // Get RAG context from documents and observations
    const ragContext = await getRAGContext(
      userId,
      profileId,
      `${profile?.first_name} ${profile?.last_name || ''} behavior personality communication patterns`,
      { maxResults: 12, sourceTypes: ['document', 'observation', 'analysis', 'communication'] }
    );

    const userPrompt = `Analyze the following person and their communication patterns:

Person: ${profile?.first_name} ${profile?.last_name || ''}
Role: ${profile?.job_title || 'Unknown'} at ${profile?.organization || 'Unknown'}
Bio: ${profile?.bio || 'Not available'}

Analysis Type: ${analysisType || 'screening'}

Transcriptions from meetings/conversations:
${transcriptions || 'No transcriptions available - provide general guidance based on profile.'}

${ragContext.sourceCount > 0 ? `ADDITIONAL CONTEXT FROM DOCUMENTS AND RECORDS:\n${ragContext.context}\n` : ''}

Provide a comprehensive behavioral analysis in JSON format:
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

    // Get user's preferred model for behavioral analysis
    const funcAnalysisType = FUNCTION_TO_ANALYSIS_TYPE['analyze-behavioral'] || 'behavioral_analysis';
    const preferredModel = await getUserPreferredModel(userId, funcAnalysisType, selectModel(modelTier as any));

    // Use unified AI client
    const aiResponse = await callAI({
      model: preferredModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: userId,
      functionName: 'analyze-behavioral',
      profileId: profileId,
      temperature: 0.7,
      promptKey: 'BEHAVIORAL_ANALYSIS',
      metadata: { analysisType, hasTranscriptions: !!transcriptions, ragSourceCount: ragContext.sourceCount },
    });

    const parsedAnalysis = parseAIJson(aiResponse.content, { 
      personality_indicators: null,
      behavioral_patterns: null,
      confidence_score: 30,
      summary: 'Analysis could not be completed'
    });

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
        ai_model_used: aiResponse.model,
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
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
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
