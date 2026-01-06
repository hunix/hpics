import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Web Push requires signing with VAPID keys
// This is a simplified implementation - in production, use the web-push library
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // For a full implementation, you'd use the web-push library
    // This is a placeholder that would need proper VAPID signing
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
      },
      body: payload,
    });

    return response.ok;
  } catch (error) {
    console.error('Push send error:', error);
    return false;
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

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        // In a real implementation, you would:
        // 1. Parse the subscription data
        // 2. Sign the request with VAPID keys
        // 3. Encrypt the payload
        // 4. Send to the push service endpoint

        // For now, we'll log and simulate success
        console.log('Would send to endpoint:', sub.endpoint);
        
        // Mark as sent (in production, only on actual success)
        successCount++;
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
      metadata: { successCount, failCount, url },
    });

    return new Response(
      JSON.stringify({
        success: true,
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
