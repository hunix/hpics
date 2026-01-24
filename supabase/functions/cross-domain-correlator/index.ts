import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainData {
  domain: string;
  score: number;
  dataPoints: number;
  lastUpdated: string | null;
}

interface Correlation {
  domains: string[];
  strength: number;
  pattern: string;
  tacticalImplication: string;
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

    const { profileId, userId } = await req.json();

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch data from all intelligence domains
    const [
      { data: dependencyScores },
      { data: miceAssessment },
      { data: betrayalPrediction },
      { data: attachmentProfile },
      { data: psychAssessment },
      { data: traumaWindows },
      { data: breakingPoint },
      { data: gottmanAnalysis },
      { data: behavioralBaseline },
      { count: noteCount },
      { count: mediaCount },
      { count: meetingCount },
    ] = await Promise.all([
      supabaseClient.from('dependency_scores').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('mice_assessments').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('betrayal_predictions').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('attachment_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('psychology_assessments').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from('trauma_exploitation_windows').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('breaking_point_predictions').select('*').eq('profile_id', profileId).maybeSingle(),
      supabaseClient.from('gottman_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from('behavioral_baselines').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from('contact_interaction_notes').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
      supabaseClient.from('media').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
      supabaseClient.from('meetings').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
    ]);

    // Compile domain scores
    const domainData: DomainData[] = [
      {
        domain: 'dependency',
        score: dependencyScores?.overall_dependency || 0,
        dataPoints: dependencyScores ? 6 : 0,
        lastUpdated: dependencyScores?.updated_at || null,
      },
      {
        domain: 'mice',
        score: miceAssessment?.overall_mice_score || 0,
        dataPoints: miceAssessment ? 4 : 0,
        lastUpdated: miceAssessment?.updated_at || null,
      },
      {
        domain: 'betrayal',
        score: (betrayalPrediction?.defection_probability || 0) * 100,
        dataPoints: betrayalPrediction ? 5 : 0,
        lastUpdated: betrayalPrediction?.updated_at || null,
      },
      {
        domain: 'attachment',
        score: ((attachmentProfile?.abandonment_sensitivity || 0) + (attachmentProfile?.rejection_sensitivity || 0)) / 2 * 100,
        dataPoints: attachmentProfile ? 7 : 0,
        lastUpdated: attachmentProfile?.updated_at || null,
      },
      {
        domain: 'dark_psychology',
        score: psychAssessment?.dark_triad_scores ? 
          (psychAssessment.dark_triad_scores.narcissism + psychAssessment.dark_triad_scores.machiavellianism + psychAssessment.dark_triad_scores.psychopathy) / 3 : 0,
        dataPoints: psychAssessment ? 3 : 0,
        lastUpdated: psychAssessment?.created_at || null,
      },
      {
        domain: 'trauma',
        score: (traumaWindows?.vulnerability_score || 0) * 100,
        dataPoints: traumaWindows ? (traumaWindows.detected_patterns?.length || 0) : 0,
        lastUpdated: traumaWindows?.updated_at || null,
      },
      {
        domain: 'breaking_point',
        score: (breakingPoint?.overall_proximity || 0) * 100,
        dataPoints: breakingPoint?.pressure_vectors?.length || 0,
        lastUpdated: breakingPoint?.updated_at || null,
      },
      {
        domain: 'gottman',
        score: gottmanAnalysis?.horsemen_scores ? 
          Object.values(gottmanAnalysis.horsemen_scores).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0) / 4 : 0,
        dataPoints: gottmanAnalysis ? 4 : 0,
        lastUpdated: gottmanAnalysis?.created_at || null,
      },
      {
        domain: 'communications',
        score: noteCount || 0,
        dataPoints: noteCount || 0,
        lastUpdated: null,
      },
      {
        domain: 'media',
        score: mediaCount || 0,
        dataPoints: mediaCount || 0,
        lastUpdated: null,
      },
    ];

    // Detect cross-domain correlations
    const correlations: Correlation[] = [];

    // High dependency + High betrayal risk = Critical
    if ((dependencyScores?.overall_dependency || 0) > 60 && (betrayalPrediction?.defection_probability || 0) > 0.6) {
      correlations.push({
        domains: ['dependency', 'betrayal'],
        strength: 0.9,
        pattern: 'High dependency with elevated betrayal risk',
        tacticalImplication: 'Maintain dependency while monitoring for defection signals. Consider preemptive bonding reinforcement.',
      });
    }

    // Attachment vulnerability + Trauma = Enhanced exploitation window
    if ((attachmentProfile?.abandonment_sensitivity || 0) > 0.6 && (traumaWindows?.vulnerability_score || 0) > 0.5) {
      correlations.push({
        domains: ['attachment', 'trauma'],
        strength: 0.85,
        pattern: 'Attachment wounds aligned with trauma triggers',
        tacticalImplication: 'Coordinate trauma-anniversary engagement with attachment reassurance for maximum impact.',
      });
    }

    // MICE vulnerability + Breaking point proximity = Pressure opportunity
    if ((miceAssessment?.overall_mice_score || 0) > 60 && (breakingPoint?.overall_proximity || 0) > 0.6) {
      correlations.push({
        domains: ['mice', 'breaking_point'],
        strength: 0.8,
        pattern: 'MICE vectors aligned with stress threshold',
        tacticalImplication: 'Optimal window for leveraging primary MICE vulnerability. Apply calibrated pressure.',
      });
    }

    // Dark Triad + Gottman = Manipulation susceptibility
    const avgDarkTriad = psychAssessment?.dark_triad_scores ? 
      (psychAssessment.dark_triad_scores.narcissism + psychAssessment.dark_triad_scores.machiavellianism) / 2 : 0;
    if (avgDarkTriad > 50 && gottmanAnalysis?.horsemen_scores) {
      correlations.push({
        domains: ['dark_psychology', 'gottman'],
        strength: 0.75,
        pattern: 'Dark traits amplify relationship conflict patterns',
        tacticalImplication: 'Leverage narcissistic supply needs during conflict. Use criticism strategically.',
      });
    }

    // Calculate unified vulnerability score
    const activeDomainsCount = domainData.filter(d => d.dataPoints > 0).length;
    const totalScore = domainData.reduce((sum, d) => sum + d.score, 0);
    const unifiedScore = activeDomainsCount > 0 ? totalScore / activeDomainsCount : 0;

    // Store correlations
    for (const correlation of correlations) {
      await supabaseClient
        .from('cross_domain_correlations')
        .upsert({
          profile_id: profileId,
          user_id: userId,
          correlation_type: correlation.domains.join('_'),
          domains_involved: correlation.domains,
          correlation_strength: correlation.strength,
          pattern_data: { pattern: correlation.pattern },
          tactical_implications: correlation.tacticalImplication,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id,user_id,correlation_type' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        unifiedVulnerabilityScore: unifiedScore,
        domainData,
        correlations,
        activeDomainsCount,
        totalDataPoints: domainData.reduce((sum, d) => sum + d.dataPoints, 0),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cross-domain correlator error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
