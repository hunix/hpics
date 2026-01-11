// Diffbot - AI-powered knowledge extraction
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiffbotRequest {
  profileId?: string;
  url?: string;
  mode: 'analyze' | 'article' | 'product' | 'organization' | 'person';
  fields?: string[];
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

    const DIFFBOT_API_KEY = Deno.env.get('DIFFBOT_API_KEY');
    if (!DIFFBOT_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Diffbot API key not configured',
        instructions: 'Add DIFFBOT_API_KEY in Settings → Integrations'
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
      profileId,
      url,
      mode = 'analyze',
      fields,
    }: DiffbotRequest = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Diffbot ${mode} for URL: ${url}`);

    const startTime = Date.now();

    // Build the API endpoint based on mode
    let endpoint = '';
    switch (mode) {
      case 'analyze':
        endpoint = `https://api.diffbot.com/v3/analyze?token=${DIFFBOT_API_KEY}&url=${encodeURIComponent(url)}`;
        break;
      case 'article':
        endpoint = `https://api.diffbot.com/v3/article?token=${DIFFBOT_API_KEY}&url=${encodeURIComponent(url)}`;
        break;
      case 'product':
        endpoint = `https://api.diffbot.com/v3/product?token=${DIFFBOT_API_KEY}&url=${encodeURIComponent(url)}`;
        break;
      case 'organization':
        // Knowledge Graph API for organizations
        endpoint = `https://kg.diffbot.com/kg/v3/dql?type=query&token=${DIFFBOT_API_KEY}&query=type:Organization name:"${encodeURIComponent(url)}"`;
        break;
      case 'person':
        // Knowledge Graph API for persons
        endpoint = `https://kg.diffbot.com/kg/v3/dql?type=query&token=${DIFFBOT_API_KEY}&query=type:Person name:"${encodeURIComponent(url)}"`;
        break;
      default:
        endpoint = `https://api.diffbot.com/v3/analyze?token=${DIFFBOT_API_KEY}&url=${encodeURIComponent(url)}`;
    }

    // Add fields filter if specified
    if (fields && fields.length > 0) {
      endpoint += `&fields=${fields.join(',')}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Diffbot API error:', response.status, errorText);

      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        profile_id: profileId || null,
        function_name: 'extract-diffbot',
        provider: 'diffbot',
        model_name: mode,
        estimated_cost_cents: 0,
        response_time_ms: responseTime,
        status: 'error',
        error_message: errorText,
      });

      return new Response(JSON.stringify({ 
        error: 'Diffbot API error',
        status: response.status,
        details: errorText,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Estimated cost (Diffbot charges per API call)
    const estimatedCostCents = 10;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId || null,
      function_name: 'extract-diffbot',
      provider: 'diffbot',
      model_name: mode,
      estimated_cost_cents: estimatedCostCents,
      response_time_ms: responseTime,
      status: 'success',
    });

    // Process based on mode
    const result: Record<string, any> = {
      success: true,
      mode,
      url,
      responseTimeMs: responseTime,
      estimatedCostCents,
    };

    if (mode === 'analyze' && data.objects) {
      // Auto-detected content type
      result.type = data.type;
      result.objects = data.objects.map((obj: any) => ({
        type: obj.type,
        title: obj.title,
        text: obj.text?.substring(0, 500),
        author: obj.author,
        date: obj.date,
        images: obj.images?.map((img: any) => img.url),
        sentiment: obj.sentiment,
        tags: obj.tags,
      }));
    }

    if (mode === 'article' && data.objects) {
      const article = data.objects[0];
      result.article = {
        title: article.title,
        author: article.author,
        date: article.date,
        text: article.text,
        html: article.html?.substring(0, 2000),
        images: article.images?.map((img: any) => ({
          url: img.url,
          caption: img.caption,
        })),
        sentiment: article.sentiment,
        tags: article.tags,
        categories: article.categories,
        entities: article.entities?.map((e: any) => ({
          name: e.name,
          type: e.type,
          mentions: e.mentions,
        })),
        siteName: article.siteName,
        publisherRegion: article.publisherRegion,
      };
    }

    if ((mode === 'organization' || mode === 'person') && data.data) {
      result.entities = data.data.map((entity: any) => ({
        name: entity.name,
        type: entity.type,
        description: entity.description,
        website: entity.homepageUri,
        location: entity.location?.name,
        industry: entity.industries,
        employees: entity.nbEmployees,
        revenue: entity.revenue,
        socialProfiles: entity.socialProfiles,
        facts: entity.facts?.slice(0, 10),
      }));
    }

    // Store as OSINT finding if profileId provided
    if (profileId) {
      await supabase.from('osint_findings').insert({
        user_id: user.id,
        profile_id: profileId,
        finding_type: 'diffbot_extraction',
        source: 'diffbot',
        title: `Diffbot ${mode}: ${url.substring(0, 50)}`,
        content_snippet: result.article?.title || result.objects?.[0]?.title || 'Content extracted',
        full_content: JSON.stringify(data),
        source_url: url,
        metadata: {
          mode,
          type: result.type,
          objectCount: data.objects?.length || data.data?.length || 0,
        },
        verification_status: 'verified',
        relevance_score: 0.85,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Diffbot error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
