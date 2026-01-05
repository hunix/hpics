import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, Loader2, CheckCircle2, XCircle, RefreshCw, 
  ChevronDown, ChevronRight, ExternalLink, Copy, AlertCircle,
  Settings2, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

export function OutlookIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [clientId, setClientId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [syncDaysBack, setSyncDaysBack] = useState('90');

  // Fetch existing config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['outlook-config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outlook_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch OAuth token status
  const { data: oauthToken } = useQuery({
    queryKey: ['oauth-token', user?.id, 'microsoft'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user!.id)
        .eq('provider', 'microsoft')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch email account status
  const { data: emailAccount } = useQuery({
    queryKey: ['email-account', user?.id, 'outlook'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('provider', 'outlook')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isConnected = !!oauthToken && new Date(oauthToken.expires_at) > new Date();
  const hasConfig = !!config;

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!clientId.trim() || !tenantId.trim()) {
        throw new Error('Client ID and Tenant ID are required');
      }

      const redirectUri = `${window.location.origin}/settings`;

      const { error } = await supabase
        .from('outlook_config')
        .upsert({
          user_id: user!.id,
          client_id: clientId.trim(),
          tenant_id: tenantId.trim(),
          redirect_uri: redirectUri,
          sync_days_back: parseInt(syncDaysBack),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlook-config'] });
      toast({ title: 'Configuration saved' });
      setShowConfig(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async () => {
      // First disconnect OAuth
      await supabase.functions.invoke('outlook-oauth', {
        body: { action: 'revoke', clientId: config?.client_id, tenantId: config?.tenant_id, redirectUri: config?.redirect_uri },
      });

      // Delete config
      await supabase
        .from('outlook_config')
        .delete()
        .eq('user_id', user!.id);

      // Delete email threads and messages
      await supabase
        .from('email_threads')
        .delete()
        .eq('user_id', user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlook-config'] });
      queryClient.invalidateQueries({ queryKey: ['oauth-token'] });
      queryClient.invalidateQueries({ queryKey: ['email-account'] });
      toast({ title: 'Outlook disconnected' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!config) throw new Error('Please save your configuration first');

      const scopes = [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.ReadBasic',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
      ].join(' ');

      const authUrl = new URL(`https://login.microsoftonline.com/${config.tenant_id}/oauth2/v2.0/authorize`);
      authUrl.searchParams.set('client_id', config.client_id);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', config.redirect_uri || `${window.location.origin}/settings`);
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('response_mode', 'query');
      authUrl.searchParams.set('state', 'outlook_connect');

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl.toString(),
        'outlook_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(checkInterval);
              reject(new Error('OAuth window was closed'));
              return;
            }

            const popupUrl = popup?.location?.href;
            if (popupUrl?.includes('code=')) {
              clearInterval(checkInterval);
              const url = new URL(popupUrl);
              const code = url.searchParams.get('code');
              popup?.close();

              if (code) {
                resolve(code);
              } else {
                reject(new Error('No authorization code received'));
              }
            }
          } catch {
            // Cross-origin - popup is on Microsoft's domain
          }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          popup?.close();
          reject(new Error('OAuth timeout'));
        }, 300000);
      });
    },
    onSuccess: async (code) => {
      // Exchange code for tokens
      const { error } = await supabase.functions.invoke('outlook-oauth', {
        body: {
          action: 'exchange',
          code,
          clientId: config!.client_id,
          tenantId: config!.tenant_id,
          redirectUri: config!.redirect_uri || `${window.location.origin}/settings`,
        },
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['oauth-token'] });
      queryClient.invalidateQueries({ queryKey: ['email-account'] });
      toast({ title: 'Connected to Outlook successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Connection failed', description: error.message, variant: 'destructive' });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-outlook-emails', {
        body: { daysBack: config?.sync_days_back || 90 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['email-account'] });
      toast({ title: 'Sync complete', description: `Synced ${data.synced} emails` });
    },
    onError: (error) => {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  if (configLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Microsoft 365 / Outlook Integration
        </CardTitle>
        <CardDescription>
          Import email threads from your Microsoft 365 or Outlook account to track conversations with your contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : hasConfig ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isConnected ? 'Connected' : hasConfig ? 'Configured (Not Connected)' : 'Not Configured'}
              </p>
              {emailAccount?.email && (
                <p className="text-sm text-muted-foreground">{emailAccount.email}</p>
              )}
              {emailAccount?.last_sync_at && (
                <p className="text-xs text-muted-foreground">
                  Last sync: {format(new Date(emailAccount.last_sync_at), 'PPp')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Sync Now</span>
              </Button>
            )}
            {hasConfig && !isConnected && (
              <Button
                variant="default"
                size="sm"
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Setup Instructions (Collapsed) */}
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Setup Instructions
              </span>
              {showInstructions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Step 1: Create Azure AD App Registration</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to the <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Azure Portal - App Registrations <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Click <strong>"New registration"</strong></li>
                  <li>Enter a name (e.g., "PICS Email Integration")</li>
                  <li>Select <strong>"Accounts in this organizational directory only"</strong> for work accounts, or <strong>"Accounts in any organizational directory and personal Microsoft accounts"</strong> for personal Outlook</li>
                  <li>Click <strong>"Register"</strong></li>
                </ol>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Step 2: Configure Redirect URI</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>In your app registration, go to <strong>"Authentication"</strong></li>
                  <li>Click <strong>"Add a platform"</strong> → <strong>"Single-page application"</strong></li>
                  <li>Add this Redirect URI:</li>
                </ol>
                <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                  <code className="text-xs flex-1 break-all">{window.location.origin}/settings</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(`${window.location.origin}/settings`)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Step 3: Configure API Permissions</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to <strong>"API permissions"</strong></li>
                  <li>Click <strong>"Add a permission"</strong> → <strong>"Microsoft Graph"</strong> → <strong>"Delegated permissions"</strong></li>
                  <li>Add these permissions:</li>
                </ol>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">Mail.Read</Badge>
                  <Badge variant="secondary">Mail.ReadBasic</Badge>
                  <Badge variant="secondary">User.Read</Badge>
                  <Badge variant="secondary">offline_access</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: For organizational accounts, an admin may need to grant consent.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Step 4: Get Your Credentials</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to <strong>"Overview"</strong></li>
                  <li>Copy the <strong>"Application (client) ID"</strong></li>
                  <li>Copy the <strong>"Directory (tenant) ID"</strong></li>
                  <li>Enter both values in the configuration below</li>
                </ol>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Configuration Form */}
        <Collapsible open={showConfig || !hasConfig} onOpenChange={setShowConfig}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configuration
              </span>
              {(showConfig || !hasConfig) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-id">Application (Client) ID</Label>
                <Input
                  id="client-id"
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={clientId || config?.client_id || ''}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-id">Directory (Tenant) ID</Label>
                <Input
                  id="tenant-id"
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or 'common'"
                  value={tenantId || config?.tenant_id || ''}
                  onChange={(e) => setTenantId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use "common" for personal Microsoft accounts, or your organization's tenant ID for work accounts.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync-days">Sync emails from last</Label>
                <Select value={syncDaysBack} onValueChange={setSyncDaysBack}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                >
                  {saveConfigMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Configuration
                </Button>

                {hasConfig && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm('This will disconnect Outlook and delete all synced emails. Continue?')) {
                        deleteConfigMutation.mutate();
                      }
                    }}
                    disabled={deleteConfigMutation.isPending}
                  >
                    {deleteConfigMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remove Integration
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Sync Settings */}
        {isConnected && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-sync enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync new emails periodically
                </p>
              </div>
              <Switch
                checked={config?.sync_enabled ?? true}
                onCheckedChange={async (checked) => {
                  await supabase
                    .from('outlook_config')
                    .update({ sync_enabled: checked })
                    .eq('user_id', user!.id);
                  queryClient.invalidateQueries({ queryKey: ['outlook-config'] });
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
