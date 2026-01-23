import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignExecutionRequest {
  userId: string;
  campaignId: string;
  action?: 'execute' | 'evaluate' | 'escalate';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'autonomous-campaign-executor', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, campaignId, action = 'execute' } = await req.json() as CampaignExecutionRequest;

    // Fetch campaign details
    const { data: campaign } = await supabase
      .from('autonomous_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();

    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent executions for context
    const { data: recentExecutions } = await supabase
      .from('agent_executions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('executed_at', { ascending: false })
      .limit(10);

    const EXECUTOR_PROMPT = `You are an autonomous campaign execution engine. Analyze the campaign and determine the next optimal action.

Campaign: ${JSON.stringify(campaign)}
Recent Executions: ${JSON.stringify(recentExecutions || [])}
Action Type: ${action}

Provide execution decision in JSON format:
{
  "shouldExecute": boolean,
  "actionType": "message|nudge|intervention|escalation|wait",
  "actionDetails": {
    "description": "string",
    "targetProfileId": "string or null",
    "timing": "immediate|scheduled|conditional",
    "scheduledFor": "ISO timestamp or null",
    "content": "action content or template",
    "escalationLevel": 1-5
  },
  "reasoning": "string",
  "predictedOutcome": {
    "successProbability": 0-1,
    "expectedImpact": "string",
    "risks": ["string"]
  },
  "nextEvaluationAt": "ISO timestamp"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: EXECUTOR_PROMPT },
          { role: 'user', content: `Execute ${action} for campaign: ${campaign.campaign_name}` }
        ],
        temperature: 0.3,
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
    
    let decision;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      decision = { raw: content, parseError: true };
    }

    // Log execution
    await supabase.from('agent_executions').insert({
      user_id: userId,
      campaign_id: campaignId,
      agent_type: 'autonomous_executor',
      action_taken: decision.actionType || action,
      action_params: decision.actionDetails,
      trigger_reason: decision.reasoning,
      outcome: decision.shouldExecute ? 'pending' : 'skipped',
      executed_at: new Date().toISOString()
    });

    // Update campaign status
    await supabase
      .from('autonomous_campaigns')
      .update({
        last_action_at: new Date().toISOString(),
        actions_today: (campaign.actions_today || 0) + 1,
        next_action_at: decision.nextEvaluationAt
      })
      .eq('id', campaignId);

    return new Response(JSON.stringify({
      success: true,
      decision,
      campaignId,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Campaign executor error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
