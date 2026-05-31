/**
 * renew-webhook-subscriptions Edge Function
 *
 * Intended to run every 4 hours via pg_cron:
 *
 *   SELECT cron.schedule(
 *     'renew-webhook-subscriptions',
 *     '0 *\/4 * * *',
 *     $$SELECT net.http_post(
 *       url := current_setting('app.supabase_url') || '/functions/v1/renew-webhook-subscriptions',
 *       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
 *       body := '{}'::jsonb
 *     )$$
 *   );
 *
 * Renews two categories of subscriptions:
 *
 * 1. Gmail push watch (expires every 7 days)
 *    Calls setup-gmail-push for each gmail_config row where push is enabled
 *    and expiry is within 2 days (or already expired).
 *
 * 2. Microsoft Graph webhook subscriptions (expire between 60 and 4230 min)
 *    PATCHes each outlook_config subscription that expires within 24 hours,
 *    extending expiry to now + 4200 minutes (~70 hours, Graph max).
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  errorResponse,
  jsonResponse,
  optionsResponse,
} from "../_shared/http-helpers.ts";

// ---------------------------------------------------------------------------
// Microsoft Graph: refresh access token helper
// ---------------------------------------------------------------------------

async function refreshMsToken(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  outlookConfig: Record<string, unknown>,
): Promise<string | null> {
  const tenantId = (outlookConfig.tenant_id as string | undefined) ?? "common";
  const refreshToken = outlookConfig.refresh_token as string | undefined;

  const { data: clientIdRow } = await supabase
    .from("platform_config")
    .select("config_value")
    .eq("config_key", "MICROSOFT_CLIENT_ID")
    .single();

  const { data: clientSecretRow } = await supabase
    .from("platform_config")
    .select("config_value")
    .eq("config_key", "MICROSOFT_CLIENT_SECRET")
    .single();

  const clientId =
    clientIdRow?.config_value ?? Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret =
    clientSecretRow?.config_value ?? Deno.env.get("MICROSOFT_CLIENT_SECRET");

  if (!clientId || !clientSecret || !refreshToken) return null;

  const tokenResp = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "https://graph.microsoft.com/.default",
      }),
    },
  );

  if (!tokenResp.ok) {
    console.error(
      `[renew-webhook] MS token refresh failed for user ${userId}:`,
      await tokenResp.text(),
    );
    return null;
  }

  const tokenData = await tokenResp.json();
  const newToken: string = tokenData.access_token;

  await supabase
    .from("outlook_config")
    .update({
      access_token: newToken,
      token_expires_at: new Date(
        Date.now() + tokenData.expires_in * 1000,
      ).toISOString(),
    })
    .eq("user_id", userId);

  return newToken;
}

// ---------------------------------------------------------------------------
// Renew Gmail push watches
// ---------------------------------------------------------------------------

async function renewGmailWatches(
  supabase: ReturnType<typeof createClient>,
): Promise<{ renewed: number; errors: number }> {
  // Find rows where push is enabled AND expiry is within 2 days (or null).
  const cutoff = new Date(
    Date.now() + 2 * 24 * 60 * 60 * 1000,
  ).toISOString(); // now + 2 days

  const { data: rows, error } = await supabase
    .from("gmail_config")
    .select("user_id")
    .not("push_enabled_at", "is", null)
    .or(`push_expiration.is.null,push_expiration.lt.${cutoff}`);

  if (error) {
    console.error("[renew-webhook] Failed to query gmail_config:", error);
    return { renewed: 0, errors: 1 };
  }

  if (!rows || rows.length === 0) {
    console.log("[renew-webhook] No Gmail watches need renewal");
    return { renewed: 0, errors: 0 };
  }

  console.log(`[renew-webhook] Renewing ${rows.length} Gmail watch(es)`);

  let renewed = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const { error: invokeErr } = await supabase.functions.invoke(
        "setup-gmail-push",
        { body: { userId: row.user_id } },
      );
      if (invokeErr) {
        console.error(
          `[renew-webhook] setup-gmail-push failed for user ${row.user_id}:`,
          invokeErr,
        );
        errors++;
      } else {
        console.log(
          `[renew-webhook] Gmail watch renewed for user ${row.user_id}`,
        );
        renewed++;
      }
    } catch (err) {
      console.error(
        `[renew-webhook] Exception invoking setup-gmail-push for user ${row.user_id}:`,
        err,
      );
      errors++;
    }
  }

  return { renewed, errors };
}

// ---------------------------------------------------------------------------
// Renew Microsoft Graph webhook subscriptions
// ---------------------------------------------------------------------------

async function renewGraphSubscriptions(
  supabase: ReturnType<typeof createClient>,
): Promise<{ renewed: number; errors: number }> {
  // Microsoft Graph max subscription lifetime is 4320 minutes for mail.
  // We extend to 4200 min (~70 h) and renew when within 24 h of expiry.
  const cutoff = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ).toISOString(); // now + 24 hours

  const { data: rows, error } = await supabase
    .from("outlook_config")
    .select("user_id, webhook_subscription_id, webhook_subscription_expiry, access_token, refresh_token, token_expires_at, tenant_id")
    .not("webhook_subscription_id", "is", null)
    .or(`webhook_subscription_expiry.is.null,webhook_subscription_expiry.lt.${cutoff}`);

  if (error) {
    console.error("[renew-webhook] Failed to query outlook_config:", error);
    return { renewed: 0, errors: 1 };
  }

  if (!rows || rows.length === 0) {
    console.log("[renew-webhook] No Graph subscriptions need renewal");
    return { renewed: 0, errors: 0 };
  }

  console.log(
    `[renew-webhook] Renewing ${rows.length} Graph subscription(s)`,
  );

  // New expiry: now + 4200 minutes
  const newExpiry = new Date(
    Date.now() + 4200 * 60 * 1000,
  ).toISOString();

  let renewed = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      // Resolve a valid access token
      let accessToken: string = row.access_token as string;

      const tokenExpiry = row.token_expires_at
        ? new Date(row.token_expires_at as string)
        : new Date(0);

      if (tokenExpiry <= new Date()) {
        console.log(
          `[renew-webhook] Refreshing MS token for user ${row.user_id}`,
        );
        const refreshed = await refreshMsToken(supabase, row.user_id, row);
        if (!refreshed) {
          console.error(
            `[renew-webhook] MS token refresh failed for user ${row.user_id}`,
          );
          errors++;
          continue;
        }
        accessToken = refreshed;
      }

      // PATCH the Graph subscription
      const patchResp = await fetch(
        `https://graph.microsoft.com/v1.0/subscriptions/${row.webhook_subscription_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expirationDateTime: newExpiry }),
        },
      );

      if (!patchResp.ok) {
        const errText = await patchResp.text();
        console.error(
          `[renew-webhook] Graph PATCH failed for subscription ${row.webhook_subscription_id} (user ${row.user_id}):`,
          errText,
        );
        errors++;
        continue;
      }

      const patchData = await patchResp.json();
      const confirmedExpiry: string =
        patchData.expirationDateTime ?? newExpiry;

      // Persist new expiry
      await supabase
        .from("outlook_config")
        .update({ webhook_subscription_expiry: confirmedExpiry })
        .eq("user_id", row.user_id);

      console.log(
        `[renew-webhook] Graph subscription renewed for user ${row.user_id}, new expiry=${confirmedExpiry}`,
      );
      renewed++;
    } catch (err) {
      console.error(
        `[renew-webhook] Exception renewing Graph subscription for user ${row.user_id}:`,
        err,
      );
      errors++;
    }
  }

  return { renewed, errors };
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

    console.log("[renew-webhook] Starting subscription renewal run");

    const [gmailResult, graphResult] = await Promise.all([
      renewGmailWatches(supabase),
      renewGraphSubscriptions(supabase),
    ]);

    const summary = {
      success: true,
      gmail: gmailResult,
      microsoftGraph: graphResult,
      totalRenewed: gmailResult.renewed + graphResult.renewed,
      totalErrors: gmailResult.errors + graphResult.errors,
      ranAt: new Date().toISOString(),
    };

    console.log("[renew-webhook] Completed:", summary);

    return jsonResponse(summary);
  } catch (err) {
    console.error("[renew-webhook] Unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(message, 500);
  }
});
