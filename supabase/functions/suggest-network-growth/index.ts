import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'suggest-network-growth', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's network data
    // Note: industry column doesn't exist on profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization, job_title, relationship_type, is_favorite')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        suggestions: [],
        message: 'Add contacts to get network growth suggestions',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze network composition
    // Note: industry column doesn't exist - use organization instead
    const organizationCount: Record<string, number> = {};
    const roleCount: Record<string, number> = {};
    const relationshipCount: Record<string, number> = {};
    
    profiles.forEach(p => {
      const org = p.organization || 'Unknown';
      organizationCount[org] = (organizationCount[org] || 0) + 1;
      
      const role = p.job_title?.split(' ')[0] || 'Unknown';
      roleCount[role] = (roleCount[role] || 0) + 1;
      
      const rel = p.relationship_type || 'other';
      relationshipCount[rel] = (relationshipCount[rel] || 0) + 1;
    });

    // Calculate diversity metrics
    const uniqueOrganizations = Object.keys(organizationCount).length;
    const uniqueRoles = Object.keys(roleCount).length;
    const totalContacts = profiles.length;

    // Get communication patterns
    const { data: communications } = await supabase
      .from('communications')
      .select('profile_id, occurred_at')
      .eq('user_id', user.id)
      .gte('occurred_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    const activeContacts = new Set(communications?.map(c => c.profile_id) || []);
    const inactiveContacts = profiles.filter(p => !activeContacts.has(p.id));

    // Build network analysis for AI
    const networkSummary = {
      total_contacts: totalContacts,
      active_contacts: activeContacts.size,
      inactive_contacts: inactiveContacts.length,
      organization_distribution: organizationCount,
      role_distribution: roleCount,
      relationship_types: relationshipCount,
      diversity_score: Math.min(100, (uniqueOrganizations * 10 + uniqueRoles * 5)),
    };

    // Generate AI-powered suggestions
    const aiResponse = await callAI({
      model: selectModel('balanced'),
      messages: [
        {
          role: 'system',
          content: `You are a professional network strategist. Analyze the user's network composition and provide actionable growth suggestions. Focus on:
1. Identifying gaps in industry diversity
2. Suggesting relationship types to develop
3. Recommending reactivation of dormant connections
4. Proposing strategic network expansion areas

Return a JSON object with this structure:
{
  "suggestions": [
    {
      "type": "diversity" | "reactivation" | "expansion" | "relationship",
      "priority": "high" | "medium" | "low",
      "title": "Short actionable title",
      "description": "Detailed suggestion with reasoning",
      "impact": "Expected benefit of this action",
      "action_items": ["Step 1", "Step 2"]
    }
  ],
  "network_health_score": 0-100,
  "key_insights": ["insight1", "insight2"]
}`,
        },
        {
          role: 'user',
          content: `Analyze this network and provide growth suggestions:\n\n${JSON.stringify(networkSummary, null, 2)}`,
        },
      ],
      userId: user.id,
      functionName: 'suggest-network-growth',
      temperature: 0.6,
      maxTokens: 1500,
      promptKey: 'network_growth',
    });

    // Parse AI response
    let result;
    try {
      const jsonMatch = aiResponse.content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : aiResponse.content.trim();
      result = JSON.parse(jsonStr);
    } catch {
      result = {
        suggestions: [
          {
            type: 'expansion',
            priority: 'medium',
            title: 'Expand your network diversity',
            description: 'Consider connecting with professionals from different industries',
            impact: 'Broader perspective and more opportunities',
            action_items: ['Attend industry events', 'Join professional groups'],
          },
        ],
        network_health_score: 65,
        key_insights: ['Your network could benefit from more diversity'],
      };
    }

    // Store prediction in database
    const topSuggestions = result.suggestions.slice(0, 5);
    for (const suggestion of topSuggestions) {
      await supabase.from('network_predictions').insert({
        user_id: user.id,
        prediction_type: 'growth_suggestion',
        prediction_data: suggestion,
        confidence_score: suggestion.priority === 'high' ? 0.9 : suggestion.priority === 'medium' ? 0.7 : 0.5,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      network_summary: networkSummary,
      generated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Network growth suggestion error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
