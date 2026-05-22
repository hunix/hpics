import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);

    // GET request = webhook verification from Meta
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification request:', { mode, token });

      if (mode === 'subscribe' && token) {
        // Look up the verify token in our config
        const { data: config } = await supabase
          .from('whatsapp_config')
          .select('*')
          .eq('webhook_verify_token', token)
          .single();

        if (config) {
          console.log('Webhook verified successfully for user:', config.user_id);
          return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      }

      return new Response('Forbidden', { status: 403 });
    }

    // POST request = incoming message or status update
    if (req.method === 'POST') {
      const rawBody = await req.text();

      // Verify Meta webhook signature (X-Hub-Signature-256)
      const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');
      if (appSecret) {
        const signature = req.headers.get('X-Hub-Signature-256');
        if (!signature) {
          console.error('Missing X-Hub-Signature-256 header');
          return new Response('Forbidden', { status: 403 });
        }
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(appSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
        const expected = 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (signature !== expected) {
          console.error('Invalid webhook signature');
          return new Response('Forbidden', { status: 403 });
        }
      }

      const body = JSON.parse(rawBody);
      console.log('Webhook received:', JSON.stringify(body, null, 2));

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return new Response(JSON.stringify({ status: 'no_value' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const phoneNumberId = value.metadata?.phone_number_id;
      
      // Find the user config for this phone number
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('phone_number_id', phoneNumberId)
        .single();

      if (!config) {
        console.log('No config found for phone_number_id:', phoneNumberId);
        return new Response(JSON.stringify({ status: 'no_config' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update last webhook timestamp
      await supabase
        .from('whatsapp_config')
        .update({ last_webhook_at: new Date().toISOString(), is_connected: true })
        .eq('id', config.id);

      // Handle incoming messages
      if (value.messages) {
        for (const message of value.messages) {
          const contact = value.contacts?.find((c: any) => c.wa_id === message.from);
          const senderName = contact?.profile?.name || message.from;
          const senderPhone = message.from;

          console.log('Processing message from:', senderName, senderPhone);

          // Try to find matching profile by phone number
          const { data: contactMethods } = await supabase
            .from('contact_methods')
            .select('profile_id, profiles!inner(user_id)')
            .eq('contact_type', 'phone')
            .eq('profiles.user_id', config.user_id)
            .ilike('value', `%${senderPhone.slice(-10)}%`);

          let profileId = contactMethods?.[0]?.profile_id;

          // If no match, create a new profile
          if (!profileId) {
            const nameParts = senderName.split(' ');
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                user_id: config.user_id,
                first_name: nameParts[0] || senderName,
                last_name: nameParts.slice(1).join(' ') || null,
              })
              .select()
              .single();

            if (newProfile) {
              profileId = newProfile.id;
              
              // Add phone number as contact method
              await supabase.from('contact_methods').insert({
                profile_id: profileId,
                contact_type: 'phone',
                value: `+${senderPhone}`,
                label: 'WhatsApp',
              });
            }
          }

          if (profileId) {
            // Find or create conversation
            let { data: conversation } = await supabase
              .from('conversations')
              .select('*')
              .eq('profile_id', profileId)
              .eq('platform', 'whatsapp')
              .single();

            if (!conversation) {
              const { data: newConv } = await supabase
                .from('conversations')
                .insert({
                  user_id: config.user_id,
                  profile_id: profileId,
                  platform: 'whatsapp',
                  title: `WhatsApp with ${senderName}`,
                })
                .select()
                .single();
              conversation = newConv;
            }

            if (conversation) {
              // Extract message content
              let content = '';
              if (message.type === 'text') {
                content = message.text?.body || '';
              } else if (message.type === 'image') {
                content = '[Image]' + (message.image?.caption || '');
              } else if (message.type === 'document') {
                content = `[Document: ${message.document?.filename || 'file'}]`;
              } else if (message.type === 'audio') {
                content = '[Voice message]';
              } else if (message.type === 'video') {
                content = '[Video]';
              } else if (message.type === 'location') {
                content = `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
              } else {
                content = `[${message.type}]`;
              }

              // Insert message
              await supabase.from('messages').insert({
                user_id: config.user_id,
                conversation_id: conversation.id,
                content,
                is_from_contact: true,
                sent_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                whatsapp_message_id: message.id,
                whatsapp_status: 'received',
              });

              // Update conversation metadata
              await supabase
                .from('conversations')
                .update({
                  last_message_at: new Date().toISOString(),
                  message_count: (conversation.message_count || 0) + 1,
                })
                .eq('id', conversation.id);

              console.log('Message saved successfully');
            }
          }
        }
      }

      // Handle status updates (sent, delivered, read)
      if (value.statuses) {
        for (const status of value.statuses) {
          await supabase
            .from('messages')
            .update({ whatsapp_status: status.status })
            .eq('whatsapp_message_id', status.id);
          
          console.log('Status update:', status.id, status.status);
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
