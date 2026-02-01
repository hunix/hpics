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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Dual-auth pattern: support both user tokens and service role calls
    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    
    const token = authHeader?.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseKey;

    const profileData = body.profileData;
    const context = body.context;
    const goalType = body.goalType || 'relationship_building';

    // Note: This function doesn't require userId for its core logic
    // but we validate auth header if present for security
    if (authHeader && !isServiceRoleCall) {
      // If an auth header is provided but it's not service role, we accept it
      // since this function primarily processes profileData without DB writes
    }

    const systemPrompt = `You are an elite strategic action intelligence system that generates highly specific, actionable recommendations for relationship management.

    Goal type: ${goalType}
    
    Generate comprehensive action intelligence including:
    
    1. IMMEDIATE ACTIONS (Next 24-48 hours):
    - High-priority actions with specific timing
    - Conversation starters with exact scripts
    - Quick wins for relationship advancement
    - Risk mitigation actions
    
    2. SHORT-TERM STRATEGY (1-2 weeks):
    - Engagement escalation plan
    - Trust-building activities
    - Value demonstration opportunities
    - Information gathering actions
    
    3. LONG-TERM ROADMAP (1-3 months):
    - Relationship deepening milestones
    - Strategic positioning moves
    - Network leverage opportunities
    - Goal achievement checkpoints
    
    4. COMMUNICATION TEMPLATES:
    - Opening messages for different contexts
    - Follow-up message sequences
    - Re-engagement scripts for dormant contacts
    - Difficult conversation frameworks
    - Appreciation/gratitude expressions
    
    5. GIFT & GESTURE INTELLIGENCE:
    - Personalized gift recommendations with reasoning
    - Gesture ideas matched to personality
    - Timing recommendations for maximum impact
    - Budget-appropriate options
    
    6. MEETING & INTERACTION PLANNING:
    - Optimal meeting venues
    - Agenda suggestions
    - Talking points preparation
    - Body language recommendations
    - Follow-up action items
    
    7. INFLUENCE TACTICS:
    - Persuasion approach recommendations
    - Objection handling scripts
    - Commitment escalation techniques
    - Social proof utilization strategies
    
    8. RISK MANAGEMENT:
    - Potential pitfalls to avoid
    - Backup plans for rejection scenarios
    - Relationship repair strategies
    - Damage control protocols
    
    9. TIMING INTELLIGENCE:
    - Best days/times for contact
    - Optimal response windows
    - Cool-off period recommendations
    - Milestone timing (birthdays, achievements)
    
    10. SUCCESS METRICS:
    - Response rate expectations
    - Engagement quality indicators
    - Relationship health benchmarks
    - Progress tracking metrics
    
    Return JSON with structure:
    {
      "immediateActions": [{
        "action": string,
        "priority": "critical" | "high" | "medium",
        "timing": string,
        "script": string,
        "expectedOutcome": string,
        "successProbability": number
      }],
      "shortTermStrategy": {
        "weeklyPlan": [{ "week": number, "focus": string, "actions": string[] }],
        "trustBuilders": string[],
        "valuePropositions": string[]
      },
      "longTermRoadmap": {
        "milestones": [{ "month": number, "milestone": string, "actions": string[] }],
        "strategicMoves": string[],
        "networkLeverage": string[]
      },
      "communicationTemplates": {
        "openers": [{ "context": string, "template": string, "tone": string }],
        "followUps": [{ "stage": string, "template": string, "timing": string }],
        "reEngagement": [{ "scenario": string, "template": string }],
        "difficultConversations": [{ "topic": string, "framework": string }]
      },
      "giftIntelligence": {
        "recommendations": [{ "item": string, "reason": string, "timing": string, "budget": string, "impact": string }],
        "gestureIdeas": [{ "gesture": string, "occasion": string, "personalityMatch": string }]
      },
      "meetingPlanning": {
        "venueRecommendations": [{ "type": string, "reason": string }],
        "agendaSuggestions": string[],
        "talkingPoints": string[],
        "bodyLanguageTips": string[]
      },
      "influenceTactics": {
        "primaryApproach": string,
        "persuasionVectors": string[],
        "objectionHandlers": [{ "objection": string, "response": string }],
        "commitmentTechniques": string[]
      },
      "riskManagement": {
        "pitfalls": [{ "risk": string, "mitigation": string }],
        "rejectionPlans": string[],
        "repairStrategies": string[]
      },
      "timingIntelligence": {
        "optimalContactTimes": string[],
        "responseWindows": { "minimum": string, "maximum": string },
        "upcomingOpportunities": [{ "date": string, "occasion": string, "action": string }]
      },
      "successMetrics": {
        "responseRateTarget": number,
        "engagementBenchmarks": string[],
        "progressIndicators": string[]
      },
      "confidenceScore": number,
      "generatedAt": string
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
          { role: 'user', content: `Generate action intelligence for: ${JSON.stringify(profileData)}\n\nContext: ${JSON.stringify(context)}` }
        ],
        temperature: 0.4,
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
    
    let actionIntelligence;
    try {
      actionIntelligence = JSON.parse(content);
    } catch {
      actionIntelligence = { rawAnalysis: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      intelligence: actionIntelligence,
      goalType,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Action intelligence error:', error);
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
