import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentTool {
  name: string;
  description: string;
  execute: (params: any, context: AgentContext) => Promise<any>;
}

interface AgentContext {
  supabase: any;
  userId: string;
  profileId?: string;
  conversationHistory: { role: string; content: string }[];
}

// Tool definitions for the agent
const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'search_all_data',
    description: 'Search across all embedded data using semantic similarity. Use for finding relevant information about any topic.',
    execute: async (params: { query: string; sourceTypes?: string[] }, context) => {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      
      // Generate embedding for the search query
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: params.query
        }),
      });

      if (!embeddingResponse.ok) return { error: 'Failed to generate embedding' };
      
      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      const { data, error } = await context.supabase.rpc('match_documents', {
        p_user_id: context.userId,
        p_query_embedding: embedding,
        p_match_threshold: 0.5,
        p_match_count: 10,
        p_profile_id: context.profileId || null,
        p_source_types: params.sourceTypes || null
      });

      if (error) return { error: error.message };
      return { results: data };
    }
  },
  {
    name: 'get_contact_profile',
    description: 'Get complete profile information for a contact including personal info, work history, and preferences.',
    execute: async (params: { profileId?: string }, context) => {
      const targetProfileId = params.profileId || context.profileId;
      if (!targetProfileId) return { error: 'No profile ID provided' };

      const { data, error } = await context.supabase
        .from('profiles')
        .select(`
          *,
          contact_personal_info(*),
          work_experiences(*),
          contact_preferences(*),
          contact_methods(*)
        `)
        .eq('id', targetProfileId)
        .eq('user_id', context.userId)
        .single();

      if (error) return { error: error.message };
      return { profile: data };
    }
  },
  {
    name: 'get_recent_communications',
    description: 'Get recent communications with a contact including messages, calls, and emails.',
    execute: async (params: { limit?: number }, context) => {
      if (!context.profileId) return { error: 'No profile context' };

      const { data: messages } = await context.supabase
        .from('messages')
        .select('content, sent_at, is_from_contact, conversation_id')
        .eq('conversations.profile_id', context.profileId)
        .order('sent_at', { ascending: false })
        .limit(params.limit || 20);

      const { data: communications } = await context.supabase
        .from('communications')
        .select('*')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId)
        .order('occurred_at', { ascending: false })
        .limit(params.limit || 10);

      return { messages, communications };
    }
  },
  {
    name: 'get_behavioral_insights',
    description: 'Get AI-generated behavioral analyses and psychological insights about a contact.',
    execute: async (params: {}, context) => {
      if (!context.profileId) return { error: 'No profile context' };

      const { data: behavioral } = await context.supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: psychological } = await context.supabase
        .from('psychological_profiles')
        .select('*')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: observations } = await context.supabase
        .from('contact_observations')
        .select('*')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId)
        .order('observed_at', { ascending: false })
        .limit(10);

      return { behavioral, psychological, observations };
    }
  },
  {
    name: 'get_social_intelligence',
    description: 'Get captured social media data and profiles for a contact.',
    execute: async (params: {}, context) => {
      if (!context.profileId) return { error: 'No profile context' };

      const { data: captures } = await context.supabase
        .from('device_captures')
        .select('*')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId)
        .order('captured_at', { ascending: false })
        .limit(20);

      const { data: socialProfiles } = await context.supabase
        .from('social_profiles')
        .select('*')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId);

      return { captures, socialProfiles };
    }
  },
  {
    name: 'get_voice_intelligence',
    description: 'Get voice transcriptions, insights, and audio analysis for a contact.',
    execute: async (params: {}, context) => {
      if (!context.profileId) return { error: 'No profile context' };

      const { data: voiceInsights } = await context.supabase
        .from('voice_insights')
        .select('*')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recordings } = await context.supabase
        .from('voice_recording_sessions')
        .select('transcription, summary, context, created_at')
        .eq('profile_id', context.profileId)
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(5);

      return { voiceInsights, recordings };
    }
  },
  {
    name: 'get_network_connections',
    description: 'Get relationships and connections between this contact and others.',
    execute: async (params: {}, context) => {
      if (!context.profileId) return { error: 'No profile context' };

      const { data } = await context.supabase
        .from('contact_relationships')
        .select(`
          *,
          from_profile:profiles!contact_relationships_from_profile_id_fkey(id, first_name, last_name),
          to_profile:profiles!contact_relationships_to_profile_id_fkey(id, first_name, last_name)
        `)
        .or(`from_profile_id.eq.${context.profileId},to_profile_id.eq.${context.profileId}`)
        .eq('user_id', context.userId);

      return { relationships: data };
    }
  },
  {
    name: 'find_entity_mentions',
    description: 'Find mentions of a specific entity (person, company, location) across all contacts.',
    execute: async (params: { entityName: string; entityType?: string }, context) => {
      const { data, error } = await context.supabase.rpc('get_entity_mentions_cross_contact', {
        p_user_id: context.userId,
        p_entity_name: params.entityName,
        p_entity_type: params.entityType || null
      });

      if (error) return { error: error.message };
      return { mentions: data };
    }
  },
  {
    name: 'compare_contacts',
    description: 'Compare two or more contacts on specific dimensions.',
    execute: async (params: { profileIds: string[]; dimensions?: string[] }, context) => {
      const { data: profiles, error } = await context.supabase
        .from('profiles')
        .select(`
          *,
          contact_personal_info(*),
          work_experiences(*),
          behavioral_analyses(behavioral_patterns),
          psychological_profiles(profile_data)
        `)
        .in('id', params.profileIds)
        .eq('user_id', context.userId);

      if (error) return { error: error.message };
      return { profiles };
    }
  }
];

async function callAI(
  messages: { role: string; content: string }[],
  tools?: any[]
): Promise<{ content?: string; toolCalls?: any[] }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      tools: tools?.length ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters || { type: 'object', properties: {} }
        }
      })) : undefined,
      tool_choice: tools?.length ? 'auto' : undefined,
      max_tokens: 4096,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;

  return {
    content: message.content,
    toolCalls: message.tool_calls
  };
}

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      message, 
      profileId, 
      contactName,
      conversationHistory = [],
      mode = 'contact' // 'contact' | 'global'
    } = await req.json();

    // Build context
    const context: AgentContext = {
      supabase,
      userId: user.id,
      profileId: mode === 'contact' ? profileId : undefined,
      conversationHistory
    };

    // Get initial context if profile specified
    let profileContext = '';
    if (profileId && mode === 'contact') {
      const profileTool = AGENT_TOOLS.find(t => t.name === 'get_contact_profile');
      if (profileTool) {
        const profileData = await profileTool.execute({}, context);
        if (profileData.profile) {
          const p = profileData.profile;
          profileContext = `
Contact Profile: ${p.first_name} ${p.last_name}
Organization: ${p.organization || 'N/A'}
Title: ${p.job_title || 'N/A'}
Relationship: ${p.relationship_type || 'N/A'}
Tags: ${(p.tags || []).join(', ') || 'None'}
Notes: ${p.notes || 'None'}
`;
        }
      }
    }

    // System prompt with tool awareness
    const systemPrompt = `You are an advanced intelligence analyst AI assistant with access to a comprehensive contact relationship management system. You have deep access to all data about contacts including their communications, social media activity, behavioral patterns, psychological insights, voice recordings, and network connections.

${mode === 'contact' && profileContext ? `Current Contact Context:\n${profileContext}` : 'You are in global analysis mode - you can search across all contacts.'}

Your capabilities:
1. Semantic search across all embedded documents, messages, and intelligence data
2. Retrieve detailed contact profiles and personal information
3. Access communication history (messages, calls, emails)
4. Analyze behavioral patterns and psychological profiles
5. Review social media intelligence and captures
6. Examine voice transcriptions and audio insights
7. Map network relationships between contacts
8. Find entity mentions across all contacts
9. Compare multiple contacts on various dimensions

Guidelines:
- Use your tools proactively to gather relevant information before answering
- Cite specific sources when making claims (e.g., "According to a voice transcription from Jan 5...")
- Provide actionable insights, not just data dumps
- Flag any concerning patterns or anomalies
- Be specific with dates, quotes, and metrics when available
- If you can't find relevant information, say so clearly

Answer the user's question using all available intelligence.`;

    const toolDefinitions = AGENT_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: 'object',
        properties: t.name === 'search_all_data' ? {
          query: { type: 'string', description: 'The search query' },
          sourceTypes: { type: 'array', items: { type: 'string' }, description: 'Optional filter by source types' }
        } : t.name === 'find_entity_mentions' ? {
          entityName: { type: 'string', description: 'Name of the entity to search for' },
          entityType: { type: 'string', description: 'Type: person, company, location, product' }
        } : t.name === 'compare_contacts' ? {
          profileIds: { type: 'array', items: { type: 'string' }, description: 'IDs of contacts to compare' },
          dimensions: { type: 'array', items: { type: 'string' }, description: 'Dimensions to compare on' }
        } : {}
      }
    }));

    // Build conversation
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Initial AI call with tools
    let aiResponse = await callAI(messages, toolDefinitions);
    
    // Process tool calls if any (agent loop)
    let iterations = 0;
    const maxIterations = 5;
    
    while (aiResponse.toolCalls && iterations < maxIterations) {
      iterations++;
      
      const toolResults: { role: string; content: string; tool_call_id?: string }[] = [];
      
      for (const toolCall of aiResponse.toolCalls) {
        const tool = AGENT_TOOLS.find(t => t.name === toolCall.function.name);
        if (tool) {
          try {
            const params = JSON.parse(toolCall.function.arguments || '{}');
            const result = await tool.execute(params, context);
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            });
          } catch (error: any) {
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: error?.message || 'Unknown error' })
            });
          }
        }
      }

      // Continue conversation with tool results
      messages.push({
        role: 'assistant',
        content: aiResponse.content || '',
        // @ts-ignore - tool_calls is valid
        tool_calls: aiResponse.toolCalls
      });
      
      toolResults.forEach(tr => messages.push(tr));
      
      // Next AI call
      aiResponse = await callAI(messages, toolDefinitions);
    }

    // Final response
    const finalContent = aiResponse.content || 'I was unable to generate a response.';

    // Log the interaction
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId || null,
      function_name: 'contact-ai-agent-v2',
      model_name: 'gpt-4o',
      provider: 'openai',
      estimated_cost_cents: 5, // Approximate
      status: 'completed',
      prompt_summary: message.substring(0, 200)
    });

    return new Response(JSON.stringify({
      success: true,
      response: finalContent,
      toolsUsed: iterations,
      mode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Contact AI Agent V2 error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});