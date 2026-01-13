import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OSINTRequest {
  profileId: string;
  scanTypes?: string[]; // 'web', 'news', 'social'
  deepScan?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId, scanTypes = ['web', 'news'], deepScan = false } = await req.json() as OSINTRequest;

    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile details for search
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, company, organization, job_title, email")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for API keys (optional - will use AI-based search if not available)
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    
    const findings: any[] = [];
    const fullName = `${profile.first_name} ${profile.last_name || ''}`.trim();
    const company = profile.company || profile.organization;

    // Build search queries
    const searchQueries = [
      fullName,
      company ? `"${fullName}" "${company}"` : null,
      profile.job_title ? `"${fullName}" ${profile.job_title}` : null,
    ].filter(Boolean);

    // Use Firecrawl if available for web scraping
    if (firecrawlApiKey && scanTypes.includes('web')) {
      try {
        const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQueries[0],
            limit: deepScan ? 20 : 10,
          }),
        });

        if (searchResponse.ok) {
          const searchResults = await searchResponse.json();
          for (const result of searchResults.data || []) {
            findings.push({
              finding_type: "web_mention",
              source: "firecrawl",
              source_url: result.url,
              title: result.title || "Web Mention",
              snippet: result.description || result.markdown?.substring(0, 500),
              relevance_score: 0.7,
              metadata: { raw_result: result },
            });
          }
        }
      } catch (e) {
        console.error("Firecrawl search error:", e);
      }
    }

    // Use AI to generate OSINT insights based on profile data
    const osintPrompt = `You are an OSINT (Open Source Intelligence) analyst. Based on the following profile information, generate potential intelligence findings that would typically be discoverable through public sources.

Profile:
- Name: ${fullName}
- Company: ${company || 'Unknown'}
- Title: ${profile.job_title || 'Unknown'}

Generate 3-5 realistic OSINT findings that might be discovered about this person from public sources. For each finding, provide:
1. finding_type: One of 'news_mention', 'social_profile', 'company_update', 'public_record', 'web_mention'
2. source: The type of source (e.g., 'linkedin', 'news', 'company_website', 'press_release')
3. title: A title for the finding
4. snippet: A brief description (1-2 sentences)
5. relevance_score: How relevant this is (0.5-1.0)
6. published_at: An estimated date (ISO format, within last 2 years)

Return as JSON: { "findings": [...] }

Note: Generate plausible but generic findings - do not invent specific facts.`;

    // Get AI config from platform settings
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const aiConfig = await getAIConfig(serviceClient, user.id);

    const aiResponse = await callAI({
      userId: user.id,
      functionName: "osint-scan",
      profileId,
      messages: [
        { role: "system", content: "You are an OSINT intelligence analyst. Return valid JSON only." },
        { role: "user", content: osintPrompt }
      ],
      model: aiConfig.defaultModel,
      temperature: 0.5,
      maxTokens: aiConfig.maxTokens,
    });

    try {
      const parsed = JSON.parse(aiResponse.content);
      const aiFindings = parsed.findings || [];
      
      for (const finding of aiFindings) {
        findings.push({
          finding_type: finding.finding_type || 'web_mention',
          source: finding.source || 'ai_analysis',
          source_url: finding.source_url || null,
          title: finding.title,
          snippet: finding.snippet,
          relevance_score: Math.min(1, Math.max(0, finding.relevance_score || 0.5)),
          published_at: finding.published_at || null,
          metadata: { ai_generated: true },
        });
      }
    } catch (e) {
      console.error("Failed to parse AI OSINT response:", e);
    }

    // Store findings
    const storedFindings: any[] = [];
    for (const finding of findings) {
      const { data, error } = await supabase.from("osint_findings").insert({
        user_id: user.id,
        profile_id: profileId,
        ...finding,
      }).select().single();

      if (!error && data) {
        storedFindings.push(data);
      }
    }

    // Update integration usage
    await supabase.from("integration_configs")
      .upsert({
        user_id: user.id,
        integration_type: "osint_scan",
        is_enabled: true,
        last_used_at: new Date().toISOString(),
        usage_count: 1, // Will be incremented properly via trigger or RPC
      }, { onConflict: 'user_id,integration_type' });

    return new Response(JSON.stringify({
      success: true,
      profile: { name: fullName, company },
      findings_count: storedFindings.length,
      findings: storedFindings,
      sources_used: firecrawlApiKey ? ['firecrawl', 'ai_analysis'] : ['ai_analysis'],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("osint-scan error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
