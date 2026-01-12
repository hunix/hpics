import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { insights, userContext, preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an intelligence insight prioritization engine. Analyze and rank insights by relevance, actionability, and impact.
    
    Prioritization Criteria:
    
    1. RELEVANCE SCORING:
    - Match to user's current goals
    - Timeliness (time-sensitive insights first)
    - Context appropriateness
    - Historical relevance patterns
    
    2. ACTIONABILITY ASSESSMENT:
    - Clear action path available
    - Resources required
    - Effort/impact ratio
    - Dependency chains
    
    3. IMPACT MAGNITUDE:
    - Potential positive outcomes
    - Risk mitigation value
    - Relationship advancement potential
    - Strategic importance
    
    4. CONFIDENCE WEIGHTING:
    - Data quality behind insight
    - Source reliability
    - Corroboration level
    - Prediction confidence
    
    5. TIME SENSITIVITY:
    - Expiration of opportunity
    - Optimal action window
    - Urgency level
    - Delay cost estimation
    
    6. PERSONALIZATION:
    - User preference alignment
    - Historical engagement patterns
    - Learning from past actions
    - Custom priority rules
    
    Return JSON with structure:
    {
      "prioritizedInsights": [{
        "insightId": string,
        "originalInsight": any,
        "priorityScore": number,
        "priorityRank": number,
        "relevanceScore": number,
        "actionabilityScore": number,
        "impactScore": number,
        "confidenceScore": number,
        "timeSensitivity": {
          "urgency": "immediate" | "today" | "this_week" | "this_month" | "flexible",
          "expiresAt": string | null,
          "optimalWindow": string
        },
        "recommendedAction": string,
        "reasoning": string
      }],
      "categories": {
        "critical": [string],
        "high": [string],
        "medium": [string],
        "low": [string],
        "informational": [string]
      },
      "actionQueue": [{
        "insightId": string,
        "action": string,
        "scheduledFor": string,
        "estimatedDuration": string
      }],
      "suppressedInsights": [{
        "insightId": string,
        "reason": string
      }],
      "personalizationLearnings": {
        "preferredCategories": string[],
        "avoidedCategories": string[],
        "actionPatterns": string[]
      },
      "processingMetrics": {
        "totalInsights": number,
        "prioritizedCount": number,
        "suppressedCount": number,
        "processingTimeMs": number
      }
    }`;

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
          { role: 'user', content: `Prioritize these insights:\n\nInsights: ${JSON.stringify(insights)}\n\nUser Context: ${JSON.stringify(userContext)}\n\nPreferences: ${JSON.stringify(preferences)}` }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    let prioritization;
    try {
      prioritization = JSON.parse(content);
    } catch {
      prioritization = { rawAnalysis: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      prioritization,
      processedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Insight prioritizer error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
