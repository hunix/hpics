import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFormDraft } from '@/hooks/reliability/useFormDraft';
import { AutoSaveIndicator } from '@/components/reliability/AutoSaveIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  CheckCircle2, 
  Loader2, 
  Download,
  Trash2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface GmailDraftData {
  step: 'setup' | 'connect' | 'import' | 'complete';
  [key: string]: unknown;
}

export function GmailImportWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'connect' | 'import' | 'complete'>('setup');
  const [showConfig, setShowConfig] = useState(false);
  const queryClient = useQueryClient();

  const redirectUri = `${window.location.origin}/import?source=gmail`;

  // Form draft for auto-save/recovery
  const {
    data: draftData,
    hasDraft,
    isSaving,
    lastSaved,
    setData: updateData,
    restoreDraft,
    discardDraft,
  } = useFormDraft<GmailDraftData>({
    formType: 'gmail_import',
    formKey: user?.id || 'anonymous',
    debounceMs: 1000,
    expiryDays: 7,
  });

  // Sync step changes to draft
  useEffect(() => {
    if (step !== 'setup') {
      updateData({ step });
    }
  }, [step, updateData]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    restoreDraft();
    if (draftData?.step) {
      setStep(draftData.step);
    }
    toast.success('Draft restored');
  };

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      // Exchange code for tokens using server-side secrets
      const response = await supabase.functions.invoke('gmail-oauth', {
        body: {
          action: 'exchange',
          code,
          redirectUri,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Connected to Gmail: ${response.data.email}`);
      queryClient.invalidateQueries({ queryKey: ['gmail-config'] });
      setStep('import');
    } catch (error) {
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get auth URL using server-side credentials
      const response = await supabase.functions.invoke('gmail-oauth', {
        body: {
          action: 'get_auth_url',
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

  // Draft recovery banner
  const DraftBanner = () => hasDraft && step === 'setup' ? (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <RotateCcw className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>You have an unsaved import session. Would you like to restore it?</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={discardDraft}>
            Discard
          </Button>
          <Button size="sm" onClick={handleRestoreDraft}>
            Restore
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  ) : null;

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
    <>
      <DraftBanner />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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
            <AutoSaveIndicator 
              status={isSaving ? 'saving' : hasDraft ? 'saved' : 'idle'} 
              lastSaved={lastSaved || undefined} 
            />
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gmail integration uses server-side OAuth credentials configured by your administrator.
            Click below to connect your Gmail account securely.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Redirect URI for Google Console:</p>
          <code className="block p-2 bg-muted rounded text-sm break-all">
            {redirectUri}
          </code>
        </div>

        <Button 
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
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
      </CardContent>
    </Card>
    </>
  );
}
