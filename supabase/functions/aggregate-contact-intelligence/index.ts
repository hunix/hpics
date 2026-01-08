// Unified Intelligence Aggregator
// Correlates data from ALL tables for a contact to generate comprehensive insights

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';
import { applyRateLimit } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntelligenceReport {
  overallConfidence: number;
  dataCompleteness: number;
  keyInsights: string[];
  contradictions: Array<{ source1: string; source2: string; issue: string }>;
  blindSpots: string[];
  recommendedActions: Array<{ action: string; priority: 'high' | 'medium' | 'low'; reason: string }>;
  relationshipHealth: number;
  riskLevel: 'low' | 'medium' | 'high';
  opportunityScore: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const rateLimitResponse = applyRateLimit(user.id, 'aggregate-contact-intelligence');
    if (rateLimitResponse) return rateLimitResponse;

    const { profileId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Missing profileId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch ALL relevant data for this contact in parallel
    const [
      profileResult,
      analysesResult,
      behavioralAnalysesResult,
      anomaliesResult,
      communicationsResult,
      predictionsResult,
      churnPredictionsResult,
      observationsResult,
      relationshipsResult,
      psychProfileResult,
      influenceActionsResult,
      crossContactResult,
      sharedExperiencesResult,
      documentsResult,
      mediaResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).eq('user_id', user.id).single(),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('generated_at', { ascending: false }).limit(10),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('behavioral_anomalies').select('*').eq('profile_id', profileId).eq('user_id', user.id).eq('is_resolved', false).limit(10),
      supabase.from('communications').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('occurred_at', { ascending: false }).limit(50),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('churn_predictions').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('observed_at', { ascending: false }).limit(20),
      supabase.from('contact_relationships').select('*, to_profile:profiles!contact_relationships_to_profile_id_fkey(first_name, last_name)').eq('from_profile_id', profileId).eq('user_id', user.id),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('influence_actions').select('*, methodology_outcomes(*)').eq('target_profile_id', profileId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('cross_contact_detections').select('*').or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`).eq('user_id', user.id).limit(10),
      supabase.from('shared_experiences').select('*').contains('participant_profile_ids', [profileId]).eq('user_id', user.id).limit(10),
      supabase.from('documents').select('id, title, document_type, ai_summary').eq('profile_id', profileId).eq('user_id', user.id).limit(10),
      supabase.from('media').select('id, caption, ai_metadata').eq('profile_id', profileId).eq('user_id', user.id).not('ai_metadata', 'is', null).limit(20),
    ]);

    const profile = profileResult.data;
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate data completeness score
    const dataSources = {
      profile: !!profile,
      analyses: (analysesResult.data?.length || 0) > 0,
      behavioralAnalyses: (behavioralAnalysesResult.data?.length || 0) > 0,
      communications: (communicationsResult.data?.length || 0) > 0,
      predictions: (predictionsResult.data?.length || 0) > 0,
      observations: (observationsResult.data?.length || 0) > 0,
      relationships: (relationshipsResult.data?.length || 0) > 0,
      psychProfile: (psychProfileResult.data?.length || 0) > 0,
      documents: (documentsResult.data?.length || 0) > 0,
      media: (mediaResult.data?.length || 0) > 0,
    };

    const dataCompleteness = Object.values(dataSources).filter(Boolean).length / Object.keys(dataSources).length;

    // Build comprehensive context
    const intelligenceContext = {
      profile: {
        name: `${profile.first_name} ${profile.last_name}`,
        organization: profile.organization,
        jobTitle: profile.job_title,
        relationshipType: profile.relationship_type,
        isFavorite: profile.is_favorite,
        tags: profile.tags,
      },
      analyses: analysesResult.data?.map((a: any) => ({
        type: a.analysis_type,
        date: a.generated_at,
        resultSummary: typeof a.result === 'object' ? JSON.stringify(a.result).substring(0, 500) : String(a.result).substring(0, 500),
      })),
      behavioralPatterns: behavioralAnalysesResult.data?.map((b: any) => ({
        type: b.analysis_type,
        patterns: b.behavioral_patterns,
        confidence: b.confidence_score,
      })),
      unresolvedAnomalies: anomaliesResult.data?.map((a: any) => ({
        type: a.anomaly_type,
        severity: a.severity,
        description: a.description,
        deviationScore: a.deviation_score,
      })),
      communicationSummary: {
        totalCount: communicationsResult.data?.length || 0,
        channels: [...new Set(communicationsResult.data?.map((c: any) => c.channel) || [])],
        avgSentiment: communicationsResult.data?.reduce((sum: number, c: any) => sum + (c.sentiment_score || 0), 0) / (communicationsResult.data?.length || 1),
        recentTopics: communicationsResult.data?.slice(0, 5).map((c: any) => c.subject).filter(Boolean),
      },
      predictions: predictionsResult.data?.map((p: any) => ({
        type: p.prediction_type,
        value: p.prediction_value,
        confidence: p.confidence_score,
      })),
      churnRisk: churnPredictionsResult.data?.[0] ? {
        probability: churnPredictionsResult.data[0].predicted_churn_probability,
        riskLevel: churnPredictionsResult.data[0].risk_level,
        factors: churnPredictionsResult.data[0].contributing_factors,
      } : null,
      observations: observationsResult.data?.map((o: any) => ({
        type: o.observation_type,
        content: o.content?.substring(0, 200),
        importance: o.importance_score,
      })),
      relationships: relationshipsResult.data?.map((r: any) => ({
        type: r.relationship_type,
        subtype: r.subtype,
        toContact: r.to_profile ? `${r.to_profile.first_name} ${r.to_profile.last_name}` : null,
        strength: r.strength,
      })),
      psychProfile: psychProfileResult.data?.[0] ? {
        mbti: psychProfileResult.data[0].mbti_type,
        disc: psychProfileResult.data[0].disc_profile,
        bigFive: psychProfileResult.data[0].big_five_scores,
        communicationStyle: psychProfileResult.data[0].communication_style,
      } : null,
      influenceHistory: influenceActionsResult.data?.map((i: any) => ({
        methodology: i.methodology_type,
        status: i.status,
        outcomes: i.methodology_outcomes?.map((o: any) => ({
          success: o.was_successful,
          learnings: o.learnings,
        })),
      })),
      crossContactPatterns: crossContactResult.data?.map((c: any) => ({
        pattern: c.pattern_type,
        confidence: c.confidence_score,
        details: c.pattern_details,
      })),
      sharedExperiences: sharedExperiencesResult.data?.map((s: any) => ({
        type: s.experience_type,
        title: s.title,
        date: s.occurred_at,
      })),
    };

    // Generate AI analysis
    const model = selectModel('balanced', 'google');
    const aiResponse = await callAI({
      model,
      userId: user.id,
      functionName: 'aggregate-contact-intelligence',
      profileId,
      enforceBudget: true,
      messages: [
        {
          role: 'system',
          content: `You are an intelligence analyst specializing in relationship intelligence. Analyze all available data about a contact and generate a comprehensive intelligence report. Focus on:
1. Identifying key insights from correlating multiple data sources
2. Detecting contradictions between different sources
3. Finding blind spots (important information that's missing)
4. Recommending high-impact actions
5. Assessing relationship health and risk levels

Respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: `Analyze this comprehensive intelligence data for ${profile.first_name} ${profile.last_name}:

${JSON.stringify(intelligenceContext, null, 2)}

Generate a JSON response with this structure:
{
  "overallConfidence": <0-100 confidence in our understanding>,
  "dataCompleteness": ${Math.round(dataCompleteness * 100)},
  "keyInsights": ["<insight 1>", "<insight 2>", ...],
  "contradictions": [{"source1": "<source>", "source2": "<source>", "issue": "<description>"}],
  "blindSpots": ["<missing info 1>", "<missing info 2>", ...],
  "recommendedActions": [{"action": "<action>", "priority": "high|medium|low", "reason": "<why>"}],
  "relationshipHealth": <0-100>,
  "riskLevel": "low|medium|high",
  "opportunityScore": <0-100>
}`,
        },
      ],
    });

    const report = parseAIJson<IntelligenceReport>(aiResponse.content, {
      overallConfidence: 50,
      dataCompleteness: Math.round(dataCompleteness * 100),
      keyInsights: ['Insufficient data for comprehensive analysis'],
      contradictions: [],
      blindSpots: ['More data collection needed'],
      recommendedActions: [{ action: 'Gather more information', priority: 'medium', reason: 'Improve analysis accuracy' }],
      relationshipHealth: 50,
      riskLevel: 'medium',
      opportunityScore: 50,
    });

    // Store the aggregated intelligence
    await supabase.from('ai_analyses').insert({
      user_id: user.id,
      profile_id: profileId,
      analysis_type: 'aggregated_intelligence',
      result: {
        report,
        dataSourcesUsed: dataSources,
        generatedAt: new Date().toISOString(),
        aiCostCents: aiResponse.costCents,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      report,
      dataSourcesUsed: dataSources,
      aiCostCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Aggregate intelligence error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
