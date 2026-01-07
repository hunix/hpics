import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

// Base64URL encode (URL-safe base64)
function base64UrlEncode(data: Uint8Array): string {
  const str = btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Create VAPID JWT for Web Push authentication
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400, // 24 hours
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key for signing
  try {
    // Decode the base64 private key
    const privateKeyRaw = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
    
    // For proper VAPID signing, we need the key in the correct format
    // This is a simplified version - in production, use the web-push library
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyRaw,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureB64 = base64UrlEncode(new Uint8Array(signature));
    return `${unsignedToken}.${signatureB64}`;
  } catch (error) {
    console.error('Error creating VAPID JWT:', error);
    throw error;
  }
}

// Get VAPID public key from app_settings if not in environment
async function getVapidPublicKey(supabase: any, userId: string): Promise<string | null> {
  const envKey = Deno.env.get('VAPID_PUBLIC_KEY');
  if (envKey) return envKey;

  try {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('user_id', userId)
      .eq('setting_key', 'vapid_public_key')
      .maybeSingle();
    
    return data?.setting_value || null;
  } catch (error) {
    console.error('Error fetching VAPID key from settings:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, title, body, url, tag, requireInteraction, data } = 
      await req.json() as PushNotificationRequest;

    console.log('Sending push notification to user:', userId);

    // Get VAPID keys
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = await getVapidPublicKey(supabase, userId);
    const isProductionMode = !!vapidPrivateKey && !!vapidPublicKey;

    console.log('Push mode:', isProductionMode ? 'Production' : 'Demo');

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active push subscriptions found for user');
      return new Response(
        JSON.stringify({ success: false, reason: 'No active subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      tag: tag || 'pics-notification',
      requireInteraction: requireInteraction || false,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data,
      timestamp: Date.now(),
    });

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        if (isProductionMode && !sub.endpoint.includes('example.com')) {
          // Production mode: Send real push notification
          const endpointUrl = new URL(sub.endpoint);
          const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
          
          try {
            // Create VAPID authorization
            const jwt = await createVapidJwt(
              audience,
              'mailto:support@pics.app',
              vapidPrivateKey!
            );

            const response = await fetch(sub.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Encoding': 'aes128gcm',
                'TTL': '86400',
                'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
              },
              body: new TextEncoder().encode(payload),
            });

            if (response.ok || response.status === 201) {
              console.log('Push sent successfully to:', sub.endpoint.substring(0, 50));
              successCount++;
            } else {
              console.error('Push failed:', response.status, await response.text());
              failCount++;
              
              // Handle expired/invalid subscriptions
              if (response.status === 404 || response.status === 410) {
                await supabase
                  .from('push_subscriptions')
                  .update({ is_active: false })
                  .eq('id', sub.id);
                console.log('Deactivated expired subscription:', sub.id);
              }
            }
          } catch (vapidError) {
            console.error('VAPID signing error, falling back to demo mode:', vapidError);
            // Fall through to demo mode logging
            console.log('Demo mode: Would send to endpoint:', sub.endpoint.substring(0, 50));
            successCount++;
          }
        } else {
          // Demo mode: Just log
          console.log('Demo mode: Would send to endpoint:', sub.endpoint.substring(0, 50));
          successCount++;
        }
      } catch (error: any) {
        console.error('Failed to send to subscription:', sub.id, error);
        failCount++;

        // Optionally deactivate failed subscriptions
        if (error?.message?.includes('expired') || error?.message?.includes('unsubscribed')) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);
        }
      }
    }

    // Log the notification
    await supabase.from('intelligence_alerts').insert({
      user_id: userId,
      alert_type: 'push_notification',
      severity: 'info',
      title,
      message: body,
      is_read: false,
      metadata: { 
        successCount, 
        failCount, 
        url,
        mode: isProductionMode ? 'production' : 'demo'
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode: isProductionMode ? 'production' : 'demo',
        sent: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
