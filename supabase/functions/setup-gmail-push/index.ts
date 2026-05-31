/**
 * setup-gmail-push Edge Function
 *
 * Sets up Gmail push notifications via Google Pub/Sub so that new emails
 * trigger the gmail-push-handler function in real-time, instead of polling.
 *
 * Prerequisites (outside this function's scope):
 *   1. A Google Cloud Pub/Sub topic named "gmail-push" must exist in the project
 *      identified by GOOGLE_CLOUD_PROJECT_ID.
 *   2. The topic must grant the service account "gmail-api@system.gserviceaccount.com"
 *      the "Pub/Sub Publisher" role so that Gmail can publish to it.
 *   3. A Pub/Sub push subscription must point at this edge function's URL.
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_CLOUD_PROJECT_ID  — GCP project that owns the Pub/Sub topic
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  (for token refresh)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
} from "../_shared/http-helpers.ts";

// ---------------------------------------------------------------------------
// Token refresh helper (mirrors sync-gmail-emails pattern)
// ---------------------------------------------------------------------------

async function refreshAccessToken(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  gmailConfig: Record<string, unknown>,
): Promise<string | null> {
  const { data: clientIdRow } = await supabase
    .from("platform_config")
    .select("config_value")
    .eq("config_key", "GOOGLE_CLIENT_ID")
    .single();

  const { data: clientSecretRow } = await supabase
    .from("platform_config")
    .select("config_value")
    .eq("config_key", "GOOGLE_CLIENT_SECRET")
    .single();

  const clientId = clientIdRow?.config_value ?? Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = clientSecretRow?.config_value ?? Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret || !gmailConfig.refresh_token) return null;

  const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: gmailConfig.refresh_token as string,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!refreshResp.ok) {
    console.error("[setup-gmail-push] Token refresh failed:", await refreshResp.text());
    return null;
  }

  const tokenData = await refreshResp.json();
  const newAccessToken: string = tokenData.access_token;

  await supabase
    .from("gmail_config")
    .update({
      access_token: newAccessToken,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId);

  return newAccessToken;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // No body — will attempt to derive userId from auth token below
    }

    // ── Resolve userId ──────────────────────────────────────────────────────
    let userId: string = (body.userId ?? body.user_id ?? "") as string;

    if (!userId) {
      // Fall back to JWT
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      }
    }

    if (!userId) {
      return errorResponse("userId is required", 400);
    }

    // ── Load Gmail config ───────────────────────────────────────────────────
    const { data: gmailConfig, error: configError } = await supabase
      .from("gmail_config")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (configError || !gmailConfig) {
      return errorResponse("Gmail not connected for this user", 400);
    }

    // ── Ensure valid access token ───────────────────────────────────────────
    let accessToken: string = gmailConfig.access_token as string;

    const tokenExpiry = gmailConfig.token_expires_at
      ? new Date(gmailConfig.token_expires_at as string)
      : new Date(0);

    if (tokenExpiry <= new Date()) {
      console.log("[setup-gmail-push] Token expired, refreshing…");
      const refreshed = await refreshAccessToken(supabase, userId, gmailConfig);
      if (!refreshed) {
        return errorResponse("Failed to refresh Gmail access token", 500);
      }
      accessToken = refreshed;
    }

    // ── Call Gmail watch API ────────────────────────────────────────────────
    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
    if (!projectId) {
      return errorResponse("GOOGLE_CLOUD_PROJECT_ID environment variable not set", 500);
    }

    const topicName = `projects/${projectId}/topics/gmail-push`;

    const watchResp = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/watch",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicName,
          labelIds: ["INBOX"],
        }),
      },
    );

    if (!watchResp.ok) {
      const errBody = await watchResp.text();
      console.error("[setup-gmail-push] Gmail watch failed:", errBody);
      return errorResponse(`Gmail watch API error: ${errBody}`, watchResp.status);
    }

    const watchData = await watchResp.json();
    // watchData: { historyId: "...", expiration: "unix-ms-string" }

    const expirationMs = parseInt(watchData.expiration, 10);
    const expirationIso = new Date(expirationMs).toISOString();

    // ── Persist watch metadata ──────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("gmail_config")
      .update({
        push_history_id: watchData.historyId,
        push_expiration: expirationIso,
        push_enabled_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[setup-gmail-push] Failed to update gmail_config:", updateError);
      return errorResponse("Failed to save watch configuration", 500);
    }

    console.log(
      `[setup-gmail-push] Watch set up for user ${userId}. ` +
        `historyId=${watchData.historyId}, expiration=${expirationIso}`,
    );

    return jsonResponse({
      success: true,
      historyId: watchData.historyId,
      expiration: expirationIso,
      topicName,
    });
  } catch (err) {
    console.error("[setup-gmail-push] Unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(message, 500);
  }
});
