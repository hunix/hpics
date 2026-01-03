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

  try {
    const { profileId, analysisType } = await req.json();
    
    if (!profileId || !analysisType) {
      return new Response(
        JSON.stringify({ error: "profileId and analysisType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get Supabase client
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

    // Fetch communications for this profile
    const { data: communications } = await supabase
      .from("communications")
      .select("*")
      .eq("profile_id", profileId)
      .order("occurred_at", { ascending: false })
      .limit(20);

    // Fetch events for this profile
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .eq("profile_id", profileId);

    // Fetch conversations and messages for this profile
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, platform, title")
      .eq("profile_id", profileId);

    let allMessages: any[] = [];
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { data: messages } = await supabase
        .from("messages")
        .select("*, conversations(platform)")
        .in("conversation_id", conversationIds)
        .order("sent_at", { ascending: false })
        .limit(50);
      allMessages = messages || [];
    }

    // Fetch education data
    const { data: education } = await supabase
      .from("education")
      .select("*")
      .eq("profile_id", profileId)
      .order("end_date", { ascending: false });

    // Fetch certifications
    const { data: certifications } = await supabase
      .from("certifications")
      .select("*")
      .eq("profile_id", profileId);

    // Fetch skills
    const { data: skills } = await supabase
      .from("contact_skills")
      .select("*")
      .eq("profile_id", profileId);

    // Build context for AI
    const context = {
      profile: {
        name: `${profile.first_name} ${profile.last_name || ""}`.trim(),
        relationship: profile.relationship_type,
        organization: profile.organization,
        jobTitle: profile.job_title,
        bio: profile.bio,
        notes: profile.notes,
        tags: profile.tags,
        linkedInUrl: profile.linkedin_url,
      },
      education: (education || []).map((e: any) => ({
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
      certifications: (certifications || []).map((c: any) => ({
        name: c.name,
        issuer: c.issuing_organization,
        issueDate: c.issue_date,
        expirationDate: c.expiration_date,
      })),
      skills: (skills || []).map((s: any) => ({
        name: s.skill_name,
        proficiency: s.proficiency_level,
        endorsements: s.endorsement_count,
      })),
      communications: (communications || []).map((c: any) => ({
        channel: c.channel,
        direction: c.direction,
        subject: c.subject,
        content: c.content,
        date: c.occurred_at,
        duration: c.duration_minutes,
      })),
      events: (events || []).map((e: any) => ({
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

    let systemPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (analysisType === "personality") {
      systemPrompt = `You are an expert behavioral psychologist. Analyze the provided information about a person and create a Big Five personality profile. Use the communication patterns, notes, and context to infer personality traits.`;
      tools = [{
        type: "function",
        function: {
          name: "personality_profile",
          description: "Generate a Big Five personality profile based on available data",
          parameters: {
            type: "object",
            properties: {
              openness: { type: "number", minimum: 0, maximum: 100, description: "Openness to experience (0-100)" },
              conscientiousness: { type: "number", minimum: 0, maximum: 100, description: "Conscientiousness (0-100)" },
              extraversion: { type: "number", minimum: 0, maximum: 100, description: "Extraversion (0-100)" },
              agreeableness: { type: "number", minimum: 0, maximum: 100, description: "Agreeableness (0-100)" },
              neuroticism: { type: "number", minimum: 0, maximum: 100, description: "Neuroticism/Emotional stability (0-100)" },
              summary: { type: "string", description: "A 2-3 sentence summary of the personality" },
              communicationStyle: { type: "string", description: "Recommended communication approach for this person" },
              strengths: { type: "array", items: { type: "string" }, description: "Key personality strengths" },
              considerationsWhenInteracting: { type: "array", items: { type: "string" }, description: "Things to keep in mind when interacting" }
            },
            required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism", "summary", "communicationStyle", "strengths", "considerationsWhenInteracting"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "personality_profile" } };
    } else if (analysisType === "sentiment") {
      systemPrompt = `You are an expert at analyzing communication patterns and sentiment. Analyze the communications provided and assess the overall sentiment trend and relationship health.`;
      tools = [{
        type: "function",
        function: {
          name: "sentiment_analysis",
          description: "Analyze sentiment trends from communications",
          parameters: {
            type: "object",
            properties: {
              overallSentiment: { type: "string", enum: ["very_positive", "positive", "neutral", "negative", "very_negative"], description: "Overall sentiment of the relationship" },
              sentimentScore: { type: "number", minimum: 0, maximum: 100, description: "Sentiment score (0-100, 100 being most positive)" },
              trend: { type: "string", enum: ["improving", "stable", "declining"], description: "Recent trend direction" },
              communicationFrequency: { type: "string", enum: ["very_active", "active", "moderate", "infrequent", "rare"], description: "How often you communicate" },
              keyThemes: { type: "array", items: { type: "string" }, description: "Key topics or themes in your communications" },
              recommendations: { type: "array", items: { type: "string" }, description: "Suggestions to improve the relationship" }
            },
            required: ["overallSentiment", "sentimentScore", "trend", "communicationFrequency", "keyThemes", "recommendations"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "sentiment_analysis" } };
    } else if (analysisType === "playbook") {
      systemPrompt = `You are an expert relationship coach preparing someone for an important meeting. Create a comprehensive social playbook based on the person's profile, communication history, and upcoming events.`;
      tools = [{
        type: "function",
        function: {
          name: "social_playbook",
          description: "Generate a social playbook for meeting preparation",
          parameters: {
            type: "object",
            properties: {
              quickSummary: { type: "string", description: "2-3 sentence summary of who this person is" },
              personalityInsights: { type: "string", description: "Key personality traits to be aware of" },
              recentInteractions: { type: "string", description: "Summary of recent interactions and their context" },
              upcomingEvents: { type: "array", items: { type: "string" }, description: "Important upcoming dates or events to mention" },
              conversationStarters: { type: "array", items: { type: "string" }, description: "5 good conversation starters based on their interests and history" },
              thingsToRemember: { type: "array", items: { type: "string" }, description: "Key facts, preferences, or sensitivities to keep in mind" },
              topicsToAvoid: { type: "array", items: { type: "string" }, description: "Topics that might be sensitive or should be avoided" },
              followUpActions: { type: "array", items: { type: "string" }, description: "Suggested follow-up actions after the meeting" }
            },
            required: ["quickSummary", "personalityInsights", "recentInteractions", "conversationStarters", "thingsToRemember", "followUpActions"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "social_playbook" } };
    } else if (analysisType === "relationship_score") {
      systemPrompt = `You are an expert at evaluating relationship health. Analyze the communication patterns, frequency, and context to calculate a relationship health score.`;
      tools = [{
        type: "function",
        function: {
          name: "relationship_score",
          description: "Calculate relationship health score",
          parameters: {
            type: "object",
            properties: {
              score: { type: "number", minimum: 0, maximum: 100, description: "Overall relationship health score (0-100)" },
              grade: { type: "string", enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"], description: "Letter grade" },
              factors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    score: { type: "number" },
                    description: { type: "string" }
                  },
                  required: ["name", "score", "description"]
                },
                description: "Factors contributing to the score"
              },
              strengths: { type: "array", items: { type: "string" }, description: "Relationship strengths" },
              areasForImprovement: { type: "array", items: { type: "string" }, description: "Areas that need attention" },
              suggestedActions: { type: "array", items: { type: "string" }, description: "Concrete actions to improve the relationship" }
            },
            required: ["score", "grade", "factors", "strengths", "areasForImprovement", "suggestedActions"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "relationship_score" } };
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid analysis type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Running ${analysisType} analysis for profile ${profileId}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this person:\n\n${JSON.stringify(context, null, 2)}` }
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

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
      JSON.stringify({ success: true, result }),
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
