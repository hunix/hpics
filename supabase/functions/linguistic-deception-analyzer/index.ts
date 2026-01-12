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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, userId, textSamples, analysisType = 'comprehensive' } = await req.json();

    // If no text samples provided, fetch from messages
    let textsToAnalyze = textSamples;
    if (!textsToAnalyze || textsToAnalyze.length === 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('content, received_at, source')
        .eq('profile_id', profileId)
        .order('received_at', { ascending: false })
        .limit(200);
      
      textsToAnalyze = messages?.map(m => ({
        text: m.content,
        timestamp: m.received_at,
        source: m.source
      })) || [];
    }

    const LIWC_ANALYSIS_PROMPT = `You are an expert in LIWC (Linguistic Inquiry and Word Count) analysis and forensic linguistics specializing in deception detection.

Analyze the following text samples using scientific linguistic markers for deception:

## LIWC Categories to Analyze:
1. **Pronouns**: First-person singular (I, me, my) - deceptive speakers often reduce self-references
2. **Cognitive Processes**: Think, know, understand - liars show altered cognitive complexity
3. **Perceptual Processes**: See, hear, feel - truthful accounts are more sensory-rich
4. **Negations**: No, not, never - increased negations may indicate deception
5. **Motion Verbs**: Go, walk, move - truthful narratives have more action
6. **Exclusive Words**: But, except, without - deceptive text has fewer exclusions
7. **Tentative Language**: Maybe, perhaps, possibly - increased uncertainty markers
8. **Certainty Words**: Always, never, definitely - overuse can indicate deception
9. **Quantifiers**: Many, few, some - vague quantifiers may signal deception

## Additional Linguistic Deception Markers:
- Response latency patterns
- Sentence complexity changes
- Passive vs active voice shifts
- Temporal consistency
- Detail richness variations
- Emotional word usage patterns

Provide analysis in this JSON format:
{
  "overallDeceptionProbability": 0-100,
  "confidenceLevel": 0-1,
  "liwcProfile": {
    "firstPersonSingular": {
      "frequency": number,
      "baseline": number,
      "deviation": number,
      "deceptionIndicator": boolean
    },
    "cognitiveProcesses": {
      "frequency": number,
      "complexity": "high|medium|low",
      "deceptionIndicator": boolean
    },
    "perceptualProcesses": {
      "frequency": number,
      "sensoryRichness": 1-10,
      "deceptionIndicator": boolean
    },
    "negations": {
      "frequency": number,
      "deceptionIndicator": boolean
    },
    "motionVerbs": {
      "frequency": number,
      "deceptionIndicator": boolean
    },
    "exclusiveWords": {
      "frequency": number,
      "deceptionIndicator": boolean
    },
    "tentativeLanguage": {
      "frequency": number,
      "deceptionIndicator": boolean
    },
    "certaintyWords": {
      "frequency": number,
      "overuse": boolean,
      "deceptionIndicator": boolean
    }
  },
  "deceptionPatterns": [
    {
      "pattern": "string",
      "category": "pronoun_shift|cognitive_complexity|sensory_deficit|negation_excess|vagueness|overconfidence|temporal_inconsistency|detail_poverty",
      "instances": number,
      "examples": ["string"],
      "severity": 1-10,
      "confidence": 0-1
    }
  ],
  "sentenceAnalysis": {
    "averageComplexity": number,
    "complexityVariation": number,
    "passiveVoiceRatio": number,
    "anomalies": ["string"]
  },
  "temporalConsistency": {
    "score": 0-100,
    "inconsistencies": ["string"],
    "timelineGaps": ["string"]
  },
  "emotionalProfile": {
    "positiveEmotion": number,
    "negativeEmotion": number,
    "emotionalLeakage": ["string"],
    "incongruentEmotions": ["string"]
  },
  "detailAnalysis": {
    "detailRichness": 1-10,
    "detailConsistency": 1-10,
    "suspiciouslyVagueAreas": ["string"],
    "suspiciouslyDetailedAreas": ["string"]
  },
  "truthfulIndicators": ["string"],
  "deceptiveIndicators": ["string"],
  "topicsByDeceptionRisk": [
    {
      "topic": "string",
      "deceptionRisk": "high|medium|low",
      "evidence": ["string"]
    }
  ],
  "baselineComparison": {
    "deviationFromBaseline": number,
    "significantChanges": ["string"]
  },
  "recommendations": [
    {
      "type": "verification_question|topic_probe|behavioral_observation",
      "recommendation": "string",
      "targetedPattern": "string"
    }
  ]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: LIWC_ANALYSIS_PROMPT },
          { role: 'user', content: JSON.stringify({ texts: textsToAnalyze, analysisType }) }
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e: any) {
      analysis = { raw: content, parseError: true };
    }

    // Store linguistic analysis
    await supabase.from('ai_analyses').insert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'linguistic_deception_analysis',
      result: analysis,
      generated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      samplesAnalyzed: textsToAnalyze.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Linguistic deception analyzer error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
