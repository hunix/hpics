import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreferenceRequest {
  profileId: string;
  regenerate?: boolean;
}

const PREFERENCE_CATEGORIES = [
  'food', 'academic', 'professional', 'lifestyle', 
  'social', 'entertainment', 'health', 'financial', 'personal'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
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

    const { profileId, regenerate = false } = await req.json() as PreferenceRequest;

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify profile belongs to user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profileName = `${profile.first_name} ${profile.last_name || ''}`.trim();

    // Gather all available data about the contact
    // NOTE: messages table has no profile_id or direction column - must join via conversations
    const [messagesResult, observationsResult, mediaResult, eventsResult, analysesResult] = await Promise.all([
      // Recent messages
      supabase
        .from('messages')
        .select('content, is_from_contact, created_at, conversations!inner(profile_id)')
        .eq('conversations.profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Observations - using contact_observations table
      supabase
        .from('contact_observations')
        .select('observation, category, confidence_level, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Media with captions
      supabase
        .from('media')
        .select('caption, tags, ai_description, context_notes')
        .eq('profile_id', profileId)
        .limit(30),
      
      // Calendar events
      supabase
        .from('events')
        .select('title, description, location')
        .eq('profile_id', profileId)
        .limit(30),
      
      // Previous AI analyses
      supabase
        .from('ai_analyses')
        .select('analysis_type, result')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(10),
    ]);

    // Build context from all data sources
    const dataContext = {
      profile: {
        name: profileName,
        occupation: profile.job_title,
        organization: profile.organization,
        location: profile.location,
        birthday: profile.birthday,
        notes: profile.notes,
        interests: profile.interests,
        hobbies: profile.hobbies,
      },
      // NOTE: messages table has 'is_from_contact' not 'direction'
      messages: (messagesResult.data || []).map((m: any) => ({
        content: m.content?.substring(0, 500),
        isFromContact: m.is_from_contact,
      })),
      observations: (observationsResult.data || []).map((o: any) => ({
        content: o.observation,
        type: o.category,
        importance: o.confidence_level,
      })),
      media: (mediaResult.data || []).map(m => ({
        caption: m.caption,
        tags: m.tags,
        description: m.ai_description,
        notes: m.context_notes,
      })),
      events: (eventsResult.data || []).map(e => ({
        title: e.title,
        description: e.description,
        location: e.location,
      })),
      previousAnalyses: (analysesResult.data || []).map(a => ({
        type: a.analysis_type,
        result: typeof a.result === 'object' ? JSON.stringify(a.result).substring(0, 1000) : a.result,
      })),
    };

    const evidenceSources: Array<{ type: string; count: number }> = [
      { type: 'messages', count: messagesResult.data?.length || 0 },
      { type: 'observations', count: observationsResult.data?.length || 0 },
      { type: 'media', count: mediaResult.data?.length || 0 },
      { type: 'events', count: eventsResult.data?.length || 0 },
      { type: 'analyses', count: analysesResult.data?.length || 0 },
    ];

    const totalEvidence = evidenceSources.reduce((sum, s) => sum + s.count, 0);

    if (totalEvidence < 3 && !regenerate) {
      return new Response(JSON.stringify({ 
        message: 'Insufficient data for prediction',
        evidenceSources,
        preferences: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call AI to predict preferences
    const systemPrompt = `You are an expert behavioral analyst and preference predictor. Based on all available data about a person, predict their likely preferences across multiple life domains.

For each prediction:
- Be specific and actionable (e.g., "Italian cuisine, especially pasta dishes" not just "likes food")
- Assign a confidence score (0-1) based on evidence strength
- Only include predictions you have reasonable evidence for
- Consider cultural context and demographic factors

Categories to analyze:
- food: Dietary preferences, cuisine types, restaurants, dining habits
- academic: Learning style, subjects of interest, educational values
- professional: Work style, career priorities, professional goals, collaboration preferences
- lifestyle: Daily routines, hobbies, travel preferences, living preferences
- social: Relationship styles, social preferences, communication patterns
- entertainment: Media preferences, activities, sports, arts
- health: Fitness preferences, wellness habits, health priorities
- financial: Spending patterns, investment preferences, value perception
- personal: Personal values, life goals, intimate preferences (be tactful)

Respond with a JSON object containing an array of preferences.`;

    const userPrompt = `Analyze this data about ${profileName} and predict their preferences:

${JSON.stringify(dataContext, null, 2)}

Return predictions as JSON:
{
  "preferences": [
    {
      "category": "food",
      "key": "Cuisine Preference",
      "value": "Mediterranean and Italian cuisine with a preference for seafood",
      "confidence": 0.85,
      "evidence": "Multiple mentions of Italian restaurants in messages, photos tagged with seafood dishes"
    }
  ]
}

Include 3-5 predictions per category where evidence exists. Skip categories with no evidence.`;

    const aiResponse = await callAI({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'predict-contact-preferences',
      profileId,
      temperature: 0.7,
    });

    const predictions = parseAIJson<{ preferences: any[] }>(aiResponse.content, { preferences: [] });

    // Store predictions in database
    if (predictions.preferences && predictions.preferences.length > 0) {
      // Delete existing preferences if regenerating
      if (regenerate) {
        await supabase
          .from('contact_predicted_preferences')
          .delete()
          .eq('profile_id', profileId)
          .eq('user_id', user.id);
      }

      // Upsert new predictions
      const preferencesToInsert = predictions.preferences.map((p: any) => ({
        profile_id: profileId,
        user_id: user.id,
        preference_category: p.category,
        preference_key: p.key,
        predicted_value: p.value,
        confidence_score: Math.min(1, Math.max(0, p.confidence || 0.5)),
        evidence_sources: evidenceSources,
        evidence_count: totalEvidence,
        last_updated: new Date().toISOString(),
      }));

      await supabase
        .from('contact_predicted_preferences')
        .upsert(preferencesToInsert, { 
          onConflict: 'profile_id,user_id,preference_category,preference_key' 
        });
    }

    return new Response(JSON.stringify({
      success: true,
      predictionsCount: predictions.preferences?.length || 0,
      cost: aiResponse.costCents,
      evidenceSources,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Preference prediction error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
