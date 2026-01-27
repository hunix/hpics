/**
 * Elicitation Engine
 * AGIS Phase 3 - Conversational intelligence extraction using FBI techniques
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 24 FBI Elicitation Techniques
const ELICITATION_TECHNIQUES = [
  'Flattery', 'False Statements', 'Artificial Ignorance', 'Deliberate Provocation',
  'Quote Reported Facts', 'Criticism', 'Word Repetition', 'Confidential Bait',
  'Quid Pro Quo', 'Bracketing', 'Oblique Reference', 'Mutual Interest',
  'Good Listener', 'Presumptive Statement', 'Naiveté', 'Expression of Skepticism',
  'Leading Questions', 'Denial of the Obvious', 'Exploiting Ego', 'Macro-Micro',
  'Feigned Disbelief', 'Volunteering Information', 'The Survey', 'Complaining'
];

interface ElicitationRequest {
  profileId: string;
  targetInformation: string[];
  context?: string;
  conversationHistory?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'elicitation-engine', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    const token = authHeader?.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;
    
    // Normalize parameter names
    const profileId = body.profileId || body.profile_id;
    const targetInformation = body.targetInformation || body.target_information || ['general information'];
    const context = body.context || 'Casual conversation';
    const conversationHistory = body.conversationHistory || body.conversation_history || [];
    let userId: string;
    
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser(token!);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    const request = { profileId, targetInformation, context, conversationHistory };

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.profileId)
      .single();

    const systemPrompt = `You are an expert in conversational intelligence and elicitation techniques.
Your task is to design natural conversation strategies to extract specific information.

The 24 FBI Elicitation Techniques:
${ELICITATION_TECHNIQUES.map((t, i) => `${i + 1}. ${t}`).join('\n')}

For each target piece of information, design:
1. Multiple elicitation approaches using different techniques
2. Natural conversation openers
3. Follow-up questions based on likely responses
4. Red flags that indicate the target is suspicious
5. Pivot strategies if direct approach fails

Guidelines:
- Never ask directly - always indirect
- Build rapport before eliciting
- Use the target's interests as entry points
- Match their communication style
- Know when to back off

Return JSON:
{
  "elicitationPlan": {
    "rapportBuilding": {
      "commonGround": ["shared interests"],
      "conversationOpeners": ["opener1", "opener2"],
      "warmupTopics": ["safe topics to discuss first"]
    },
    "targetedElicitations": [
      {
        "targetInformation": "what we want to learn",
        "primaryTechnique": "technique name",
        "scriptedApproach": "exact words to use",
        "naturalContext": "how to bring it up naturally",
        "followUpQuestions": ["if they say X, ask Y"],
        "pivotStrategies": ["if blocked, try this"],
        "successIndicators": ["how to know we got it"],
        "riskLevel": "low/medium/high"
      }
    ],
    "conversationFlow": {
      "idealSequence": ["topic1", "topic2", "target topic"],
      "timeEstimate": "how long conversation should last",
      "settingSuggestion": "where to have conversation"
    },
    "counterMeasures": {
      "suspicionIndicators": ["signs they're onto you"],
      "backoffTriggers": ["when to stop"],
      "coverStories": ["explanations if confronted"]
    }
  },
  "sessionNotes": {
    "riskAssessment": "overall risk of detection",
    "successProbability": 0-1,
    "alternativeApproaches": ["other ways to get info"]
  }
}`;

    const userPrompt = `Design elicitation strategies for:
Target: ${profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown'}
Context: ${request.context || 'Casual conversation'}

Target Information to Extract:
${request.targetInformation.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

${request.conversationHistory ? `Previous Conversation:\n${request.conversationHistory.join('\n')}` : ''}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId,
      functionName: 'elicitation-engine',
      profileId,
      temperature: 0.7,
    });

    const plan = parseAIJson(aiResponse.content, {
      elicitationPlan: { rapportBuilding: {}, targetedElicitations: [] },
      sessionNotes: { successProbability: 0.5 }
    });

    // Store the session
    await supabase.from('elicitation_sessions').insert({
      user_id: userId,
      profile_id: profileId,
      session_type: 'intelligence_extraction',
      techniques_used: plan.elicitationPlan.targetedElicitations.map((t: any) => t.primaryTechnique),
      target_information: targetInformation,
      follow_up_questions: plan.elicitationPlan.targetedElicitations.flatMap((t: any) => t.followUpQuestions || []),
      conversation_notes: context
    });

    // Also persist to ai_analyses for section availability detection
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'elicitation_guide',
      result: plan,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      plan,
      availableTechniques: ELICITATION_TECHNIQUES,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Elicitation engine error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
