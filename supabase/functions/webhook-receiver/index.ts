/**
 * PICS webhook-receiver Edge Function
 * Handles incoming push notifications from 3rd-party services (e.g., Microsoft Graph/Outlook).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logLLMObservability, startTimer } from "../_shared/llm-observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_BASE_URL = "https://ai.gateway.lovable.dev/v1";

// ──────────────────────────────────────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────────────────────────────────────

async function callLLM(system: string, user: string, temp = 0.3) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return "LLM API Key missing";
  const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: temp,
    }),
  });
  if (!resp.ok) return "LLM Error";
  const j = await resp.json();
  return j.choices?.[0]?.message?.content ?? "";
}

// ──────────────────────────────────────────────────────────────────────────────
// Extract Semantic Value
// ──────────────────────────────────────────────────────────────────────────────

async function processEmail(supabase: ReturnType<typeof createClient>, payload: any) {
  // A real integration would use the Microsoft Graph token to fetch the full email body here 
  // using payload.resource. For this blueprint, we process the metadata provided in the webhook.
  
  const from = payload.from?.emailAddress?.address || "unknown";
  const subject = payload.subject || "No Subject";
  const snippet = payload.bodyPreview || "";

  // 1. Send straight to Stream Processor as a raw event
  await supabase.functions.invoke("stream-processor", {
    body: {
      action: "emit_event",
      profileId: "unknown", // The LLM in stream-processor will try to match this
      eventType: "email_received",
      description: `Email from ${from}: ${subject}`,
      metadata: { from, subject, snippet, source: "microsoft_graph_webhook" },
      severity: "info",
    }
  });

  // 2. Perform basic NER classification here
  const classification = await callLLM(
    "You are an intelligence intake parser. Determine if this short email snippet contains: 'financial_intel', 'operational_intel', 'threat', or 'noise'. Return only that word.",
    `From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}`
  );

  return classification.trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const timer = startTimer();

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || "unknown"; // e.g. ?provider=msgraph

    // 1. Microsoft Graph Validation Hook
    // When subscribing, MS Graph sends a validationToken in the query string 
    // that must be echoed back in plain text.
    const validationToken = url.searchParams.get("validationToken");
    if (validationToken) {
      console.log(`[Webhook] Validating ${provider} subscription`);
      return new Response(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }

    // 2. Process Payload
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let processedCount = 0;

    if (provider === "msgraph" && body.value && Array.isArray(body.value)) {
      // Verify MS Graph clientState secret if configured
      const webhookSecret = Deno.env.get("MSGRAPH_WEBHOOK_CLIENT_STATE");
      if (webhookSecret) {
        const clientStatesValid = body.value.every(
          (n: any) => n.clientState === webhookSecret
        );
        if (!clientStatesValid) {
          console.error("[Webhook] Invalid clientState in MS Graph notification");
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      for (const notification of body.value) {
        if (notification.resourceData) {
          await processEmail(supabase, notification.resourceData);
          processedCount++;
        }
      }
    } else {
       // generic payload stash
       await supabase.from("intelligence_events").insert({
         event_type: "raw_webhook",
         description: `Webhook received from ${provider}`,
         metadata: body
       }).catch(()=>null);
       processedCount = 1;
    }

    // Attempt log
    logLLMObservability({
      userId: "webhook-system",
      edgeFunction: "webhook-receiver",
      model: "gpt-4o-mini",
      latencyMs: timer(),
      success: true,
      searchMethod: `provider:${provider}`
    }).catch(() => null);

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[Webhook Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
