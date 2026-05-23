import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Loader2, 
  Download,
  AlertCircle,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export function OutlookContactsImport() {
  const queryClient = useQueryClient();

  // Check if Outlook is connected
  const { data: outlookConfig, isLoading } = useQuery({
    queryKey: ['outlook-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'outlook')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Check email account for last sync
  const { data: emailAccount } = useQuery({
    queryKey: ['email-account-outlook'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'outlook')
        .maybeSingle();
      
      return data;
    },
  });

  // Get last import session
  const { data: lastImport } = useQuery({
    queryKey: ['last-import-outlook'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('import_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('source', 'outlook')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await invokeFunction('import-outlook-contacts');

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} contacts from Outlook`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['last-import-outlook'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!outlookConfig) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Outlook Contacts</CardTitle>
              <CardDescription>Import contacts from Outlook</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your Outlook account first in Settings → Integrations → Outlook
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Outlook Contacts</CardTitle>
              <CardDescription>{emailAccount?.email || 'Connected'}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastImport && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last Import:</span>
              <p className="font-medium">
                {new Date(lastImport.completed_at || lastImport.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Imported:</span>
              <p className="font-medium">{lastImport.imported_items || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Skipped:</span>
              <p className="font-medium">{lastImport.skipped_items || 0}</p>
            </div>
          </div>
        )}

        <Button 
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending}
          className="w-full"
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing Contacts...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Import Outlook Contacts
            </>
          )}
        </Button>

        {importMutation.data && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Successfully imported {importMutation.data.imported} contacts, 
              skipped {importMutation.data.skipped} duplicates
              {importMutation.data.errors > 0 && ` (${importMutation.data.errors} errors)`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
