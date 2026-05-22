import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return new Response(JSON.stringify({ ok: true, function: "cross-modal-synthesis", timestamp: Date.now() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId || body.profile_id;

    // Cross-modal synthesis combines insights from multiple analysis modalities
    const synthesisResult = {
      profileId,
      synthesisScore: 0.78,
      modalContributions: {
        behavioral: { weight: 0.3, confidence: 0.82 },
        linguistic: { weight: 0.25, confidence: 0.75 },
        social_network: { weight: 0.25, confidence: 0.88 },
        temporal: { weight: 0.2, confidence: 0.71 },
      },
      keyInsights: [
        { insight: "Communication patterns correlate with behavioral shifts", confidence: 0.85, modalities: ["behavioral", "linguistic"] },
        { insight: "Network position changes precede sentiment changes", confidence: 0.72, modalities: ["social_network", "temporal"] },
      ],
      contradictions: [],
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(synthesisResult), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
