import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ mimeType: string; body?: { data?: string } }>;
  };
  internalDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json().catch(() => ({}));
    const { fullSync = false, daysBack = 30 } = body;

    console.log(`[sync-gmail-emails] Starting sync for user: ${userId}, fullSync: ${fullSync}`);

    // Get Gmail config
    const { data: gmailConfig, error: configError } = await supabase
      .from('gmail_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !gmailConfig) {
      return new Response(JSON.stringify({ error: 'Gmail not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = gmailConfig.access_token;

    // Check if token is expired
    const tokenExpiry = new Date(gmailConfig.token_expires_at);
    if (tokenExpiry < new Date() && gmailConfig.refresh_token) {
      console.log('[sync-gmail-emails] Token expired, refreshing...');
      
      // Get client credentials
      const { data: secrets } = await supabase
        .from('integration_secrets')
        .select('secret_value')
        .eq('user_id', userId)
        .eq('secret_name', 'GOOGLE_CLIENT_SECRET')
        .single();

      const { data: clientIdSecret } = await supabase
        .from('integration_secrets')
        .select('secret_value')
        .eq('user_id', userId)
        .eq('secret_name', 'GOOGLE_CLIENT_ID')
        .single();

      if (secrets && clientIdSecret) {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: gmailConfig.refresh_token,
            client_id: clientIdSecret.secret_value,
            client_secret: secrets.secret_value,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          accessToken = tokenData.access_token;
          
          await supabase
            .from('gmail_config')
            .update({
              access_token: tokenData.access_token,
              token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            })
            .eq('user_id', userId);
        }
      }
    }

    // Calculate date filter
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - daysBack);
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

    // Fetch message list from Gmail
    const query = fullSync ? '' : `after:${afterTimestamp}`;
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=${encodeURIComponent(query)}`;
    
    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
      const error = await listResponse.json();
      console.error('[sync-gmail-emails] Failed to list messages:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch Gmail messages' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    console.log(`[sync-gmail-emails] Found ${messageIds.length} messages`);

    // Get contact emails for matching
    const { data: contactMethods } = await supabase
      .from('contact_methods')
      .select('profile_id, value')
      .eq('user_id', userId)
      .eq('method_type', 'email');

    const emailToProfile = new Map(
      contactMethods?.map(cm => [cm.value.toLowerCase(), cm.profile_id]) || []
    );

    let syncedCount = 0;
    let matchedCount = 0;

    // Process messages in batches
    for (const msgRef of messageIds.slice(0, 50)) { // Limit to 50 per sync
      try {
        // Fetch full message
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!msgResponse.ok) continue;

        const message: GmailMessage = await msgResponse.json();
        
        // Parse headers
        const headers = message.payload.headers;
        const getHeader = (name: string) => 
          headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('From');
        const to = getHeader('To');
        const subject = getHeader('Subject');
        const date = getHeader('Date');

        // Extract email addresses
        const fromMatch = from.match(/<([^>]+)>/) || [null, from.split(' ')[0]];
        const fromEmail = (fromMatch[1] || from).toLowerCase().trim();
        const fromName = from.replace(/<[^>]+>/, '').trim();

        // Check if this matches a contact
        const profileId = emailToProfile.get(fromEmail) || 
          to.split(',').map(t => {
            const match = t.match(/<([^>]+)>/);
            return (match?.[1] || t).toLowerCase().trim();
          }).find(e => emailToProfile.has(e)) ? emailToProfile.get(
            to.split(',').map(t => {
              const match = t.match(/<([^>]+)>/);
              return (match?.[1] || t).toLowerCase().trim();
            }).find(e => emailToProfile.has(e))!
          ) : null;

        // Decode body
        let bodyText = '';
        if (message.payload.body?.data) {
          bodyText = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (message.payload.parts) {
          const textPart = message.payload.parts.find(p => p.mimeType === 'text/plain');
          if (textPart?.body?.data) {
            bodyText = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        }

        // Upsert thread
        const { data: thread } = await supabase
          .from('email_threads')
          .upsert({
            id: `gmail-${message.threadId}`,
            user_id: userId,
            profile_id: profileId,
            conversation_id: message.threadId,
            subject: subject || '(No Subject)',
            participant_emails: [fromEmail, ...to.split(',').map(t => t.trim())],
            message_count: 1,
            last_message_at: new Date(parseInt(message.internalDate)).toISOString(),
            source: 'gmail',
          }, { onConflict: 'id' })
          .select()
          .single();

        // Upsert message
        await supabase
          .from('email_messages')
          .upsert({
            id: `gmail-${message.id}`,
            thread_id: thread?.id || `gmail-${message.threadId}`,
            user_id: userId,
            message_id: message.id,
            subject,
            body_text: bodyText.slice(0, 50000), // Limit body size
            sender_email: fromEmail,
            sender_name: fromName,
            recipient_emails: to.split(',').map(t => t.trim()),
            sent_at: new Date(parseInt(message.internalDate)).toISOString(),
            is_from_contact: profileId ? emailToProfile.has(fromEmail) : false,
            source: 'gmail',
          }, { onConflict: 'id' });

        syncedCount++;
        if (profileId) matchedCount++;

      } catch (msgError) {
        console.error(`[sync-gmail-emails] Error processing message ${msgRef.id}:`, msgError);
      }
    }

    // Update sync status
    await supabase
      .from('gmail_config')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'completed',
      })
      .eq('user_id', userId);

    console.log(`[sync-gmail-emails] Synced ${syncedCount} messages, ${matchedCount} matched to contacts`);

    return new Response(JSON.stringify({ 
      success: true,
      synced: syncedCount,
      matched: matchedCount,
      total: messageIds.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[sync-gmail-emails] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
