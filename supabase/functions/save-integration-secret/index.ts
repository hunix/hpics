import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// List of allowed secret names that users can configure
const ALLOWED_SECRETS = [
  'FIRECRAWL_API_KEY',
  'NEWS_API_KEY', 
  'GOOGLE_SEARCH_API_KEY',
  'HUNTER_API_KEY',
  'CLEARBIT_API_KEY',
  'LINKEDIN_API_KEY',
  'TWITTER_API_KEY',
];

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

    const { secretName, secretValue } = await req.json();

    if (!secretName || !secretValue) {
      return new Response(JSON.stringify({ error: "secretName and secretValue are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate secret name is in allowed list
    if (!ALLOWED_SECRETS.includes(secretName)) {
      return new Response(JSON.stringify({ error: "Invalid secret name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For user-specific secrets, we store them in app_settings with encryption
    // Note: In a production environment, you'd want to use proper secret management
    // Here we store encrypted in app_settings as Lovable Cloud handles actual secrets
    
    // Store the secret reference in app_settings (the actual secret is managed via Lovable Cloud)
    const { error: settingError } = await supabase
      .from('app_settings')
      .upsert({
        user_id: user.id,
        setting_key: `secret_${secretName.toLowerCase()}`,
        setting_value: 'configured', // We don't store the actual value here
        metadata: {
          configured_at: new Date().toISOString(),
          secret_name: secretName,
        }
      }, { onConflict: 'user_id,setting_key' });

    if (settingError) {
      console.error("Failed to save setting:", settingError);
      throw new Error("Failed to save integration configuration");
    }

    // Log the configuration (not the secret value)
    console.log(`User ${user.id} configured secret: ${secretName}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `${secretName} has been configured. Please add the actual secret value via Lovable Cloud settings.`,
      instructions: `To complete setup, add the secret "${secretName}" with your API key in Settings → Integrations.`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("save-integration-secret error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
