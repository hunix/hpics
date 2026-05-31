/**
 * gmail-push-handler Edge Function
 *
 * Receives Pub/Sub push notifications from Google whenever a new Gmail
 * message arrives for a watched inbox.
 *
 * Google sends:
 *   POST /gmail-push-handler
 *   {
 *     "message": {
 *       "data": "<base64url-encoded JSON>",
 *       "messageId": "...",
 *       "publishTime": "..."
 *     },
 *     "subscription": "projects/.../subscriptions/..."
 *   }
 *
 * The decoded "data" payload is:
 *   { "emailAddress": "user@gmail.com", "historyId": "12345" }
 *
 * This function:
 *   1. Decodes and validates the Pub/Sub envelope.
 *   2. Looks up the user in gmail_config by email address.
 *   3. Invokes sync-gmail-emails with incremental sync parameters.
 *   4. Updates gmail_config.push_history_id to the new historyId.
 *
 * IMPORTANT: Always returns HTTP 200. Pub/Sub interprets any non-2xx
 * response as a delivery failure and will retry — which can cause storms.
 * Errors are logged but never propagated as non-200 responses.
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Pub/Sub always hits this without CORS, but keep consistent headers.
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Always-200 response helper — Pub/Sub requirement. */
function pubsubOk(body: Record<string, unknown> = { received: true }): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // Handle CORS preflight (unlikely from Pub/Sub, but keep consistent).
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only POST is valid; reject everything else with 200 (not 405) so Pub/Sub
  // doesn't retry endlessly on misconfigured subscriptions.
  if (req.method !== "POST") {
    console.warn(`[gmail-push-handler] Unexpected method: ${req.method}`);
    return pubsubOk({ skipped: true, reason: "unexpected method" });
  }

  try {
    // ── Parse Pub/Sub envelope ────────────────────────────────────────────
    let envelope: Record<string, unknown>;
    try {
      envelope = await req.json();
    } catch {
      console.error("[gmail-push-handler] Could not parse request body as JSON");
      return pubsubOk({ skipped: true, reason: "invalid json" });
    }

    const message = envelope.message as Record<string, unknown> | undefined;
    if (!message?.data) {
      console.error("[gmail-push-handler] Missing message.data in Pub/Sub envelope");
      return pubsubOk({ skipped: true, reason: "missing message.data" });
    }

    // ── Decode base64url payload ─────────────────────────────────────────
    let gmailNotification: { emailAddress: string; historyId: string };
    try {
      // Pub/Sub uses standard base64 (not URL-safe) for push messages, but
      // Gmail may use base64url — normalise both variants.
      const raw = (message.data as string)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const decoded = atob(raw);
      gmailNotification = JSON.parse(decoded);
    } catch (decodeErr) {
      console.error("[gmail-push-handler] Failed to decode message.data:", decodeErr);
      return pubsubOk({ skipped: true, reason: "decode error" });
    }

    const { emailAddress, historyId } = gmailNotification;

    if (!emailAddress || !historyId) {
      console.error("[gmail-push-handler] Decoded payload missing emailAddress or historyId", gmailNotification);
      return pubsubOk({ skipped: true, reason: "missing fields in payload" });
    }

    console.log(
      `[gmail-push-handler] Notification for ${emailAddress}, historyId=${historyId}`,
    );

    // ── Look up user ──────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: gmailConfig, error: lookupError } = await supabase
      .from("gmail_config")
      .select("user_id, push_history_id")
      .eq("email", emailAddress)
      .single();

    if (lookupError || !gmailConfig) {
      // Email not found — not necessarily an error; may be an unregistered user.
      console.warn(
        `[gmail-push-handler] No gmail_config found for email=${emailAddress}`,
      );
      return pubsubOk({ skipped: true, reason: "user not found" });
    }

    const userId: string = gmailConfig.user_id;
    const previousHistoryId: string | null = gmailConfig.push_history_id ?? null;

    // ── Invoke incremental sync ───────────────────────────────────────────
    // Pass the previous historyId so sync-gmail-emails can fetch only the
    // history entries since that point. If unknown, sync-gmail-emails will
    // fall back to its default behaviour.
    try {
      const { error: invokeError } = await supabase.functions.invoke(
        "sync-gmail-emails",
        {
          body: {
            userId,
            historyId,
            previousHistoryId,
            incrementalSync: true,
          },
        },
      );

      if (invokeError) {
        console.error(
          "[gmail-push-handler] sync-gmail-emails invocation error:",
          invokeError,
        );
        // Fall through — still update historyId so we don't re-process.
      } else {
        console.log(
          `[gmail-push-handler] sync-gmail-emails invoked for user ${userId}`,
        );
      }
    } catch (invokeErr) {
      console.error(
        "[gmail-push-handler] Failed to invoke sync-gmail-emails:",
        invokeErr,
      );
      // Fall through — still update historyId.
    }

    // ── Advance the stored historyId ──────────────────────────────────────
    // Always update even if sync failed, so we don't keep retrying from an
    // old historyId and potentially duplicating work on the next push.
    const { error: updateError } = await supabase
      .from("gmail_config")
      .update({ push_history_id: historyId })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        "[gmail-push-handler] Failed to update push_history_id:",
        updateError,
      );
    }

    return pubsubOk({ success: true, userId, historyId });
  } catch (err) {
    // Catch-all: log and return 200 to prevent Pub/Sub retry storms.
    console.error("[gmail-push-handler] Unhandled error:", err);
    return pubsubOk({ error: err instanceof Error ? err.message : String(err) });
  }
});
