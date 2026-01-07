import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const { data: claimsData, error: authError } = await (authClient.auth as any).getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    const { profile_id, dossier_type = 'full', classification = 'internal' } = await req.json();
    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'profile_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all data in parallel
    const [
      { data: profile },
      { data: personalInfo },
      { data: contactMethods },
      { data: relationships },
      { data: education },
      { data: certifications },
      { data: interests },
      { data: skills },
      { data: observations },
      { data: communications },
      { data: messages },
      { data: behavioralAnalyses },
      { data: facialAnalyses },
      { data: vocalAnalyses },
      { data: bodyLanguageAnalyses },
      { data: psychProfile },
      { data: trustAssessment },
      { data: anomalies },
      { data: connectionIntel },
      { data: locations },
      { data: identityDocs },
      { data: travelHistory },
      { data: milestones },
      { data: commPrefs },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profile_id).single(),
      supabase.from('contact_personal_info').select('*').eq('profile_id', profile_id).maybeSingle(),
      supabase.from('contact_methods').select('*').eq('profile_id', profile_id),
      supabase.from('contact_relationships').select('*, related_profile:profiles!contact_relationships_related_profile_id_fkey(first_name, last_name)').eq('profile_id', profile_id),
      supabase.from('education').select('*').eq('profile_id', profile_id),
      supabase.from('certifications').select('*').eq('profile_id', profile_id),
      supabase.from('contact_interests').select('*').eq('profile_id', profile_id),
      supabase.from('contact_skills').select('*').eq('profile_id', profile_id),
      supabase.from('contact_observations').select('*').eq('profile_id', profile_id),
      supabase.from('communications').select('*').eq('profile_id', profile_id).order('occurred_at', { ascending: false }).limit(100),
      supabase.from('messages').select('*, conversations!inner(profile_id)').eq('user_id', userId).limit(200),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profile_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('facial_analyses').select('*').eq('profile_id', profile_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('vocal_analyses').select('*').eq('profile_id', profile_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('body_language_analyses').select('*').eq('profile_id', profile_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profile_id).order('created_at', { ascending: false }).limit(1),
      supabase.from('trust_assessments').select('*').eq('profile_id', profile_id).maybeSingle(),
      supabase.from('behavioral_anomalies').select('*').eq('profile_id', profile_id).eq('is_resolved', false),
      supabase.from('connection_intelligence').select('*').or(`profile_a_id.eq.${profile_id},profile_b_id.eq.${profile_id}`),
      supabase.from('contact_locations').select('*').eq('profile_id', profile_id),
      supabase.from('contact_identity_documents').select('*').eq('profile_id', profile_id),
      supabase.from('contact_travel_history').select('*').eq('profile_id', profile_id).order('travel_date', { ascending: false }),
      supabase.from('contact_life_milestones').select('*').eq('profile_id', profile_id),
      supabase.from('contact_communication_preferences').select('*').eq('profile_id', profile_id).maybeSingle(),
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profileMessages = messages?.filter(m => (m.conversations as any)?.profile_id === profile_id) || [];

    // Build dossier sections
    const sections: Record<string, any> = {};

    // 1. Executive Summary
    sections.executive_summary = {
      full_name: `${profile.first_name} ${profile.last_name}`,
      organization: profile.organization,
      title: profile.title,
      relationship_type: profile.relationship_type,
      is_favorite: profile.is_favorite,
      trust_score: trustAssessment?.overall_trust_score,
      verification_status: trustAssessment?.verification_status,
      active_anomalies: anomalies?.length || 0,
      last_contact: profile.last_contact_date,
      total_communications: (communications?.length || 0) + (profileMessages.length || 0),
    };

    // 2. Personal Information
    sections.personal_information = {
      profile: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        nickname: profile.nickname,
        birthday: profile.birthday,
        avatar_url: profile.avatar_url,
      },
      extended: personalInfo ? {
        blood_group: personalInfo.blood_group,
        medical_conditions: personalInfo.medical_conditions,
        allergies: personalInfo.allergies,
        emergency_contact: personalInfo.emergency_contact,
        nationality: personalInfo.nationality,
        religion: personalInfo.religion,
        political_affiliation: personalInfo.political_affiliation,
      } : null,
      contact_methods: contactMethods?.map(m => ({
        type: m.type,
        value: m.value,
        is_primary: m.is_primary,
        verified: m.verified,
      })),
    };

    // 3. Relationships & Network
    sections.network = {
      direct_relationships: relationships?.map(r => ({
        type: r.relationship_type,
        subtype: r.relationship_subtype,
        name: r.related_profile ? `${r.related_profile.first_name} ${r.related_profile.last_name}` : 'Unknown',
        notes: r.notes,
      })),
      connection_intelligence: connectionIntel?.map(c => ({
        connection_type: c.connection_type,
        strength: c.connection_strength,
        evidence_count: (c.evidence as any[])?.length || 0,
        shared_organizations: c.shared_organizations,
      })),
    };

    // 4. Professional Background
    sections.professional = {
      current_organization: profile.organization,
      current_title: profile.title,
      education: education?.map(e => ({
        institution: e.institution_name,
        degree: e.degree,
        field: e.field_of_study,
        dates: `${e.start_date || ''} - ${e.end_date || 'Present'}`,
      })),
      certifications: certifications?.map(c => ({
        name: c.name,
        issuer: c.issuing_organization,
        date: c.issue_date,
      })),
      skills: skills?.map(s => s.skill_name),
    };

    // 5. Psychological Profile
    sections.psychological = {
      profile: psychProfile?.[0] ? {
        personality_assessment: (psychProfile[0].analysis_result as any)?.personality,
        attachment_style: (psychProfile[0].analysis_result as any)?.attachment_style,
        emotional_intelligence: (psychProfile[0].analysis_result as any)?.emotional_intelligence,
        cognitive_patterns: (psychProfile[0].analysis_result as any)?.cognitive_patterns,
        risk_markers: (psychProfile[0].analysis_result as any)?.psychiatric_risk_markers,
        data_completeness: psychProfile[0].data_completeness_score,
        confidence: psychProfile[0].confidence_score,
      } : null,
      behavioral_patterns: behavioralAnalyses?.[0]?.behavioral_patterns,
      personality_indicators: behavioralAnalyses?.[0]?.personality_indicators,
      observations: observations?.map(o => ({
        category: o.category,
        content: o.observation_text,
        confidence: o.confidence_level,
        validated: o.ai_validation_status,
      })),
    };

    // 6. Trust & Authenticity Assessment
    sections.trust_assessment = trustAssessment ? {
      overall_score: trustAssessment.overall_trust_score,
      authenticity: trustAssessment.authenticity_score,
      consistency: trustAssessment.consistency_score,
      verification_status: trustAssessment.verification_status,
      deception_indicators: trustAssessment.deception_indicators,
      inconsistencies: trustAssessment.inconsistencies,
      ai_assessment: trustAssessment.ai_assessment,
    } : { status: 'Not yet assessed' };

    // 7. Communication Analysis
    const recentComms = communications?.slice(0, 20) || [];
    const avgSentiment = recentComms.length > 0 
      ? recentComms.filter(c => c.sentiment_score).reduce((a, c) => a + (c.sentiment_score || 0), 0) / recentComms.filter(c => c.sentiment_score).length
      : null;
    
    sections.communication_analysis = {
      total_communications: communications?.length || 0,
      total_messages: profileMessages.length,
      preferred_channels: commPrefs?.preferred_channels,
      communication_style: commPrefs?.communication_style,
      average_sentiment: avgSentiment,
      recent_topics: commPrefs?.favorite_topics,
      topics_to_avoid: commPrefs?.topics_to_avoid,
      response_speed: commPrefs?.response_speed,
    };

    // 8. Geographic Intelligence
    sections.geographic = {
      known_locations: locations?.map(l => ({
        type: l.location_type,
        name: l.location_name,
        city: l.city,
        country: l.country,
        is_current: l.is_current,
        confidence: l.confidence_score,
      })),
      travel_history: travelHistory?.slice(0, 10).map(t => ({
        destination: t.destination_city,
        country: t.destination_country,
        date: t.travel_date,
        purpose: t.travel_purpose,
      })),
    };

    // 9. Active Alerts & Anomalies
    sections.alerts = {
      active_anomalies: anomalies?.map(a => ({
        type: a.anomaly_type,
        severity: a.severity,
        description: a.description,
        detected_at: a.detected_at,
      })),
    };

    // 10. Key Findings & Recommendations (AI-generated via unified client)
    let keyFindings: any[] = [];
    let recommendations: any[] = [];
    let riskAssessment: any = null;

    try {
      const aiResponse = await callAI({
        model: selectModel('quality'), // Use quality model for dossiers
        messages: [
          {
            role: 'system',
            content: `You are an intelligence analyst generating a ${dossier_type} dossier. Analyze the provided data and generate:
1. Key findings (3-7 critical insights)
2. Risk assessment (overall risk level and specific risks)
3. Strategic recommendations (3-5 actionable items)

Be objective, evidence-based, and professionally formatted. Output as JSON with structure:
{
  "key_findings": [{"finding": "...", "importance": "high|medium|low", "evidence": "..."}],
  "risk_assessment": {"overall_risk": "low|medium|high|critical", "specific_risks": [{"risk": "...", "likelihood": "...", "impact": "..."}]},
  "recommendations": [{"action": "...", "priority": "...", "rationale": "..."}]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              dossier_type,
              executive_summary: sections.executive_summary,
              trust_assessment: sections.trust_assessment,
              psychological_summary: sections.psychological?.profile ? {
                personality: sections.psychological.profile.personality_assessment,
                risk_markers: sections.psychological.profile.risk_markers,
              } : null,
              active_anomalies: sections.alerts.active_anomalies,
              relationship_type: profile.relationship_type,
            })
          }
        ],
        userId,
        functionName: 'generate-dossier',
        profileId: profile_id,
        maxTokens: 1500,
      });

      const parsed = parseAIJson(aiResponse.content, { key_findings: [], risk_assessment: null, recommendations: [] });
      keyFindings = parsed.key_findings || [];
      riskAssessment = parsed.risk_assessment;
      recommendations = parsed.recommendations || [];
    } catch (e) {
      console.error('AI dossier generation error:', e);
    }

    sections.key_findings = keyFindings;
    sections.risk_assessment = riskAssessment;
    sections.recommendations = recommendations;

    // Generate summary
    const summary = `Intelligence dossier for ${profile.first_name} ${profile.last_name} (${profile.relationship_type || 'Contact'}). ` +
      `Trust score: ${trustAssessment?.overall_trust_score || 'N/A'}. ` +
      `${anomalies?.length || 0} active anomalies. ` +
      `Last contact: ${profile.last_contact_date || 'Unknown'}. ` +
      `Data sources: ${Object.keys(sections).length} sections analyzed.`;

    // Store dossier
    const dossierData = {
      user_id: userId,
      profile_id,
      dossier_type,
      title: `${dossier_type.replace('_', ' ').toUpperCase()} - ${profile.first_name} ${profile.last_name}`,
      classification,
      sections,
      summary,
      key_findings: keyFindings,
      risk_assessment: riskAssessment,
      recommendations,
      data_sources_used: Object.keys(sections),
      ai_model_used: 'google/gemini-2.5-flash',
      generated_at: new Date().toISOString(),
    };

    const { data: dossier, error: insertError } = await supabase
      .from('dossiers')
      .insert(dossierData)
      .select()
      .single();

    if (insertError) throw insertError;

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
