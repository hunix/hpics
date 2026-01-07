import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AggregatedInsight {
  category: string;
  finding: string;
  confidence: number;
  sourceCount: number;
  mediaIds: string[];
}

interface ContactAggregation {
  profileId: string;
  profileName: string;
  totalAnalyzed: number;
  insights: AggregatedInsight[];
  emotionalPatterns: Record<string, number>;
  behavioralPatterns: Record<string, number>;
  topicsCovered: string[];
  riskFlags: string[];
  strengthSignals: string[];
}

interface CrossContactInsight {
  type: string;
  description: string;
  involvedProfiles: string[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { sessionId } = await req.json();

    // Fetch session with all completed items
    const { data: session, error: sessionError } = await supabase
      .from("bulk_analysis_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // Fetch all completed items with their results
    const { data: completedItems } = await supabase
      .from("bulk_analysis_items")
      .select("*")
      .eq("session_id", sessionId)
      .eq("status", "completed");

    if (!completedItems || completedItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No completed items to aggregate" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by contact
    const byContact: Record<string, typeof completedItems> = {};
    for (const item of completedItems) {
      const profileId = item.profile_id;
      if (!byContact[profileId]) {
        byContact[profileId] = [];
      }
      byContact[profileId].push(item);
    }

    // Fetch profile names
    const profileIds = Object.keys(byContact);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", profileIds);

    const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name}`]) || []);

    // Aggregate findings per contact
    const contactAggregations: ContactAggregation[] = [];

    for (const [profileId, items] of Object.entries(byContact)) {
      const emotionalPatterns: Record<string, number> = {};
      const behavioralPatterns: Record<string, number> = {};
      const topicsSet = new Set<string>();
      const riskFlags: string[] = [];
      const strengthSignals: string[] = [];
      const insights: AggregatedInsight[] = [];

      for (const item of items) {
        const result = item.result as Record<string, unknown> | null;
        if (!result) continue;

        // Extract emotional patterns
        if (result.emotions && typeof result.emotions === "object") {
          for (const [emotion, value] of Object.entries(result.emotions as Record<string, number>)) {
            emotionalPatterns[emotion] = (emotionalPatterns[emotion] || 0) + (value || 0);
          }
        }

        // Extract behavioral patterns
        if (result.behaviors && Array.isArray(result.behaviors)) {
          for (const behavior of result.behaviors) {
            if (typeof behavior === "string") {
              behavioralPatterns[behavior] = (behavioralPatterns[behavior] || 0) + 1;
            }
          }
        }

        // Extract topics
        if (result.topics && Array.isArray(result.topics)) {
          for (const topic of result.topics) {
            if (typeof topic === "string") {
              topicsSet.add(topic);
            }
          }
        }

        // Extract risk flags
        if (result.riskIndicators && Array.isArray(result.riskIndicators)) {
          riskFlags.push(...result.riskIndicators.filter((r): r is string => typeof r === "string"));
        }

        // Extract strength signals
        if (result.positiveIndicators && Array.isArray(result.positiveIndicators)) {
          strengthSignals.push(...result.positiveIndicators.filter((s): s is string => typeof s === "string"));
        }

        // Extract key insights
        if (result.keyInsights && Array.isArray(result.keyInsights)) {
          for (const insight of result.keyInsights) {
            if (typeof insight === "object" && insight !== null) {
              insights.push({
                category: (insight as { category?: string }).category || "general",
                finding: (insight as { finding?: string }).finding || String(insight),
                confidence: (insight as { confidence?: number }).confidence || 0.7,
                sourceCount: 1,
                mediaIds: [item.media_id || item.document_id || ""],
              });
            }
          }
        }
      }

      // Normalize emotional patterns
      const totalEmotions = Object.values(emotionalPatterns).reduce((a, b) => a + b, 0);
      if (totalEmotions > 0) {
        for (const key of Object.keys(emotionalPatterns)) {
          emotionalPatterns[key] = emotionalPatterns[key] / totalEmotions;
        }
      }

      // Deduplicate and merge similar insights
      const mergedInsights = mergeInsights(insights);

      contactAggregations.push({
        profileId,
        profileName: profileMap.get(profileId) || "Unknown",
        totalAnalyzed: items.length,
        insights: mergedInsights,
        emotionalPatterns,
        behavioralPatterns,
        topicsCovered: Array.from(topicsSet),
        riskFlags: [...new Set(riskFlags)],
        strengthSignals: [...new Set(strengthSignals)],
      });
    }

    // Generate cross-contact insights using AI
    let crossContactInsights: CrossContactInsight[] = [];
    
    if (lovableApiKey && contactAggregations.length > 1) {
      try {
        const prompt = `Analyze these contact aggregations and identify cross-contact patterns, shared experiences, or relationship dynamics:

${JSON.stringify(contactAggregations.map(c => ({
  name: c.profileName,
  emotionalPatterns: c.emotionalPatterns,
  behavioralPatterns: c.behavioralPatterns,
  topics: c.topicsCovered,
  riskFlags: c.riskFlags,
})), null, 2)}

Provide insights in JSON format:
{
  "crossContactInsights": [
    {
      "type": "shared_experience" | "relationship_pattern" | "group_dynamic" | "conflict_indicator" | "opportunity",
      "description": "Brief description of the insight",
      "involvedProfiles": ["profile names"],
      "confidence": 0.0-1.0
    }
  ]
}`;

        const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const parsed = JSON.parse(aiResult.choices[0].message.content);
          crossContactInsights = parsed.crossContactInsights || [];
        }
      } catch (aiError) {
        console.error("AI cross-contact analysis failed:", aiError);
      }
    }

    // Build aggregation result
    const aggregationResult = {
      sessionId,
      generatedAt: new Date().toISOString(),
      totalItemsAnalyzed: completedItems.length,
      contactCount: contactAggregations.length,
      contactAggregations,
      crossContactInsights,
      summary: {
        dominantEmotions: getDominantPatterns(
          mergePatternMaps(contactAggregations.map(c => c.emotionalPatterns))
        ),
        commonBehaviors: getDominantPatterns(
          mergePatternMaps(contactAggregations.map(c => c.behavioralPatterns))
        ),
        allRiskFlags: [...new Set(contactAggregations.flatMap(c => c.riskFlags))],
        allStrengthSignals: [...new Set(contactAggregations.flatMap(c => c.strengthSignals))],
      },
    };

    // Store aggregation result
    await supabase
      .from("bulk_analysis_sessions")
      .update({ 
        aggregation_result: aggregationResult,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Optionally trigger deep psychological analysis for contacts with significant findings
    if (session.trigger_deep_analysis) {
      const contactsWithSignificantData = contactAggregations.filter(
        c => c.totalAnalyzed >= 3 || c.riskFlags.length > 0 || c.insights.length >= 5
      );

      for (const contact of contactsWithSignificantData) {
        // Queue deep analysis (fire and forget)
        fetch(`${supabaseUrl}/functions/v1/deep-psychological-analysis`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            profileId: contact.profileId,
            triggerSource: "bulk_analysis_aggregation",
            sessionId,
          }),
        }).catch(err => console.error("Failed to trigger deep analysis:", err));
      }
    }

    return new Response(
      JSON.stringify(aggregationResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in aggregate-bulk-results:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function mergeInsights(insights: AggregatedInsight[]): AggregatedInsight[] {
  const merged: Map<string, AggregatedInsight> = new Map();

  for (const insight of insights) {
    const key = `${insight.category}:${insight.finding.toLowerCase().slice(0, 50)}`;
    const existing = merged.get(key);

    if (existing) {
      existing.sourceCount += 1;
      existing.confidence = Math.max(existing.confidence, insight.confidence);
      existing.mediaIds.push(...insight.mediaIds);
    } else {
      merged.set(key, { ...insight });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20);
}

function mergePatternMaps(maps: Record<string, number>[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      result[key] = (result[key] || 0) + value;
    }
  }
  return result;
}

function getDominantPatterns(patterns: Record<string, number>, limit = 5): string[] {
  return Object.entries(patterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key]) => key);
}
