import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(
      JSON.stringify({ ok: true, function: 'update-app-version', timestamp: Date.now() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // This endpoint requires service role authentication (admin only)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes(serviceRoleKey)) {
      // Alternative: Check if request is from an authenticated admin user
      const supabaseClient = createClient(supabaseUrl, authHeader?.replace('Bearer ', '') || '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if user has admin clearance (optional - you can implement this based on your clearance system)
      const { data: clearance } = await createClient(supabaseUrl, serviceRoleKey)
        .from('user_clearances')
        .select('clearance_level')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Require at least 'secret' clearance to update app version
      const allowedLevels = ['secret', 'top_secret', 'cosmic'];
      if (!clearance || !allowedLevels.includes(clearance.clearance_level)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient clearance' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = await req.json();
    const { version } = body;

    if (!version || typeof version !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Version string is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate version format (basic semver)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(version)) {
      return new Response(
        JSON.stringify({ error: 'Invalid version format. Expected: X.Y.Z (e.g., 3.9.52)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the version in platform_config
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const { error: updateError } = await supabaseAdmin
      .from('platform_config')
      .update({ 
        config_value: JSON.stringify(version),
        updated_at: new Date().toISOString()
      })
      .eq('config_key', 'app_published_version');

    if (updateError) {
      console.error('[update-app-version] Database error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update version', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[update-app-version] Successfully updated to version ${version}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        version,
        message: `App version updated to ${version}. Users will be prompted to update on next version check.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[update-app-version] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
