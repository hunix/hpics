/**
 * Gottman Relationship Analyzer
 * AGIS Phase 3 - Four Horsemen detection for relationship dissolution prediction
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GottmanRequest {
  profileId: string;
  conversationSamples?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: GottmanRequest = await req.json();

    // Get message history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('profile_id', request.profileId)
      .order('created_at', { ascending: false })
      .limit(300);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.profileId)
      .single();

    const systemPrompt = `You are an expert in Dr. John Gottman's research on relationship stability and the "Four Horsemen of the Apocalypse" - communication patterns that predict relationship dissolution with 93% accuracy.

THE FOUR HORSEMEN:

1. CRITICISM
- Attacking character/personality rather than specific behavior
- "You always..." "You never..." statements
- Global, character-based complaints vs specific behavioral complaints
- Different from legitimate complaints about behavior

2. CONTEMPT
- Most destructive horseman - strongest predictor of divorce
- Communicating disgust, disrespect, superiority
- Eye-rolling, sneering, mockery, sarcasm
- Name-calling, hostile humor
- Treating partner as inferior

3. DEFENSIVENESS
- Counter-attacking when criticized
- Playing the victim
- Making excuses
- Cross-complaining (responding to complaint with complaint)
- "Yes-but" responses
- Refusing to accept responsibility

4. STONEWALLING
- Emotional withdrawal
- Shutting down conversation
- Silent treatment
- Disengaging, looking away
- Usually response to flooding (emotional overwhelm)

ANTIDOTES (positive counterparts):
- Criticism → Gentle start-up, "I" statements
- Contempt → Build culture of appreciation
- Defensiveness → Accept responsibility
- Stonewalling → Self-soothing, take breaks

Analyze the communication patterns for presence of each horseman.

Return JSON:
{
  "horsemenAnalysis": {
    "criticism": {
      "presenceScore": 0-1,
      "frequency": "rare/occasional/frequent/pervasive",
      "examples": ["specific examples from messages"],
      "patterns": ["recurring criticism themes"],
      "targetAreas": ["what they criticize most"],
      "escalationTrend": "increasing/stable/decreasing"
    },
    "contempt": {
      "presenceScore": 0-1,
      "frequency": "rare/occasional/frequent/pervasive",
      "examples": ["specific examples"],
      "manifestations": ["eye-rolling", "sarcasm", "mockery"],
      "superiorityThemes": ["areas of superiority signaling"],
      "escalationTrend": "increasing/stable/decreasing"
    },
    "defensiveness": {
      "presenceScore": 0-1,
      "frequency": "rare/occasional/frequent/pervasive",
      "examples": ["specific examples"],
      "defensePatterns": ["excuse-making", "counter-attack", "victim-playing"],
      "triggerTopics": ["what triggers defensiveness"],
      "escalationTrend": "increasing/stable/decreasing"
    },
    "stonewalling": {
      "presenceScore": 0-1,
      "frequency": "rare/occasional/frequent/pervasive",
      "examples": ["specific examples"],
      "withdrawalPatterns": ["how they disengage"],
      "floodingIndicators": ["signs of emotional overwhelm"],
      "escalationTrend": "increasing/stable/decreasing"
    }
  },
  "overallAssessment": {
    "relationshipHealthScore": 0-1,
    "dissolutionRisk": 0-1,
    "dominantHorseman": "which is most present",
    "interactionPattern": "negative/neutral/positive ratio",
    "repairAttemptSuccess": 0-1,
    "bidsForConnectionResponse": "turning toward/away/against"
  },
  "positiveIndicators": {
    "appreciationExpressed": "frequency",
    "gentleStartups": "frequency",
    "responsibilityTaking": "frequency",
    "emotionalBidAcceptance": "frequency",
    "repairAttempts": ["examples of repair"]
  },
  "intervention": {
    "urgencyLevel": "low/medium/high/critical",
    "priorityAreas": ["what to address first"],
    "specificRecommendations": ["actionable steps"],
    "conversationStarters": ["healing conversation openers"],
    "boundaryRecommendations": ["what limits to set"]
  },
  "trajectory": {
    "shortTermOutlook": "next 1-3 months",
    "longTermOutlook": "6-12 months",
    "turningPointIndicators": ["what would change trajectory"],
    "criticalMoments": ["upcoming high-risk situations"]
  }
}`;

    const userPrompt = `Analyze relationship for Gottman's Four Horsemen:

Relationship with: ${profile?.full_name || 'Unknown'}
Relationship Type: ${profile?.relationship_type || 'Unknown'}

Recent Communications (${messages?.length || 0} messages):
${messages?.slice(0, 50).map(m => `[${m.direction}] ${m.content}`).join('\n\n') || 'No messages available'}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'gottman-relationship-analyzer',
      profileId: request.profileId,
      temperature: 0.5,
    });

    const analysis = parseAIJson(aiResponse.content, {
      horsemenAnalysis: {
        criticism: { presenceScore: 0.2 },
        contempt: { presenceScore: 0.1 },
        defensiveness: { presenceScore: 0.2 },
        stonewalling: { presenceScore: 0.1 }
      },
      overallAssessment: { relationshipHealthScore: 0.7, dissolutionRisk: 0.3 },
      positiveIndicators: {},
      intervention: { urgencyLevel: 'low' },
      trajectory: {}
    });

    // Store or update betrayal prediction with Gottman data
    await supabase.from('betrayal_predictions').upsert({
      user_id: user.id,
      profile_id: request.profileId,
      gottman_horsemen: analysis.horsemenAnalysis,
      relationship_stress_score: 1 - analysis.overallAssessment.relationshipHealthScore,
      defection_probability: analysis.overallAssessment.dissolutionRisk,
      warning_signs: [
        analysis.horsemenAnalysis.criticism.presenceScore > 0.5 ? 'High criticism' : null,
        analysis.horsemenAnalysis.contempt.presenceScore > 0.3 ? 'Contempt detected' : null,
        analysis.horsemenAnalysis.defensiveness.presenceScore > 0.5 ? 'High defensiveness' : null,
        analysis.horsemenAnalysis.stonewalling.presenceScore > 0.4 ? 'Stonewalling present' : null
      ].filter(Boolean),
      risk_mitigation: analysis.intervention.specificRecommendations
    }, { onConflict: 'profile_id' });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Gottman analyzer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
