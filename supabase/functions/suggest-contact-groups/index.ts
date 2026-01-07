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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch contacts with their details
    const { data: contacts, error: contactsError } = await supabase
      .from("profiles")
      .select(`
        id, first_name, last_name, organization, job_title, city, country,
        relationship_type, interests:contact_interests(interest),
        groups:contact_group_members(group:contact_groups(name))
      `)
      .eq("user_id", user.id)
      .limit(200);

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError);
      throw contactsError;
    }

    if (!contacts || contacts.length < 3) {
      return new Response(JSON.stringify({ 
        suggestions: [],
        message: "Need at least 3 contacts to generate group suggestions" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing groups
    const { data: existingGroups } = await supabase
      .from("contact_groups")
      .select("name")
      .eq("user_id", user.id);

    const existingGroupNames = (existingGroups || []).map(g => g.name.toLowerCase());

    // Prepare contact summaries for AI
    const contactSummaries = contacts.map(c => ({
      id: c.id,
      name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
      organization: c.organization,
      jobTitle: c.job_title,
      location: [c.city, c.country].filter(Boolean).join(", "),
      relationshipType: c.relationship_type,
      interests: (c.interests || []).map((i: any) => i.interest),
      existingGroups: (c.groups || []).map((g: any) => g.group?.name).filter(Boolean),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Analyze these contacts and suggest 3-5 smart groups based on commonalities:

CONTACTS:
${JSON.stringify(contactSummaries, null, 2)}

EXISTING GROUPS (avoid duplicating these): ${existingGroupNames.join(", ") || "None"}

Consider grouping by:
- Same organization or industry
- Similar job titles/roles
- Geographic location
- Shared interests
- Relationship type patterns
- Professional connections

Return ONLY a JSON array with this structure:
[
  {
    "groupName": "Group Name",
    "description": "Brief description of what unites these contacts",
    "reasoning": "Why this grouping makes sense",
    "memberIds": ["id1", "id2", "id3"],
    "confidenceScore": 0.85
  }
]

Rules:
- Each group should have at least 2 members
- Group names should be concise and descriptive
- Confidence score from 0.0 to 1.0 based on how strong the connection is
- Don't suggest groups that are too similar to existing ones`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert at analyzing relationships and finding patterns in contact networks. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the response
    let suggestions = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      suggestions = [];
    }

    // Store suggestions in database
    for (const suggestion of suggestions) {
      const members = contactSummaries
        .filter(c => suggestion.memberIds?.includes(c.id))
        .map(c => ({ id: c.id, name: c.name }));

      await supabase.from("ai_group_suggestions").insert({
        user_id: user.id,
        group_name: suggestion.groupName,
        description: suggestion.description,
        reasoning: suggestion.reasoning,
        suggested_members: members,
        confidence_score: suggestion.confidenceScore || 0.7,
        status: "pending",
      });
    }

    return new Response(JSON.stringify({ 
      suggestions,
      message: `Generated ${suggestions.length} group suggestions` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in suggest-contact-groups:", error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
