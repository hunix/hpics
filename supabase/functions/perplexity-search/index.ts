// Perplexity AI Search - Grounded web search with citations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerplexityRequest {
  query: string;
  model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';
  searchMode?: 'default' | 'academic';
  domainFilter?: string[];
  excludeDomains?: string[];
  recencyFilter?: 'day' | 'week' | 'month' | 'year';
  maxTokens?: number;
  profileId?: string;
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

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Perplexity API key not configured',
        instructions: 'Please connect Perplexity via Lovable Cloud connectors'
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
      model = 'sonar',
      searchMode = 'default',
      domainFilter,
      excludeDomains,
      recencyFilter,
      maxTokens = 1024,
      profileId,
    }: PerplexityRequest = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Perplexity search: "${query}" with model ${model}`);

    // Build the request body
    const requestBody: Record<string, any> = {
      model,
      messages: [
        { 
          role: 'system', 
          content: 'You are a research assistant. Provide accurate, well-sourced information. Always cite your sources.' 
        },
        { role: 'user', content: query }
      ],
      max_tokens: maxTokens,
    };

    // Add domain filtering if specified
    if (domainFilter && domainFilter.length > 0) {
      requestBody.search_domain_filter = domainFilter;
    }

    if (excludeDomains && excludeDomains.length > 0) {
      requestBody.search_domain_filter = excludeDomains.map(d => `-${d}`);
    }

    // Add recency filter
    if (recencyFilter) {
      requestBody.search_recency_filter = recencyFilter;
    }

    // Add search mode for academic research
    if (searchMode === 'academic') {
      requestBody.search_mode = 'academic';
    }

    const startTime = Date.now();

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Perplexity API error',
        status: response.status,
        details: errorText,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Extract the response content and citations
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Estimate cost (rough estimate based on model)
    const estimatedCostCents = model === 'sonar-pro' ? 10 : 
                               model === 'sonar-reasoning-pro' ? 15 :
                               model === 'sonar-deep-research' ? 50 : 5;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId || null,
      function_name: 'perplexity-search',
      provider: 'perplexity',
      model_name: model,
      estimated_cost_cents: estimatedCostCents,
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
      response_time_ms: responseTime,
      status: 'success',
      prompt_summary: query.substring(0, 100),
    });

    // If profileId provided, store as OSINT finding
    if (profileId) {
      await supabase.from('osint_findings').insert({
        user_id: user.id,
        profile_id: profileId,
        finding_type: 'perplexity_search',
        source: 'perplexity',
        title: `AI Search: ${query.substring(0, 50)}`,
        content_snippet: content.substring(0, 500),
        full_content: content,
        source_url: citations[0] || null,
        metadata: {
          query,
          model,
          citations,
          searchMode,
        },
        verification_status: 'verified',
        relevance_score: 0.9,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      content,
      citations,
      model,
      usage: data.usage,
      responseTimeMs: responseTime,
      estimatedCostCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Perplexity search error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
