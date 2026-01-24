import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";
import { getRAGContext } from "../_shared/rag-helper.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create service role client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Validate JWT using getUser (modern pattern)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Note: Already using service role client from above

    const { profile_id, analysis_depth = 'comprehensive', focus_areas, model_preference } = await req.json();

    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'profile_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting deep psychological analysis for profile ${profile_id}, depth: ${analysis_depth}`);

    // ============================================
    // PHASE 1: Aggregate ALL data sources
    // ============================================
    
    const dataSources: Record<string, any> = {};

    // 1. Profile basic info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    dataSources.profile = profile;

    // 2. ALL messages from conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);

    let allMessages: any[] = [];
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c: { id: string }) => c.id);
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('timestamp', { ascending: false })
        .limit(5000); // Get up to 5000 messages for analysis
      allMessages = messages || [];
    }
    dataSources.messages = {
      count: allMessages.length,
      sample: allMessages.slice(0, 500), // Send 500 for context
      date_range: allMessages.length > 0 ? {
        start: allMessages[allMessages.length - 1]?.timestamp,
        end: allMessages[0]?.timestamp
      } : null
    };

    // 3. Media with AI metadata
    const { data: media } = await supabase
      .from('media')
      .select('id, media_type, caption, ai_metadata, created_at')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .not('ai_metadata', 'is', null)
      .limit(100);
    dataSources.media = media || [];

    // 4. Documents with AI metadata
    const { data: documents } = await supabase
      .from('documents')
      .select('id, name, document_type, ai_metadata, created_at')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .not('ai_metadata', 'is', null)
      .limit(50);
    dataSources.documents = documents || [];

    // 5. Voice/Video recordings with transcriptions
    const { data: recordings } = await supabase
      .from('meeting_recordings')
      .select('id, title, transcription, duration_seconds, created_at')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .not('transcription', 'is', null)
      .limit(20);
    dataSources.recordings = recordings || [];

    // 6. Previous behavioral analyses
    const { data: behavioralAnalyses } = await supabase
      .from('behavioral_analyses')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    dataSources.behavioral_analyses = behavioralAnalyses || [];

    // 7. Previous facial analyses
    const { data: facialAnalyses } = await supabase
      .from('facial_analyses')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    dataSources.facial_analyses = facialAnalyses || [];

    // 8. Previous body language analyses
    const { data: bodyAnalyses } = await supabase
      .from('body_language_analyses')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    dataSources.body_analyses = bodyAnalyses || [];

    // 9. Previous vocal analyses
    const { data: vocalAnalyses } = await supabase
      .from('vocal_analyses')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    dataSources.vocal_analyses = vocalAnalyses || [];

    // 10. User observations
    const { data: observations } = await supabase
      .from('contact_observations')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);
    dataSources.observations = observations || [];

    // 11. Communications (calls, emails, etc.)
    const { data: communications } = await supabase
      .from('communications')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(200);
    dataSources.communications = communications || [];

    // 12. Relationships
    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select(`
        *,
        from_profile:profiles!contact_relationships_from_profile_id_fkey(first_name, last_name),
        to_profile:profiles!contact_relationships_to_profile_id_fkey(first_name, last_name)
      `)
      .or(`from_profile_id.eq.${profile_id},to_profile_id.eq.${profile_id}`)
      .eq('user_id', user.id);
    dataSources.relationships = relationships || [];

    // 13. Personal info
    const { data: personalInfo } = await supabase
      .from('contact_personal_info')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .single();
    dataSources.personal_info = personalInfo;

    // 14. Interests
    const { data: interests } = await supabase
      .from('contact_interests')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);
    dataSources.interests = interests || [];

    // 15. Skills
    const { data: skills } = await supabase
      .from('contact_skills')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);
    dataSources.skills = skills || [];

    // 16. Education
    const { data: education } = await supabase
      .from('education')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);
    dataSources.education = education || [];

    // 17. Certifications
    const { data: certifications } = await supabase
      .from('certifications')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);
    dataSources.certifications = certifications || [];

    // 18. Travel history
    const { data: travelHistory } = await supabase
      .from('contact_travel_history')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);
    dataSources.travel_history = travelHistory || [];

    // 19. Financial history
    const { data: financialHistory } = await supabase
      .from('contact_financial_history')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id);
    dataSources.financial_history = financialHistory || [];

    // 20. Conversation analyses
    const { data: conversationAnalyses } = await supabase
      .from('conversation_analyses')
      .select('*')
      .eq('user_id', user.id)
      .limit(10);
    dataSources.conversation_analyses = conversationAnalyses || [];

    // Calculate data completeness
    const dataCompleteness = calculateDataCompleteness(dataSources);
    console.log(`Data completeness: ${dataCompleteness}%`);

    // ============================================
    // PHASE 2: Prepare analysis prompts
    // ============================================

    const contactName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'This person';
    
    // Get RAG context for enhanced analysis
    const ragContext = await getRAGContext(
      user.id,
      profile_id,
      `${contactName} psychological analysis personality behavior patterns`,
      { maxResults: 15, sourceTypes: ['document', 'observation', 'analysis', 'communication'] }
    );

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(contactName, dataSources, analysis_depth, focus_areas) + 
      (ragContext.sourceCount > 0 ? `\n\n## Additional Context from Documents:\n${ragContext.context}` : '');

    console.log(`Sending to AI for analysis with ${ragContext.sourceCount} RAG sources...`);

    // ============================================
    // PHASE 3: Call AI for comprehensive analysis using unified client
    // ============================================

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, user.id);
    const preferredModel = model_preference || aiConfig.qualityModel; // Use quality model for deep analysis
    
    console.log(`Using model: ${preferredModel}`);
    
    const aiResult = await callAI({
      model: preferredModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'deep-psychological-analysis',
      profileId: profile_id,
      temperature: 0.3,
      maxTokens: 16000,
      metadata: { analysis_depth, dataCompleteness },
      enforceBudget: true,
    });

    console.log(`AI analysis received (${aiResult.totalTokens} tokens, ${aiResult.costCents}¢)`);

    // ============================================
    // PHASE 4: Parse AI response
    // ============================================

    // Parse AI response - use any for flexible structure
    const analysisResult: any = parseAIJson(aiResult.content, {
      personality_ocean: null,
      dark_triad: null,
      attachment_style: null,
      emotional_intelligence: null,
      cognitive_profile: null,
      communication_dna: null,
      psychiatric_indicators: null,
      deception_analysis: null,
      behavioral_predictions: null,
      flags: { red_flags: [], yellow_flags: [], green_flags: [], certainties: [] },
      action_plans: { immediate: [], short_term: [], long_term: [], do_not_do: [] },
      relationship_dynamics: null,
      values_profile: null,
      confidence_score: 30,
      raw_analysis: aiResult.content
    });

    // ============================================
    // PHASE 5: Save to database
    // ============================================

    const dataSourcesUsed = {
      messages: { count: dataSources.messages.count, date_range: dataSources.messages.date_range },
      media: { count: dataSources.media.length, types: [...new Set(dataSources.media.map((m: any) => m.media_type))] },
      voice_recordings: { count: dataSources.recordings.length, total_duration_minutes: dataSources.recordings.reduce((acc: number, r: any) => acc + (r.duration_seconds || 0) / 60, 0) },
      documents: { count: dataSources.documents.length, types: [...new Set(dataSources.documents.map((d: any) => d.document_type))] },
      behavioral_analyses: { count: dataSources.behavioral_analyses.length },
      facial_analyses: { count: dataSources.facial_analyses.length },
      vocal_analyses: { count: dataSources.vocal_analyses.length },
      body_language_analyses: { count: dataSources.body_analyses.length },
      observations: { count: dataSources.observations.length },
      communications: { count: dataSources.communications.length },
      relationships: { count: dataSources.relationships.length },
    };

    // Check for existing profile
    const { data: existingProfile } = await supabase
      .from('psychological_profiles')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('user_id', user.id)
      .single();

    let savedProfile;
    const profileData = {
      profile_id,
      user_id: user.id,
      personality_ocean: analysisResult.personality_ocean,
      dark_triad: analysisResult.dark_triad,
      hexaco_honesty_humility: analysisResult.hexaco_honesty_humility,
      attachment_style: analysisResult.attachment_style,
      emotional_intelligence: analysisResult.emotional_intelligence,
      cognitive_profile: analysisResult.cognitive_profile,
      communication_dna: analysisResult.communication_dna,
      psychiatric_indicators: analysisResult.psychiatric_indicators,
      deception_analysis: analysisResult.deception_analysis,
      behavioral_predictions: analysisResult.behavioral_predictions,
      flags: analysisResult.flags,
      action_plans: analysisResult.action_plans,
      relationship_dynamics: analysisResult.relationship_dynamics,
      values_profile: analysisResult.values_profile,
      confidence_score: analysisResult.confidence_score || calculateConfidenceScore(analysisResult, dataCompleteness),
      data_completeness: dataCompleteness,
      data_sources_used: dataSourcesUsed,
      last_analysis_at: new Date().toISOString(),
      analysis_version: '1.0',
      analysis_model: preferredModel,
    };

    if (existingProfile) {
      // Save history first
      const { data: oldProfile } = await supabase
        .from('psychological_profiles')
        .select('*')
        .eq('id', existingProfile.id)
        .single();

      if (oldProfile) {
        await supabase.from('psychological_profile_history').insert({
          psychological_profile_id: existingProfile.id,
          user_id: user.id,
          snapshot: oldProfile,
          trigger_event: 'manual_reanalysis',
          changes_summary: 'Full reanalysis requested',
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from('psychological_profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      savedProfile = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('psychological_profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) throw insertError;
      savedProfile = inserted;
    }

    console.log(`Psychological profile saved: ${savedProfile.id}`);

    return new Response(JSON.stringify({
      success: true,
      profile: savedProfile,
      is_new: !existingProfile,
      data_sources_summary: dataSourcesUsed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in deep-psychological-analysis:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateDataCompleteness(dataSources: Record<string, any>): number {
  const weights = {
    messages: 25,
    behavioral_analyses: 15,
    facial_analyses: 10,
    vocal_analyses: 10,
    body_analyses: 10,
    observations: 10,
    communications: 5,
    media: 5,
    recordings: 5,
    interests: 2,
    personal_info: 3,
  };

  let score = 0;
  if (dataSources.messages?.count > 0) score += Math.min(weights.messages, dataSources.messages.count / 100 * weights.messages);
  if (dataSources.behavioral_analyses?.length > 0) score += weights.behavioral_analyses;
  if (dataSources.facial_analyses?.length > 0) score += weights.facial_analyses;
  if (dataSources.vocal_analyses?.length > 0) score += weights.vocal_analyses;
  if (dataSources.body_analyses?.length > 0) score += weights.body_analyses;
  if (dataSources.observations?.length > 0) score += Math.min(weights.observations, dataSources.observations.length / 5 * weights.observations);
  if (dataSources.communications?.length > 0) score += weights.communications;
  if (dataSources.media?.length > 0) score += weights.media;
  if (dataSources.recordings?.length > 0) score += weights.recordings;
  if (dataSources.interests?.length > 0) score += weights.interests;
  if (dataSources.personal_info) score += weights.personal_info;

  return Math.round(Math.min(100, score));
}

function calculateConfidenceScore(result: any, dataCompleteness: number): number {
  let baseConfidence = dataCompleteness * 0.5; // Data completeness contributes 50%
  
  // Check how many analysis sections have data
  const sections = [
    result.personality_ocean,
    result.dark_triad,
    result.attachment_style,
    result.emotional_intelligence,
    result.cognitive_profile,
    result.communication_dna,
    result.behavioral_predictions,
  ];
  
  const filledSections = sections.filter(s => s !== null && s !== undefined).length;
  baseConfidence += (filledSections / sections.length) * 50; // Filled sections contribute 50%
  
  return Math.round(Math.min(100, baseConfidence));
}

function buildSystemPrompt(): string {
  return `You are a clinical psychologist and behavioral analyst with expertise in:
- DSM-5 diagnostic criteria (for screening indicators only, NOT diagnoses)
- Big Five personality theory with NEO-PI-R 30 sub-facets
- Dark Triad research (Paulhus & Williams)
- Attachment theory (Bowlby, Ainsworth, Main)
- Emotional Intelligence (Goleman, Mayer-Salovey-Caruso)
- Cognitive behavioral patterns
- Deception detection research (Vrij, DePaulo meta-analyses)
- Schwartz values theory

Your task is to synthesize ALL provided data into a comprehensive psychological profile.

CRITICAL GUIDELINES:
1. Every conclusion MUST cite specific evidence (quote messages, reference specific behaviors)
2. Assign confidence levels (0-100) for each assessment with justification
3. Note contradicting evidence when present
4. Frame psychiatric indicators as "patterns suggesting" not "diagnosed with"
5. Be direct and actionable - this is for personal relationship intelligence
6. Identify RED FLAGS (critical concerns), YELLOW FLAGS (monitor), GREEN FLAGS (positive indicators)
7. Provide specific, actionable recommendations

OUTPUT FORMAT: Return a valid JSON object with this exact structure:
{
  "personality_ocean": {
    "openness": {"score": 0-100, "confidence": 0-100, "evidence_count": n, "sub_facets": {...}},
    "conscientiousness": {...},
    "extraversion": {...},
    "agreeableness": {...},
    "neuroticism": {...}
  },
  "dark_triad": {
    "narcissism": {"score": 0-100, "confidence": 0-100, "indicators": [], "behavioral_manifestations": []},
    "machiavellianism": {...},
    "psychopathy": {...},
    "overall_risk_level": "low"|"moderate"|"elevated"|"high"
  },
  "attachment_style": {
    "primary_style": "secure"|"anxious"|"avoidant"|"disorganized",
    "security_score": 0-100,
    "anxiety_score": 0-100,
    "avoidance_score": 0-100,
    "evidence": [],
    "relationship_patterns": [],
    "recommended_approach": ""
  },
  "emotional_intelligence": {
    "overall_eq": 0-100,
    "self_awareness": {"score": 0-100, "confidence": 0-100, "strengths": [], "growth_areas": [], "evidence": []},
    "self_regulation": {...},
    "motivation": {...},
    "empathy": {...},
    "social_skills": {...}
  },
  "cognitive_profile": {
    "thinking_style": {"primary": "", "confidence": 0-100, "evidence": []},
    "decision_making": {"style": "", "speed": "", "confidence": 0-100},
    "risk_tolerance": {"level": "", "financial": "", "social": "", "confidence": 0-100},
    "learning_style": {"primary": "", "adaptability": 0-100},
    "complexity_handling": {"comfort_level": 0-100, "ambiguity_tolerance": 0-100},
    "time_orientation": {"primary": "", "planning_horizon": ""}
  },
  "communication_dna": {
    "primary_style": "",
    "conflict_style": "",
    "influence_tactics": [],
    "persuasion_susceptibility": {...},
    "listening_quality": 0-100,
    "assertiveness": 0-100,
    "directness": 0-100,
    "emotional_expressiveness": 0-100,
    "preferred_channels": [],
    "response_time_pattern": ""
  },
  "psychiatric_indicators": {
    "anxiety_markers": {"indicator_level": "", "confidence": 0-100, "observed_patterns": [], "disclaimer": ""},
    "depression_indicators": {...},
    "stress_vulnerability": {...},
    "emotional_dysregulation": {...},
    "trauma_indicators": {...},
    "overall_mental_wellness": 0-100,
    "professional_referral_suggested": boolean,
    "disclaimer": "These are behavioral patterns, not clinical diagnoses"
  },
  "deception_analysis": {
    "authenticity_score": 0-100,
    "consistency_score": 0-100,
    "deception_patterns": {"frequency": "", "types": [], "trigger_topics": []},
    "topic_sensitivities": [],
    "baseline_established": boolean,
    "anomalies_detected": []
  },
  "behavioral_predictions": {
    "reliability_forecast": {"score": 0-100, "confidence": 0-100, "factors": [], "timeframe": "", "commitment_follow_through": 0-100, "punctuality": 0-100, "promise_keeping": 0-100},
    "conflict_probability": {"score": 0-100, "confidence": 0-100, "factors": [], "timeframe": "", "likely_triggers": [], "escalation_risk": "", "de_escalation_strategies": []},
    "engagement_trend": {"score": 0-100, "confidence": 0-100, "factors": [], "timeframe": "", "trajectory": "", "investment_level": "", "reciprocity_balance": 0},
    "crisis_response": {"predicted_behavior": "", "support_seeking": "", "resilience_level": 0-100, "recommended_support_approach": ""}
  },
  "flags": {
    "red_flags": [{"id": "", "title": "", "description": "", "severity": "critical", "confidence": 0-100, "evidence": [], "first_detected": "", "still_active": true, "recommended_action": "", "category": ""}],
    "yellow_flags": [...],
    "green_flags": [...],
    "certainties": [{"id": "", "statement": "", "confidence": 90+, "evidence_sources": [], "consistency_over_time": boolean, "cross_validated": boolean}]
  },
  "action_plans": {
    "immediate": [{"id": "", "title": "", "description": "", "priority": "", "category": "", "specific_scripts": [], "timing_recommendation": "", "expected_outcome": "", "risk_if_ignored": ""}],
    "short_term": [...],
    "long_term": [...],
    "do_not_do": [{"action": "", "reason": "", "severity": ""}],
    "conversation_scripts": [{"scenario": "", "opening": "", "key_points": [], "phrases_to_avoid": [], "expected_response": ""}]
  },
  "relationship_dynamics": {
    "power_balance": {"score": -100 to 100, "dominant_party": "", "areas_of_dominance": []},
    "trust_level": {"score": 0-100, "trajectory": "", "trust_builders": [], "trust_breakers": []},
    "investment_asymmetry": {"score": -100 to 100, "your_investment": 0-100, "their_investment": 0-100, "recommendation": ""},
    "growth_potential": {"score": 0-100, "limiting_factors": [], "growth_opportunities": [], "optimal_trajectory": ""},
    "compatibility_analysis": {"overall_score": 0-100, "personality_fit": 0-100, "values_alignment": 0-100, "communication_compatibility": 0-100, "lifestyle_compatibility": 0-100}
  },
  "values_profile": {
    "self_direction": {"score": 0-100, "priority_rank": 1-10, "evidence": []},
    "stimulation": {...},
    "hedonism": {...},
    "achievement": {...},
    "power": {...},
    "security": {...},
    "conformity": {...},
    "tradition": {...},
    "benevolence": {...},
    "universalism": {...},
    "core_values_summary": [],
    "value_conflicts": []
  },
  "confidence_score": 0-100
}`;
}

function buildUserPrompt(contactName: string, dataSources: Record<string, any>, depth: string, focusAreas?: string[]): string {
  let prompt = `Analyze ${contactName} using ALL the following data sources:\n\n`;

  // Profile info
  if (dataSources.profile) {
    prompt += `## BASIC PROFILE\n${JSON.stringify(dataSources.profile, null, 2)}\n\n`;
  }

  // Personal info
  if (dataSources.personal_info) {
    prompt += `## PERSONAL INFORMATION\n${JSON.stringify(dataSources.personal_info, null, 2)}\n\n`;
  }

  // Messages
  if (dataSources.messages?.count > 0) {
    prompt += `## MESSAGES (${dataSources.messages.count} total, showing recent 500)\n`;
    prompt += `Date range: ${dataSources.messages.date_range?.start} to ${dataSources.messages.date_range?.end}\n`;
    prompt += `Sample messages:\n${JSON.stringify(dataSources.messages.sample.slice(0, 200), null, 2)}\n\n`;
  }

  // Behavioral analyses
  if (dataSources.behavioral_analyses?.length > 0) {
    prompt += `## PREVIOUS BEHAVIORAL ANALYSES\n${JSON.stringify(dataSources.behavioral_analyses, null, 2)}\n\n`;
  }

  // Facial analyses
  if (dataSources.facial_analyses?.length > 0) {
    prompt += `## PREVIOUS FACIAL ANALYSES\n${JSON.stringify(dataSources.facial_analyses, null, 2)}\n\n`;
  }

  // Vocal analyses
  if (dataSources.vocal_analyses?.length > 0) {
    prompt += `## PREVIOUS VOCAL ANALYSES\n${JSON.stringify(dataSources.vocal_analyses, null, 2)}\n\n`;
  }

  // Body language analyses
  if (dataSources.body_analyses?.length > 0) {
    prompt += `## PREVIOUS BODY LANGUAGE ANALYSES\n${JSON.stringify(dataSources.body_analyses, null, 2)}\n\n`;
  }

  // Observations
  if (dataSources.observations?.length > 0) {
    prompt += `## USER OBSERVATIONS (subjective notes from the user)\n${JSON.stringify(dataSources.observations, null, 2)}\n\n`;
  }

  // Communications
  if (dataSources.communications?.length > 0) {
    prompt += `## COMMUNICATIONS LOG (${dataSources.communications.length} records)\n${JSON.stringify(dataSources.communications.slice(0, 50), null, 2)}\n\n`;
  }

  // Relationships
  if (dataSources.relationships?.length > 0) {
    prompt += `## RELATIONSHIPS\n${JSON.stringify(dataSources.relationships, null, 2)}\n\n`;
  }

  // Interests
  if (dataSources.interests?.length > 0) {
    prompt += `## INTERESTS\n${JSON.stringify(dataSources.interests, null, 2)}\n\n`;
  }

  // Skills
  if (dataSources.skills?.length > 0) {
    prompt += `## SKILLS\n${JSON.stringify(dataSources.skills, null, 2)}\n\n`;
  }

  // Education
  if (dataSources.education?.length > 0) {
    prompt += `## EDUCATION\n${JSON.stringify(dataSources.education, null, 2)}\n\n`;
  }

  // Media with AI metadata
  if (dataSources.media?.length > 0) {
    prompt += `## MEDIA AI ANALYSIS (${dataSources.media.length} items)\n${JSON.stringify(dataSources.media.slice(0, 20), null, 2)}\n\n`;
  }

  // Recordings with transcriptions
  if (dataSources.recordings?.length > 0) {
    prompt += `## VOICE/VIDEO TRANSCRIPTIONS\n${JSON.stringify(dataSources.recordings, null, 2)}\n\n`;
  }

  // Conversation analyses
  if (dataSources.conversation_analyses?.length > 0) {
    prompt += `## PREVIOUS CONVERSATION ANALYSES\n${JSON.stringify(dataSources.conversation_analyses, null, 2)}\n\n`;
  }

  // Travel history
  if (dataSources.travel_history?.length > 0) {
    prompt += `## TRAVEL HISTORY\n${JSON.stringify(dataSources.travel_history, null, 2)}\n\n`;
  }

  // Focus areas
  if (focusAreas && focusAreas.length > 0) {
    prompt += `\n## FOCUS AREAS\nPay special attention to: ${focusAreas.join(', ')}\n\n`;
  }

  prompt += `\nAnalysis depth: ${depth.toUpperCase()}\n`;
  prompt += `\nProvide a comprehensive psychological profile. Be direct, specific, and actionable. Cite specific evidence for all conclusions.`;

  return prompt;
}
