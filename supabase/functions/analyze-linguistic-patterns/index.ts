import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// LIWC-inspired categories for linguistic analysis
const LIWC_CATEGORIES = {
  // First person pronouns (deception: liars use fewer I/me)
  firstPersonSingular: ['i', 'me', 'my', 'mine', 'myself'],
  firstPersonPlural: ['we', 'us', 'our', 'ours', 'ourselves'],
  
  // Exclusive words (truth: authentic accounts have more)
  exclusiveWords: ['but', 'except', 'without', 'exclude', 'although', 'however', 'nevertheless'],
  
  // Cognitive process words (truth: more cognitive complexity)
  cognitiveProcess: ['think', 'know', 'consider', 'understand', 'realize', 'believe', 'thought', 'remember', 'forget'],
  
  // Sensory words (truth: more sensory details)
  sensoryWords: ['see', 'saw', 'hear', 'heard', 'feel', 'felt', 'smell', 'taste', 'touch', 'sound', 'look'],
  
  // Temporal references (truth: more temporal markers)
  temporalWords: ['then', 'next', 'after', 'before', 'during', 'while', 'when', 'until', 'meanwhile'],
  
  // Certainty markers (deception: less certainty OR over-certainty)
  certaintyMarkers: ['definitely', 'certainly', 'always', 'never', 'absolutely', 'totally', 'surely'],
  
  // Hedging markers (potential deception when excessive)
  hedgingMarkers: ['maybe', 'perhaps', 'possibly', 'might', 'could', 'kind of', 'sort of', 'somewhat'],
  
  // Negation (deception: more negations)
  negations: ['no', 'not', 'never', "don't", "didn't", "won't", "can't", "couldn't", "wouldn't"],
  
  // Self-distancing (deception: less engagement)
  selfDistancing: ['that', 'it', 'they', 'them', 'those', 'one'],
  
  // Emotional words
  positiveEmotion: ['happy', 'love', 'great', 'good', 'best', 'wonderful', 'amazing', 'glad', 'excited'],
  negativeEmotion: ['hate', 'bad', 'terrible', 'awful', 'sad', 'angry', 'worried', 'upset', 'frustrated'],
};

interface LinguisticAnalysis {
  firstPersonSingularRate: number;
  firstPersonPluralRate: number;
  exclusiveWordsRate: number;
  cognitiveProcessRate: number;
  sensoryWordsRate: number;
  temporalReferencesRate: number;
  certaintyMarkerRate: number;
  hedgingMarkerRate: number;
  negationRate: number;
  selfDistancingRate: number;
  positiveEmotionRate: number;
  negativeEmotionRate: number;
  authenticityScore: number;
  wordCount: number;
  avgSentenceLength: number;
  vocabularySophistication: number;
  formalityScore: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile_id, text, source_type = 'message', source_id } = await req.json();

    if (!text || text.trim().length < 20) {
      return new Response(JSON.stringify({ error: 'Text too short for analysis (min 20 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing linguistic patterns for ${text.length} chars`);

    // Perform local linguistic analysis first
    const localAnalysis = analyzeTextLocal(text);

    // For deep analysis, use AI to detect patterns human analysis might miss
    let aiEnhancements = null;
    if (LOVABLE_API_KEY && text.length > 100) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `You are a forensic linguist specializing in deception detection and text analysis.
Analyze the text for:
1. Story consistency and coherence
2. Emotional authenticity vs performance
3. Specificity level (vague vs detailed)
4. Tense consistency
5. Narrative structure (beginning, middle, end)
6. Self-reference patterns
7. Topic avoidance signals

Return JSON only:
{
  "storyCoherence": 0-100,
  "emotionalAuthenticity": 0-100,
  "specificityLevel": 0-100,
  "tenseConsistency": 0-100,
  "narrativeCompleteness": 0-100,
  "deceptionIndicators": ["indicator1", ...],
  "authenticityIndicators": ["indicator1", ...],
  "topicSensitivities": ["topic1", ...],
  "writingStyleProfile": {
    "formality": "formal|informal|mixed",
    "emotionalTone": "positive|negative|neutral|mixed",
    "complexity": "simple|moderate|complex"
  },
  "overallAuthenticityScore": 0-100,
  "confidence": 0-100,
  "keyObservations": ["observation1", ...]
}`
              },
              {
                role: 'user',
                content: `Analyze this text:\n\n"${text.slice(0, 3000)}"`
              }
            ],
            temperature: 0.2,
            max_tokens: 2000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiEnhancements = JSON.parse(jsonMatch[0]);
            }
          } catch {
            console.warn('Failed to parse AI enhancements');
          }
        }
      } catch (e) {
        console.warn('AI enhancement failed:', e);
      }
    }

    // Combine local and AI analysis
    const combinedAuthenticity = aiEnhancements
      ? Math.round((localAnalysis.authenticityScore + aiEnhancements.overallAuthenticityScore) / 2)
      : localAnalysis.authenticityScore;

    const result = {
      ...localAnalysis,
      authenticityScore: combinedAuthenticity,
      aiEnhancements,
      analyzedAt: new Date().toISOString(),
    };

    // Store in database if profile_id provided
    if (profile_id) {
      await supabase.from('ai_analyses').insert({
        profile_id,
        user_id: user.id,
        analysis_type: 'linguistic_patterns',
        result: result,
      });

      // Log AI usage
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        profile_id,
        function_name: 'analyze-linguistic-patterns',
        model_name: aiEnhancements ? 'google/gemini-3-flash-preview' : 'local-liwc',
        provider: aiEnhancements ? 'lovable' : 'local',
        estimated_cost_cents: aiEnhancements ? 1 : 0,
        status: 'completed',
        input_tokens: Math.round(text.length / 4),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Linguistic analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeTextLocal(text: string): LinguisticAnalysis {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  if (wordCount === 0) {
    return createEmptyAnalysis();
  }

  // Calculate rates for each category
  const countMatches = (category: string[]): number => {
    return words.filter(w => category.some(c => w.includes(c))).length;
  };

  const rates = {
    firstPersonSingularRate: (countMatches(LIWC_CATEGORIES.firstPersonSingular) / wordCount) * 100,
    firstPersonPluralRate: (countMatches(LIWC_CATEGORIES.firstPersonPlural) / wordCount) * 100,
    exclusiveWordsRate: (countMatches(LIWC_CATEGORIES.exclusiveWords) / wordCount) * 100,
    cognitiveProcessRate: (countMatches(LIWC_CATEGORIES.cognitiveProcess) / wordCount) * 100,
    sensoryWordsRate: (countMatches(LIWC_CATEGORIES.sensoryWords) / wordCount) * 100,
    temporalReferencesRate: (countMatches(LIWC_CATEGORIES.temporalWords) / wordCount) * 100,
    certaintyMarkerRate: (countMatches(LIWC_CATEGORIES.certaintyMarkers) / wordCount) * 100,
    hedgingMarkerRate: (countMatches(LIWC_CATEGORIES.hedgingMarkers) / wordCount) * 100,
    negationRate: (countMatches(LIWC_CATEGORIES.negations) / wordCount) * 100,
    selfDistancingRate: (countMatches(LIWC_CATEGORIES.selfDistancing) / wordCount) * 100,
    positiveEmotionRate: (countMatches(LIWC_CATEGORIES.positiveEmotion) / wordCount) * 100,
    negativeEmotionRate: (countMatches(LIWC_CATEGORIES.negativeEmotion) / wordCount) * 100,
  };

  // Calculate sentence metrics
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : wordCount;

  // Vocabulary sophistication (unique words / total words)
  const uniqueWords = new Set(words);
  const vocabularySophistication = (uniqueWords.size / wordCount) * 100;

  // Formality score based on various indicators
  const formalIndicators = ['therefore', 'however', 'moreover', 'furthermore', 'consequently'];
  const informalIndicators = ['yeah', 'gonna', 'wanna', 'kinda', 'lol', 'haha'];
  const formalCount = countMatches(formalIndicators);
  const informalCount = countMatches(informalIndicators);
  const formalityScore = 50 + (formalCount - informalCount) * 10;

  // Calculate authenticity score based on research-backed indicators
  // Higher first-person singular, exclusive words, sensory details, cognitive complexity = more authentic
  // Lower negations, higher hedging without context = less authentic
  let authenticityScore = 50;
  
  // First person pronouns (authentic accounts use more "I")
  if (rates.firstPersonSingularRate > 4) authenticityScore += 10;
  else if (rates.firstPersonSingularRate < 1) authenticityScore -= 10;
  
  // Exclusive words (authentic accounts have more)
  if (rates.exclusiveWordsRate > 1) authenticityScore += 8;
  
  // Sensory details (authentic accounts have more)
  if (rates.sensoryWordsRate > 1) authenticityScore += 10;
  
  // Cognitive process (authentic accounts show more thinking)
  if (rates.cognitiveProcessRate > 2) authenticityScore += 7;
  
  // Temporal markers (authentic narratives have timeline)
  if (rates.temporalReferencesRate > 1.5) authenticityScore += 8;
  
  // Excessive hedging (potential deception)
  if (rates.hedgingMarkerRate > 3) authenticityScore -= 12;
  
  // Excessive negation (potential deception)
  if (rates.negationRate > 5) authenticityScore -= 8;
  
  // Self-distancing language (potential deception)
  if (rates.selfDistancingRate > 6 && rates.firstPersonSingularRate < 2) authenticityScore -= 10;

  // Clamp score
  authenticityScore = Math.max(10, Math.min(100, authenticityScore));

  return {
    ...rates,
    authenticityScore,
    wordCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    vocabularySophistication: Math.round(vocabularySophistication * 10) / 10,
    formalityScore: Math.max(0, Math.min(100, formalityScore)),
  };
}

function createEmptyAnalysis(): LinguisticAnalysis {
  return {
    firstPersonSingularRate: 0,
    firstPersonPluralRate: 0,
    exclusiveWordsRate: 0,
    cognitiveProcessRate: 0,
    sensoryWordsRate: 0,
    temporalReferencesRate: 0,
    certaintyMarkerRate: 0,
    hedgingMarkerRate: 0,
    negationRate: 0,
    selfDistancingRate: 0,
    positiveEmotionRate: 0,
    negativeEmotionRate: 0,
    authenticityScore: 50,
    wordCount: 0,
    avgSentenceLength: 0,
    vocabularySophistication: 0,
    formalityScore: 50,
  };
}
