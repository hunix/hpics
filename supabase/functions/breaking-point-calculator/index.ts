import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PressureVector {
  name: string;
  currentLevel: number;
  maxTolerance: number;
  utilizationPercent: number;
  escalationRate: number;
}

const PRESSURE_VECTORS = [
  'emotional_exhaustion',
  'financial_stress',
  'social_isolation',
  'sleep_deprivation',
  'cognitive_overload',
  'identity_confusion',
  'trust_erosion',
  'autonomy_restriction',
  'shame_accumulation',
  'hope_depletion',
  'physical_exhaustion',
  'decision_fatigue',
  'relationship_strain',
  'professional_pressure',
  'health_anxiety',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'breaking-point-calculator', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Dual-auth pattern: support both user tokens and service role calls
    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    
    const token = authHeader?.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseKey;

    let userId = body.userId || body.user_id;
    const profileId = body.profileId || body.profile_id;

    if (!isServiceRoleCall && authHeader) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token!);
      if (!authError && user) {
        userId = user.id;
      } else if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate data from multiple sources
    const [
      { data: dependencyScores },
      { data: attachmentProfile },
      { data: traumaWindows },
      { data: behavioralBaseline },
      { data: psychAssessment },
    ] = await Promise.all([
      supabaseClient
        .from('dependency_scores')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle(),
      supabaseClient
        .from('attachment_profiles')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle(),
      supabaseClient
        .from('trauma_exploitation_windows')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle(),
      supabaseClient
        .from('behavioral_baselines')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseClient
        .from('psychology_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Calculate pressure vectors
    const pressureVectors: PressureVector[] = PRESSURE_VECTORS.map(vector => {
      let currentLevel = 0.3; // Base level
      let maxTolerance = 0.8; // Base tolerance

      // Adjust based on available data
      if (dependencyScores) {
        if (vector === 'emotional_exhaustion') {
          currentLevel = (dependencyScores.emotional_dependency || 0) / 100;
        }
        if (vector === 'autonomy_restriction') {
          currentLevel = (dependencyScores.behavioral_dependency || 0) / 100;
        }
      }

      if (attachmentProfile) {
        if (vector === 'social_isolation') {
          currentLevel = Math.max(currentLevel, (attachmentProfile.abandonment_sensitivity || 0) * 0.8);
        }
        if (vector === 'trust_erosion') {
          currentLevel = Math.max(currentLevel, (attachmentProfile.rejection_sensitivity || 0) * 0.7);
        }
      }

      if (traumaWindows) {
        if (vector === 'shame_accumulation' || vector === 'hope_depletion') {
          currentLevel = Math.max(currentLevel, (traumaWindows.vulnerability_score || 0) * 0.9);
        }
      }

      // Add some variance
      const variance = (Math.random() - 0.5) * 0.2;
      currentLevel = Math.max(0, Math.min(1, currentLevel + variance));

      return {
        name: vector,
        currentLevel,
        maxTolerance,
        utilizationPercent: (currentLevel / maxTolerance) * 100,
        escalationRate: 0.05 + Math.random() * 0.1,
      };
    });

    // Calculate overall breaking point proximity
    const avgUtilization = pressureVectors.reduce((sum, v) => sum + v.utilizationPercent, 0) / pressureVectors.length;
    const maxUtilization = Math.max(...pressureVectors.map(v => v.utilizationPercent));
    const criticalVectors = pressureVectors.filter(v => v.utilizationPercent > 70);

    const breakingPointProximity = (avgUtilization * 0.4 + maxUtilization * 0.6) / 100;

    // Estimate time to breaking point
    const avgEscalationRate = pressureVectors.reduce((sum, v) => sum + v.escalationRate, 0) / pressureVectors.length;
    const remainingCapacity = 1 - breakingPointProximity;
    const estimatedDaysToBreak = remainingCapacity > 0 ? Math.round(remainingCapacity / avgEscalationRate) : 0;

    // Store results
    const { error: insertError } = await supabaseClient
      .from('breaking_point_predictions')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        overall_proximity: breakingPointProximity,
        pressure_vectors: pressureVectors,
        critical_vectors: criticalVectors.map(v => v.name),
        estimated_timeline: `${estimatedDaysToBreak} days`,
        protective_factors: [],
        risk_amplifiers: criticalVectors.map(v => ({ vector: v.name, level: v.utilizationPercent })),
        recommended_pressure_points: pressureVectors
          .filter(v => v.utilizationPercent < 50)
          .slice(0, 3)
          .map(v => v.name),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,user_id' });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Also persist to ai_analyses for section availability detection
    await supabaseClient.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'breaking_point',
      result: {
        breakingPointProximity,
        estimatedDaysToBreak,
        pressureVectors,
        criticalVectors: criticalVectors.map(v => v.name),
        avgUtilization,
        maxUtilization,
      },
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        breakingPointProximity,
        estimatedDaysToBreak,
        pressureVectors,
        criticalVectors: criticalVectors.map(v => v.name),
        avgUtilization,
        maxUtilization,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Breaking point calculator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
