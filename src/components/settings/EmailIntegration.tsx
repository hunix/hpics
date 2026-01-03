import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, RefreshCw, Trash2, Plus, Calendar, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type EmailAccount = {
  id: string;
  provider: string;
  email: string;
  display_name: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_enabled: boolean;
};

export function EmailIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [provider, setProvider] = useState<'gmail' | 'outlook'>('gmail');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EmailAccount[];
    },
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      // Simulated OAuth connection - in production, this would redirect to OAuth flow
      const { error } = await supabase.from('email_accounts').insert({
        user_id: user!.id,
        provider,
        email,
        display_name: displayName || null,
        is_connected: true, // Simulated - would be set after OAuth success
        last_sync_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast({ title: 'Email account connected (Demo Mode)' });
      setDialogOpen(false);
      setEmail('');
      setDisplayName('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (accountId: string) => {
      // Simulated sync - would call edge function to sync emails
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { error } = await supabase
        .from('email_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast({ title: 'Emails synced (Demo Mode)', description: 'In production, this would sync real emails from your account.' });
    },
    onError: (error) => {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    },
  });

  const toggleSyncMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('email_accounts')
        .update({ sync_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      toast({ title: 'Email account removed' });
    },
  });

  const getProviderIcon = (provider: string) => {
    if (provider === 'gmail') {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
          <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
          <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
          <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#0078D4" d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
      </svg>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Integration
          <Badge variant="secondary" className="ml-2">Demo</Badge>
        </CardTitle>
        <CardDescription>
          Connect your email accounts to automatically log communications with your contacts.
          <span className="block text-xs mt-1 text-muted-foreground/70">
            This is a simulated demo. In production, OAuth integration would sync real emails.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getProviderIcon(account.provider)}
                  <div>
                    <p className="font-medium">{account.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.display_name || account.provider}
                      {account.last_sync_at && (
                        <span className="ml-2">
                          · Last synced {new Date(account.last_sync_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={account.sync_enabled}
                    onCheckedChange={(enabled) =>
                      toggleSyncMutation.mutate({ id: account.id, enabled })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => syncMutation.mutate(account.id)}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(account.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No email accounts connected</p>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Connect Email Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Email Account</DialogTitle>
              <DialogDescription>
                Connect your Gmail or Outlook account to automatically sync emails with your contacts.
                <span className="block mt-1 text-xs">(Demo mode - no actual OAuth connection)</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as 'gmail' | 'outlook')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">
                      <div className="flex items-center gap-2">
                        {getProviderIcon('gmail')}
                        Gmail
                      </div>
                    </SelectItem>
                    <SelectItem value="outlook">
                      <div className="flex items-center gap-2">
                        {getProviderIcon('outlook')}
                        Outlook
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name (optional)</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Work Email"
                />
              </div>
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={!email || connectMutation.isPending}
                className="w-full"
              >
                {connectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Connect Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Calendar sync coming soon - sync events from Google Calendar & Outlook Calendar
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
