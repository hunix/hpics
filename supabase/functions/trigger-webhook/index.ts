import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { webhookId, eventType, data, userId } = await req.json();

    if (!webhookId && !userId) {
      return new Response(JSON.stringify({ error: "Missing webhookId or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get webhooks to trigger
    let webhooksQuery = supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true);

    if (webhookId) {
      webhooksQuery = webhooksQuery.eq('id', webhookId);
    } else if (userId) {
      webhooksQuery = webhooksQuery.eq('user_id', userId);
    }

    const { data: webhooks, error: webhooksError } = await webhooksQuery;

    if (webhooksError) {
      throw webhooksError;
    }

    const results: Array<{ webhookId: string; success: boolean; status?: number; error?: string }> = [];

    for (const webhook of webhooks || []) {
      // Check if this webhook is subscribed to this event
      if (eventType && !webhook.events.includes(eventType) && !webhook.events.includes('*')) {
        continue;
      }

      const payload: WebhookPayload = {
        event: eventType || 'test',
        timestamp: new Date().toISOString(),
        data: data || { test: true },
      };

      // Create signature if secret is set
      let signature = '';
      if (webhook.secret) {
        const hmac = createHmac('sha256', webhook.secret);
        hmac.update(JSON.stringify(payload));
        signature = hmac.digest('hex');
      }

      const startTime = Date.now();
      let responseStatus = 0;
      let responseBody = '';
      let errorMessage = '';

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': eventType || 'test',
          'X-Webhook-Timestamp': payload.timestamp,
          ...(signature && { 'X-Webhook-Signature': `sha256=${signature}` }),
          ...(webhook.headers || {}),
        };

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        responseStatus = response.status;
        responseBody = await response.text();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseBody}`);
        }

        results.push({ webhookId: webhook.id, success: true, status: responseStatus });
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.push({ webhookId: webhook.id, success: false, error: errorMessage });
      }

      const durationMs = Date.now() - startTime;

      // Log the webhook delivery
      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event_type: eventType || 'test',
        payload,
        response_status: responseStatus || null,
        response_body: responseBody.substring(0, 10000) || null,
        error_message: errorMessage || null,
        duration_ms: durationMs,
      });

      // Update webhook status
      await supabase
        .from('webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status: responseStatus || 0,
          failure_count: errorMessage 
            ? (webhook.failure_count || 0) + 1 
            : 0,
        })
        .eq('id', webhook.id);
    }

    return new Response(JSON.stringify({
      success: true,
      triggered: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error('Trigger webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
