import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveInsightRequest {
  profileId: string;
  content: string;
  question: string;
  saveAs: 'note' | 'observation' | 'insight' | 'analysis';
  category?: string;
  importance?: 'low' | 'medium' | 'high';
  tags?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const payload: SaveInsightRequest = await req.json();
    const { profileId, content, question, saveAs, category, importance, tags } = payload;

    if (!profileId || !content || !saveAs) {
      return new Response(JSON.stringify({ error: 'profileId, content, and saveAs are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let savedRecord: any = null;

    switch (saveAs) {
      case 'note':
        // Save as contact comment/note
        const { data: note, error: noteError } = await supabase
          .from('contact_comments')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            content: `**AI Insight**\n\n**Question:** ${question}\n\n**Answer:**\n${content}`,
            is_private: false,
          })
          .select()
          .single();

        if (noteError) throw noteError;
        savedRecord = { type: 'note', id: note.id };
        break;

      case 'observation':
        // Save as observation - using contact_observations table
        const { data: observation, error: obsError } = await supabase
          .from('contact_observations')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            category: category || 'ai_insight',
            title: `AI Insight: ${(content || '').substring(0, 50)}...`,
            observation: content,
            confidence_level: importance === 'high' ? 'high' : importance === 'low' ? 'low' : 'medium',
            ai_validation_status: 'validated',
            ai_confidence_score: 0.85,
            tags: tags || [],
          })
          .select()
          .single();

        if (obsError) throw obsError;
        savedRecord = { type: 'observation', id: observation.id };
        break;

      case 'insight':
        // Save as AI analysis result
        const { data: insight, error: insightError } = await supabase
          .from('ai_analyses')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            analysis_type: category || 'agent_insight',
            result: {
              question,
              answer: content,
              importance: importance || 'medium',
              tags: tags || [],
              generated_at: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (insightError) throw insightError;
        savedRecord = { type: 'insight', id: insight.id };
        break;

      case 'analysis':
        // Save as behavioral analysis
        const { data: analysis, error: analysisError } = await supabase
          .from('behavioral_analyses')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            analysis_type: category || 'ai_agent_analysis',
            raw_analysis: {
              question,
              answer: content,
              importance: importance || 'medium',
              tags: tags || [],
            },
            ai_model_used: 'gemini-3-flash-preview',
            confidence_score: 0.85,
          })
          .select()
          .single();

        if (analysisError) throw analysisError;
        savedRecord = { type: 'analysis', id: analysis.id };
        break;
    }

    // Log to activity feed
    await supabase.from('contact_activity_feed').insert({
      user_id: user.id,
      profile_id: profileId,
      activity_type: 'ai_insight_saved',
      activity_subtype: saveAs,
      title: `AI ${saveAs} saved`,
      description: question.substring(0, 100),
      metadata: {
        saved_record: savedRecord,
        importance,
        tags,
      },
    });

    return new Response(
      JSON.stringify({ success: true, saved: savedRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Save AI Insight error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
