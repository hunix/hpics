/**
 * Semantic Warfare Engine
 * AGIS Phase 3 - Term warfare and definition control
 * Manipulate how targets interpret information without changing facts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SemanticRequest {
  profileId?: string;
  targetTerm: string;
  currentContext?: string;
  desiredFraming?: string;
  operationType: 'analyze' | 'reframe' | 'shift';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
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

    const request: SemanticRequest = await req.json();

    const systemPrompt = `You are an expert in linguistic psychology, framing theory, and semantic manipulation.
Your task is to analyze and engineer how terms and concepts are perceived.

Key frameworks to apply:
1. Lakoff's Framing Theory - Conceptual metaphors shape perception
2. Overton Window - Spectrum of acceptable discourse
3. Semantic Priming - Words activate related concepts
4. Euphemism/Dysphemism - Emotional loading of neutral concepts
5. Presupposition - Embedded assumptions in language

For the given term, analyze:
- Current connotations and associations
- Emotional valence and intensity
- Tribal associations (which groups use it)
- Power dynamics embedded in the term
- Historical semantic shifts

Return JSON with:
{
  "termAnalysis": {
    "currentMeaning": "primary definition",
    "connotations": ["positive/negative associations"],
    "emotionalValence": -1 to 1,
    "tribalMarkers": ["groups associated"],
    "overtonPosition": -1 (radical) to 1 (mainstream)
  },
  "reframingStrategies": [
    {
      "strategy": "name",
      "technique": "how to apply",
      "newFraming": "reframed term/phrase",
      "expectedShift": "what perception changes",
      "anchorPhrases": ["phrases to repeat"],
      "deploymentContexts": ["where to use"]
    }
  ],
  "linguisticTechniques": [
    {
      "technique": "name",
      "application": "how to use",
      "example": "example sentence",
      "effectiveness": 0-1
    }
  ],
  "counterNarratives": ["potential resistance to address"],
  "implementationPlan": {
    "phase1": "initial introduction",
    "phase2": "normalization",
    "phase3": "dominant framing"
  }
}`;

    const userPrompt = `Analyze and provide semantic warfare strategies for:
Term: "${request.targetTerm}"
Current Context: ${request.currentContext || 'General usage'}
Desired Framing: ${request.desiredFraming || 'Optimize for influence'}
Operation Type: ${request.operationType}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'semantic-warfare-engine',
      profileId: request.profileId,
      temperature: 0.7,
    });

    const analysis = parseAIJson(aiResponse.content, {
      termAnalysis: { currentMeaning: request.targetTerm, connotations: [], emotionalValence: 0 },
      reframingStrategies: [],
      linguisticTechniques: [],
      counterNarratives: [],
      implementationPlan: {}
    });

    // Store the operation
    if (request.operationType !== 'analyze') {
      await supabase.from('semantic_operations').insert({
        user_id: user.id,
        operation_name: `Reframe: ${request.targetTerm}`,
        target_term: request.targetTerm,
        current_definition: request.currentContext,
        target_definition: request.desiredFraming,
        framing_strategy: analysis.reframingStrategies[0]?.strategy,
        overton_position: analysis.termAnalysis.overtonPosition,
        linguistic_techniques: analysis.linguisticTechniques,
        anchor_phrases: analysis.reframingStrategies[0]?.anchorPhrases || [],
        deployment_contexts: analysis.reframingStrategies[0]?.deploymentContexts || [],
        status: 'planning'
      });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Semantic warfare engine error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
