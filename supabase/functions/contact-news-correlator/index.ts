import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'contact-news-correlator', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, profileId, newsItemId, days = 7 } = await req.json();

    switch (action) {
      case "correlate_all":
        return await correlateAllContacts(supabase, user.id, days);
      case "correlate_contact":
        return await correlateContact(supabase, user.id, profileId, days);
      case "generate_alerts":
        return await generateAlerts(supabase, user.id);
      case "predict_behavior":
        return await predictContactBehavior(supabase, user.id, profileId);
      case "update_industries":
        return await updateIndustryTracking(supabase, user.id);
      case "get_alerts":
        return await getAlerts(supabase, user.id, profileId);
      case "mark_alert_read":
        return await markAlertRead(supabase, user.id, newsItemId);
      case "get_predictions":
        return await getPredictions(supabase, user.id, profileId);
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Contact-news correlator error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function correlateAllContacts(supabase: any, userId: string, days: number) {
  // Get all contacts with organization info
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, organization, job_title, city, country, tags")
    .eq("user_id", userId)
    .limit(500);

  if (profilesError) throw profilesError;

  // Get recent news
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: newsItems, error: newsError } = await supabase
    .from("news_intelligence_items")
    .select("*")
    .eq("user_id", userId)
    .gte("published_at", cutoffDate)
    .order("published_at", { ascending: false })
    .limit(200);

  if (newsError) throw newsError;

  const correlations = [];
  const alerts = [];

  for (const profile of profiles || []) {
    const profileKeywords = extractProfileKeywords(profile);
    
    for (const news of newsItems || []) {
      const matchScore = calculateMatchScore(profileKeywords, news);
      
      if (matchScore > 0.3) {
        const correlation = {
          user_id: userId,
          profile_id: profile.id,
          news_item_id: news.id,
          correlation_type: determineCorrelationType(news, profile),
          correlation_score: matchScore,
          matched_entities: findMatchedEntities(profileKeywords, news),
          impact_assessment: assessImpact(news, profile, matchScore),
        };
        correlations.push(correlation);

        // Generate alert if significant
        if (matchScore > 0.6 || news.sentiment_score < -0.3 || news.sentiment_score > 0.5) {
          alerts.push(createAlert(userId, profile, news, correlation));
        }
      }
    }
  }

  // Batch insert correlations
  if (correlations.length > 0) {
    const { error: insertError } = await supabase
      .from("contact_news_correlations")
      .upsert(correlations, { onConflict: "user_id,profile_id,news_item_id" });
    if (insertError) console.error("Correlation insert error:", insertError);
  }

  // Batch insert alerts
  if (alerts.length > 0) {
    const { error: alertError } = await supabase
      .from("contact_news_alerts")
      .insert(alerts);
    if (alertError) console.error("Alert insert error:", alertError);
  }

  return new Response(JSON.stringify({
    success: true,
    correlationsFound: correlations.length,
    alertsGenerated: alerts.length,
    profilesAnalyzed: profiles?.length || 0,
    newsAnalyzed: newsItems?.length || 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function correlateContact(supabase: any, userId: string, profileId: string, days: number) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", userId)
    .single();

  if (profileError) throw profileError;

  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: newsItems, error: newsError } = await supabase
    .from("news_intelligence_items")
    .select("*")
    .eq("user_id", userId)
    .gte("published_at", cutoffDate)
    .order("relevance_score", { ascending: false })
    .limit(100);

  if (newsError) throw newsError;

  const profileKeywords = extractProfileKeywords(profile);
  const correlations = [];

  for (const news of newsItems || []) {
    const matchScore = calculateMatchScore(profileKeywords, news);
    if (matchScore > 0.2) {
      correlations.push({
        news,
        score: matchScore,
        type: determineCorrelationType(news, profile),
        impact: assessImpact(news, profile, matchScore),
      });
    }
  }

  // Sort by score
  correlations.sort((a, b) => b.score - a.score);

  // Use AI for deeper analysis if significant correlations found
  let aiAnalysis = null;
  if (correlations.length > 0) {
    aiAnalysis = await analyzeWithAI(profile, correlations.slice(0, 10));
  }

  return new Response(JSON.stringify({
    success: true,
    profile: {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      organization: profile.organization,
    },
    correlations: correlations.slice(0, 20),
    aiAnalysis,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function generateAlerts(supabase: any, userId: string) {
  // Get high-impact recent news
  const { data: recentNews, error: newsError } = await supabase
    .from("news_intelligence_items")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .or("sentiment_score.lt.-0.3,sentiment_score.gt.0.5,relevance_score.gt.0.7")
    .limit(50);

  if (newsError) throw newsError;

  // Get all contacts
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, organization, job_title")
    .eq("user_id", userId);

  if (profilesError) throw profilesError;

  const newAlerts = [];

  for (const news of recentNews || []) {
    for (const profile of profiles || []) {
      const profileKeywords = extractProfileKeywords(profile);
      const matchScore = calculateMatchScore(profileKeywords, news);

      if (matchScore > 0.5) {
        const alertType = determineAlertType(news, profile);
        const severity = determineSeverity(news, matchScore);

        newAlerts.push({
          user_id: userId,
          profile_id: profile.id,
          news_item_id: news.id,
          alert_type: alertType,
          severity,
          title: generateAlertTitle(alertType, profile, news),
          description: generateAlertDescription(alertType, profile, news),
          predicted_impact: {
            type: alertType,
            magnitude: matchScore > 0.8 ? "high" : matchScore > 0.6 ? "medium" : "low",
            timeframe: news.sentiment_score < -0.3 ? "immediate" : "near_term",
            confidence: matchScore,
          },
          recommended_actions: generateRecommendedActions(alertType, profile, news),
          conversation_starters: generateConversationStarters(news, profile),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }
  }

  if (newAlerts.length > 0) {
    const { error: insertError } = await supabase
      .from("contact_news_alerts")
      .insert(newAlerts);
    if (insertError) console.error("Alert insert error:", insertError);
  }

  return new Response(JSON.stringify({
    success: true,
    alertsGenerated: newAlerts.length,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function predictContactBehavior(supabase: any, userId: string, profileId: string) {
  // Get contact with full context
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", userId)
    .single();

  if (profileError) throw profileError;

  // Get recent correlations
  const { data: correlations, error: corrError } = await supabase
    .from("contact_news_correlations")
    .select("*, news_intelligence_items(*)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (corrError) throw corrError;

  // Get behavioral history
  const { data: behaviorHistory, error: behaviorError } = await supabase
    .from("behavioral_analyses")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Use AI to predict behavior
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const predictions = await generateBehaviorPredictions(
    profile,
    correlations || [],
    behaviorHistory || [],
    LOVABLE_API_KEY
  );

  // Store predictions
  if (predictions.length > 0) {
    const predictionsToInsert = predictions.map((p: any) => ({
      user_id: userId,
      profile_id: profileId,
      prediction_type: p.type,
      trigger_source: "news",
      trigger_details: p.trigger,
      prediction_value: p.prediction,
      confidence_score: p.confidence,
      evidence: p.evidence,
      time_horizon: p.timeHorizon,
    }));

    const { error: insertError } = await supabase
      .from("contact_behavior_predictions")
      .insert(predictionsToInsert);
    if (insertError) console.error("Prediction insert error:", insertError);
  }

  return new Response(JSON.stringify({
    success: true,
    profile: {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
    },
    predictions,
    correlationsAnalyzed: correlations?.length || 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function generateBehaviorPredictions(
  profile: any,
  correlations: any[],
  behaviorHistory: any[],
  apiKey: string
): Promise<any[]> {
  const newsContext = correlations.map(c => ({
    headline: c.news_intelligence_items?.title,
    sentiment: c.news_intelligence_items?.sentiment_score,
    entities: c.news_intelligence_items?.entities,
    correlationScore: c.correlation_score,
  }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a behavioral prediction AI. Based on news correlations and contact context, predict likely behaviors.
          
Return a JSON array of predictions with this structure:
{
  "predictions": [
    {
      "type": "job_change|financial_stress|opportunity_window|mood_shift|decision_timing|travel",
      "prediction": {
        "description": "What you predict will happen",
        "likelihood": 0.0-1.0,
        "indicators": ["specific signals"],
        "implications": "What this means for the user"
      },
      "confidence": 0.0-1.0,
      "evidence": ["specific evidence points"],
      "timeHorizon": "immediate|days|weeks|months",
      "trigger": {
        "type": "news|pattern|behavior",
        "details": "What triggered this prediction"
      }
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analyze this contact and predict their likely behavior:

CONTACT:
Name: ${profile.first_name} ${profile.last_name}
Organization: ${profile.organization || "Unknown"}
Title: ${profile.job_title || "Unknown"}

RELEVANT NEWS CORRELATIONS:
${JSON.stringify(newsContext, null, 2)}

BEHAVIORAL HISTORY SUMMARY:
${behaviorHistory.length > 0 ? JSON.stringify(behaviorHistory.slice(0, 3), null, 2) : "No prior behavioral analysis"}

Predict:
1. Job change likelihood (if company has layoffs, restructuring, negative news)
2. Financial stress indicators (industry downturns, company issues)
3. Opportunity windows (positive news, expansions, funding)
4. Mood/attitude shifts (based on news sentiment affecting them)
5. Decision timing (when they might be receptive to offers/asks)`
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    console.error("AI prediction error:", await response.text());
    return [];
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "{}";
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.predictions || [];
    }
  } catch (e) {
    console.error("Parse error:", e);
  }
  
  return [];
}

async function updateIndustryTracking(supabase: any, userId: string) {
  // Get unique organizations from contacts (industry field doesn't exist)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("organization")
    .eq("user_id", userId)
    .not("organization", "is", null);

  if (profilesError) throw profilesError;

  const industryCounts: Record<string, number> = {};
  for (const p of profiles || []) {
    if (p.organization) {
      industryCounts[p.organization] = (industryCounts[p.organization] || 0) + 1;
    }
  }

  // Get recent news for sentiment
  const { data: recentNews, error: newsError } = await supabase
    .from("news_intelligence_items")
    .select("sectors, sentiment_score, relevance_score")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (newsError) throw newsError;

  // Calculate industry sentiment
  const industrySentiment: Record<string, { total: number; count: number }> = {};
  for (const news of recentNews || []) {
    for (const sector of news.sectors || []) {
      if (!industrySentiment[sector]) {
        industrySentiment[sector] = { total: 0, count: 0 };
      }
      industrySentiment[sector].total += news.sentiment_score || 0;
      industrySentiment[sector].count += 1;
    }
  }

  // Upsert tracked industries
  const industries = Object.entries(industryCounts).map(([name, count]) => {
    const sentiment = industrySentiment[name];
    const avgSentiment = sentiment ? sentiment.total / sentiment.count : 0;
    
    return {
      user_id: userId,
      industry_name: name,
      contacts_count: count,
      current_sentiment: avgSentiment,
      sentiment_trend: avgSentiment > 0.2 ? "rising" : avgSentiment < -0.2 ? "falling" : "stable",
      risk_level: avgSentiment < -0.3 ? "high" : avgSentiment < 0 ? "medium" : "low",
      opportunity_score: Math.max(0, avgSentiment * 100),
    };
  });

  for (const industry of industries) {
    const { error } = await supabase
      .from("tracked_industries")
      .upsert(industry, { onConflict: "user_id,industry_name" });
    if (error) console.error("Industry upsert error:", error);
  }

  return new Response(JSON.stringify({
    success: true,
    industriesTracked: industries.length,
    industries: industries.map(i => ({
      name: i.industry_name,
      contacts: i.contacts_count,
      sentiment: i.current_sentiment,
      trend: i.sentiment_trend,
    })),
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAlerts(supabase: any, userId: string, profileId?: string) {
  let query = supabase
    .from("contact_news_alerts")
    .select("*, profiles(first_name, last_name, organization), news_intelligence_items(title, source)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (profileId) {
    query = query.eq("profile_id", profileId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    alerts: data,
    unreadCount: data?.filter((a: any) => !a.is_read).length || 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function markAlertRead(supabase: any, userId: string, alertId: string) {
  const { error } = await supabase
    .from("contact_news_alerts")
    .update({ is_read: true })
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getPredictions(supabase: any, userId: string, profileId?: string) {
  let query = supabase
    .from("contact_behavior_predictions")
    .select("*, profiles(first_name, last_name, organization)")
    .eq("user_id", userId)
    .order("confidence_score", { ascending: false })
    .limit(50);

  if (profileId) {
    query = query.eq("profile_id", profileId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    predictions: data,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Helper functions
function extractProfileKeywords(profile: any): string[] {
  const keywords: string[] = [];
  if (profile.organization) keywords.push(profile.organization.toLowerCase());
  if (profile.job_title) {
    keywords.push(...profile.job_title.toLowerCase().split(/\s+/));
  }
  if (profile.city) keywords.push(profile.city.toLowerCase());
  if (profile.country) keywords.push(profile.country.toLowerCase());
  if (profile.tags) keywords.push(...(profile.tags || []));
  return keywords.filter(k => k && k.length > 2);
}

function calculateMatchScore(profileKeywords: string[], news: any): number {
  let score = 0;
  const newsText = `${news.title || ""} ${news.summary || ""} ${JSON.stringify(news.entities || {})}`.toLowerCase();
  
  for (const keyword of profileKeywords) {
    if (newsText.includes(keyword)) {
      score += 0.2;
    }
  }
  
  // Boost for entity matches
  const entities = news.entities || {};
  for (const keyword of profileKeywords) {
    if (entities.companies?.some((c: string) => c.toLowerCase().includes(keyword))) {
      score += 0.3;
    }
    if (entities.industries?.some((i: string) => i.toLowerCase().includes(keyword))) {
      score += 0.2;
    }
  }
  
  return Math.min(1, score);
}

function determineCorrelationType(news: any, profile: any): string {
  if (news.entities?.companies?.some((c: string) => 
    c.toLowerCase().includes(profile.organization?.toLowerCase() || ""))) {
    return "direct_organization_mention";
  }
  if (news.sectors?.some((s: string) => 
    s.toLowerCase().includes(profile.organization?.toLowerCase() || ""))) {
    return "organization_related";
  }
  return "keyword_match";
}

function findMatchedEntities(profileKeywords: string[], news: any): string[] {
  const matched: string[] = [];
  const entities = news.entities || {};
  
  for (const keyword of profileKeywords) {
    if (entities.companies?.some((c: string) => c.toLowerCase().includes(keyword))) {
      matched.push(`company:${keyword}`);
    }
    if (entities.people?.some((p: string) => p.toLowerCase().includes(keyword))) {
      matched.push(`person:${keyword}`);
    }
  }
  
  return matched;
}

function assessImpact(news: any, profile: any, matchScore: number): any {
  const sentiment = news.sentiment_score || 0;
  return {
    magnitude: matchScore > 0.7 ? "high" : matchScore > 0.4 ? "medium" : "low",
    sentiment: sentiment > 0.2 ? "positive" : sentiment < -0.2 ? "negative" : "neutral",
    urgency: Math.abs(sentiment) > 0.5 && matchScore > 0.6 ? "high" : "normal",
  };
}

function createAlert(userId: string, profile: any, news: any, correlation: any): any {
  const alertType = determineAlertType(news, profile);
  return {
    user_id: userId,
    profile_id: profile.id,
    news_item_id: news.id,
    alert_type: alertType,
    severity: determineSeverity(news, correlation.correlation_score),
    title: generateAlertTitle(alertType, profile, news),
    description: generateAlertDescription(alertType, profile, news),
    predicted_impact: correlation.impact_assessment,
    recommended_actions: generateRecommendedActions(alertType, profile, news),
    conversation_starters: generateConversationStarters(news, profile),
  };
}

function determineAlertType(news: any, profile: any): string {
  const title = (news.title || "").toLowerCase();
  const sentiment = news.sentiment_score || 0;
  
  if (title.includes("layoff") || title.includes("cutting jobs") || title.includes("workforce reduction")) {
    return "layoff_warning";
  }
  if (title.includes("funding") || title.includes("raises") || title.includes("investment")) {
    return "funding_announcement";
  }
  if (title.includes("competitor") || title.includes("rival")) {
    return "competitor_move";
  }
  if (sentiment < -0.4) {
    return "risk";
  }
  if (sentiment > 0.4) {
    return "opportunity";
  }
  return "company_news";
}

function determineSeverity(news: any, matchScore: number): string {
  const sentiment = Math.abs(news.sentiment_score || 0);
  if (sentiment > 0.6 && matchScore > 0.7) return "critical";
  if (sentiment > 0.4 || matchScore > 0.6) return "high";
  if (sentiment > 0.2 || matchScore > 0.4) return "medium";
  return "low";
}

function generateAlertTitle(alertType: string, profile: any, news: any): string {
  const name = `${profile.first_name} ${profile.last_name}`;
  switch (alertType) {
    case "layoff_warning":
      return `⚠️ Layoff Alert: ${profile.organization || "Organization"} mentioned in workforce news`;
    case "funding_announcement":
      return `💰 Opportunity: ${profile.organization || "Organization"} funding/investment news`;
    case "competitor_move":
      return `🎯 Competitive Intel: Movement in ${name}'s sector`;
    case "risk":
      return `🚨 Risk Alert: Negative news affecting ${name}`;
    case "opportunity":
      return `✨ Opportunity: Positive developments for ${name}`;
    default:
      return `📰 News Alert: ${profile.organization || name} in the news`;
  }
}

function generateAlertDescription(alertType: string, profile: any, news: any): string {
  return `${news.title}\n\nThis may affect ${profile.first_name} ${profile.last_name} at ${profile.organization || "their organization"}.`;
}

function generateRecommendedActions(alertType: string, profile: any, news: any): any[] {
  const actions: any[] = [];
  
  switch (alertType) {
    case "layoff_warning":
      actions.push(
        { action: "Reach out with support/networking offer", priority: "high", timing: "within 48 hours" },
        { action: "Position yourself as a resource for their next move", priority: "medium", timing: "within 1 week" }
      );
      break;
    case "funding_announcement":
      actions.push(
        { action: "Congratulate and explore collaboration opportunities", priority: "high", timing: "within 24 hours" },
        { action: "Discuss how you can help with their growth", priority: "medium", timing: "within 1 week" }
      );
      break;
    case "opportunity":
      actions.push(
        { action: "Connect to leverage positive momentum", priority: "medium", timing: "within 1 week" }
      );
      break;
    case "risk":
      actions.push(
        { action: "Check in with empathy and support", priority: "medium", timing: "within 48 hours" }
      );
      break;
  }
  
  return actions;
}

function generateConversationStarters(news: any, profile: any): string[] {
  return [
    `I saw the news about ${news.title?.split(":")[0] || "recent developments"} - how is that affecting things at ${profile.organization || "your organization"}?`,
    `With everything happening in your sector, I wanted to check in and see how you're doing.`,
    `I noticed some interesting news that might be relevant to your work - would love to chat about it.`,
  ];
}

async function analyzeWithAI(profile: any, correlations: any[]): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Analyze news correlations for a contact and provide strategic insights. Be concise and actionable."
          },
          {
            role: "user",
            content: `Contact: ${profile.first_name} ${profile.last_name} at ${profile.organization || "Unknown"} (${profile.job_title || "Unknown"})

Correlated News:
${correlations.map(c => `- ${c.news?.title} (Score: ${c.score.toFixed(2)}, Impact: ${c.impact?.magnitude})`).join("\n")}

Provide:
1. Overall situation assessment (2-3 sentences)
2. Key opportunities (bullet points)
3. Risks to monitor (bullet points)
4. Recommended approach (1 paragraph)`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("AI analysis error:", e);
    return null;
  }
}
