import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callAI, parseAIJson, selectModel, ModelTier } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Analysis prompts by mode and media type
const ANALYSIS_PROMPTS: Record<string, Record<string, string>> = {
  image: {
    face_intelligence: `Analyze all faces in this image with extreme detail:
- For each person: estimated age (range), gender, ethnicity, emotional state (primary + secondary emotions with confidence)
- Facial characteristics: eye color, hair color/style, distinctive features, facial symmetry
- Expression analysis: genuine vs performed emotions, micro-expression indicators
- Identity cues: profession indicators, social status markers, health indicators
- Relationship cues if multiple people: closeness, power dynamics, comfort level
Return structured JSON with 'faces' array, each containing: position, age_range, gender, emotions, characteristics, identity_cues, confidence`,

    scene_intelligence: `Analyze the scene and environment in extreme detail:
- Location type: indoor/outdoor, specific venue type, geographic region indicators
- Time indicators: time of day, season, event context
- Wealth/status indicators: quality of surroundings, brand items, lifestyle markers
- Activity context: what's happening, social context, formality level
- Objects of significance: items that reveal interests, profession, relationships
- Privacy level: public/private setting, who else might be present
Return structured JSON with: location, time_context, wealth_indicators, activity, significant_objects, privacy_assessment`,

    document_extraction: `Extract all text and document information:
- OCR all visible text with high accuracy
- Identify document type: ID, contract, letter, receipt, etc.
- Extract structured data: names, dates, amounts, addresses
- Handwriting analysis if present: characteristics, emotional state indicators
- Document metadata: official/informal, completeness, authenticity indicators
Return structured JSON with: full_text, document_type, extracted_entities, handwriting_analysis, metadata`,

    lifestyle_profiling: `Profile the lifestyle indicators in this image:
- Wealth indicators: clothing brands, accessories, environment quality
- Interests visible: hobbies, activities, preferences shown
- Health indicators: fitness level, dietary hints, wellness markers
- Social patterns: alone/group, social comfort, extroversion indicators
- Values indicators: what they display, prioritize, or surround themselves with
- Consumption patterns: brands, quality levels, spending indicators
Return structured JSON with: wealth_score (1-10), interests, health_indicators, social_patterns, values, consumption_profile`,

    relationship_mapping: `Map all relationship indicators in this image:
- Identify all people and their likely relationships
- Physical proximity and body language between people
- Power dynamics: who dominates, who defers
- Emotional connections: warmth, tension, formality
- Group structure: leader, followers, outsiders
- Relationship stage: new, established, strained
Return structured JSON with: people (array), relationships (array with from/to/type/confidence), group_dynamics`,

    security_scan: `Perform security and privacy analysis:
- Sensitive information visible: IDs, addresses, financial info
- Privacy risks: identifiable locations, patterns, vulnerabilities
- Authenticity check: signs of editing, AI generation, manipulation
- Anomalies: anything unexpected or concerning
- Metadata implications: what this image reveals that might be sensitive
Return structured JSON with: sensitive_data_found, privacy_risks, authenticity_score, anomalies, recommendations`,
  },
  
  audio: {
    transcription_plus: `Transcribe this audio with maximum detail:
- Full verbatim transcription with timestamps
- Speaker diarization: identify and label different speakers
- Non-verbal sounds: laughter, sighs, pauses, interruptions
- Emphasis and tone markers in transcription
- Background sounds and context
Return structured JSON with: transcript (array of {speaker, timestamp, text, tone}), speakers (array with voice characteristics), background_context`,

    vocal_psychology: `Analyze the vocal patterns for psychological indicators:
- Stress patterns: where voice shows tension, anxiety, discomfort
- Deception indicators: voice changes during specific topics, hesitations
- Emotional state timeline: how emotions shift throughout
- Confidence levels: certainty vs uncertainty in voice
- Authenticity: genuine vs performed emotions
- Personality indicators: introversion/extroversion, dominance, openness
Return structured JSON with: stress_points (array with timestamps), deception_flags, emotional_timeline, confidence_analysis, authenticity_score, personality_cues`,

    content_intelligence: `Extract intelligence from the audio content:
- Key topics discussed with importance ranking
- Named entities: people, places, organizations, dates, amounts
- Commitments made: promises, agreements, plans
- Action items: tasks, deadlines, follow-ups mentioned
- Decisions: choices made or deferred
- Concerns raised: problems, objections, worries expressed
Return structured JSON with: topics, entities, commitments, action_items, decisions, concerns`,

    conversation_dynamics: `Analyze the conversation dynamics:
- Power balance: who controls the conversation
- Speaking time distribution
- Interruption patterns: who interrupts whom
- Question/answer patterns: who asks, who answers
- Rapport indicators: agreement, mirroring, warmth
- Conflict indicators: disagreement, tension, defensiveness
Return structured JSON with: power_analysis, speaking_distribution, interruption_matrix, rapport_score, conflict_points`,

    sentiment_timeline: `Create a sentiment timeline of the audio:
- Overall sentiment by segment (positive/negative/neutral with score)
- Emotional peaks and valleys with timestamps
- Topic correlation: which topics trigger which emotions
- Trend: is the conversation becoming more positive or negative
- Key turning points in sentiment
Return structured JSON with: segments (array with timestamp, sentiment, emotions), peaks, valleys, trend, turning_points`,

    speaker_profiling: `Profile each speaker in the audio:
- Voice characteristics: pitch, pace, volume patterns
- Speaking style: formal/informal, verbose/concise
- Personality indicators from voice: Big Five estimates
- Emotional baseline and variations
- Credibility indicators: consistency, confidence
- Cultural/regional indicators from speech patterns
Return structured JSON with: speakers (array with id, characteristics, personality_cues, emotional_profile, credibility_score)`,
  },
  
  video: {
    behavioral_full: `Perform comprehensive behavioral analysis:
- Body language throughout: posture, gestures, movement patterns
- Facial expressions: emotions, micro-expressions, eye contact
- Vocal patterns: tone, pace, stress indicators
- Behavioral consistency: do words match body language
- Comfort/discomfort indicators by timestamp
- Deception tells: combined verbal and non-verbal
Return structured JSON with: body_language_timeline, facial_timeline, vocal_timeline, consistency_analysis, comfort_map, deception_indicators`,

    interaction_analysis: `Analyze interactions between people:
- Relationship dynamics: hierarchy, intimacy, tension
- Non-verbal communication: touch, proximity, mirroring
- Influence patterns: who persuades whom, how
- Group dynamics: alliances, exclusions, leader/follower
- Emotional contagion: how moods spread
- Turn-taking and attention patterns
Return structured JSON with: relationships, influence_map, group_structure, emotional_flow, attention_patterns`,

    temporal_emotions: `Map emotional states across video timeline:
- Emotion detection by timestamp for each person
- Emotional transitions: what triggers changes
- Peak emotional moments with context
- Emotional synchrony between people
- Baseline vs. deviation analysis
- Predicted emotional trajectory
Return structured JSON with: timeline (array with timestamp, person, emotions), transitions, peaks, synchrony_score, predictions`,

    micro_expression_scan: `Scan for micro-expressions and hidden emotions:
- Fleeting expressions (< 0.5s) with timestamps
- Emotion leaked vs. emotion displayed
- Deception indicators from expression leakage
- Stress tells: eye movement, facial tension
- Suppressed emotions: what they're hiding
- Critical moments requiring attention
Return structured JSON with: micro_expressions (array with timestamp, duration, emotion, context), deception_flags, stress_indicators, suppressed_emotions, critical_moments`,

    engagement_metrics: `Measure engagement and attention:
- Attention tracking: where are they looking, for how long
- Engagement level by timestamp
- Distraction indicators
- Interest peaks: what captures attention
- Boredom/disengagement signals
- Focus patterns: sustained vs. scattered
Return structured JSON with: attention_timeline, engagement_score_timeline, distractions, interest_peaks, focus_analysis`,

    scene_narrative: `Construct the narrative of the video:
- Key scenes and transitions
- Story arc: beginning, development, climax, resolution
- Context shifts: topic changes, mood changes
- Important moments and their significance
- Character development: how people change through video
- Summary and key takeaways
Return structured JSON with: scenes (array), story_arc, context_shifts, key_moments, character_development, summary`,
  },
  
  document: {
    entity_extraction: `Extract all entities from this document:
- People: names, roles, contact info
- Organizations: companies, institutions
- Dates: deadlines, events, periods
- Amounts: money, quantities, percentages
- Locations: addresses, places, regions
- References: document numbers, case IDs, accounts
Return structured JSON with: people, organizations, dates, amounts, locations, references (each as array with value, context, confidence)`,

    relationship_intelligence: `Analyze relationships revealed in document:
- People connections: who knows whom, how
- Organizational hierarchies
- Power dynamics: who decides, who approves
- Influence patterns: recommendations, endorsements
- Hidden relationships: implied but not stated
Return structured JSON with: connections (array with parties, relationship_type, evidence), hierarchies, power_map, hidden_relationships`,

    legal_analysis: `Perform legal analysis of document:
- Document type and legal status
- Key clauses and their implications
- Obligations: who must do what, by when
- Rights granted or waived
- Risks and liabilities identified
- Compliance requirements
- Unusual or concerning provisions
Return structured JSON with: document_type, clauses (array with text, implication), obligations, rights, risks, compliance_items, red_flags`,

    financial_analysis: `Analyze financial aspects of document:
- All monetary amounts with context
- Payment terms and schedules
- Financial commitments
- Cost/benefit implications
- Hidden costs or financial risks
- Comparison to market norms
Return structured JSON with: amounts (array with value, currency, purpose), payment_terms, commitments, risks, market_comparison`,

    action_extraction: `Extract actionable items from document:
- Tasks required with owners
- Deadlines: explicit and implied
- Decisions needed with options
- Follow-ups required
- Dependencies: what blocks what
- Priority assessment
Return structured JSON with: tasks (array with description, owner, deadline, priority), decisions, follow_ups, dependencies`,

    sentiment_tone: `Analyze document tone and sentiment:
- Overall tone: formal/informal, friendly/hostile
- Urgency level: how pressing
- Confidence level of statements
- Emotional undertones
- Persuasion techniques used
- Authenticity indicators
Return structured JSON with: tone, urgency_score, confidence_score, emotional_undertones, persuasion_techniques, authenticity_assessment`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token using getClaims
    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: claimsData, error: authError } = await (authClient.auth as any).getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    const { 
      media_id, 
      document_id, 
      profile_id, 
      media_type,
      media_url,
      analysis_modes, 
      analysis_context, 
      analysis_depth = 'standard',
      model_override,
      modelTier,
      skip_completed_modes = false,  // Enable incremental mode to skip already-analyzed modes
    } = await req.json();

    // Validate inputs FIRST - before any property access
    if (!media_type) {
      throw new Error('Missing required field: media_type');
    }
    if (!analysis_modes || !Array.isArray(analysis_modes) || analysis_modes.length === 0) {
      throw new Error('Missing required field: analysis_modes (must be non-empty array)');
    }
    if (!media_url) {
      throw new Error('Missing required field: media_url');
    }

    console.log(`Starting ${media_type} analysis for ${analysis_modes.length} modes`);

    // Incremental mode: filter out already-completed modes
    let effectiveModes = analysis_modes;
    let skippedModes: string[] = [];

    if (skip_completed_modes && (media_id || document_id)) {
      const tableName = document_id ? 'documents' : 'media';
      const itemId = document_id || media_id;
      
      const { data: itemData } = await supabase
        .from(tableName)
        .select('completed_analysis_modes')
        .eq('id', itemId)
        .single();
      
      const completedModes = itemData?.completed_analysis_modes || [];
      skippedModes = analysis_modes.filter((m: string) => completedModes.includes(m));
      effectiveModes = analysis_modes.filter((m: string) => !completedModes.includes(m));
      
      console.log(`Incremental mode: ${skippedModes.length} modes already done, ${effectiveModes.length} remaining`);
      
      if (effectiveModes.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'All requested modes already completed',
          skipped_modes: skippedModes,
          analysis: null,
          tokensUsed: 0,
          costCents: 0,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Build analysis prompt based on effective modes (after filtering)
    const modePrompts = effectiveModes
      .map((mode: string) => ANALYSIS_PROMPTS[media_type]?.[mode])
      .filter(Boolean);

    if (modePrompts.length === 0) {
      throw new Error(`No valid analysis modes for media type: ${media_type}`);
    }

    // Determine model based on media type and depth
    const tier: ModelTier = analysis_depth === 'deep' ? 'quality' : 'balanced';
    const model = model_override || selectModel((modelTier as ModelTier) || tier);

    // Build comprehensive prompt
    const systemPrompt = `You are an expert analyst specialized in extracting maximum intelligence from ${media_type} content.
Your analysis must be:
- Extremely detailed and thorough
- Evidence-based with specific observations
- Confidence-calibrated (assign confidence scores 0-100%)
- Actionable with clear implications
- Sensitive to context: ${JSON.stringify(analysis_context || {})}

Analysis depth: ${analysis_depth}
${analysis_depth === 'deep' ? 'Provide maximum detail and cross-reference all findings.' : ''}
${analysis_depth === 'quick' ? 'Focus on key insights, be concise.' : ''}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations outside JSON.`;

    const userPrompt = `Analyze this ${media_type} content and provide structured intelligence.

ANALYSIS MODES REQUESTED:
${modePrompts.join('\n\n---\n\n')}

Combine all requested analyses into a single comprehensive JSON response with these top-level keys:
${effectiveModes.map((m: string) => `- "${m}": { analysis results }`).join('\n')}
- "key_insights": [array of most important findings as strings]
- "red_flags": [array of concerning findings requiring attention]
- "yellow_flags": [array of things to monitor]
- "action_items": [array of recommended actions]
- "personality_cues": { any personality indicators found }
- "certainties": [array of high-confidence conclusions]
- "overall_confidence": number 0-100

Be thorough and extract maximum intelligence.`;

    // Prepare messages based on media type
    let messages: any[];
    
    if (media_type === 'document') {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userPrompt}\n\nDocument URL: ${media_url}` }
      ];
    } else if (media_type === 'image') {
      messages = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: media_url } }
          ]
        }
      ];
    } else if (media_type === 'video' || media_type === 'audio') {
      messages = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: `${userPrompt}\n\nMedia URL: ${media_url}` }
          ]
        }
      ];
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
    }

    // Call AI using unified wrapper
    const maxTokens = analysis_depth === 'deep' ? 8000 : analysis_depth === 'quick' ? 2000 : 4000;
    
    const aiResponse = await callAI({
      model,
      messages,
      userId,
      functionName: 'analyze-media-deep',
      profileId: profile_id,
      temperature: 0.3,
      maxTokens,
      metadata: {
        media_type,
        analysis_modes,
        analysis_depth,
        media_id,
        document_id,
      },
      enforceBudget: true,
    });

    // Parse JSON response
    const analysisResult = parseAIJson(aiResponse.content, {
      error: 'Failed to parse analysis',
      key_insights: [],
      overall_confidence: 0,
    });

    // Store the analysis result
    if (media_id) {
      await supabase
        .from('media_analyses')
        .upsert({
          media_id,
          user_id: userId,
          analysis_type: 'deep_multi_mode',
          analysis_modes: effectiveModes,
          analysis_depth,
          result: analysisResult,
          ai_model_used: model,
          cost_cents: aiResponse.costCents,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'media_id,analysis_type',
        });
    }

    // Update completed_analysis_modes on the source table
    const tableName = document_id ? 'documents' : 'media';
    const itemId = document_id || media_id;

    if (itemId) {
      // Fetch current completed modes and merge with newly completed
      const { data: currentItem } = await supabase
        .from(tableName)
        .select('completed_analysis_modes')
        .eq('id', itemId)
        .single();
      
      const existingModes = currentItem?.completed_analysis_modes || [];
      const allCompletedModes = [...new Set([...existingModes, ...effectiveModes])];
      
      await supabase
        .from(tableName)
        .update({
          completed_analysis_modes: allCompletedModes,
          last_analysis_at: new Date().toISOString(),
        })
        .eq('id', itemId);
      
      console.log(`Updated ${tableName}.completed_analysis_modes for ${itemId}: ${allCompletedModes.join(', ')}`);
    }

    const processingTimeMs = Date.now() - startTime;
    console.log(`Deep media analysis complete. Modes: ${analysis_modes.length}, Cost: ${aiResponse.costCents}¢, Time: ${processingTimeMs}ms`);

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      metadata: {
        media_type,
        modes_analyzed: analysis_modes,
        depth: analysis_depth,
        model_used: model,
        processing_time_ms: processingTimeMs,
        ai_response_time_ms: aiResponse.responseTimeMs,
        tokens_used: aiResponse.totalTokens,
        cost_cents: aiResponse.costCents,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Deep media analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
