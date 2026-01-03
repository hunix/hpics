import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      throw new Error('Authorization header is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    // Fetch all profiles with their communication data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id);

    if (profilesError) throw profilesError;

    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Analyze each profile for risk
    const riskAnalysis = await Promise.all(profiles.map(async (profile) => {
      const { data: communications } = await supabase
        .from('communications')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('occurred_at', oneMonthAgo.toISOString())
        .order('occurred_at', { ascending: false });

      const { data: recentTrends } = await supabase
        .from('relationship_trends')
        .select('*')
        .eq('profile_id', profile.id)
        .order('recorded_at', { ascending: false })
        .limit(4);

      const lastContact = profile.last_contact_date ? new Date(profile.last_contact_date) : null;
      const daysSinceContact = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      const recentComms = communications?.filter(c => new Date(c.occurred_at) >= twoWeeksAgo) || [];
      const olderComms = communications?.filter(c => new Date(c.occurred_at) < twoWeeksAgo) || [];
      
      // Calculate risk factors
      let riskScore = 0;
      const riskFactors: string[] = [];

      // Factor 1: Days since last contact
      if (daysSinceContact > 60) {
        riskScore += 40;
        riskFactors.push(`No contact in ${daysSinceContact} days`);
      } else if (daysSinceContact > 30) {
        riskScore += 25;
        riskFactors.push(`Last contact ${daysSinceContact} days ago`);
      } else if (daysSinceContact > 14) {
        riskScore += 10;
      }

      // Factor 2: Communication frequency decline
      if (olderComms.length > 0 && recentComms.length === 0) {
        riskScore += 30;
        riskFactors.push('Communication frequency dropped to zero');
      } else if (olderComms.length > recentComms.length * 2) {
        riskScore += 20;
        riskFactors.push('Communication frequency declining');
      }

      // Factor 3: Sentiment trend (if we have trends data)
      if (recentTrends && recentTrends.length >= 2) {
        const sentimentTrend = recentTrends[0].sentiment_avg - recentTrends[recentTrends.length - 1].sentiment_avg;
        if (sentimentTrend < -0.2) {
          riskScore += 15;
          riskFactors.push('Sentiment has been declining');
        }
      }

      // Factor 4: Important relationship types get higher risk scores faster
      if (['family', 'friend', 'mentor', 'client'].includes(profile.relationship_type) && daysSinceContact > 14) {
        riskScore += 10;
        riskFactors.push(`Important ${profile.relationship_type} relationship needs attention`);
      }

      return {
        profileId: profile.id,
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        avatarUrl: profile.avatar_url,
        relationshipType: profile.relationship_type,
        riskScore: Math.min(100, riskScore),
        riskLevel: riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low',
        riskFactors,
        daysSinceContact,
        lastContactDate: profile.last_contact_date
      };
    }));

    // Sort by risk score and filter to at-risk relationships
    const atRiskRelationships = riskAnalysis
      .filter(r => r.riskScore >= 20)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Generate AI recommendations for top risks
    let aiRecommendations = [];
    if (atRiskRelationships.length > 0) {
      const topRisks = atRiskRelationships.slice(0, 5);
      
      const prompt = `Based on these at-risk relationships, provide specific, actionable recommendations to re-engage:

${topRisks.map(r => `- ${r.name} (${r.relationshipType}): ${r.riskFactors.join(', ')}`).join('\n')}

Provide 1 specific recommendation per person. Be concise and actionable.`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a relationship coach. Give brief, specific recommendations.' },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'provide_recommendations',
                description: 'Provide relationship re-engagement recommendations',
                parameters: {
                  type: 'object',
                  properties: {
                    recommendations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          action: { type: 'string' },
                          urgency: { type: 'string', enum: ['immediate', 'this_week', 'this_month'] }
                        },
                        required: ['name', 'action', 'urgency']
                      }
                    }
                  },
                  required: ['recommendations']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'provide_recommendations' } }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
            const parsed = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
            aiRecommendations = parsed.recommendations;
          }
        }
      } catch (aiError) {
        console.error('AI recommendation error:', aiError);
      }
    }

    // Calculate network health stats
    const totalContacts = profiles.length;
    const healthyCount = riskAnalysis.filter(r => r.riskLevel === 'low').length;
    const atRiskCount = riskAnalysis.filter(r => r.riskLevel === 'medium').length;
    const criticalCount = riskAnalysis.filter(r => r.riskLevel === 'high').length;

    return new Response(JSON.stringify({ 
      success: true,
      networkHealth: {
        total: totalContacts,
        healthy: healthyCount,
        atRisk: atRiskCount,
        critical: criticalCount,
        healthPercentage: totalContacts > 0 ? Math.round((healthyCount / totalContacts) * 100) : 100
      },
      atRiskRelationships,
      aiRecommendations,
      analyzedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error predicting risks:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
