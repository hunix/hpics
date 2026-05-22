// News API - News monitoring and search
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsRequest {
  query?: string;
  profileId?: string;
  mode?: 'everything' | 'top-headlines';
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  fromDate?: string;
  toDate?: string;
  sources?: string[];
  domains?: string[];
  pageSize?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const __url = new URL(req.url);
  if (__url.searchParams.get("healthCheck") === "1") {
    return new Response(JSON.stringify({ ok: true, function: "search-news", timestamp: Date.now() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
    if (!NEWS_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'News API key not configured',
        instructions: 'Add NEWS_API_KEY in Settings → Integrations'
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
      mode = 'everything',
      language = 'en',
      sortBy = 'publishedAt',
      fromDate,
      toDate,
      sources,
      domains,
      pageSize = 10,
    }: NewsRequest = await req.json();

    // If profileId provided, build query from profile data
    let searchQuery = query;
    if (!searchQuery && profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, organization')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single();

      if (profile) {
        searchQuery = `"${profile.first_name} ${profile.last_name}"`;
        if (profile.organization) {
          searchQuery += ` OR "${profile.organization}"`;
        }
      }
    }

    if (!searchQuery) {
      return new Response(JSON.stringify({ error: 'Query or profile ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`News API search: "${searchQuery}"`);

    const startTime = Date.now();

    // Build the API URL
    const params = new URLSearchParams({
      q: searchQuery,
      language,
      sortBy,
      pageSize: pageSize.toString(),
      apiKey: NEWS_API_KEY,
    });

    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    if (sources && sources.length > 0) params.append('sources', sources.join(','));
    if (domains && domains.length > 0) params.append('domains', domains.join(','));

    const endpoint = mode === 'top-headlines' 
      ? `https://newsapi.org/v2/top-headlines?${params.toString()}`
      : `https://newsapi.org/v2/everything?${params.toString()}`;

    const response = await fetch(endpoint);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('News API error:', response.status, errorData);

      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        profile_id: profileId || null,
        function_name: 'search-news',
        provider: 'newsapi',
        model_name: mode,
        estimated_cost_cents: 0,
        response_time_ms: responseTime,
        status: 'error',
        error_message: errorData.message || 'API error',
      });

      return new Response(JSON.stringify({ 
        error: 'News API error',
        status: response.status,
        details: errorData.message || 'Unknown error',
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // News API has free tier, so cost is 0 for most cases
    const estimatedCostCents = 0;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId || null,
      function_name: 'search-news',
      provider: 'newsapi',
      model_name: mode,
      estimated_cost_cents: estimatedCostCents,
      response_time_ms: responseTime,
      status: 'success',
      prompt_summary: searchQuery.substring(0, 100),
    });

    // Format articles
    const articles = data.articles?.map((article: any) => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: {
        id: article.source?.id,
        name: article.source?.name,
      },
      author: article.author,
    })) || [];

    // Store as OSINT findings if profileId provided
    if (profileId && articles.length > 0) {
      for (const article of articles.slice(0, 5)) { // Store top 5
        try {
          await supabase.from('osint_findings').insert({
            user_id: user.id,
            profile_id: profileId,
            finding_type: 'news_mention',
            source: article.source?.name || 'news',
            title: article.title,
            content_snippet: article.description?.substring(0, 300),
            full_content: article.content,
            source_url: article.url,
            image_url: article.urlToImage,
            discovered_at: article.publishedAt,
            metadata: {
              author: article.author,
              source: article.source,
              query: searchQuery,
            },
            verification_status: 'unverified',
            relevance_score: 0.75,
          });
        } catch {} // Ignore duplicates
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalResults: data.totalResults || 0,
      articles,
      articleCount: articles.length,
      query: searchQuery,
      responseTimeMs: responseTime,
      estimatedCostCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('News API error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
