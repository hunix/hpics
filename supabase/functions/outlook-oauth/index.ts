import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  action: 'exchange' | 'refresh' | 'revoke';
  code?: string;
  refreshToken?: string;
  clientId: string;
  tenantId: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
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

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: TokenRequest = await req.json();
    const { action, code, refreshToken, clientId, tenantId, redirectUri } = body;

    console.log(`[outlook-oauth] Action: ${action} for user: ${user.id}`);

    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    if (action === 'exchange') {
      // Exchange authorization code for tokens
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenParams = new URLSearchParams({
        client_id: clientId,
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadBasic https://graph.microsoft.com/User.Read offline_access',
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      console.log('[outlook-oauth] Exchanging code for tokens...');

      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('[outlook-oauth] Token exchange failed:', errorData);
        return new Response(JSON.stringify({ error: 'Token exchange failed', details: errorData }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokens: TokenResponse = await tokenResponse.json();
      console.log('[outlook-oauth] Token exchange successful');

      // Get user email from Microsoft Graph
      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userInfo = await graphResponse.json();
      const accountEmail = userInfo.mail || userInfo.userPrincipalName;

      console.log(`[outlook-oauth] Connected account: ${accountEmail}`);

      // Store tokens in database
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      const { error: upsertError } = await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: user.id,
          provider: 'microsoft',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          scopes: tokens.scope.split(' '),
          account_email: accountEmail,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider,account_email',
        });

      if (upsertError) {
        console.error('[outlook-oauth] Failed to store tokens:', upsertError);
        return new Response(JSON.stringify({ error: 'Failed to store tokens' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update email_accounts table
      await supabase
        .from('email_accounts')
        .upsert({
          user_id: user.id,
          provider: 'outlook',
          email: accountEmail,
          display_name: userInfo.displayName,
          is_connected: true,
          sync_enabled: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,email',
          ignoreDuplicates: false,
        });

      return new Response(JSON.stringify({
        success: true,
        email: accountEmail,
        displayName: userInfo.displayName,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'refresh') {
      // Refresh access token
      if (!refreshToken) {
        return new Response(JSON.stringify({ error: 'Missing refresh token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenParams = new URLSearchParams({
        client_id: clientId,
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadBasic https://graph.microsoft.com/User.Read offline_access',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('[outlook-oauth] Token refresh failed:', errorData);
        return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokens: TokenResponse = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Update tokens in database
      await supabase
        .from('oauth_tokens')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || refreshToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', 'microsoft');

      return new Response(JSON.stringify({
        success: true,
        expiresAt: expiresAt.toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'revoke') {
      // Delete tokens and disconnect
      await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'microsoft');

      await supabase
        .from('email_accounts')
        .update({ is_connected: false, sync_enabled: false })
        .eq('user_id', user.id)
        .eq('provider', 'outlook');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[outlook-oauth] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
