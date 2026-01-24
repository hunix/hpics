import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

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
      function: 'analyze-profile', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { profileId, analysisType, modelTier = 'balanced' } = await req.json();
    
    if (!profileId || !analysisType) {
      return new Response(
        JSON.stringify({ error: "profileId and analysisType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all related data in parallel
    const [communicationsResult, eventsResult, conversationsResult, educationResult, certificationsResult, skillsResult] = await Promise.all([
      supabase.from("communications").select("*").eq("profile_id", profileId).order("occurred_at", { ascending: false }).limit(20),
      supabase.from("events").select("*").eq("profile_id", profileId),
      supabase.from("conversations").select("id, platform, title").eq("profile_id", profileId),
      supabase.from("education").select("*").eq("profile_id", profileId).order("end_date", { ascending: false }),
      supabase.from("certifications").select("*").eq("profile_id", profileId),
      supabase.from("contact_skills").select("*").eq("profile_id", profileId),
    ]);

    const communications = communicationsResult.data || [];
    const events = eventsResult.data || [];
    const conversations = conversationsResult.data || [];
    const education = educationResult.data || [];
    const certifications = certificationsResult.data || [];
    const skills = skillsResult.data || [];

    // Fetch messages if conversations exist
    let allMessages: any[] = [];
    if (conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { data: messages } = await supabase
        .from("messages")
        .select("*, conversations(platform)")
        .in("conversation_id", conversationIds)
        .order("sent_at", { ascending: false })
        .limit(50);
      allMessages = messages || [];
    }

    // Build context for AI
    const context = {
      profile: {
        name: `${profile.first_name} ${profile.last_name || ""}`.trim(),
        relationship: profile.relationship_type,
        organization: profile.organization,
        jobTitle: profile.job_title,
        notes: profile.notes,
        tags: profile.tags,
        linkedInUrl: profile.linkedin_url,
      },
      education: education.map((e: any) => ({
        institution: e.institution_name,
        degree: e.degree_type,
        field: e.field_of_study,
        startDate: e.start_date,
        endDate: e.end_date,
        isCurrent: e.is_current,
        gpa: e.grade_or_gpa,
        activities: e.activities,
        description: e.description,
      })),
      certifications: certifications.map((c: any) => ({
        name: c.name,
        issuer: c.issuing_organization,
        issueDate: c.issue_date,
        expirationDate: c.expiration_date,
      })),
      skills: skills.map((s: any) => ({
        name: s.skill_name,
        proficiency: s.proficiency_level,
        endorsements: s.endorsement_count,
      })),
      communications: communications.map((c: any) => ({
        channel: c.channel,
        direction: c.is_from_contact ? 'inbound' : 'outbound',
        subject: c.subject,
        content: c.content,
        date: c.occurred_at,
        duration: c.duration_minutes,
      })),
      events: events.map((e: any) => ({
        type: e.event_type,
        title: e.title,
        date: e.event_date,
      })),
      messageThreads: allMessages.map((m: any) => ({
        platform: m.conversations?.platform,
        isFromContact: m.is_from_contact,
        content: m.content,
        date: m.sent_at,
      })),
    };

    // Build prompts based on analysis type
    const prompts = getAnalysisPrompts(analysisType, context);
    if (!prompts) {
      return new Response(
        JSON.stringify({ error: "Invalid analysis type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Running ${analysisType} analysis for profile ${profileId}`);

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, profile.user_id);
    const selectedModel = modelTier === 'quality' ? aiConfig.qualityModel : 
                          modelTier === 'speed' ? aiConfig.speedModel : 
                          aiConfig.defaultModel;

    // Use the unified AI client with automatic logging
    const aiResponse = await callAI({
      model: selectedModel,
      messages: [
        { role: "system", content: prompts.systemPrompt },
        { role: "user", content: `Analyze this person:\n\n${JSON.stringify(context, null, 2)}\n\nRespond with valid JSON matching the expected structure.` }
      ],
      userId: profile.user_id,
      functionName: "analyze-profile",
      profileId: profileId,
      temperature: aiConfig.temperature,
      metadata: { analysisType, modelTier },
    });

    // Parse the AI response
    const result = parseAIJson(aiResponse.content, prompts.fallback);

    // Save the analysis to the database
    const { error: saveError } = await supabase
      .from("ai_analyses")
      .insert({
        user_id: profile.user_id,
        profile_id: profileId,
        analysis_type: analysisType,
        result,
      });

    if (saveError) {
      console.error("Error saving analysis:", saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        tokensUsed: aiResponse.totalTokens,
        costCents: aiResponse.costCents,
        model: aiResponse.model,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-profile function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getAnalysisPrompts(analysisType: string, context: any): { systemPrompt: string; fallback: any } | null {
  switch (analysisType) {
    case "personality":
      return {
        systemPrompt: `You are an expert behavioral psychologist. Analyze the provided information about a person and create a Big Five personality profile. Use the communication patterns, notes, and context to infer personality traits. Respond with JSON only.`,
        fallback: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
          summary: "Insufficient data for detailed analysis",
          communicationStyle: "Unknown",
          strengths: [],
          considerationsWhenInteracting: [],
        },
      };
    case "sentiment":
      return {
        systemPrompt: `You are an expert at analyzing communication patterns and sentiment. Analyze the communications provided and assess the overall sentiment trend and relationship health. Respond with JSON only.`,
        fallback: {
          overallSentiment: "neutral",
          sentimentScore: 50,
          trend: "stable",
          communicationFrequency: "moderate",
          keyThemes: [],
          recommendations: [],
        },
      };
    case "playbook":
      return {
        systemPrompt: `You are an expert relationship coach preparing someone for an important meeting. Create a comprehensive social playbook based on the person's profile, communication history, and upcoming events. Respond with JSON only.`,
        fallback: {
          quickSummary: "Analysis in progress",
          personalityInsights: "",
          recentInteractions: "",
          upcomingEvents: [],
          conversationStarters: [],
          thingsToRemember: [],
          topicsToAvoid: [],
          followUpActions: [],
        },
      };
    case "relationship_score":
      return {
        systemPrompt: `You are an expert at evaluating relationship health. Analyze the communication patterns, frequency, and context to calculate a relationship health score. Respond with JSON only.`,
        fallback: {
          score: 50,
          grade: "C",
          factors: [],
          strengths: [],
          areasForImprovement: [],
          suggestedActions: [],
        },
      };
    default:
      return null;
  }
}
