import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Data source weights for fusion
const SOURCE_WEIGHTS: Record<string, number> = {
  profile: 1.0,
  contact_methods: 0.9,
  communications: 0.85,
  messages: 0.8,
  documents: 0.75,
  media: 0.7,
  observations: 0.65,
  behavioral_analyses: 0.9,
  psychological_profiles: 0.95,
  voice_analyses: 0.8,
  facial_analyses: 0.75,
  body_language: 0.7,
  enrichment_data: 0.6,
  network_analysis: 0.85,
  news_correlations: 0.5,
  predictions: 0.7,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'unified-data-fusion', timestamp: Date.now() }), {
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

    const body = await req.json();
    const token = authHeader.replace("Bearer ", "");
    const isServiceRoleCall = token === supabaseKey;
    
    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required for service calls" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
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
      userId = user.id;
    }

    // Default to comprehensive_fusion for intelligence session calls
    const action = body.action || "comprehensive_fusion";
    const profileId = body.profileId || body.profile_id;
    const options = body.options || {};

    switch (action) {
      case "comprehensive_fusion":
        return await comprehensiveFusion(supabase, userId, profileId, options);
      case "get_data_completeness":
        return await getDataCompleteness(supabase, userId, profileId);
      case "cross_contact_analysis":
        return await crossContactAnalysis(supabase, userId, options);
      case "pattern_detection":
        return await patternDetection(supabase, userId, profileId);
      case "temporal_analysis":
        return await temporalAnalysis(supabase, userId, profileId, options);
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Data fusion error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function comprehensiveFusion(supabase: any, userId: string, profileId: string, options: any) {
  const dataCollections: Record<string, any> = {};
  const completenessScores: Record<string, number> = {};
  
  // 1. Core Profile Data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", userId)
    .single();
  
  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  dataCollections.profile = profile;
  completenessScores.profile = calculateProfileCompleteness(profile);

  // 2. Contact Methods
  // contact_methods has no user_id column, must join via profiles for ownership
  const { data: contactMethods } = await supabase
    .from("contact_methods")
    .select("*, profiles!inner(user_id)")
    .eq("profile_id", profileId)
    .eq("profiles.user_id", userId);
  dataCollections.contactMethods = contactMethods || [];
  completenessScores.contactMethods = (contactMethods?.length || 0) > 0 ? 1 : 0;

  // 3. Personal Info
  const { data: personalInfo } = await supabase
    .from("contact_personal_info")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .single();
  dataCollections.personalInfo = personalInfo;
  completenessScores.personalInfo = personalInfo ? calculatePersonalInfoCompleteness(personalInfo) : 0;

  // 4. Communications
  const { data: communications } = await supabase
    .from("communications")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(100);
  dataCollections.communications = communications || [];
  completenessScores.communications = Math.min(1, (communications?.length || 0) / 10);

  // 5. Messages
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  
  const conversationIds = (conversations || []).map((c: any) => c.id);
  let messages: any[] = [];
  if (conversationIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("sent_at", { ascending: false })
      .limit(200);
    messages = msgs || [];
  }
  dataCollections.messages = messages;
  completenessScores.messages = Math.min(1, messages.length / 20);

  // 6. Documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.documents = documents || [];
  completenessScores.documents = (documents?.length || 0) > 0 ? 1 : 0;

  // 7. Media
  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.media = media || [];
  completenessScores.media = (media?.length || 0) > 0 ? 1 : 0;

  // 8. Observations
  const { data: observations } = await supabase
    .from("contact_observations")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.observations = observations || [];
  completenessScores.observations = Math.min(1, (observations?.length || 0) / 5);

  // 9. Behavioral Analyses
  const { data: behavioralAnalyses } = await supabase
    .from("behavioral_analyses")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.behavioralAnalyses = behavioralAnalyses || [];
  completenessScores.behavioralAnalyses = (behavioralAnalyses?.length || 0) > 0 ? 1 : 0;

  // 10. Psychological Profile
  const { data: psychProfile } = await supabase
    .from("psychological_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .single();
  dataCollections.psychologicalProfile = psychProfile;
  completenessScores.psychologicalProfile = psychProfile ? 1 : 0;

  // 11. Voice Analyses
  const { data: voiceAnalyses } = await supabase
    .from("vocal_analyses")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.voiceAnalyses = voiceAnalyses || [];
  completenessScores.voiceAnalyses = (voiceAnalyses?.length || 0) > 0 ? 1 : 0;

  // 12. Facial Analyses
  const { data: facialAnalyses } = await supabase
    .from("facial_analyses")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.facialAnalyses = facialAnalyses || [];
  completenessScores.facialAnalyses = (facialAnalyses?.length || 0) > 0 ? 1 : 0;

  // 13. Body Language
  const { data: bodyLanguage } = await supabase
    .from("body_language_analyses")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.bodyLanguage = bodyLanguage || [];
  completenessScores.bodyLanguage = (bodyLanguage?.length || 0) > 0 ? 1 : 0;

  // 14. Enrichment Data - fetch from ai_analyses instead of non-existent table
  const { data: enrichmentData } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .eq("analysis_type", "enrichment");
  dataCollections.enrichmentData = enrichmentData || [];
  completenessScores.enrichmentData = (enrichmentData?.length || 0) > 0 ? 1 : 0;

  // 15. Network/Relationships
  const { data: relationships } = await supabase
    .from("contact_relationships")
    .select("*, to_profile:profiles!contact_relationships_to_profile_id_fkey(id, first_name, last_name)")
    .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`)
    .eq("user_id", userId);
  dataCollections.relationships = relationships || [];
  completenessScores.relationships = Math.min(1, (relationships?.length || 0) / 3);

  // 16. News Correlations
  const { data: newsCorrelations } = await supabase
    .from("contact_news_correlations")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  dataCollections.newsCorrelations = newsCorrelations || [];
  completenessScores.newsCorrelations = (newsCorrelations?.length || 0) > 0 ? 1 : 0;

  // 17. Predictions
  const { data: predictions } = await supabase
    .from("contact_behavior_predictions")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  dataCollections.predictions = predictions || [];
  completenessScores.predictions = (predictions?.length || 0) > 0 ? 1 : 0;

  // 18. AI Analyses
  const { data: aiAnalyses } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.aiAnalyses = aiAnalyses || [];
  completenessScores.aiAnalyses = (aiAnalyses?.length || 0) > 0 ? 1 : 0;

  // 19. Biometric Data
  const { data: biometricSamples } = await supabase
    .from("biometric_samples")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.biometricSamples = biometricSamples || [];
  completenessScores.biometricSamples = (biometricSamples?.length || 0) > 0 ? 1 : 0;

  // 20. Events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", userId);
  dataCollections.events = events || [];
  completenessScores.events = (events?.length || 0) > 0 ? 1 : 0;

  // 21. Document Embeddings (for RAG context)
  const { data: embeddings } = await supabase
    .from("document_embeddings")
    .select("id, source_type, content_summary, metadata")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .limit(50);
  dataCollections.embeddingsContext = embeddings || [];
  completenessScores.embeddings = (embeddings?.length || 0) > 0 ? 1 : 0;

  // Calculate overall completeness
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [source, score] of Object.entries(completenessScores)) {
    const weight = SOURCE_WEIGHTS[source] || 0.5;
    weightedSum += score * weight;
    totalWeight += weight;
  }
  const overallCompleteness = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Generate fusion summary with AI if requested
  let fusionSummary = null;
  if (options.generateSummary) {
    fusionSummary = await generateFusionSummary(dataCollections, overallCompleteness);
  }

  return new Response(JSON.stringify({
    success: true,
    profileId,
    dataCollections,
    completenessScores,
    overallCompleteness,
    fusionSummary,
    stats: {
      totalDataPoints: Object.values(dataCollections).reduce((sum: number, arr: any) => 
        sum + (Array.isArray(arr) ? arr.length : (arr ? 1 : 0)), 0),
      sourcesWithData: Object.values(completenessScores).filter(s => s > 0).length,
      totalSources: Object.keys(completenessScores).length,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getDataCompleteness(supabase: any, userId: string, profileId: string) {
  const sources = [
    { name: "profile", table: "profiles", filter: { id: profileId } },
    { name: "contactMethods", table: "contact_methods", filter: { profile_id: profileId } },
    { name: "personalInfo", table: "contact_personal_info", filter: { profile_id: profileId } },
    { name: "communications", table: "communications", filter: { profile_id: profileId } },
    { name: "documents", table: "documents", filter: { profile_id: profileId } },
    { name: "media", table: "media", filter: { profile_id: profileId } },
    { name: "observations", table: "contact_observations", filter: { profile_id: profileId } },
    { name: "behavioralAnalyses", table: "behavioral_analyses", filter: { profile_id: profileId } },
    { name: "psychologicalProfile", table: "psychological_profiles", filter: { profile_id: profileId } },
    { name: "voiceAnalyses", table: "vocal_analyses", filter: { profile_id: profileId } },
    { name: "facialAnalyses", table: "facial_analyses", filter: { profile_id: profileId } },
    { name: "bodyLanguage", table: "body_language_analyses", filter: { profile_id: profileId } },
    { name: "enrichmentData", table: "contact_observations", filter: { profile_id: profileId } }, // contact_enrichment_data doesn't exist, use observations
    { name: "relationships", table: "contact_relationships", filter: {} }, // Special handling
    { name: "aiAnalyses", table: "ai_analyses", filter: { profile_id: profileId } },
    { name: "biometricSamples", table: "biometric_samples", filter: { profile_id: profileId } },
    { name: "events", table: "events", filter: { profile_id: profileId } },
    { name: "embeddings", table: "document_embeddings", filter: { profile_id: profileId } },
  ];

  const completeness: Record<string, { hasData: boolean; count: number; weight: number }> = {};

  for (const source of sources) {
    try {
      let query = supabase.from(source.table).select("id", { count: "exact", head: true });
      
      if (source.name === "relationships") {
        query = query.or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);
      } else {
        for (const [key, value] of Object.entries(source.filter)) {
          query = query.eq(key, value);
        }
      }
      query = query.eq("user_id", userId);
      
      const { count } = await query;
      completeness[source.name] = {
        hasData: (count || 0) > 0,
        count: count || 0,
        weight: SOURCE_WEIGHTS[source.name] || 0.5,
      };
    } catch (e) {
      completeness[source.name] = { hasData: false, count: 0, weight: 0.5 };
    }
  }

  let totalWeight = 0;
  let weightedSum = 0;
  for (const [, data] of Object.entries(completeness)) {
    weightedSum += (data.hasData ? 1 : 0) * data.weight;
    totalWeight += data.weight;
  }

  return new Response(JSON.stringify({
    success: true,
    completeness,
    overallScore: totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0,
    sourcesWithData: Object.values(completeness).filter(c => c.hasData).length,
    totalSources: sources.length,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function crossContactAnalysis(supabase: any, userId: string, options: any) {
  const { analysisType = "all", limit = 50 } = options;

  const results: any = {
    sharedConnections: [],
    commonEntities: [],
    communicationPatterns: [],
    behavioralSimilarities: [],
  };

  // Find shared connections
  if (analysisType === "all" || analysisType === "connections") {
    const { data: relationships } = await supabase
      .from("contact_relationships")
      .select("from_profile_id, to_profile_id, relationship_type")
      .eq("user_id", userId);

    const connectionMap: Record<string, string[]> = {};
    for (const rel of relationships || []) {
      if (!connectionMap[rel.from_profile_id]) connectionMap[rel.from_profile_id] = [];
      if (!connectionMap[rel.to_profile_id]) connectionMap[rel.to_profile_id] = [];
      connectionMap[rel.from_profile_id].push(rel.to_profile_id);
      connectionMap[rel.to_profile_id].push(rel.from_profile_id);
    }

    // Find profiles with most connections
    const sortedByConnections = Object.entries(connectionMap)
      .map(([id, connections]) => ({ profileId: id, connectionCount: connections.length }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 10);

    results.sharedConnections = sortedByConnections;
  }

  // Find common entities mentioned across contacts
  if (analysisType === "all" || analysisType === "entities") {
    const { data: entityMentions } = await supabase
      .from("entity_mentions")
      .select("normalized_name, entity_type, mentioned_in_profile_id")
      .eq("user_id", userId);

    const entityCounts: Record<string, { count: number; profiles: Set<string>; type: string }> = {};
    for (const mention of entityMentions || []) {
      if (!entityCounts[mention.normalized_name]) {
        entityCounts[mention.normalized_name] = { count: 0, profiles: new Set(), type: mention.entity_type };
      }
      entityCounts[mention.normalized_name].count++;
      entityCounts[mention.normalized_name].profiles.add(mention.mentioned_in_profile_id);
    }

    results.commonEntities = Object.entries(entityCounts)
      .filter(([, data]) => data.profiles.size > 1)
      .map(([name, data]) => ({
        entity: name,
        type: data.type,
        mentionCount: data.count,
        appearsInProfiles: data.profiles.size,
      }))
      .sort((a, b) => b.appearsInProfiles - a.appearsInProfiles)
      .slice(0, 20);
  }

  return new Response(JSON.stringify({
    success: true,
    results,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function patternDetection(supabase: any, userId: string, profileId: string) {
  const patterns: any[] = [];

  // Communication frequency pattern
  const { data: communications } = await supabase
    .from("communications")
    .select("occurred_at, channel, direction")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .order("occurred_at", { ascending: true });

  if (communications && communications.length > 5) {
    // Analyze time gaps
    const gaps: number[] = [];
    for (let i = 1; i < communications.length; i++) {
      const gap = new Date(communications[i].occurred_at).getTime() - 
                  new Date(communications[i-1].occurred_at).getTime();
      gaps.push(gap);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const avgGapDays = avgGap / (1000 * 60 * 60 * 24);

    patterns.push({
      type: "communication_frequency",
      description: `Average communication gap: ${avgGapDays.toFixed(1)} days`,
      avgGapDays,
      totalCommunications: communications.length,
    });

    // Day of week pattern
    const dayOfWeekCounts: Record<number, number> = {};
    for (const comm of communications) {
      const day = new Date(comm.occurred_at).getDay();
      dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
    }
    const preferredDay = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)[0];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    patterns.push({
      type: "preferred_day",
      description: `Most active on ${dayNames[parseInt(preferredDay[0])]}`,
      dayDistribution: dayOfWeekCounts,
    });
  }

  // Sentiment trend
  const { data: sentimentData } = await supabase
    .from("communications")
    .select("occurred_at, sentiment_score")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .not("sentiment_score", "is", null)
    .order("occurred_at", { ascending: true });

  if (sentimentData && sentimentData.length > 3) {
    const sentiments = sentimentData.map((d: any) => d.sentiment_score);
    const recentSentiment = sentiments.slice(-5).reduce((a: number, b: number) => a + b, 0) / 
                           Math.min(5, sentiments.length);
    const overallSentiment = sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length;
    
    const trend = recentSentiment > overallSentiment + 0.1 ? "improving" :
                  recentSentiment < overallSentiment - 0.1 ? "declining" : "stable";

    patterns.push({
      type: "sentiment_trend",
      description: `Sentiment is ${trend}`,
      recentSentiment,
      overallSentiment,
      trend,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    profileId,
    patterns,
    patternCount: patterns.length,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function temporalAnalysis(supabase: any, userId: string, profileId: string, options: any) {
  const { timeRange = 90 } = options; // days
  const cutoffDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString();

  const timeline: any[] = [];

  // Get all timestamped data
  const [
    { data: comms },
    { data: observations },
    { data: analyses },
    { data: events },
  ] = await Promise.all([
    supabase.from("communications")
      .select("id, occurred_at, channel, direction, subject")
      .eq("profile_id", profileId).eq("user_id", userId)
      .gte("occurred_at", cutoffDate),
    supabase.from("contact_observations")
      .select("id, created_at, category, title")
      .eq("profile_id", profileId).eq("user_id", userId)
      .gte("created_at", cutoffDate),
    supabase.from("ai_analyses")
      .select("id, generated_at, analysis_type")
      .eq("profile_id", profileId).eq("user_id", userId)
      .gte("generated_at", cutoffDate),
    supabase.from("events")
      .select("id, event_date, title, event_type")
      .eq("profile_id", profileId).eq("user_id", userId)
      .gte("event_date", cutoffDate),
  ]);

  // Merge into timeline
  for (const c of comms || []) {
    timeline.push({ type: "communication", date: c.occurred_at, data: c });
  }
  for (const o of observations || []) {
    timeline.push({ type: "observation", date: o.created_at, data: o });
  }
  for (const a of analyses || []) {
    timeline.push({ type: "analysis", date: a.generated_at, data: a });
  }
  for (const e of events || []) {
    timeline.push({ type: "event", date: e.event_date, data: e });
  }

  // Sort by date
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Activity by week
  const weeklyActivity: Record<string, number> = {};
  for (const item of timeline) {
    const week = getWeekNumber(new Date(item.date));
    weeklyActivity[week] = (weeklyActivity[week] || 0) + 1;
  }

  return new Response(JSON.stringify({
    success: true,
    profileId,
    timeline: timeline.slice(0, 100),
    totalEvents: timeline.length,
    weeklyActivity,
    timeRangeDays: timeRange,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Helper functions
function calculateProfileCompleteness(profile: any): number {
  // Note: profiles uses organization (not company), notes (not bio), city/country (not location)
  // industry column doesn't exist on profiles table
  const fields = ["first_name", "last_name", "organization", "job_title", "city", "country", "notes"];
  const filled = fields.filter(f => profile[f] && String(profile[f]).trim().length > 0).length;
  return filled / fields.length;
}

function calculatePersonalInfoCompleteness(info: any): number {
  const fields = ["date_of_birth", "nationality", "education_level", "languages_spoken", "hobbies_interests"];
  const filled = fields.filter(f => info[f]).length;
  return filled / fields.length;
}

function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

async function generateFusionSummary(dataCollections: any, completeness: number): Promise<string | null> {
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
            content: "You are an intelligence analyst. Provide a brief, actionable summary of the available data for this contact. Focus on key insights and gaps."
          },
          {
            role: "user",
            content: `Data completeness: ${(completeness * 100).toFixed(0)}%
            
Profile: ${dataCollections.profile?.first_name} ${dataCollections.profile?.last_name}
Company: ${dataCollections.profile?.company || "Unknown"}
Communications: ${dataCollections.communications?.length || 0}
Messages: ${dataCollections.messages?.length || 0}
Documents: ${dataCollections.documents?.length || 0}
Behavioral Analyses: ${dataCollections.behavioralAnalyses?.length || 0}
Has Psychological Profile: ${dataCollections.psychologicalProfile ? "Yes" : "No"}
Relationships: ${dataCollections.relationships?.length || 0}
News Correlations: ${dataCollections.newsCorrelations?.length || 0}

Provide a 3-4 sentence summary of this contact's intelligence profile and what key data is missing.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("Fusion summary error:", e);
    return null;
  }
}
