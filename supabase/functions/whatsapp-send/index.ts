import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, profileId, conversationId, message, templateName, templateParams } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Get user's WhatsApp config
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !config) {
      throw new Error('WhatsApp not configured. Please set up your WhatsApp Business API first.');
    }

    // Get the access token from secrets
    const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (!whatsappAccessToken) {
      throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
    }

    // Get recipient phone number from profile
    const { data: contactMethods } = await supabase
      .from('contact_methods')
      .select('value')
      .eq('profile_id', profileId)
      .eq('contact_type', 'phone')
      .limit(1);

    if (!contactMethods?.length) {
      throw new Error('No phone number found for this contact');
    }

    // Clean phone number (remove spaces, dashes, plus sign for API)
    let phoneNumber = contactMethods[0].value.replace(/[\s\-\(\)]/g, '');
    if (phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.slice(1);
    }

    console.log('Sending WhatsApp message to:', phoneNumber);

    let messagePayload: any;

    if (templateName) {
      // Send template message (required for initiating conversations outside 24hr window)
      messagePayload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: templateParams ? [
            {
              type: 'body',
              parameters: templateParams.map((p: string) => ({ type: 'text', text: p })),
            },
          ] : [],
        },
      };
    } else {
      // Send regular text message (only works within 24hr conversation window)
      messagePayload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message },
      };
    }

    // Send via WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const result = await response.json();
    console.log('WhatsApp API response:', result);

    if (!response.ok) {
      const errorMessage = result.error?.message || 'Failed to send message';
      throw new Error(errorMessage);
    }

    const whatsappMessageId = result.messages?.[0]?.id;

    // Store the sent message in our database
    if (conversationId && message) {
      await supabase.from('messages').insert({
        user_id: userId,
        conversation_id: conversationId,
        content: message,
        is_from_contact: false,
        sent_at: new Date().toISOString(),
        whatsapp_message_id: whatsappMessageId,
        whatsapp_status: 'sent',
      });

      // Update conversation
      const { data: conv } = await supabase
        .from('conversations')
        .select('message_count')
        .eq('id', conversationId)
        .single();

      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: (conv?.message_count || 0) + 1,
        })
        .eq('id', conversationId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: whatsappMessageId,
        message: 'Message sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Send error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
