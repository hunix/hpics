import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive list of allowed secret names that users can configure
// This should match the integration registry in src/lib/integrations/registry.ts
const ALLOWED_SECRETS = [
  // ===== Connected via Lovable Connectors =====
  'FIRECRAWL_API_KEY',
  'PERPLEXITY_API_KEY',
  'ELEVENLABS_API_KEY',
  
  // ===== People Intelligence =====
  'PDL_API_KEY',
  'PROXYCURL_API_KEY',
  'HUNTER_API_KEY',
  
  // ===== Social Media =====
  'RAPIDAPI_KEY',
  
  // ===== Research & Search =====
  'DIFFBOT_API_KEY',
  'TAVILY_API_KEY',
  'NEWS_API_KEY', 
  'GOOGLE_SEARCH_API_KEY',
  'GOOGLE_SEARCH_CX',
  
  // ===== Email & Calendar =====
  'RESEND_API_KEY',
  'GOOGLE_GMAIL_CLIENT_ID',
  'GOOGLE_GMAIL_CLIENT_SECRET',
  'GOOGLE_CALENDAR_CLIENT_ID',
  'GOOGLE_CALENDAR_CLIENT_SECRET',
  
  // ===== Notifications =====
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  
  // ===== AI & Voice =====
  'OPENAI_API_KEY',
  
  // ===== Legacy/Other (backward compatibility) =====
  'CLEARBIT_API_KEY',
  'LINKEDIN_API_KEY',
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
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
      console.warn(`Attempted to save disallowed secret: ${secretName}`);
      return new Response(JSON.stringify({ 
        error: "Invalid secret name",
        allowed: ALLOWED_SECRETS,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store the secret reference in app_settings
    // NOTE: The actual secret value must be added via Lovable Cloud settings
    // This function only records that the user has configured this integration
    const { error: settingError } = await supabase
      .from('app_settings')
      .upsert({
        user_id: user.id,
        setting_key: `secret_${secretName.toLowerCase()}`,
        setting_value: 'configured',
        metadata: {
          configured_at: new Date().toISOString(),
          secret_name: secretName,
          // Store a hash indicator (not the actual value) for reference
          value_hint: secretValue.substring(0, 4) + '...' + secretValue.substring(secretValue.length - 4),
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
      message: `${secretName} has been registered.`,
      instructions: [
        `To complete setup, add the secret "${secretName}" in Lovable Cloud:`,
        `1. Go to Settings → Cloud → Secrets`,
        `2. Add a new secret with name: ${secretName}`,
        `3. Paste your API key as the value`,
        `4. The integration will then be fully functional`,
      ],
      secretName,
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
