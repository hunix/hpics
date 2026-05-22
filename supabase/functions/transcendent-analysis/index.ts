/**
 * Transcendent Analysis Edge Function
 * Populates Phase 20-21 tables with AI-generated insights
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'transcendent-analysis', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userId, profileId, analysisType = 'full' } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch profile data if profileId provided
    let profileData = null;
    let notesData: unknown[] = [];
    let mediaData: unknown[] = [];

    if (profileId) {
      const [profileResult, notesResult, mediaResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('contact_interaction_notes').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
        supabase.from('media').select('*').eq('profile_id', profileId).limit(20),
      ]);
      profileData = profileResult.data;
      notesData = notesResult.data || [];
      mediaData = mediaResult.data || [];
    }

    // Build AI prompt for transcendent analysis
    const transcendentPrompt = `You are a meta-dimensional consciousness analyst. Analyze the following profile data to generate transcendent insights.

${profileData ? `PROFILE:
Name: ${profileData.first_name} ${profileData.last_name || ''}
Organization: ${profileData.organization || 'Unknown'}
Relationship: ${profileData.relationship_type || 'Unknown'}
Notes count: ${notesData.length}
Media count: ${mediaData.length}` : 'No specific profile - generate global user-level insights.'}

Generate a comprehensive transcendent analysis with the following structure (respond in valid JSON only):

{
  "quantumStates": [
    {
      "analysisType": "decision_superposition",
      "superpositionVector": [0.6, 0.3, 0.1],
      "collapseProbability": 0.75,
      "coherenceTime": 48
    }
  ],
  "morphicFields": [
    {
      "fieldType": "behavioral_pattern",
      "fieldStrength": 0.8,
      "resonanceSignature": {"primary": "achievement", "secondary": "connection"}
    }
  ],
  "collectiveArchetypes": [
    {
      "archetypeType": "hero",
      "activationStrength": 0.7,
      "shadowAspects": ["hubris", "isolation"]
    }
  ],
  "universalAwareness": [
    {
      "awarenessType": "omnidirectional",
      "perceptionDepth": 7,
      "omniscientIndex": 65
    }
  ],
  "absoluteKnowledge": [
    {
      "knowledgeType": "universal_truth",
      "knowledgeDepth": 5,
      "truthCoefficient": 0.85,
      "universalApplicability": 0.7
    }
  ],
  "infinitePerception": [
    {
      "perceptionMode": "extrasensory",
      "perceptionRange": 8,
      "clarityIndex": 72
    }
  ]
}

Be creative but maintain internally consistent metrics. All scores should be between 0-1 or 0-100 as appropriate.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: transcendentPrompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', content);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const insertResults: Record<string, number> = {};

    // Insert quantum states
    if (analysis.quantumStates?.length) {
      const rows = analysis.quantumStates.map((qs: Record<string, unknown>) => ({
        user_id: userId,
        profile_id: profileId || null,
        analysis_type: qs.analysisType || 'quantum_analysis',
        superposition_vector: qs.superpositionVector || [0.5, 0.5],
        collapse_probability: qs.collapseProbability || 0.5,
        coherence_time: qs.coherenceTime || 24,
      }));
      const { error } = await supabase.from('quantum_states').insert(rows);
      if (!error) insertResults.quantumStates = rows.length;
    }

    // Insert morphic fields
    if (analysis.morphicFields?.length) {
      const rows = analysis.morphicFields.map((mf: Record<string, unknown>) => ({
        user_id: userId,
        profile_id: profileId || null,
        field_type: mf.fieldType || 'behavioral_pattern',
        field_strength: mf.fieldStrength || 0.5,
        resonance_signature: mf.resonanceSignature || {},
      }));
      const { error } = await supabase.from('morphic_fields').insert(rows);
      if (!error) insertResults.morphicFields = rows.length;
    }

    // Insert archetypal activations
    if (analysis.collectiveArchetypes?.length) {
      const rows = analysis.collectiveArchetypes.map((ca: Record<string, unknown>) => ({
        user_id: userId,
        profile_id: profileId || null,
        archetype_type: ca.archetypeType || 'unknown',
        activation_strength: ca.activationStrength || 0.5,
        shadow_aspects: ca.shadowAspects || [],
      }));
      const { error } = await supabase.from('archetypal_activations').insert(rows);
      if (!error) insertResults.collectiveArchetypes = rows.length;
    }

    // Insert universal awareness
    if (analysis.universalAwareness?.length) {
      const rows = analysis.universalAwareness.map((ua: Record<string, unknown>) => ({
        user_id: userId,
        profile_id: profileId || null,
        awareness_type: ua.awarenessType || 'omnidirectional',
        perception_depth: ua.perceptionDepth || 5,
        omniscient_index: ua.omniscientIndex || 50,
      }));
      const { error } = await supabase.from('universal_awareness').insert(rows);
      if (!error) insertResults.universalAwareness = rows.length;
    }

    // Insert absolute knowledge
    if (analysis.absoluteKnowledge?.length) {
      const rows = analysis.absoluteKnowledge.map((ak: Record<string, unknown>) => ({
        user_id: userId,
        profile_id: profileId || null,
        knowledge_type: ak.knowledgeType || 'universal_truth',
        knowledge_depth: ak.knowledgeDepth || 5,
        truth_coefficient: ak.truthCoefficient || 0.5,
        universal_applicability: ak.universalApplicability || 0.5,
      }));
      const { error } = await supabase.from('absolute_knowledge').insert(rows);
      if (!error) insertResults.absoluteKnowledge = rows.length;
    }

    // Insert infinite perception
    if (analysis.infinitePerception?.length) {
      const rows = analysis.infinitePerception.map((ip: Record<string, unknown>) => ({
        user_id: userId,
        profile_id: profileId || null,
        perception_mode: ip.perceptionMode || 'extrasensory',
        perception_range: ip.perceptionRange || 5,
        clarity_index: ip.clarityIndex || 50,
      }));
      const { error } = await supabase.from('infinite_perception').insert(rows);
      if (!error) insertResults.infinitePerception = rows.length;
    }

    console.log('Transcendent analysis complete:', insertResults);

    return new Response(JSON.stringify({
      success: true,
      profileId,
      analysisType,
      insertedRecords: insertResults,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Transcendent analysis error:', error);
    return new Response(JSON.stringify({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
