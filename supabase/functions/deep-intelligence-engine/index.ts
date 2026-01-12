import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntelligenceRequest {
  profileId: string;
  profileName?: string;
  userId: string;
  analysisType: 'comprehensive' | 'emotional' | 'behavioral' | 'socioeconomic' | 'intimacy' | 'fortune';
}

const ANALYSIS_PROMPTS = {
  comprehensive: `You are an elite intelligence analyst with expertise in human behavior, psychology, and strategic profiling. Conduct a comprehensive analysis covering:

1. **EMOTIONAL INTELLIGENCE PROFILE**
- Emotional baseline and regulation patterns
- Trigger points and stress responses
- Emotional availability and depth capacity
- Empathy quotient and emotional contagion susceptibility

2. **BEHAVIORAL PATTERN ANALYSIS**
- Habitual behavior loops and routines
- Decision-making patterns and biases
- Response predictability index
- Behavioral consistency score

3. **SOCIOECONOMIC POSITIONING**
- Social class indicators and mobility trajectory
- Resource access patterns
- Network capital and leverage points
- Economic stability signals

4. **INTIMACY & ATTACHMENT PROFILE**
- Attachment style (secure/anxious/avoidant/disorganized)
- Intimacy comfort zones
- Trust formation patterns
- Vulnerability expression tendencies

5. **INFLUENCE SUSCEPTIBILITY MAP**
- Persuasion vectors (authority, social proof, scarcity, etc.)
- Resistance points
- Optimal approach strategies
- Manipulation vulnerability score

6. **PREDICTIVE TRAJECTORY**
- Short-term behavioral forecasts (7-30 days)
- Medium-term relationship trajectory (3-6 months)
- Long-term stability assessment
- Critical intervention windows

Return structured JSON with confidence scores (0-1) for each dimension.`,

  emotional: `Analyze the subject's emotional architecture:
- Core emotional drivers and motivations
- Emotional regulation capacity (1-10)
- Trigger taxonomy with response patterns
- Emotional investment capacity
- Love language hierarchy
- Conflict response style
- Recovery patterns after emotional events
Return detailed JSON with actionable insights.`,

  behavioral: `Map the subject's behavioral DNA:
- Habit loops and routine patterns
- Decision-making style (analytical/intuitive/impulsive)
- Risk tolerance profile
- Consistency index across contexts
- Behavioral tells and micro-patterns
- Predictability score with confidence intervals
- Behavioral change sensitivity
Return structured behavioral profile JSON.`,

  socioeconomic: `Profile socioeconomic positioning:
- Class indicators (education, occupation, consumption patterns)
- Economic stability signals
- Resource allocation patterns
- Social mobility trajectory
- Network capital valuation
- Status signaling behaviors
- Financial decision patterns
Return comprehensive socioeconomic profile JSON.`,

  intimacy: `Analyze intimacy and attachment patterns:
- Primary attachment style with secondary patterns
- Intimacy comfort spectrum
- Trust formation timeline
- Vulnerability expression patterns
- Sexual-romantic integration style
- Commitment readiness indicators
- Relationship trajectory predictions
Return detailed attachment profile JSON.`,

  fortune: `Assess future trajectory and fortune indicators:
- Career trajectory probability curves
- Relationship outcome predictions
- Health risk factors
- Financial trajectory modeling
- Life satisfaction forecast
- Critical decision points ahead
- Opportunity windows analysis
Return predictive fortune profile JSON.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, profileName, userId, analysisType = 'comprehensive' } = await req.json() as IntelligenceRequest;

    if (!profileId || !userId) {
      return new Response(JSON.stringify({ error: 'profileId and userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather all available intelligence on the subject
    const [
      { data: profile },
      { data: observations },
      { data: messages },
      { data: behavioralData },
      { data: psychProfile },
      { data: mediaAnalyses },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).order('observed_at', { ascending: false }).limit(50),
      supabase.from('messages').select('content, direction, sentiment_score, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
      supabase.from('media_analyses').select('analysis_result, analysis_type').eq('profile_id', profileId).limit(20),
    ]);

    // Build comprehensive context
    const contextData = {
      profile: profile || {},
      name: profileName || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      observations: (observations || []).map(o => ({
        content: o.content,
        category: o.category,
        date: o.observed_at,
        sentiment: o.sentiment,
      })),
      communicationPatterns: (messages || []).slice(0, 50).map(m => ({
        direction: m.direction,
        sentiment: m.sentiment_score,
        preview: m.content?.substring(0, 100),
      })),
      behavioralHistory: (behavioralData || []).map(b => ({
        type: b.analysis_type,
        patterns: b.behavioral_patterns,
        confidence: b.confidence_score,
      })),
      psychologicalProfile: psychProfile || null,
      mediaInsights: (mediaAnalyses || []).map(m => ({
        type: m.analysis_type,
        result: m.analysis_result,
      })),
    };

    const systemPrompt = ANALYSIS_PROMPTS[analysisType] || ANALYSIS_PROMPTS.comprehensive;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Analyze this subject comprehensively:

SUBJECT PROFILE:
${JSON.stringify(contextData.profile, null, 2)}

OBSERVATIONS (${contextData.observations.length} entries):
${JSON.stringify(contextData.observations.slice(0, 20), null, 2)}

COMMUNICATION PATTERNS:
${JSON.stringify(contextData.communicationPatterns.slice(0, 30), null, 2)}

BEHAVIORAL HISTORY:
${JSON.stringify(contextData.behavioralHistory, null, 2)}

EXISTING PSYCHOLOGICAL PROFILE:
${JSON.stringify(contextData.psychologicalProfile, null, 2)}

MEDIA ANALYSIS INSIGHTS:
${JSON.stringify(contextData.mediaInsights.slice(0, 10), null, 2)}

Provide your complete intelligence analysis in structured JSON format.`
          }
        ],
        temperature: 0.3,
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisContent = aiResponse.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let analysisResult;
    try {
      const jsonMatch = analysisContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisContent;
      analysisResult = JSON.parse(jsonStr);
    } catch {
      analysisResult = { rawAnalysis: analysisContent };
    }

    // Store the analysis
    const { error: insertError } = await supabase
      .from('ai_analyses')
      .insert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: `deep_intelligence_${analysisType}`,
        result: analysisResult,
      });

    if (insertError) {
      console.error('Failed to store analysis:', insertError);
    }

    // Calculate cost estimate
    const inputTokens = aiResponse.usage?.prompt_tokens || 0;
    const outputTokens = aiResponse.usage?.completion_tokens || 0;
    const costCents = Math.round((inputTokens * 0.00125 + outputTokens * 0.005) * 100);

    return new Response(JSON.stringify({
      success: true,
      analysisType,
      analysis: analysisResult,
      cost: costCents,
      tokens: { input: inputTokens, output: outputTokens },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Deep intelligence engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
