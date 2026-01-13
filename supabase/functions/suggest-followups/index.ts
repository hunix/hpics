import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let modelTier = 'speed';
    try {
      const body = await req.text();
      if (body) {
        const parsed = JSON.parse(body);
        modelTier = parsed.modelTier || 'speed';
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Fetch active contacts with their last communication
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, relationship_type, last_contact_date, is_favorite')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (profilesError) throw profilesError;

    // Fetch recent communications
    const { data: communications, error: commsError } = await supabase
      .from('communications')
      .select('profile_id, occurred_at, channel, direction')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false });

    if (commsError) throw commsError;

    // Build context for AI
    const now = new Date();
    const contactsWithActivity = (profiles || []).map(profile => {
      const profileComms = (communications || []).filter(c => c.profile_id === profile.id);
      const lastComm = profileComms[0];
      const lastContactDate = lastComm?.occurred_at || profile.last_contact_date;
      const daysSinceContact = lastContactDate 
        ? Math.floor((now.getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      return {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        relationshipType: profile.relationship_type,
        isFavorite: profile.is_favorite,
        daysSinceContact,
        recentChannels: profileComms.slice(0, 5).map(c => c.channel),
        commCount: profileComms.length,
      };
    });

    // Get user's preferred model for followup suggestions
    const analysisType = FUNCTION_TO_ANALYSIS_TYPE['suggest-followups'] || 'followup_suggestions';
    const preferredModel = await getUserPreferredModel(userId, analysisType, selectModel(modelTier as any));

    // Use unified AI client for intelligent suggestions
    const aiResponse = await callAI({
      model: preferredModel,
      messages: [
        { 
          role: 'system', 
          content: `You are a personal relationship manager AI. Analyze the user's contacts and their communication patterns to suggest who they should follow up with. Consider:
- How long since last contact (priority increases with time)
- Relationship type (family/close friends need more frequent contact)
- Whether the contact is marked as favorite
- Communication patterns and preferred channels

Return JSON only.` 
        },
        { 
          role: 'user', 
          content: `Here are my contacts with activity data:
${JSON.stringify(contactsWithActivity.slice(0, 50), null, 2)}

Return JSON: { "suggestions": [{ "contactId": "uuid", "contactName": "name", "priority": "high/medium/low", "reason": "...", "suggestedAction": "...", "daysSinceContact": number }] }

Suggest up to 5 contacts I should follow up with.` 
        }
      ],
      userId: userId,
      functionName: 'suggest-followups',
      temperature: 0.7,
      promptKey: 'FOLLOWUP_SUGGESTIONS',
      metadata: { contactCount: contactsWithActivity.length },
    });

    const result = parseAIJson(aiResponse.content, { suggestions: [] });

    return new Response(JSON.stringify({
      ...result,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-followups:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
