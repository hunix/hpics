import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';
import { toast } from 'sonner';

export function CalendarSyncSettings() {
  const queryClient = useQueryClient();

  const redirectUri = `${window.location.origin}/settings?source=google-calendar`;

  // Check Google Calendar connection
  const { data: googleConfig, isLoading: loadingGoogle } = useQuery({
    queryKey: ['google-calendar-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('google_calendar_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      return data;
    },
  });

  // Check Outlook connection
  const { data: outlookConfig } = useQuery({
    queryKey: ['outlook-config-calendar'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'outlook')
        .maybeSingle();
      
      return data;
    },
  });

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const source = urlParams.get('source');
    
    if (code && source === 'google-calendar') {
      handleGoogleCallback(code);
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleGoogleCallback = async (code: string) => {
    try {
      // Exchange code for tokens using server-side secrets
      const response = await invokeFunction('google-calendar-oauth', {
          action: 'exchange',
          code,
          redirectUri,
        });

      if (response.error) throw new Error(response.error.message);

      toast.success(`Connected Google Calendar: ${response.data.email}`);
      queryClient.invalidateQueries({ queryKey: ['google-calendar-config'] });
    } catch (error) {
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      // Get auth URL using server-side credentials
      const response = await invokeFunction('google-calendar-oauth', {
          action: 'get_auth_url',
          redirectUri,
        });

      if (response.error) throw new Error(response.error.message);
      
      window.location.href = response.data.authUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const syncGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await invokeFunction('sync-google-calendar');
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} events, matched ${data.matched} to contacts`);
      queryClient.invalidateQueries({ queryKey: ['google-calendar-config'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const syncOutlookMutation = useMutation({
    mutationFn: async () => {
      const response = await invokeFunction('sync-outlook-calendar');
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} events, matched ${data.matched} to contacts`);
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const disconnectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await invokeFunction('google-calendar-oauth', { action: 'revoke' });
      if (response.error) throw new Error(response.error.message);
    },
    onSuccess: () => {
      toast.success('Disconnected from Google Calendar');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-config'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>Sync events and match attendees to contacts</CardDescription>
              </div>
            </div>
            {googleConfig && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingGoogle ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : googleConfig ? (
            <>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{googleConfig.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Calendars:</span>
                  <p className="font-medium">{googleConfig.calendar_ids?.length || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Sync:</span>
                  <p className="font-medium">
                    {googleConfig.last_sync_at 
                      ? new Date(googleConfig.last_sync_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => syncGoogleMutation.mutate()}
                  disabled={syncGoogleMutation.isPending}
                >
                  {syncGoogleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => disconnectGoogleMutation.mutate()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Google Calendar integration uses server-side OAuth credentials.
                  Click below to connect your account securely.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Redirect URI for Google Console:</p>
                <code className="block p-2 bg-muted rounded text-sm break-all">
                  {redirectUri}
                </code>
              </div>

              <Button 
                onClick={() => connectGoogleMutation.mutate()}
                disabled={connectGoogleMutation.isPending}
                className="w-full"
              >
                {connectGoogleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Connect Google Calendar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Outlook Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Outlook Calendar</CardTitle>
                <CardDescription>Sync events from your Microsoft account</CardDescription>
              </div>
            </div>
            {outlookConfig && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {outlookConfig ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your Outlook account is connected. Calendar events will be synced automatically.
              </p>
              <Button 
                onClick={() => syncOutlookMutation.mutate()}
                disabled={syncOutlookMutation.isPending}
              >
                {syncOutlookMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Calendar
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Outlook account first in Settings → Integrations → Outlook
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
