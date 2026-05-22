import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  fullSync?: boolean;
  daysBack?: number;
  profileId?: string;
}

interface GraphMessage {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body?: { content: string; contentType: string };
  sender: { emailAddress: { address: string; name: string } };
  toRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  ccRecipients?: Array<{ emailAddress: { address: string; name: string } }>;
  sentDateTime: string;
  receivedDateTime: string;
  hasAttachments: boolean;
  importance: string;
  isRead: boolean;
  parentFolderId: string;
}

Deno.serve(async (req) => {
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
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
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

    const body: SyncRequest = await req.json().catch(() => ({}));
    const { fullSync = false, daysBack = 90, profileId } = body;

    console.log(`[sync-outlook-emails] Starting sync for user: ${userId}, fullSync: ${fullSync}, daysBack: ${daysBack}`);

    // Get OAuth tokens
    const { data: oauthToken, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'microsoft')
      .single();

    if (tokenError || !oauthToken) {
      console.error('[sync-outlook-emails] No OAuth token found');
      return new Response(JSON.stringify({ error: 'Not connected to Outlook' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token is expired and refresh if needed
    const tokenExpiry = new Date(oauthToken.expires_at);
    let accessToken = oauthToken.access_token;

    if (tokenExpiry < new Date()) {
      console.log('[sync-outlook-emails] Token expired, refreshing...');
      
      // Get outlook config for client_id and tenant_id
      const { data: config } = await supabase
        .from('outlook_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!config) {
        return new Response(JSON.stringify({ error: 'Outlook config not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenEndpoint = `https://login.microsoftonline.com/${config.tenant_id}/oauth2/v2.0/token`;
      const tokenParams = new URLSearchParams({
        client_id: config.client_id,
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadBasic https://graph.microsoft.com/User.Read offline_access',
        refresh_token: oauthToken.refresh_token!,
        grant_type: 'refresh_token',
      });

      const refreshResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      if (!refreshResponse.ok) {
        console.error('[sync-outlook-emails] Token refresh failed');
        return new Response(JSON.stringify({ error: 'Token refresh failed, please reconnect' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;

      // Update tokens in database
      await supabase
        .from('oauth_tokens')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token || oauthToken.refresh_token,
          expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', oauthToken.id);
    }

    // Get contact emails for matching - scope via profiles table for user isolation
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select(`
        id,
        contact_methods (
          value,
          profile_id
        )
      `)
      .eq('user_id', userId);

    const emailToProfileMap = new Map<string, string>();
    for (const profile of userProfiles || []) {
      for (const method of profile.contact_methods || []) {
        if (method.value) {
          emailToProfileMap.set(method.value.toLowerCase(), method.profile_id);
        }
      }
    }

    // Build Graph API URL with filters
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);
    const filterDate = sinceDate.toISOString();

    let graphUrl = `https://graph.microsoft.com/v1.0/me/messages?$top=100&$orderby=receivedDateTime desc&$select=id,conversationId,subject,bodyPreview,sender,toRecipients,ccRecipients,sentDateTime,receivedDateTime,hasAttachments,importance,isRead,parentFolderId`;
    
    if (!fullSync) {
      graphUrl += `&$filter=receivedDateTime ge ${filterDate}`;
    }

    console.log('[sync-outlook-emails] Fetching messages from Graph API...');

    let totalSynced = 0;
    let nextLink: string | null = graphUrl;

    while (nextLink) {
      const fetchResponse = await fetch(nextLink, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('[sync-outlook-emails] Graph API error:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to fetch emails' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const graphData: { value?: GraphMessage[]; '@odata.nextLink'?: string } = await fetchResponse.json();
      const messages: GraphMessage[] = graphData.value || [];

      console.log(`[sync-outlook-emails] Processing ${messages.length} messages...`);

      for (const msg of messages) {
        const senderEmail = msg.sender?.emailAddress?.address?.toLowerCase();
        const recipientEmails = msg.toRecipients?.map(r => r.emailAddress?.address?.toLowerCase()) || [];
        
        // Find matching profile
        let matchedProfileId = profileId || null;
        
        if (!matchedProfileId) {
          // Check sender
          if (senderEmail && emailToProfileMap.has(senderEmail)) {
            matchedProfileId = emailToProfileMap.get(senderEmail)!;
          } else {
            // Check recipients
            for (const email of recipientEmails) {
              if (email && emailToProfileMap.has(email)) {
                matchedProfileId = emailToProfileMap.get(email)!;
                break;
              }
            }
          }
        }

        // Only sync emails that match a contact (unless profileId is specified)
        if (!matchedProfileId) continue;

        // Upsert email thread
        const { data: thread, error: threadError } = await supabase
          .from('email_threads')
          .upsert({
            user_id: userId,
            profile_id: matchedProfileId,
            conversation_id: msg.conversationId,
            subject: msg.subject,
            last_message_at: msg.receivedDateTime,
            is_read: msg.isRead,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,conversation_id',
          })
          .select('id')
          .single();

        if (threadError) {
          console.error('[sync-outlook-emails] Thread upsert error:', threadError);
          continue;
        }

        // Upsert email message
        const { error: msgError } = await supabase
          .from('email_messages')
          .upsert({
            user_id: userId,
            thread_id: thread.id,
            external_id: msg.id,
            sender_email: senderEmail || '',
            sender_name: msg.sender?.emailAddress?.name,
            recipients: recipientEmails,
            cc_recipients: msg.ccRecipients?.map(r => r.emailAddress?.address?.toLowerCase()) || [],
            subject: msg.subject,
            body_preview: msg.bodyPreview,
            sent_at: msg.sentDateTime,
            received_at: msg.receivedDateTime,
            is_from_contact: emailToProfileMap.has(senderEmail || ''),
            has_attachments: msg.hasAttachments,
            importance: msg.importance?.toLowerCase() || 'normal',
          }, {
            onConflict: 'user_id,external_id',
          });

        if (msgError) {
          console.error('[sync-outlook-emails] Message upsert error:', msgError);
        } else {
          totalSynced++;
        }
      }

      // Check for more pages
      nextLink = graphData['@odata.nextLink'] || null;
      
      // Limit to avoid timeouts (max 500 messages per sync)
      if (totalSynced >= 500) {
        console.log('[sync-outlook-emails] Reached sync limit of 500 messages');
        break;
      }
    }

    // Update message counts for threads (ignore if function doesn't exist)
    try {
      await supabase.rpc('update_email_thread_counts', { p_user_id: userId });
    } catch {
      // Function might not exist yet, that's ok
    }

    // Update last sync time
    await supabase
      .from('outlook_config')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);

    await supabase
      .from('email_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'outlook');

    console.log(`[sync-outlook-emails] Sync complete. Total synced: ${totalSynced}`);

    return new Response(JSON.stringify({
      success: true,
      synced: totalSynced,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sync-outlook-emails] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
