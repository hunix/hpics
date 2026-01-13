import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    // Check environment configuration
    const checks = {
      supabase_url: !!supabaseUrl,
      supabase_anon_key: !!supabaseKey,
      lovable_api_key: !!lovableApiKey,
    };

    // Test database connectivity
    let dbConnected = false;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('platform_config').select('config_key').limit(1);
        dbConnected = !error;
      } catch (e) {
        console.error('DB connectivity check failed:', e);
      }
    }

    const allHealthy = Object.values(checks).every(v => v) && dbConnected;

    return new Response(JSON.stringify({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        ...checks,
        database_connected: dbConnected,
      },
    }), {
      status: allHealthy ? 200 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
