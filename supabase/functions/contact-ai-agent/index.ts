import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  profileId: string;
  question: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  includeAnalyses?: boolean;
  includeMedia?: boolean;
  includeDocuments?: boolean;
  includeCommunications?: boolean;
  includeObservations?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: AgentRequest = await req.json();
    const { 
      profileId, 
      question, 
      conversationHistory = [],
      includeAnalyses = true,
      includeMedia = true,
      includeDocuments = true,
      includeCommunications = true,
      includeObservations = true,
    } = payload;

    if (!profileId || !question) {
      return new Response(JSON.stringify({ error: 'profileId and question are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Contact AI Agent - Profile:', profileId, 'Question:', question.substring(0, 100));

    // Gather all contact intelligence
    const contactContext = await gatherContactIntelligence(supabase, user.id, profileId, {
      includeAnalyses,
      includeMedia,
      includeDocuments,
      includeCommunications,
      includeObservations,
    });

    // Build the comprehensive system prompt
    const systemPrompt = buildSystemPrompt(contactContext);

    // Call AI with streaming
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: question },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the response
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Contact AI Agent error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface GatherOptions {
  includeAnalyses: boolean;
  includeMedia: boolean;
  includeDocuments: boolean;
  includeCommunications: boolean;
  includeObservations: boolean;
}

async function gatherContactIntelligence(
  supabase: any, 
  userId: string, 
  profileId: string,
  options: GatherOptions
) {
  const context: any = {};

  // Get basic profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('user_id', userId)
    .single();

  context.profile = profile;

  // Get all data in parallel
  const promises: Promise<any>[] = [];

  // Observations - using contact_observations table
  if (options.includeObservations) {
    promises.push(
      supabase
        .from('contact_observations')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }: any) => ({ observations: data }))
    );
  }

  // AI Analyses
  if (options.includeAnalyses) {
    promises.push(
      supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(20)
        .then(({ data }: any) => ({ aiAnalyses: data }))
    );

    // Behavioral analyses
    promises.push(
      supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }: any) => ({ behavioralAnalyses: data }))
    );

    // Body language analyses
    promises.push(
      supabase
        .from('body_language_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }: any) => ({ bodyLanguageAnalyses: data }))
    );
  }

  // Communications
  if (options.includeCommunications) {
    promises.push(
      supabase
        .from('communications')
        .select('*')
        .eq('profile_id', profileId)
        .order('occurred_at', { ascending: false })
        .limit(50)
        .then(({ data }: any) => ({ communications: data }))
    );
  }

  // Media (screenshots, social data)
  if (options.includeMedia) {
    promises.push(
      supabase
        .from('device_captures')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }: any) => ({ deviceCaptures: data }))
    );

    promises.push(
      supabase
        .from('screenshot_imports')
        .select('*')
        .eq('contact_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }: any) => ({ screenshotImports: data }))
    );

    promises.push(
      supabase
        .from('media')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }: any) => ({ media: data }))
    );
  }

  // Documents
  if (options.includeDocuments) {
    promises.push(
      supabase
        .from('documents')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }: any) => ({ documents: data }))
    );
  }

  // Voice recordings
  promises.push(
    supabase
      .from('voice_recording_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: any) => ({ voiceRecordings: data }))
  );

  // Meeting recordings
  promises.push(
    supabase
      .from('meeting_recordings')
      .select('*')
      .eq('profile_id', profileId)
      .order('recorded_at', { ascending: false })
      .limit(20)
      .then(({ data }: any) => ({ meetingRecordings: data }))
  );

  // Biometrics
  promises.push(
    supabase
      .from('contact_biometrics')
      .select('*')
      .eq('profile_id', profileId)
      .single()
      .then(({ data }: any) => ({ biometrics: data }))
  );

  // Communication preferences
  promises.push(
    supabase
      .from('contact_communication_preferences')
      .select('*')
      .eq('profile_id', profileId)
      .single()
      .then(({ data }: any) => ({ communicationPreferences: data }))
  );

  // Activity feed
  promises.push(
    supabase
      .from('contact_activity_feed')
      .select('*')
      .eq('profile_id', profileId)
      .order('occurred_at', { ascending: false })
      .limit(30)
      .then(({ data }: any) => ({ activityFeed: data }))
  );

  // Predictions
  promises.push(
    supabase
      .from('behavioral_predictions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }: any) => ({ predictions: data }))
  );

  // Churn predictions
  promises.push(
    supabase
      .from('churn_predictions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }: any) => ({ churnPredictions: data }))
  );

  // Connection intelligence
  promises.push(
    supabase
      .from('connection_intelligence')
      .select('*')
      .or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: any) => ({ connections: data }))
  );

  // Wait for all queries
  const results = await Promise.all(promises);

  // Merge all results into context
  results.forEach(result => {
    Object.assign(context, result);
  });

  return context;
}

function buildSystemPrompt(context: any): string {
  const profile = context.profile || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Contact';

  let prompt = `You are an expert intelligence analyst assistant. You have access to comprehensive data about a contact named "${fullName}".

Your role is to:
1. Answer questions about this contact using ALL available data
2. Provide insights based on behavioral patterns, communications, and analyses
3. Cross-reference information from multiple sources
4. Identify patterns, trends, and anomalies
5. Make predictions based on historical data
6. Suggest actionable recommendations

## Available Intelligence Data

### Basic Profile
${JSON.stringify(profile, null, 2)}

`;

  if (context.observations?.length) {
    prompt += `### Observations (${context.observations.length} entries)
Key observations about this contact:
${context.observations.slice(0, 20).map((o: any) => `- [${o.category || 'general'}] ${(o.observation || o.title || 'No content')?.substring(0, 200)} (${o.created_at})`).join('\n')}

`;
  }

  if (context.aiAnalyses?.length) {
    prompt += `### AI Analyses (${context.aiAnalyses.length} analyses)
${context.aiAnalyses.slice(0, 10).map((a: any) => `- ${a.analysis_type}: ${JSON.stringify(a.result)?.substring(0, 500)}`).join('\n')}

`;
  }

  if (context.behavioralAnalyses?.length) {
    prompt += `### Behavioral Analyses
${context.behavioralAnalyses.slice(0, 5).map((a: any) => `- ${a.analysis_type}: Patterns: ${JSON.stringify(a.behavioral_patterns)?.substring(0, 300)}`).join('\n')}

`;
  }

  if (context.communications?.length) {
    prompt += `### Recent Communications (${context.communications.length} records)
${context.communications.slice(0, 15).map((c: any) => `- [${c.channel}/${c.direction}] ${c.subject || c.content?.substring(0, 100) || 'No content'} (${c.occurred_at})`).join('\n')}

`;
  }

  if (context.deviceCaptures?.length) {
    prompt += `### Social Media Intelligence (${context.deviceCaptures.length} captures)
${context.deviceCaptures.slice(0, 10).map((d: any) => `- ${d.capture_type}: ${JSON.stringify(d.extracted_data)?.substring(0, 300)}`).join('\n')}

`;
  }

  if (context.voiceRecordings?.length) {
    prompt += `### Voice Recordings (${context.voiceRecordings.length} sessions)
${context.voiceRecordings.slice(0, 10).map((v: any) => `- ${v.session_type}: Duration ${v.duration_seconds}s, Status: ${v.status}, Transcript: ${v.transcription?.substring(0, 200) || 'Not available'}`).join('\n')}

`;
  }

  if (context.biometrics) {
    prompt += `### Biometric Profile
- Facial confidence: ${context.biometrics.facial_confidence || 'N/A'}
- Voice confidence: ${context.biometrics.voice_confidence || 'N/A'}
- Voice characteristics: ${JSON.stringify(context.biometrics.voice_characteristics)?.substring(0, 200) || 'N/A'}

`;
  }

  if (context.communicationPreferences) {
    const prefs = context.communicationPreferences;
    prompt += `### Communication Preferences
- Style: ${prefs.communication_style || 'Unknown'}
- Preferred channels: ${prefs.preferred_channels?.join(', ') || 'Unknown'}
- Best contact times: ${JSON.stringify(prefs.best_contact_times) || 'Unknown'}
- Decision style: ${prefs.decision_style || 'Unknown'}

`;
  }

  if (context.predictions?.length) {
    prompt += `### Behavioral Predictions
${context.predictions.slice(0, 5).map((p: any) => `- ${p.prediction_type}: ${JSON.stringify(p.prediction_value)?.substring(0, 200)} (Confidence: ${p.confidence_score})`).join('\n')}

`;
  }

  if (context.churnPredictions?.length) {
    const latest = context.churnPredictions[0];
    prompt += `### Churn Risk
- Risk level: ${latest.risk_level}
- Probability: ${latest.predicted_churn_probability}
- Contributing factors: ${JSON.stringify(latest.contributing_factors)?.substring(0, 300)}

`;
  }

  if (context.connections?.length) {
    prompt += `### Network Connections (${context.connections.length} connections)
${context.connections.slice(0, 10).map((c: any) => `- ${c.connection_type}: Strength ${c.connection_strength}, Relationship: ${c.inferred_relationship}`).join('\n')}

`;
  }

  if (context.activityFeed?.length) {
    prompt += `### Recent Activity (${context.activityFeed.length} events)
${context.activityFeed.slice(0, 15).map((a: any) => `- [${a.activity_type}] ${a.title} (${a.occurred_at})`).join('\n')}

`;
  }

  prompt += `
## Response Guidelines

1. Be specific and cite sources when possible (e.g., "Based on the behavioral analysis from [date]...")
2. Highlight patterns across multiple data sources
3. Flag any inconsistencies or anomalies in the data
4. Provide confidence levels for your assessments
5. Suggest what additional data might be helpful
6. If asked to compare with other contacts, note that you only have data for this specific contact

Answer the user's question thoroughly and insightfully.`;

  return prompt;
}
