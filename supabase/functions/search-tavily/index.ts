// Tavily - AI-optimized web search
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TavilyRequest {
  query: string;
  profileId?: string;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Tavily API key not configured',
        instructions: 'Add TAVILY_API_KEY in Settings → Integrations'
      }), {
        status: 400,
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

    const {
      query,
      profileId,
      searchDepth = 'basic',
      includeAnswer = true,
      includeRawContent = false,
      maxResults = 5,
      includeDomains,
      excludeDomains,
    }: TavilyRequest = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Tavily search: "${query}" with depth ${searchDepth}`);

    const startTime = Date.now();

    // Build request body
    const requestBody: Record<string, any> = {
      api_key: TAVILY_API_KEY,
      query,
      search_depth: searchDepth,
      include_answer: includeAnswer,
      include_raw_content: includeRawContent,
      max_results: maxResults,
    };

    if (includeDomains && includeDomains.length > 0) {
      requestBody.include_domains = includeDomains;
    }

    if (excludeDomains && excludeDomains.length > 0) {
      requestBody.exclude_domains = excludeDomains;
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavily API error:', response.status, errorText);

      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        profile_id: profileId || null,
        function_name: 'search-tavily',
        provider: 'tavily',
        model_name: searchDepth,
        estimated_cost_cents: 0,
        response_time_ms: responseTime,
        status: 'error',
        error_message: errorText,
      });

      return new Response(JSON.stringify({ 
        error: 'Tavily API error',
        status: response.status,
        details: errorText,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Estimated cost (Tavily: ~$0.01 per search)
    const estimatedCostCents = searchDepth === 'advanced' ? 2 : 1;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId || null,
      function_name: 'search-tavily',
      provider: 'tavily',
      model_name: searchDepth,
      estimated_cost_cents: estimatedCostCents,
      response_time_ms: responseTime,
      status: 'success',
      prompt_summary: query.substring(0, 100),
    });

    // Format results
    const results = data.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
      rawContent: r.raw_content,
      publishedDate: r.published_date,
    })) || [];

    // Store as OSINT finding if profileId provided
    if (profileId && results.length > 0) {
      await supabase.from('osint_findings').insert({
        user_id: user.id,
        profile_id: profileId,
        finding_type: 'tavily_search',
        source: 'tavily',
        title: `AI Search: ${query.substring(0, 50)}`,
        content_snippet: data.answer?.substring(0, 300) || results[0]?.content?.substring(0, 300),
        full_content: JSON.stringify({ answer: data.answer, results }),
        source_url: results[0]?.url,
        metadata: {
          query,
          searchDepth,
          resultCount: results.length,
        },
        verification_status: 'verified',
        relevance_score: 0.85,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      answer: data.answer,
      results,
      resultCount: results.length,
      query: data.query,
      responseTimeMs: responseTime,
      estimatedCostCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tavily search error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
