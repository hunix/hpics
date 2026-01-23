/**
 * Sacred Values Mapper
 * AGIS Phase 3 - Identify non-negotiable beliefs for tribal activation or exploitation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SacredValuesRequest {
  profileId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'sacred-values-mapper', timestamp: Date.now() }), {
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

    // Gather data
    // NOTE: messages table has no profile_id column - must join via conversations
    const [profile, messages, observations] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('messages').select('*, conversations!inner(profile_id)').eq('conversations.profile_id', profileId).order('created_at', { ascending: false }).limit(200),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).limit(50)
    ]);

    const systemPrompt = `You are an expert in moral psychology, sacred values research, and tribal dynamics.

Sacred values are beliefs that people refuse to trade off for material benefit. They:
- Resist cost-benefit analysis
- Trigger moral outrage when violated
- Form the core of identity
- Define tribal boundaries
- Activate emotional rather than rational processing

Domains to analyze:
1. Political/Ideological (left/right, libertarian/authoritarian)
2. Religious/Spiritual (faith, practices, afterlife beliefs)
3. Family/Kinship (roles, obligations, traditions)
4. Professional/Career (work ethic, integrity, expertise)
5. Cultural/National (heritage, customs, loyalty)
6. Environmental (nature, sustainability, animals)
7. Economic (capitalism, socialism, fairness)
8. Social (equality, hierarchy, in-group loyalty)

For each identified sacred value, determine:
- How central it is to their identity
- What triggers defensive reactions
- How it can be leveraged for influence
- What violations would destroy the relationship

Return JSON:
{
  "sacredValuesProfile": {
    "identifiedValues": [
      {
        "valueDomain": "domain",
        "valueName": "specific value",
        "protectionLevel": 0-1,
        "emotionalIntensity": 0-1,
        "identityCentrality": 0-1,
        "tribalAssociations": ["groups who share this"],
        "violationTriggers": ["what triggers outrage"],
        "defensiveReactions": ["how they react to threats"],
        "exploitationVectors": ["how to leverage"],
        "tabooTradeoffs": ["what they'd never trade for"]
      }
    ],
    "valueHierarchy": ["most sacred to least"],
    "tribalIdentity": {
      "primaryTribe": "main group identity",
      "inGroupMarkers": ["how they signal membership"],
      "outGroupEnemies": ["who they oppose"],
      "tribalNarratives": ["stories that bind them"]
    }
  },
  "influenceStrategies": {
    "alignmentOpportunities": ["values you share"],
    "activationTriggers": ["how to activate their values"],
    "sacredRhetoric": ["language that resonates"],
    "tabooTopics": ["what to never say"],
    "coalitionBuilding": ["how to join their tribe"]
  },
  "riskAssessment": {
    "valueConflicts": ["where your values clash"],
    "dealbreakers": ["what would end the relationship"],
    "moralOutrageRisk": 0-1,
    "mitigationStrategies": ["how to avoid triggers"]
  }
}`;

    const userPrompt = `Map sacred values and tribal identity:

Contact: ${profile.data ? `${profile.data.first_name || ''} ${profile.data.last_name || ''}`.trim() || 'Unknown' : 'Unknown'}
Background: ${profile.data?.notes || 'Unknown'}

Communications (${messages.data?.length || 0}):
${messages.data?.slice(0, 40).map(m => m.content?.substring(0, 200)).join('\n') || 'No messages'}

Observations (${observations.data?.length || 0}):
${observations.data?.map(o => `${o.category}: ${o.observation}`).join('\n') || 'No observations'}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId,
      functionName: 'sacred-values-mapper',
      profileId,
      temperature: 0.6,
    });

    interface SacredValue {
      valueDomain: string;
      valueName: string;
      protectionLevel: number;
      emotionalIntensity: number;
      tribalAssociations: string[];
      identityCentrality: number;
      violationTriggers: string[];
      exploitationVectors: string[];
      defensiveReactions: string[];
    }

    const mapping = parseAIJson(aiResponse.content, {
      sacredValuesProfile: { identifiedValues: [] as SacredValue[], tribalIdentity: {} },
      influenceStrategies: {},
      riskAssessment: { moralOutrageRisk: 0.3 }
    });

    // Store each identified sacred value
    const identifiedValues = (mapping.sacredValuesProfile?.identifiedValues || []) as SacredValue[];
    for (const value of identifiedValues) {
      await supabase.from('sacred_values').insert({
        user_id: userId,
        profile_id: profileId,
        value_domain: value.valueDomain,
        value_name: value.valueName,
        protection_level: value.protectionLevel,
        emotional_intensity: value.emotionalIntensity,
        tribal_associations: value.tribalAssociations,
        identity_centrality: value.identityCentrality,
        violation_triggers: value.violationTriggers,
        exploitation_vectors: value.exploitationVectors,
        defensive_reactions: value.defensiveReactions
      });
    }

    // Also persist to ai_analyses for section availability detection
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'sacred_values',
      result: mapping,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      mapping,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sacred values mapper error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
