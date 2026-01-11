import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface CrossPattern {
  patternType: string;
  description: string;
  involvedProfiles: string[];
  evidence: any[];
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  suggestedAction?: string;
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

    const patterns: CrossPattern[] = [];

    // 1. Find entities mentioned by multiple contacts
    const { data: entityMentions } = await supabase
      .from('entity_mentions')
      .select('*, profiles:mentioned_in_profile_id(id, first_name, last_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);

    // Group by normalized name
    const entityGroups = new Map<string, any[]>();
    for (const mention of (entityMentions || [])) {
      const key = `${mention.entity_type}:${mention.normalized_name}`;
      if (!entityGroups.has(key)) {
        entityGroups.set(key, []);
      }
      entityGroups.get(key)!.push(mention);
    }

    // Find shared entities
    for (const [key, mentions] of entityGroups) {
      const profileIds = [...new Set(mentions.filter(m => m.mentioned_in_profile_id).map(m => m.mentioned_in_profile_id))];
      if (profileIds.length >= 2) {
        const [type, name] = key.split(':');
        patterns.push({
          patternType: 'shared_entity',
          description: `${name} (${type}) mentioned by ${profileIds.length} contacts`,
          involvedProfiles: profileIds,
          evidence: mentions.slice(0, 5).map(m => ({
            profileId: m.mentioned_in_profile_id,
            context: m.context,
            sentiment: m.sentiment
          })),
          confidence: Math.min(0.95, 0.6 + (profileIds.length * 0.1)),
          severity: profileIds.length >= 4 ? 'warning' : 'info',
          actionable: true,
          suggestedAction: `Investigate relationship between contacts through ${name}`
        });
      }
    }

    // 2. Find overlapping organizations
    const { data: workExperiences } = await supabase
      .from('work_experiences')
      .select('*, profiles:profile_id(id, first_name, last_name)')
      .eq('user_id', user.id);

    const orgGroups = new Map<string, any[]>();
    for (const exp of (workExperiences || [])) {
      if (exp.company) {
        const key = exp.company.toLowerCase();
        if (!orgGroups.has(key)) {
          orgGroups.set(key, []);
        }
        orgGroups.get(key)!.push(exp);
      }
    }

    for (const [org, experiences] of orgGroups) {
      const profileIds = [...new Set(experiences.map(e => e.profile_id))];
      if (profileIds.length >= 2) {
        patterns.push({
          patternType: 'shared_organization',
          description: `${experiences[0].company}: ${profileIds.length} contacts worked here`,
          involvedProfiles: profileIds,
          evidence: experiences.slice(0, 5).map(e => ({
            profileId: e.profile_id,
            title: e.title,
            timeframe: `${e.start_date || 'Unknown'} - ${e.end_date || 'Present'}`
          })),
          confidence: 0.9,
          severity: 'info',
          actionable: true,
          suggestedAction: `Consider introducing contacts from ${experiences[0].company}`
        });
      }
    }

    // 3. Find communication timing patterns
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('id, sent_at, conversations!inner(profile_id)')
      .eq('conversations.user_id', user.id)
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false })
      .limit(500);

    // Group messages by hour
    const hourlyActivity = new Map<number, Set<string>>();
    for (const msg of (recentMessages || []) as any[]) {
      const hour = new Date(msg.sent_at).getHours();
      if (!hourlyActivity.has(hour)) {
        hourlyActivity.set(hour, new Set());
      }
      if (msg.conversations?.profile_id) {
        hourlyActivity.get(hour)!.add(msg.conversations.profile_id);
      }
    }

    // Find unusual timing clusters
    for (const [hour, profiles] of hourlyActivity) {
      if (profiles.size >= 3 && (hour < 6 || hour > 22)) {
        patterns.push({
          patternType: 'timing_cluster',
          description: `${profiles.size} contacts active during unusual hours (${hour}:00)`,
          involvedProfiles: [...profiles],
          evidence: [{ hour, contactCount: profiles.size }],
          confidence: 0.7,
          severity: 'info',
          actionable: false
        });
      }
    }

    // 4. Find sentiment correlation patterns
    const { data: sentimentData } = await supabase
      .from('communications')
      .select('profile_id, sentiment_score, occurred_at')
      .eq('user_id', user.id)
      .not('sentiment_score', 'is', null)
      .order('occurred_at', { ascending: false })
      .limit(500);

    // Group by profile and calculate average sentiment
    const sentimentByProfile = new Map<string, number[]>();
    for (const comm of (sentimentData || [])) {
      if (!sentimentByProfile.has(comm.profile_id)) {
        sentimentByProfile.set(comm.profile_id, []);
      }
      sentimentByProfile.get(comm.profile_id)!.push(comm.sentiment_score);
    }

    // Find negative sentiment clusters
    const negativeSentimentProfiles: string[] = [];
    for (const [profileId, scores] of sentimentByProfile) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < -0.3 && scores.length >= 3) {
        negativeSentimentProfiles.push(profileId);
      }
    }

    if (negativeSentimentProfiles.length >= 2) {
      patterns.push({
        patternType: 'sentiment_cluster',
        description: `${negativeSentimentProfiles.length} contacts showing consistently negative sentiment`,
        involvedProfiles: negativeSentimentProfiles,
        evidence: negativeSentimentProfiles.map(p => ({
          profileId: p,
          avgSentiment: sentimentByProfile.get(p)!.reduce((a, b) => a + b, 0) / sentimentByProfile.get(p)!.length
        })),
        confidence: 0.75,
        severity: 'warning',
        actionable: true,
        suggestedAction: 'Review relationship health with these contacts'
      });
    }

    // 5. Use AI to find deeper patterns
    if (patterns.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        try {
          const response = await fetch(LOVABLE_AI_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                {
                  role: 'system',
                  content: `Analyze these cross-contact patterns and provide:
1. Overall assessment of relationship network health
2. Top 3 actionable insights
3. Any hidden connections or risks

Return as JSON: { "assessment": "...", "insights": ["..."], "risks": ["..."] }`
                },
                {
                  role: 'user',
                  content: JSON.stringify(patterns.slice(0, 10))
                }
              ],
              max_tokens: 500,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
            const aiAnalysis = JSON.parse(jsonMatch[0]);
            // Store the AI analysis using correct column names
            await supabase.from('cross_contact_patterns').upsert({
              user_id: user.id,
              pattern_type: 'ai_synthesis',
              title: 'Network Intelligence Summary',
              description: aiAnalysis.assessment || 'AI-generated network analysis',
              confidence_score: 0.8,
              profiles_involved: [],
              evidence: {
                insights: aiAnalysis.insights || [],
                risks: aiAnalysis.risks || [],
                generatedAt: new Date().toISOString()
              },
              detected_at: new Date().toISOString(),
              is_active: true
            }, {
              onConflict: 'user_id,pattern_type'
            });
          }
        }
      } catch (aiErr) {
        console.error('AI analysis error:', aiErr);
      }
    }
  }

  // Store detected patterns using correct column names
  for (const pattern of patterns) {
    await supabase.from('cross_contact_patterns').insert({
      user_id: user.id,
      pattern_type: pattern.patternType,
      title: pattern.description.slice(0, 100),
      description: pattern.description,
      confidence_score: pattern.confidence,
      profiles_involved: pattern.involvedProfiles,
      evidence: {
        data: pattern.evidence,
        severity: pattern.severity,
        suggestedAction: pattern.suggestedAction,
        actionable: pattern.actionable
      },
      detected_at: new Date().toISOString(),
      is_active: true
    });
  }

    return new Response(JSON.stringify({
      success: true,
      patternsDetected: patterns.length,
      patterns: patterns.slice(0, 20) // Return top 20
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Cross-pattern detection error:', error);
    
    if (error?.message?.includes('RATE_LIMIT')) {
      return new Response(JSON.stringify({ error: 'Rate limits exceeded.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (error?.message?.includes('BUDGET_EXCEEDED')) {
      return new Response(JSON.stringify({ error: 'AI budget exceeded.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
