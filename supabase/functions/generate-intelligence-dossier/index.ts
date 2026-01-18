// Enhanced Intelligence Dossier Generator
// Full Dossier + Actionable Intelligence with strategic tactics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DossierSection {
  title: string;
  content: any;
  confidence: number;
  sources: string[];
}

interface ActionableIntelligence {
  approach_tactics: Array<{
    scenario: string;
    recommended_approach: string;
    talking_points: string[];
    avoid: string[];
    timing_recommendation: string;
  }>;
  leverage_points: Array<{
    type: 'psychological' | 'professional' | 'personal' | 'network';
    description: string;
    activation_trigger: string;
    risk_level: 'low' | 'medium' | 'high';
  }>;
  vulnerability_windows: Array<{
    trigger: string;
    predicted_timing: string;
    opportunity_type: string;
    recommended_action: string;
  }>;
  influence_map: {
    primary_motivators: string[];
    decision_making_style: string;
    trust_builders: string[];
    trust_breakers: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify auth
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      profileId, 
      dossierType = 'full_actionable', // 'summary', 'full', 'full_actionable'
      includeMediaIntelligence = true 
    } = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating ${dossierType} dossier for profile ${profileId}`);

    // Fetch comprehensive data in parallel
    const [
      profileResult,
      mediaIntelResult,
      analysesResult,
      psychProfileResult,
      trustResult,
      influenceResult,
      behavioralResult,
      communicationsResult,
      observationsResult,
      predictionsResult,
      relationshipsResult,
      preferencesResult,
      churnResult,
      anomaliesResult,
      locationsResult,
      milestoneResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).eq('user_id', user.id).single(),
      includeMediaIntelligence ? supabase
        .from('ai_analyses')
        .select('result, generated_at')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .eq('analysis_type', 'media_intelligence_aggregation')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle() : { data: null },
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('generated_at', { ascending: false }).limit(20),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('trust_assessments').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('assessed_at', { ascending: false }).limit(1),
      supabase.from('contact_influence_profiles').select('*').eq('profile_id', profileId).eq('user_id', user.id).maybeSingle(),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('communications').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('occurred_at', { ascending: false }).limit(50),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('observed_at', { ascending: false }).limit(30),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('contact_relationships').select('*, to_profile:profiles!contact_relationships_to_profile_id_fkey(first_name, last_name)').eq('from_profile_id', profileId).eq('user_id', user.id),
      supabase.from('contact_predicted_preferences').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('confidence_score', { ascending: false }).limit(20),
      supabase.from('churn_predictions').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('behavioral_anomalies').select('*').eq('profile_id', profileId).eq('user_id', user.id).eq('is_resolved', false),
      supabase.from('contact_locations').select('*').eq('profile_id', profileId).eq('user_id', user.id),
      supabase.from('contact_life_milestones').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('milestone_date', { ascending: false }).limit(10),
    ]);

    const profile = profileResult.data;
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build dossier sections
    const sections: Record<string, DossierSection> = {};

    // Executive Summary
    sections.executive_summary = {
      title: 'Executive Summary',
      content: {
        full_name: `${profile.first_name} ${profile.last_name}`,
        organization: profile.organization,
        title: profile.job_title || profile.title,
        relationship_type: profile.relationship_type,
        relationship_tier: profile.relationship_tier,
        trust_score: trustResult.data?.[0]?.overall_trust_score,
        influence_index: influenceResult.data?.influence_index,
        churn_risk: churnResult.data?.[0]?.predicted_churn_probability,
        active_alerts: anomaliesResult.data?.length || 0,
        last_contact: profile.last_contact_date,
      },
      confidence: 95,
      sources: ['profile', 'trust_assessment', 'influence_profile'],
    };

    // Media Intelligence (from bulk analysis)
    if (mediaIntelResult.data?.result) {
      const mediaIntel = mediaIntelResult.data.result as any;
      sections.media_intelligence = {
        title: 'Media Intelligence',
        content: {
          media_analyzed: mediaIntel.media_analyzed,
          people_network: mediaIntel.people_network,
          locations: mediaIntel.location_timeline,
          activities: mediaIntel.activity_patterns,
          interests: mediaIntel.interests,
          wealth_indicators: mediaIntel.wealth_lifestyle?.indicators,
          profession_cues: mediaIntel.wealth_lifestyle?.profession_cues,
          emotional_profile: mediaIntel.emotional_profile,
          certainties: mediaIntel.certainties,
          red_flags: mediaIntel.red_flags,
        },
        confidence: 85,
        sources: ['media_analysis', 'ai_metadata'],
      };
    }

    // Psychological Profile
    if (psychProfileResult.data?.[0]) {
      const psych = psychProfileResult.data[0];
      sections.psychological_profile = {
        title: 'Psychological Profile',
        content: {
          mbti_type: psych.mbti_type,
          disc_profile: psych.disc_profile,
          big_five: psych.big_five_scores,
          attachment_style: psych.attachment_style,
          communication_style: psych.communication_style,
          decision_making: psych.decision_making_style,
          stress_response: psych.stress_response_patterns,
          emotional_triggers: psych.emotional_triggers,
          core_values: psych.core_values,
          motivators: psych.primary_motivators,
        },
        confidence: psych.confidence_score || 70,
        sources: ['psychological_analysis', 'behavioral_patterns'],
      };
    }

    // Behavioral Patterns
    if (behavioralResult.data?.length) {
      const patterns = behavioralResult.data.map((b: any) => ({
        type: b.analysis_type,
        patterns: b.behavioral_patterns,
        anomalies: b.anomalies_detected,
      }));
      sections.behavioral_patterns = {
        title: 'Behavioral Patterns',
        content: { patterns, observations: observationsResult.data?.slice(0, 10) },
        confidence: 80,
        sources: ['behavioral_analysis', 'observations'],
      };
    }

    // Network & Relationships
    if (relationshipsResult.data?.length) {
      sections.network_analysis = {
        title: 'Network & Relationships',
        content: {
          relationships: relationshipsResult.data.map((r: any) => ({
            type: r.relationship_type,
            name: r.to_profile ? `${r.to_profile.first_name} ${r.to_profile.last_name}` : 'Unknown',
            strength: r.strength,
          })),
          network_position: influenceResult.data?.network_centrality,
          influence_reach: influenceResult.data?.influence_reach,
        },
        confidence: 85,
        sources: ['relationships', 'influence_profile'],
      };
    }

    // Predictions & Forecasts
    if (predictionsResult.data?.length) {
      sections.predictions = {
        title: 'Predictions & Forecasts',
        content: {
          behavioral: predictionsResult.data.map((p: any) => ({
            type: p.prediction_type,
            prediction: p.prediction_value,
            confidence: p.confidence_score,
            timeframe: p.prediction_timeframe,
          })),
          churn: churnResult.data?.[0] ? {
            probability: churnResult.data[0].predicted_churn_probability,
            risk_level: churnResult.data[0].risk_level,
            factors: churnResult.data[0].contributing_factors,
            interventions: churnResult.data[0].recommended_interventions,
          } : null,
        },
        confidence: 75,
        sources: ['behavioral_predictions', 'churn_analysis'],
      };
    }

    // Preferences
    if (preferencesResult.data?.length) {
      sections.preferences = {
        title: 'Predicted Preferences',
        content: preferencesResult.data.map((p: any) => ({
          category: p.preference_category,
          preference: p.preference_value,
          confidence: p.confidence_score,
          source: p.source_type,
        })),
        confidence: 70,
        sources: ['preference_prediction'],
      };
    }

    // Alerts & Anomalies
    if (anomaliesResult.data?.length) {
      sections.alerts = {
        title: 'Active Alerts',
        content: anomaliesResult.data.map((a: any) => ({
          type: a.anomaly_type,
          severity: a.severity,
          description: a.description,
          detected_at: a.detected_at,
        })),
        confidence: 90,
        sources: ['anomaly_detection'],
      };
    }

    // Geographic Intelligence
    if (locationsResult.data?.length) {
      sections.geographic = {
        title: 'Geographic Intelligence',
        content: {
          known_locations: locationsResult.data.map((l: any) => ({
            type: l.location_type,
            name: l.location_name,
            city: l.city,
            country: l.country,
            is_current: l.is_current,
          })),
        },
        confidence: 85,
        sources: ['location_data'],
      };
    }

    // Life Milestones
    if (milestoneResult.data?.length) {
      sections.milestones = {
        title: 'Life Milestones',
        content: milestoneResult.data.map((m: any) => ({
          type: m.milestone_type,
          title: m.title,
          date: m.milestone_date,
          significance: m.significance_score,
        })),
        confidence: 90,
        sources: ['milestone_tracking'],
      };
    }

    // Generate AI-powered actionable intelligence
    let actionableIntelligence: ActionableIntelligence | null = null;
    let keyFindings: any[] = [];
    let riskAssessment: any = null;

    if (dossierType === 'full_actionable') {
      try {
        const aiConfig = await getAIConfig(supabase, user.id);
        
        const contextForAI = {
          profile: sections.executive_summary.content,
          psychological: sections.psychological_profile?.content,
          behavioral: sections.behavioral_patterns?.content?.patterns?.slice(0, 3),
          mediaIntel: sections.media_intelligence?.content,
          predictions: sections.predictions?.content,
          alerts: sections.alerts?.content,
          preferences: sections.preferences?.content?.slice(0, 10),
        };

        const aiResponse = await callAI({
          model: aiConfig.qualityModel,
          messages: [
            {
              role: 'system',
              content: `You are an elite intelligence analyst generating an actionable dossier. Analyze ALL provided data and generate:

1. KEY FINDINGS: 5-7 critical insights with evidence
2. RISK ASSESSMENT: Overall risk level with specific risks
3. APPROACH TACTICS: 3-5 scenario-based approaches with talking points
4. LEVERAGE POINTS: Psychological, professional, personal, and network leverage
5. VULNERABILITY WINDOWS: Predicted timing opportunities
6. INFLUENCE MAP: Motivators, decision style, trust builders/breakers

Be specific, evidence-based, and strategically actionable. Output as JSON:
{
  "key_findings": [{"finding": "...", "importance": "high|medium", "evidence": "..."}],
  "risk_assessment": {"overall_risk": "low|medium|high|critical", "risks": [{"risk": "...", "likelihood": "...", "impact": "..."}]},
  "approach_tactics": [{"scenario": "...", "recommended_approach": "...", "talking_points": ["..."], "avoid": ["..."], "timing_recommendation": "..."}],
  "leverage_points": [{"type": "psychological|professional|personal|network", "description": "...", "activation_trigger": "...", "risk_level": "low|medium|high"}],
  "vulnerability_windows": [{"trigger": "...", "predicted_timing": "...", "opportunity_type": "...", "recommended_action": "..."}],
  "influence_map": {"primary_motivators": ["..."], "decision_making_style": "...", "trust_builders": ["..."], "trust_breakers": ["..."]}
}`
            },
            {
              role: 'user',
              content: JSON.stringify(contextForAI)
            }
          ],
          userId: user.id,
          functionName: 'generate-intelligence-dossier',
          profileId,
          maxTokens: 4000,
          enforceBudget: true,
        });

        const parsed = parseAIJson(aiResponse.content, {
          key_findings: [],
          risk_assessment: null,
          approach_tactics: [],
          leverage_points: [],
          vulnerability_windows: [],
          influence_map: null,
        });

        keyFindings = parsed.key_findings || [];
        riskAssessment = parsed.risk_assessment;
        actionableIntelligence = {
          approach_tactics: parsed.approach_tactics || [],
          leverage_points: parsed.leverage_points || [],
          vulnerability_windows: parsed.vulnerability_windows || [],
          influence_map: parsed.influence_map || {
            primary_motivators: [],
            decision_making_style: 'Unknown',
            trust_builders: [],
            trust_breakers: [],
          },
        };

      } catch (e) {
        console.error('AI actionable intel error:', e);
      }
    }

    // Build final dossier
    const dossier = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      profile_name: `${profile.first_name} ${profile.last_name}`,
      dossier_type: dossierType,
      generated_at: new Date().toISOString(),
      sections,
      key_findings: keyFindings,
      risk_assessment: riskAssessment,
      actionable_intelligence: actionableIntelligence,
      data_completeness: Object.keys(sections).length / 12 * 100, // 12 possible sections
      source_count: Object.values(sections).reduce((sum, s) => sum + s.sources.length, 0),
    };

    // Store in ai_analyses for history
    await supabase.from('ai_analyses').insert({
      user_id: user.id,
      profile_id: profileId,
      analysis_type: 'intelligence_dossier',
      result: dossier,
    });

    return new Response(JSON.stringify({
      success: true,
      dossier,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Dossier generation error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
