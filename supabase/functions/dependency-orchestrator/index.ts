import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DependencyTactic {
  domain: string;
  tactic: string;
  script: string;
  currentEffectiveness: number;
  recommendedIntensity: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { profileId, userId, targetDependencyLevel = 0.8 } = await req.json();

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current dependency state
    const { data: dependencyScores } = await supabaseClient
      .from('dependency_scores')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    const { data: addictionProtocol } = await supabaseClient
      .from('addiction_protocols')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    // Current dependency levels
    const currentLevels = {
      emotional: (dependencyScores?.emotional_dependency || 0) / 100,
      financial: (dependencyScores?.financial_dependency || 0) / 100,
      social: (dependencyScores?.social_dependency || 0) / 100,
      informational: (dependencyScores?.informational_dependency || 0) / 100,
      behavioral: (dependencyScores?.behavioral_dependency || 0) / 100,
    };

    // Generate tactics for each dependency domain
    const tactics: DependencyTactic[] = [];

    // Emotional dependency tactics
    if (currentLevels.emotional < targetDependencyLevel) {
      tactics.push({
        domain: 'emotional',
        tactic: 'Intermittent Reinforcement',
        script: 'Alternate between intense affection and emotional distance. Create unpredictability in emotional availability.',
        currentEffectiveness: currentLevels.emotional,
        recommendedIntensity: Math.min(currentLevels.emotional + 0.2, 1.0),
      });
      tactics.push({
        domain: 'emotional',
        tactic: 'Exclusive Validation',
        script: 'Position yourself as the only one who truly understands them. Subtly devalue other relationships.',
        currentEffectiveness: currentLevels.emotional,
        recommendedIntensity: Math.min(currentLevels.emotional + 0.15, 1.0),
      });
    }

    // Social dependency tactics
    if (currentLevels.social < targetDependencyLevel) {
      tactics.push({
        domain: 'social',
        tactic: 'Social Circle Integration',
        script: 'Become central to their social activities. Make group events dependent on your presence.',
        currentEffectiveness: currentLevels.social,
        recommendedIntensity: Math.min(currentLevels.social + 0.2, 1.0),
      });
      tactics.push({
        domain: 'social',
        tactic: 'Relationship Triangulation',
        script: 'Create subtle competition for your attention. Reference how others value your time.',
        currentEffectiveness: currentLevels.social,
        recommendedIntensity: Math.min(currentLevels.social + 0.15, 1.0),
      });
    }

    // Informational dependency tactics
    if (currentLevels.informational < targetDependencyLevel) {
      tactics.push({
        domain: 'informational',
        tactic: 'Expert Positioning',
        script: 'Become their go-to source for advice and information. Subtly undermine their confidence in other sources.',
        currentEffectiveness: currentLevels.informational,
        recommendedIntensity: Math.min(currentLevels.informational + 0.2, 1.0),
      });
    }

    // Behavioral dependency tactics
    if (currentLevels.behavioral < targetDependencyLevel) {
      tactics.push({
        domain: 'behavioral',
        tactic: 'Routine Integration',
        script: 'Embed yourself into their daily routines. Create rituals that require your participation.',
        currentEffectiveness: currentLevels.behavioral,
        recommendedIntensity: Math.min(currentLevels.behavioral + 0.2, 1.0),
      });
    }

    // Calculate optimal reinforcement schedule
    const reinforcementRatio = addictionProtocol?.variable_ratio_config || { ratio: 3, variance: 0.3 };
    
    const orchestrationPlan = {
      currentOverallDependency: Object.values(currentLevels).reduce((a, b) => a + b, 0) / 5,
      targetDependencyLevel,
      gap: targetDependencyLevel - (Object.values(currentLevels).reduce((a, b) => a + b, 0) / 5),
      recommendedTactics: tactics,
      reinforcementSchedule: {
        type: 'variable_ratio',
        ...reinforcementRatio,
        nextReinforcementIn: Math.floor(Math.random() * 5) + 1 + ' interactions',
      },
      estimatedTimeToTarget: `${Math.ceil((targetDependencyLevel - Object.values(currentLevels).reduce((a, b) => a + b, 0) / 5) * 30)} days`,
    };

    // Update dependency scores with orchestration metadata
    const { error: updateError } = await supabaseClient
      .from('dependency_scores')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        emotional_dependency: currentLevels.emotional * 100,
        financial_dependency: currentLevels.financial * 100,
        social_dependency: currentLevels.social * 100,
        informational_dependency: currentLevels.informational * 100,
        behavioral_dependency: currentLevels.behavioral * 100,
        attachment_dependency: (currentLevels.emotional + currentLevels.social) / 2 * 100,
        overall_dependency: orchestrationPlan.currentOverallDependency * 100,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,user_id' });

    if (updateError) {
      console.error('Update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        orchestrationPlan,
        currentLevels,
        tacticCount: tactics.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dependency orchestrator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
