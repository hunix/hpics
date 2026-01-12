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
    const { profileData, searchDepth = 'comprehensive' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an elite OSINT analyst specializing in deep open-source intelligence gathering.
    
    Analyze the provided profile and generate comprehensive OSINT findings including:
    
    1. DIGITAL FOOTPRINT ANALYSIS:
    - Social media presence mapping (platforms, usernames, activity levels)
    - Digital identity consistency check
    - Online reputation assessment
    - Content publishing patterns
    - Forum/community participation
    
    2. PROFESSIONAL INTELLIGENCE:
    - Career trajectory mapping
    - Professional network analysis
    - Company affiliations and roles
    - Industry influence assessment
    - Patent/publication search results
    - Conference/speaking engagement history
    
    3. PUBLIC RECORDS INTELLIGENCE:
    - Corporate registry findings
    - Business ownership records
    - Professional licenses
    - Domain registrations
    - Trademark/patent holdings
    
    4. MEDIA & NEWS INTELLIGENCE:
    - News mention aggregation
    - Press release appearances
    - Interview/quote compilation
    - Controversy/scandal detection
    - Public statement analysis
    
    5. ACADEMIC/INTELLECTUAL PROFILE:
    - Educational background verification
    - Academic publication tracking
    - Research contributions
    - Intellectual property assessment
    - Expertise domain mapping
    
    6. SOCIAL GRAPH INTELLIGENCE:
    - Key connection identification
    - Influence network mapping
    - Group/organization memberships
    - Event attendance patterns
    - Co-occurrence analysis
    
    7. FINANCIAL INTELLIGENCE INDICATORS:
    - Wealth indicator analysis
    - Lifestyle/spending pattern inference
    - Asset ownership signals
    - Investment pattern indicators
    - Financial stress/success markers
    
    8. LOCATION INTELLIGENCE:
    - Residence history
    - Frequent location patterns
    - Travel patterns
    - Geographic network distribution
    - Timezone/activity patterns
    
    9. BEHAVIORAL OSINT:
    - Communication style patterns
    - Response time patterns
    - Content preference analysis
    - Engagement behavior patterns
    - Online activity schedules
    
    10. RISK & OPPORTUNITY ASSESSMENT:
    - Vulnerability indicators
    - Leverage points identification
    - Approach opportunities
    - Red flag detection
    - Trust/credibility scoring
    
    Return JSON with structure:
    {
      "digitalFootprint": {
        "platforms": [{ "name": string, "username": string, "activityLevel": string, "followerCount": number, "contentFocus": string[] }],
        "identityConsistency": { "score": number, "discrepancies": string[] },
        "onlineReputation": { "score": number, "positiveSignals": string[], "negativeSignals": string[] },
        "publishingPatterns": { "frequency": string, "preferredTimes": string[], "contentTypes": string[] }
      },
      "professionalIntelligence": {
        "careerTrajectory": { "current": string, "trajectory": string, "milestones": string[] },
        "industryInfluence": { "score": number, "domains": string[], "evidence": string[] },
        "intellectualProperty": { "patents": number, "publications": number, "domains": string[] }
      },
      "publicRecords": {
        "businessOwnerships": [{ "entity": string, "role": string, "status": string }],
        "licenses": string[],
        "domains": string[],
        "trademarks": string[]
      },
      "mediaIntelligence": {
        "newsMentions": [{ "source": string, "date": string, "sentiment": string, "summary": string }],
        "controversies": [{ "topic": string, "severity": string, "status": string }],
        "publicStatements": string[]
      },
      "academicProfile": {
        "education": [{ "institution": string, "degree": string, "field": string, "year": string }],
        "publications": number,
        "citations": number,
        "expertiseDomains": string[]
      },
      "socialGraph": {
        "keyConnections": [{ "name": string, "relationship": string, "influence": string }],
        "organizations": string[],
        "influenceScore": number
      },
      "financialIndicators": {
        "wealthTier": string,
        "incomeEstimate": string,
        "assetSignals": string[],
        "financialHealth": string,
        "investmentPatterns": string[]
      },
      "locationIntelligence": {
        "primaryLocation": string,
        "frequentLocations": string[],
        "travelPatterns": string[],
        "timezone": string
      },
      "behavioralOsint": {
        "communicationStyle": string,
        "responsePatterns": string,
        "activitySchedule": string[],
        "preferredChannels": string[]
      },
      "riskAssessment": {
        "overallRisk": string,
        "vulnerabilities": [{ "type": string, "severity": string, "exploitability": string }],
        "leveragePoints": string[],
        "redFlags": string[],
        "trustScore": number
      },
      "opportunities": {
        "approachVectors": string[],
        "commonGround": string[],
        "optimalTiming": string,
        "recommendations": string[]
      },
      "confidenceScore": number,
      "dataFreshness": string,
      "sourcesUsed": string[]
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
          { role: 'user', content: `Perform ${searchDepth} OSINT analysis on: ${JSON.stringify(profileData)}` }
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
    
    let osintAnalysis;
    try {
      osintAnalysis = JSON.parse(content);
    } catch {
      osintAnalysis = { rawAnalysis: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: osintAnalysis,
      searchDepth,
      analyzedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Deep OSINT scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
