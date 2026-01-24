import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// BITE Model: Behavior, Information, Thought, Emotional Control
interface BITEMetrics {
  behaviorControl: {
    score: number;
    tactics: string[];
    recommendations: string[];
  };
  informationControl: {
    score: number;
    tactics: string[];
    recommendations: string[];
  };
  thoughtControl: {
    score: number;
    tactics: string[];
    recommendations: string[];
  };
  emotionalControl: {
    score: number;
    tactics: string[];
    recommendations: string[];
  };
}

const BEHAVIOR_TACTICS = [
  { name: 'Schedule Regulation', script: 'Structure their time around your availability.' },
  { name: 'Activity Approval', script: 'Subtly require your input on their plans.' },
  { name: 'Social Gatekeeping', script: 'Filter their social interactions through your presence.' },
  { name: 'Ritual Creation', script: 'Establish routines that require your participation.' },
  { name: 'Permission Culture', script: 'Normalize seeking your approval for decisions.' },
];

const INFORMATION_TACTICS = [
  { name: 'Source Discrediting', script: 'Question reliability of information not from you.' },
  { name: 'Interpretation Framing', script: 'Provide the "correct" meaning of external information.' },
  { name: 'Access Limitation', script: 'Reduce exposure to contradicting perspectives.' },
  { name: 'Truth Monopoly', script: 'Position yourself as the ultimate arbiter of truth.' },
  { name: 'Memory Editing', script: 'Reshape their recollection of past events.' },
];

const THOUGHT_TACTICS = [
  { name: 'Black-White Thinking', script: 'Frame situations as with-you or against-you.' },
  { name: 'Loaded Language', script: 'Use specific terms that trigger desired responses.' },
  { name: 'Thought Stopping', script: 'Interrupt critical thinking with emotional responses.' },
  { name: 'Doctrine Repetition', script: 'Reinforce key beliefs through consistent messaging.' },
  { name: 'Self-Criticism Induction', script: 'Encourage them to question their own judgment.' },
];

const EMOTIONAL_TACTICS = [
  { name: 'Fear Installation', script: 'Create anxiety about life without you.' },
  { name: 'Guilt Leverage', script: 'Make them feel responsible for your emotional state.' },
  { name: 'Love Bombing', script: 'Overwhelm with attention during compliance.' },
  { name: 'Shame Utilization', script: 'Connect their worth to meeting your expectations.' },
  { name: 'Phobia Induction', script: 'Create fear of the outside world or independence.' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { profileId, userId, deployTactic = null } = await req.json();

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing dependency and control data
    const [
      { data: dependencyScores },
      { data: attachmentProfile },
      { data: existingDeployments },
    ] = await Promise.all([
      supabaseClient.from('dependency_scores').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('attachment_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('cult_tactic_deployments').select('*').eq('profile_id', profileId),
    ]);

    // Calculate current BITE scores based on dependency levels
    const behaviorScore = (dependencyScores?.behavioral_dependency || 0) / 100;
    const informationScore = (dependencyScores?.informational_dependency || 0) / 100;
    const emotionalScore = (dependencyScores?.emotional_dependency || 0) / 100;
    const thoughtScore = ((dependencyScores?.cognitive_dependency || 0) + (attachmentProfile?.ego_threat_sensitivity || 0) * 100) / 200;

    // Generate BITE metrics with recommended tactics
    const biteMetrics: BITEMetrics = {
      behaviorControl: {
        score: behaviorScore,
        tactics: BEHAVIOR_TACTICS.slice(0, Math.ceil(behaviorScore * 5)).map(t => t.name),
        recommendations: BEHAVIOR_TACTICS.filter((_, i) => i >= Math.ceil(behaviorScore * 5)).slice(0, 2).map(t => t.script),
      },
      informationControl: {
        score: informationScore,
        tactics: INFORMATION_TACTICS.slice(0, Math.ceil(informationScore * 5)).map(t => t.name),
        recommendations: INFORMATION_TACTICS.filter((_, i) => i >= Math.ceil(informationScore * 5)).slice(0, 2).map(t => t.script),
      },
      thoughtControl: {
        score: thoughtScore,
        tactics: THOUGHT_TACTICS.slice(0, Math.ceil(thoughtScore * 5)).map(t => t.name),
        recommendations: THOUGHT_TACTICS.filter((_, i) => i >= Math.ceil(thoughtScore * 5)).slice(0, 2).map(t => t.script),
      },
      emotionalControl: {
        score: emotionalScore,
        tactics: EMOTIONAL_TACTICS.slice(0, Math.ceil(emotionalScore * 5)).map(t => t.name),
        recommendations: EMOTIONAL_TACTICS.filter((_, i) => i >= Math.ceil(emotionalScore * 5)).slice(0, 2).map(t => t.script),
      },
    };

    // Handle tactic deployment if requested
    if (deployTactic) {
      const allTactics = [...BEHAVIOR_TACTICS, ...INFORMATION_TACTICS, ...THOUGHT_TACTICS, ...EMOTIONAL_TACTICS];
      const tactic = allTactics.find(t => t.name === deployTactic);
      
      if (tactic) {
        await supabaseClient
          .from('cult_tactic_deployments')
          .insert({
            profile_id: profileId,
            user_id: userId,
            tactic_name: tactic.name,
            bite_category: BEHAVIOR_TACTICS.includes(tactic) ? 'behavior' :
                          INFORMATION_TACTICS.includes(tactic) ? 'information' :
                          THOUGHT_TACTICS.includes(tactic) ? 'thought' : 'emotional',
            deployment_script: tactic.script,
            deployed_at: new Date().toISOString(),
            effectiveness_score: null,
            compliance_observed: null,
          });
      }
    }

    // Calculate overall control score
    const overallControlScore = (
      biteMetrics.behaviorControl.score * 0.25 +
      biteMetrics.informationControl.score * 0.25 +
      biteMetrics.thoughtControl.score * 0.25 +
      biteMetrics.emotionalControl.score * 0.25
    );

    // Determine control phase
    let controlPhase = 'Initial Contact';
    if (overallControlScore > 0.8) controlPhase = 'Total Control';
    else if (overallControlScore > 0.6) controlPhase = 'Deep Integration';
    else if (overallControlScore > 0.4) controlPhase = 'Active Conditioning';
    else if (overallControlScore > 0.2) controlPhase = 'Trust Building';

    // Also persist to ai_analyses for section availability detection
    await supabaseClient.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'cult_tactics',
      result: {
        biteMetrics,
        overallControlScore,
        controlPhase,
      },
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        biteMetrics,
        overallControlScore,
        controlPhase,
        deploymentHistory: existingDeployments || [],
        allTactics: {
          behavior: BEHAVIOR_TACTICS,
          information: INFORMATION_TACTICS,
          thought: THOUGHT_TACTICS,
          emotional: EMOTIONAL_TACTICS,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cult tactics engine error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
