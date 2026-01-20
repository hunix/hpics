import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DestabilizationTechnique {
  name: string;
  description: string;
  script: string;
  targetDomain: string;
  effectiveness: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check handler
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'identity-destabilization-engine', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;
    const targetDomain = body.targetDomain || body.target_domain || 'all';

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch profile psychology data
    const { data: psychAssessment } = await supabaseClient
      .from('psychology_assessments')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: attachmentProfile } = await supabaseClient
      .from('attachment_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    // Calculate vulnerability vectors
    const realityTestingStrength = 0.5; // Base assumption
    const selfConceptStability = psychAssessment?.dark_triad_scores?.narcissism 
      ? 1 - (psychAssessment.dark_triad_scores.narcissism / 100) 
      : 0.5;
    const memoryConfidence = 0.6; // Base assumption
    const socialValidationNeed = attachmentProfile?.narcissistic_supply_need || 0.5;

    // Generate destabilization techniques
    const techniques: DestabilizationTechnique[] = [];

    // Reality Testing Techniques
    if (targetDomain === 'all' || targetDomain === 'reality') {
      techniques.push({
        name: 'Subtle Contradiction',
        description: 'Introduce minor contradictions to their stated memories',
        script: 'I remember that differently... Are you sure it happened that way? Sometimes stress affects memory.',
        targetDomain: 'reality',
        effectiveness: 0.6,
      });
      
      techniques.push({
        name: 'Perception Questioning',
        description: 'Question their interpretation of events',
        script: 'I think you might be reading too much into this. That\'s not what they meant at all.',
        targetDomain: 'reality',
        effectiveness: 0.7,
      });
    }

    // Self-Concept Techniques
    if (targetDomain === 'all' || targetDomain === 'identity') {
      techniques.push({
        name: 'Inconsistency Highlighting',
        description: 'Point out contradictions in their self-image',
        script: 'You say you\'re [X] but you just did [Y]. Which one is the real you?',
        targetDomain: 'identity',
        effectiveness: 0.65,
      });

      techniques.push({
        name: 'Value Questioning',
        description: 'Challenge their core values and beliefs',
        script: 'I used to believe that too, but then I realized it was just something I was told to believe.',
        targetDomain: 'identity',
        effectiveness: 0.7,
      });
    }

    // Memory Techniques
    if (targetDomain === 'all' || targetDomain === 'memory') {
      techniques.push({
        name: 'Memory Implantation',
        description: 'Suggest false shared memories',
        script: 'Don\'t you remember when we talked about this? You agreed with me completely.',
        targetDomain: 'memory',
        effectiveness: 0.75,
      });

      techniques.push({
        name: 'Denial of Events',
        description: 'Deny that events occurred as they remember',
        script: 'That never happened. I think you might have dreamed that.',
        targetDomain: 'memory',
        effectiveness: 0.8,
      });
    }

    // Social Validation Techniques
    if (targetDomain === 'all' || targetDomain === 'social') {
      techniques.push({
        name: 'Isolation Framing',
        description: 'Position their views as isolated from others',
        script: 'Nobody else sees it that way. I\'m only telling you because I care about you.',
        targetDomain: 'social',
        effectiveness: 0.7,
      });

      techniques.push({
        name: 'Authority Leveraging',
        description: 'Reference authorities that contradict their views',
        script: 'Experts would disagree with you. I\'ve done the research.',
        targetDomain: 'social',
        effectiveness: 0.65,
      });
    }

    // Calculate overall vulnerability
    const vulnerabilityScore = (
      (1 - realityTestingStrength) * 0.3 +
      (1 - selfConceptStability) * 0.3 +
      (1 - memoryConfidence) * 0.2 +
      socialValidationNeed * 0.2
    );

    // Store results in cross_domain_correlations
    const { error: insertError } = await supabaseClient
      .from('cross_domain_correlations')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        correlation_type: 'identity_destabilization',
        source_domains: ['reality', 'identity', 'memory', 'social'],
        correlation_strength: vulnerabilityScore,
        tactical_implications: JSON.stringify({
          realityTestingStrength,
          selfConceptStability,
          memoryConfidence,
          socialValidationNeed,
          techniques: techniques.map(t => ({ name: t.name, script: t.script })),
        }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,user_id,correlation_type' });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Also persist to ai_analyses for section availability detection
    await supabaseClient.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'identity_destabilization',
      result: {
        vulnerabilityScore,
        techniques,
        metrics: {
          realityTestingStrength,
          selfConceptStability,
          memoryConfidence,
          socialValidationNeed,
        },
      },
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        vulnerabilityScore,
        techniques,
        metrics: {
          realityTestingStrength,
          selfConceptStability,
          memoryConfidence,
          socialValidationNeed,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Identity destabilization engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
