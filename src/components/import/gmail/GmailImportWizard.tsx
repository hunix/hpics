import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Settings,
  Download,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function GmailImportWizard() {
  const [step, setStep] = useState<'setup' | 'connect' | 'import' | 'complete'>('setup');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const queryClient = useQueryClient();

  const redirectUri = `${window.location.origin}/import?source=gmail`;

  // Check existing connection
  const { data: gmailConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['gmail-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('gmail_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const source = urlParams.get('source');
    
    if (code && source === 'gmail') {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, '', '/import');
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      // Get stored credentials
      const storedClientId = localStorage.getItem('gmail_client_id');
      const storedClientSecret = localStorage.getItem('gmail_client_secret');
      
      if (!storedClientId || !storedClientSecret) {
        toast.error('Missing OAuth credentials. Please reconfigure.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('gmail-oauth', {
        body: {
          action: 'exchange',
          code,
          clientId: storedClientId,
          clientSecret: storedClientSecret,
          redirectUri,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Connected to Gmail: ${response.data.email}`);
      queryClient.invalidateQueries({ queryKey: ['gmail-config'] });
      setStep('import');
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`);
    }
  };

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!clientId || !clientSecret) {
        throw new Error('Please enter your Google OAuth credentials');
      }

      // Store credentials temporarily
      localStorage.setItem('gmail_client_id', clientId);
      localStorage.setItem('gmail_client_secret', clientSecret);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('gmail-oauth', {
        body: {
          action: 'get_auth_url',
          clientId,
          redirectUri,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Redirect to Google OAuth
      window.location.href = response.data.authUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('import-gmail-contacts', {});

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} contacts`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['gmail-config'] });
      setStep('complete');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'revoke' },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
    },
    onSuccess: () => {
      toast.success('Disconnected from Gmail');
      localStorage.removeItem('gmail_client_id');
      localStorage.removeItem('gmail_client_secret');
      queryClient.invalidateQueries({ queryKey: ['gmail-config'] });
      setStep('setup');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoadingConfig) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Already connected
  if (gmailConfig) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Gmail Connected</CardTitle>
                <CardDescription>{gmailConfig.email}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last Sync:</span>
              <p className="font-medium">
                {gmailConfig.last_sync_at 
                  ? new Date(gmailConfig.last_sync_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Contacts Synced:</span>
              <p className="font-medium">{gmailConfig.contacts_synced || 0}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              className="flex-1"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import Contacts
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {importMutation.data && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Imported {importMutation.data.imported} contacts, 
                skipped {importMutation.data.skipped} duplicates
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle>Import Gmail Contacts</CardTitle>
            <CardDescription>
              Connect your Google account to import contacts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To import Gmail contacts, you need to set up Google OAuth credentials in the 
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">
              Google Cloud Console
            </a>
          </AlertDescription>
        </Alert>

        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => setShowConfig(!showConfig)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {showConfig ? 'Hide' : 'Configure'} OAuth Credentials
        </Button>

        {showConfig && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="your-client-id.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Your client secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Redirect URI (add this to Google Console)</Label>
              <code className="block p-2 bg-muted rounded text-sm break-all">
                {redirectUri}
              </code>
            </div>

            <Button 
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || !clientId || !clientSecret}
              className="w-full"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
