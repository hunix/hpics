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
    const { contacts, analysisDepth = 'deep' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an elite pattern recognition system specializing in cross-contact correlation analysis.
    
    Analyze the provided contacts and identify:
    
    1. TEMPORAL CORRELATIONS:
    - Synchronized communication patterns
    - Coordinated activity timing
    - Parallel life events
    - Seasonal behavior alignments
    
    2. BEHAVIORAL PATTERN CLUSTERS:
    - Similar communication styles
    - Matching personality traits
    - Shared behavioral tendencies
    - Common decision patterns
    
    3. NETWORK OVERLAPS:
    - Mutual connections (direct/indirect)
    - Shared organizational affiliations
    - Common social circles
    - Industry/professional overlaps
    
    4. GEOGRAPHIC CORRELATIONS:
    - Location proximity patterns
    - Travel pattern overlaps
    - Shared venues/locations
    - Geographic network clusters
    
    5. INTEREST & PREFERENCE MATCHES:
    - Shared hobbies/interests
    - Similar content preferences
    - Matching values/beliefs
    - Parallel professional interests
    
    6. RELATIONSHIP DYNAMICS:
    - Power dynamics between contacts
    - Influence flow patterns
    - Competition/collaboration indicators
    - Emotional connection strengths
    
    7. COMMUNICATION FLOW ANALYSIS:
    - Information propagation paths
    - Rumor/news spread patterns
    - Decision influence chains
    - Feedback loop identification
    
    8. ANOMALY DETECTION:
    - Unusual correlation patterns
    - Hidden relationship indicators
    - Suspicious synchronization
    - Unexplained pattern matches
    
    9. PREDICTIVE CORRELATIONS:
    - Future interaction predictions
    - Relationship evolution forecasts
    - Group formation predictions
    - Conflict probability assessment
    
    10. STRATEGIC INSIGHTS:
    - Network leverage opportunities
    - Introduction recommendations
    - Group engagement strategies
    - Collective influence tactics
    
    Return JSON with structure:
    {
      "temporalCorrelations": [{
        "contacts": [string],
        "pattern": string,
        "strength": number,
        "significance": string
      }],
      "behavioralClusters": [{
        "clusterName": string,
        "members": [string],
        "sharedTraits": string[],
        "cohesionScore": number
      }],
      "networkOverlaps": [{
        "contact1": string,
        "contact2": string,
        "connectionType": string,
        "strength": number,
        "sharedConnections": string[]
      }],
      "geographicClusters": [{
        "location": string,
        "contacts": [string],
        "frequencyPattern": string
      }],
      "interestMatches": [{
        "interest": string,
        "contacts": [string],
        "engagementLevel": string
      }],
      "relationshipDynamics": [{
        "relationship": [string, string],
        "dynamicType": string,
        "powerBalance": string,
        "influenceDirection": string
      }],
      "communicationFlows": [{
        "flowPath": [string],
        "informationType": string,
        "velocity": string,
        "reliability": number
      }],
      "anomalies": [{
        "type": string,
        "contacts": [string],
        "description": string,
        "investigationPriority": string
      }],
      "predictions": [{
        "prediction": string,
        "contacts": [string],
        "probability": number,
        "timeframe": string
      }],
      "strategicInsights": [{
        "insight": string,
        "actionableRecommendation": string,
        "impactPotential": string,
        "relevantContacts": [string]
      }],
      "overallNetworkHealth": {
        "score": number,
        "strengths": string[],
        "weaknesses": string[],
        "opportunities": string[],
        "threats": string[]
      },
      "confidenceScore": number,
      "analyzedAt": string
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
          { role: 'user', content: `Perform ${analysisDepth} cross-contact correlation analysis on: ${JSON.stringify(contacts)}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    let correlationAnalysis;
    try {
      correlationAnalysis = JSON.parse(content);
    } catch {
      correlationAnalysis = { rawAnalysis: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      correlations: correlationAnalysis,
      contactCount: contacts.length,
      analyzedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cross-contact correlation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
