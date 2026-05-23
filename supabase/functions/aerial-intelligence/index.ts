import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return new Response(JSON.stringify({ ok: true, function: "aerial-intelligence", timestamp: Date.now() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    switch (action) {
      case "get_missions": {
        const { data } = await supabase.from("aerial_missions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(body.limit || 50);
        return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "get_captures": {
        const { data } = await supabase.from("aerial_captures").select("*").eq("aerial_mission_id", body.aerial_mission_id).eq("user_id", user.id);
        return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "create_mission": {
        const { data, error } = await supabase.from("aerial_missions").insert({ user_id: user.id, waypoints: body.waypoints || [], altitude_meters: body.altitude_meters, flight_mode: body.flight_mode, status: "planned" }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "start_mission": {
        const { data, error } = await supabase.from("aerial_missions").update({ status: "active", started_at: new Date().toISOString() }).eq("id", body.aerial_mission_id).eq("user_id", user.id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "complete_mission": {
        const { data, error } = await supabase.from("aerial_missions").update({ status: "completed", completed_at: new Date().toISOString(), telemetry_log: body.telemetry_log }).eq("id", body.aerial_mission_id).eq("user_id", user.id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "upload_capture": {
        const { data, error } = await supabase.from("aerial_captures").insert({ user_id: user.id, aerial_mission_id: body.aerial_mission_id, capture_type: body.capture_type || "photo", location: body.location, altitude_meters: body.altitude_meters, media_url: body.media_url }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "analyze_capture": {
        if (!body.capture_id) {
          return new Response(JSON.stringify({ error: "capture_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: capture, error: capErr } = await supabase
          .from("aerial_captures")
          .select("*")
          .eq("user_id", user.id)
          .eq("id", body.capture_id)
          .single();
        if (capErr || !capture) {
          return new Response(JSON.stringify({ error: "Capture not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (!capture.media_url) {
          return new Response(JSON.stringify({ error: "Capture has no media_url to analyze" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured — cannot run vision analysis" }), { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const visionPrompt = `Analyze this aerial/drone image and identify:
1. Distinct objects (vehicles, people, structures, equipment) with approximate counts.
2. Anything that looks like a threat or security concern (weapons, surveillance equipment, unauthorized presence, fire, hazards).
3. The overall scene context (urban, rural, industrial, etc).

Respond ONLY with a JSON object of the form:
{
  "objects": [{ "label": string, "count": number, "confidence": 0..1 }],
  "threats": [{ "type": string, "severity": "low"|"medium"|"high", "confidence": 0..1, "description": string }],
  "scene": string,
  "confidence": 0..1
}`;

        const visionRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: visionPrompt },
                  { type: "image_url", image_url: { url: capture.media_url } },
                ],
              },
            ],
          }),
        });

        if (!visionRes.ok) {
          const errText = await visionRes.text();
          return new Response(JSON.stringify({ error: `Vision model error: ${visionRes.status}`, detail: errText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const visionJson = await visionRes.json();
        const rawContent = visionJson?.choices?.[0]?.message?.content ?? "";
        // Strip code fences if the model wrapped JSON in them.
        const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

        let analysis: Record<string, unknown>;
        try {
          analysis = JSON.parse(cleaned);
        } catch {
          return new Response(JSON.stringify({ error: "Vision model returned non-JSON output", raw: rawContent.slice(0, 500) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Persist the analysis on the capture row for later retrieval.
        await supabase
          .from("aerial_captures")
          .update({ analysis: { ...analysis, analyzed_at: new Date().toISOString() } })
          .eq("id", body.capture_id)
          .eq("user_id", user.id);

        return new Response(JSON.stringify({ captureId: body.capture_id, analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
