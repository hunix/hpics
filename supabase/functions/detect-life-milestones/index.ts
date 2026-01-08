import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";

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
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = claimsData.claims.sub as string;
    } catch (authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body for optional profile filter
    const body = await req.json().catch(() => ({}));
    const targetProfileId = body.profileId;

    // Fetch messages
    let query = supabase
      .from('conversations')
      .select('id, profile_id')
      .eq('user_id', userId);
    
    if (targetProfileId) {
      query = query.eq('profile_id', targetProfileId);
    }

    const { data: conversations } = await query;

    if (!conversations || conversations.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        milestones: [],
        message: 'No conversations found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversationIds = conversations.map(c => c.id);
    const conversationToProfile = new Map(conversations.map(c => [c.id, c.profile_id]));

    // Fetch recent messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, conversation_id, content, sent_at')
      .in('conversation_id', conversationIds)
      .order('sent_at', { ascending: false })
      .limit(300);

    // Fetch profile info
    const profileIds = [...new Set(conversations.map(c => c.profile_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', profileIds);

    const profileNames = new Map(
      (profiles || []).map(p => [p.id, `${p.first_name} ${p.last_name || ''}`.trim()])
    );

    // Build message content per profile
    const messagesByProfile: Record<string, string[]> = {};
    for (const msg of messages || []) {
      const profileId = conversationToProfile.get(msg.conversation_id);
      if (profileId && msg.content) {
        if (!messagesByProfile[profileId]) {
          messagesByProfile[profileId] = [];
        }
        messagesByProfile[profileId].push(msg.content);
      }
    }

    const profilesWithContent = Object.entries(messagesByProfile)
      .filter(([_, msgs]) => msgs.length >= 3)
      .slice(0, 10);

    if (profilesWithContent.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        milestones: [],
        message: 'Not enough message data'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to detect life milestones
    const prompt = `Analyze these conversations and identify any life milestones or significant life events mentioned.

CONTACTS AND MESSAGES:
${profilesWithContent.map(([profileId, msgs]) => 
  `Contact: ${profileNames.get(profileId) || 'Unknown'} (ID: ${profileId})\nMessages:\n${msgs.slice(0, 15).join('\n')}`
).join('\n\n---\n\n')}

Look for mentions of:
- Career changes (new job, promotion, resignation, retirement)
- Relationship milestones (engagement, marriage, divorce, new relationship)
- Family events (pregnancy, birth, death of family member)
- Location changes (moving, new house, relocation)
- Education (graduation, new degree, starting school)
- Health events (surgery, recovery, diagnosis)
- Achievements (awards, publications, launches)

Return JSON with this structure:
{ "milestones": [{ "profileId": "...", "type": "career|relationship|family|location|education|health|achievement|other", "title": "...", "description": "...", "approximateDate": "...", "sentiment": "positive|negative|neutral", "confidence": 0.0-1.0 }] }`;

    let detected: { milestones: any[] } = { milestones: [] };
    try {
      const aiResponse = await callAI({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a life milestone detection AI. Identify significant life events from conversations. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        userId,
        functionName: 'detect-life-milestones',
        temperature: 0.3,
      });
      detected = parseAIJson(aiResponse.content, { milestones: [] });
    } catch (e) {
      console.error('AI analysis error:', e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI analysis failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save high-confidence milestones
    const savedMilestones = [];
    for (const milestone of detected.milestones) {
      if (milestone.confidence >= 0.6) {
        const { data: existing } = await supabase
          .from('contact_life_milestones')
          .select('id')
          .eq('profile_id', milestone.profileId)
          .eq('milestone_title', milestone.title)
          .single();

        if (!existing) {
          const { data: inserted } = await supabase
            .from('contact_life_milestones')
            .insert({
              user_id: userId,
              profile_id: milestone.profileId,
              milestone_type: milestone.type,
              milestone_title: milestone.title,
              description: milestone.description,
              approximate_date: milestone.approximateDate || null,
              sentiment: milestone.sentiment,
              source: 'ai_detected',
              confidence_score: milestone.confidence,
            })
            .select()
            .single();

          if (inserted) {
            savedMilestones.push(inserted);

            // Create activity feed entry
            await supabase
              .from('contact_activity_feed')
              .insert({
                user_id: userId,
                profile_id: milestone.profileId,
                activity_type: 'milestone_detected',
                activity_subtype: milestone.type,
                title: `Life Milestone: ${milestone.title}`,
                description: milestone.description,
                importance_score: milestone.sentiment === 'positive' ? 8 : milestone.sentiment === 'negative' ? 7 : 5,
                source: 'ai_detection',
              });
          }
        }
      }
    }

    console.log(`Detected ${detected.milestones.length} milestones, saved ${savedMilestones.length}`);

    return new Response(JSON.stringify({ 
      success: true,
      detected: detected.milestones,
      savedCount: savedMilestones.length,
      analyzedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error detecting life milestones:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
