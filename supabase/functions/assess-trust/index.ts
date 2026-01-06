import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile_id } = await req.json();
    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'profile_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all relevant data for cross-referencing
    const [
      { data: personalInfo },
      { data: observations },
      { data: communications },
      { data: behavioralAnalyses },
      { data: facialAnalyses },
      { data: vocalAnalyses },
      { data: identityDocs },
      { data: education },
      { data: certifications },
      { data: interactionNotes },
    ] = await Promise.all([
      supabase.from('contact_personal_info').select('*').eq('profile_id', profile_id).maybeSingle(),
      supabase.from('contact_observations').select('*').eq('profile_id', profile_id),
      supabase.from('communications').select('*').eq('profile_id', profile_id).order('occurred_at', { ascending: false }).limit(50),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profile_id).limit(5),
      supabase.from('facial_analyses').select('*').eq('profile_id', profile_id).limit(5),
      supabase.from('vocal_analyses').select('*').eq('profile_id', profile_id).limit(5),
      supabase.from('contact_identity_documents').select('*').eq('profile_id', profile_id),
      supabase.from('education').select('*').eq('profile_id', profile_id),
      supabase.from('certifications').select('*').eq('profile_id', profile_id),
      supabase.from('contact_interaction_notes').select('*').eq('profile_id', profile_id).limit(20),
    ]);

    // Calculate consistency score - how consistent is the data across sources
    const inconsistencies: any[] = [];
    const deceptionIndicators: any[] = [];
    let consistencyPoints = 100;
    let authenticityPoints = 100;

    // Check for data completeness
    const hasPhoto = !!profile.avatar_url;
    const hasVerifiedDocs = identityDocs?.some(d => d.parsed_data) || false;
    const hasEducationHistory = (education?.length || 0) > 0;
    const hasBehavioralAnalysis = (behavioralAnalyses?.length || 0) > 0;

    const dataSources = [
      hasPhoto && 'photo',
      hasVerifiedDocs && 'identity_documents',
      hasEducationHistory && 'education',
      hasBehavioralAnalysis && 'behavioral_analysis',
      (communications?.length || 0) > 5 && 'communication_history',
    ].filter(Boolean);

    // Cross-reference name consistency
    if (personalInfo) {
      const profileName = `${profile.first_name} ${profile.last_name}`.toLowerCase().trim();
      if (personalInfo.full_legal_name) {
        const legalName = personalInfo.full_legal_name.toLowerCase().trim();
        if (!legalName.includes(profile.first_name?.toLowerCase() || '') && 
            !legalName.includes(profile.last_name?.toLowerCase() || '')) {
          inconsistencies.push({
            type: 'name_mismatch',
            description: 'Profile name does not match legal name on record',
            severity: 'medium',
            sources: ['profile', 'personal_info'],
          });
          consistencyPoints -= 15;
        }
      }
    }

    // Check identity document consistency
    if (identityDocs && identityDocs.length > 0) {
      const docNames = identityDocs
        .filter(d => d.parsed_data?.full_name)
        .map(d => (d.parsed_data as any).full_name.toLowerCase());
      
      if (docNames.length > 1) {
        const allSame = docNames.every(n => n === docNames[0]);
        if (!allSame) {
          inconsistencies.push({
            type: 'document_name_variance',
            description: 'Names vary across identity documents',
            severity: 'high',
            sources: ['identity_documents'],
          });
          consistencyPoints -= 20;
          deceptionIndicators.push({
            type: 'identity_inconsistency',
            confidence: 0.7,
            description: 'Multiple identity documents show different names',
          });
        }
      }
    }

    // Analyze behavioral consistency
    if (behavioralAnalyses && behavioralAnalyses.length > 1) {
      const personalities = behavioralAnalyses
        .map(a => (a.personality_indicators as any))
        .filter(Boolean);
      
      // Check for major personality shifts
      if (personalities.length >= 2) {
        const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
        let shiftCount = 0;
        
        for (const trait of traits) {
          const values = personalities.map(p => p[trait]).filter(v => v !== undefined);
          if (values.length >= 2) {
            const max = Math.max(...values);
            const min = Math.min(...values);
            if (max - min > 30) {
              shiftCount++;
            }
          }
        }
        
        if (shiftCount >= 2) {
          inconsistencies.push({
            type: 'personality_inconsistency',
            description: `Major personality trait variations detected across ${shiftCount} dimensions`,
            severity: 'medium',
          });
          consistencyPoints -= 10;
        }
      }
    }

    // Analyze vocal patterns for authenticity
    if (vocalAnalyses && vocalAnalyses.length > 0) {
      const stressIndicators = vocalAnalyses
        .map(a => (a.raw_analysis as any)?.stress_indicators)
        .filter(Boolean);
      
      const highStressCount = stressIndicators.filter((s: any) => 
        s.overall_stress === 'high' || s.deception_markers?.length > 0
      ).length;
      
      if (highStressCount > stressIndicators.length * 0.5) {
        deceptionIndicators.push({
          type: 'vocal_stress_pattern',
          confidence: 0.6,
          description: 'Frequent high stress or deception markers in vocal analysis',
        });
        authenticityPoints -= 15;
      }
    }

    // Check observation validation status
    if (observations && observations.length > 0) {
      const validatedObs = observations.filter(o => o.ai_validation_status === 'validated');
      const contradictedObs = observations.filter(o => o.ai_validation_status === 'contradicted');
      
      if (contradictedObs.length > validatedObs.length && contradictedObs.length > 0) {
        inconsistencies.push({
          type: 'observation_contradictions',
          description: `${contradictedObs.length} observations contradicted by AI analysis`,
          severity: 'medium',
        });
        consistencyPoints -= contradictedObs.length * 5;
      }
    }

    // Calculate verification status
    let verificationStatus = 'unverified';
    if (hasVerifiedDocs && dataSources.length >= 3) {
      verificationStatus = 'verified';
    } else if (dataSources.length >= 2) {
      verificationStatus = 'partially_verified';
    }
    if (deceptionIndicators.length >= 2 || inconsistencies.filter(i => i.severity === 'high').length > 0) {
      verificationStatus = 'suspicious';
    }

    // Calculate final scores
    const consistencyScore = Math.max(0, consistencyPoints);
    const authenticityScore = Math.max(0, authenticityPoints);
    const overallTrustScore = Math.round(
      (consistencyScore * 0.4 + authenticityScore * 0.4 + (dataSources.length / 5) * 100 * 0.2)
    );

    // Use AI for deeper assessment if we have enough data
    let aiAssessment = null;
    if (dataSources.length >= 3) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `You are a counter-intelligence analyst assessing the trustworthiness and authenticity of a contact profile. Analyze the data for inconsistencies, deception indicators, and provide a brief assessment. Be objective and evidence-based.`
                },
                {
                  role: 'user',
                  content: JSON.stringify({
                    profile: { name: `${profile.first_name} ${profile.last_name}`, organization: profile.organization },
                    inconsistencies_found: inconsistencies,
                    deception_indicators: deceptionIndicators,
                    data_sources: dataSources,
                    recent_communications_count: communications?.length || 0,
                    observations_summary: observations?.slice(0, 5).map(o => ({ category: o.category, content: o.observation_text?.substring(0, 100) })),
                  })
                }
              ],
              max_tokens: 500,
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            aiAssessment = aiData.choices?.[0]?.message?.content;
          }
        } catch (e) {
          console.error('AI assessment error:', e);
        }
      }
    }

    // Store trust assessment
    const trustData = {
      user_id: user.id,
      profile_id,
      overall_trust_score: overallTrustScore,
      authenticity_score: authenticityScore,
      consistency_score: consistencyScore,
      deception_indicators: deceptionIndicators,
      inconsistencies,
      verification_status: verificationStatus,
      evidence_summary: `Based on ${dataSources.length} data sources: ${dataSources.join(', ')}`,
      ai_assessment: aiAssessment,
      confidence_level: Math.min(100, dataSources.length * 20),
      data_sources_analyzed: dataSources,
      last_assessment_at: new Date().toISOString(),
    };

    await supabase
      .from('trust_assessments')
      .upsert(trustData, { onConflict: 'user_id,profile_id' });

    return new Response(JSON.stringify({
      success: true,
      assessment: trustData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Trust assessment error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
