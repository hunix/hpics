import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Wallet, Edit2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentAccountsManagerProps {
  profileId: string;
}

interface PaymentAccount {
  id: string;
  platform: string;
  account_identifier: string;
  account_holder_name: string | null;
  currency: string | null;
  country: string | null;
  is_verified: boolean | null;
  is_primary: boolean | null;
  notes: string | null;
}

const platforms = [
  { value: 'paypal', label: 'PayPal' },
  { value: 'wamad', label: 'Wamad (Kuwait)' },
  { value: 'click', label: 'CliQ (Jordan)' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'stcpay', label: 'STC Pay (Saudi)' },
  { value: 'applepay', label: 'Apple Pay' },
  { value: 'googlepay', label: 'Google Pay' },
  { value: 'wise', label: 'Wise (TransferWise)' },
  { value: 'skrill', label: 'Skrill' },
  { value: 'payoneer', label: 'Payoneer' },
  { value: 'western_union', label: 'Western Union' },
  { value: 'moneygram', label: 'MoneyGram' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
];

export function PaymentAccountsManager({ profileId }: PaymentAccountsManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [formData, setFormData] = useState({
    platform: '',
    account_identifier: '',
    account_holder_name: '',
    currency: '',
    country: '',
    is_verified: false,
    is_primary: false,
    notes: '',
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['payment-accounts', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_payment_accounts')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data as PaymentAccount[];
    },
    enabled: !!profileId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingAccount) {
        const { error } = await supabase
          .from('contact_payment_accounts')
          .update(data)
          .eq('id', editingAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_payment_accounts')
          .insert({
            ...data,
            profile_id: profileId,
            user_id: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-accounts', profileId] });
      toast.success(editingAccount ? 'Payment account updated' : 'Payment account added');
      resetForm();
    },
    onError: () => toast.error('Failed to save payment account'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_payment_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-accounts', profileId] });
      toast.success('Payment account deleted');
    },
    onError: () => toast.error('Failed to delete payment account'),
  });

  const resetForm = () => {
    setFormData({
      platform: '',
      account_identifier: '',
      account_holder_name: '',
      currency: '',
      country: '',
      is_verified: false,
      is_primary: false,
      notes: '',
    });
    setEditingAccount(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (account: PaymentAccount) => {
    setEditingAccount(account);
    setFormData({
      platform: account.platform,
      account_identifier: account.account_identifier,
      account_holder_name: account.account_holder_name || '',
      currency: account.currency || '',
      country: account.country || '',
      is_verified: account.is_verified || false,
      is_primary: account.is_primary || false,
      notes: account.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.platform || !formData.account_identifier.trim()) {
      toast.error('Platform and account identifier are required');
      return;
    }
    saveMutation.mutate(formData);
  };

  const getPlatformLabel = (value: string) => {
    return platforms.find(p => p.value === value)?.label || value;
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading payment accounts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Digital Payment Accounts
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Payment Account' : 'Add Payment Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Platform *</Label>
                <Select value={formData.platform || undefined} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account Identifier *</Label>
                <Input
                  value={formData.account_identifier}
                  onChange={(e) => setFormData({ ...formData, account_identifier: e.target.value })}
                  placeholder="Email, phone, or username"
                />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="e.g., USD"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_verified}
                    onCheckedChange={(c) => setFormData({ ...formData, is_verified: c })}
                  />
                  <Label>Verified</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_primary}
                    onCheckedChange={(c) => setFormData({ ...formData, is_primary: c })}
                  />
                  <Label>Primary</Label>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className={account.is_primary ? 'border-primary' : ''}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getPlatformLabel(account.platform)}
                    {account.is_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {account.is_primary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Primary</span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(account)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(account.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm space-y-1">
                <p><span className="text-muted-foreground">ID:</span> {account.account_identifier}</p>
                {account.account_holder_name && <p><span className="text-muted-foreground">Name:</span> {account.account_holder_name}</p>}
                {account.currency && <p><span className="text-muted-foreground">Currency:</span> {account.currency}</p>}
                {account.country && <p><span className="text-muted-foreground">Country:</span> {account.country}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No payment accounts added yet.</p>
      )}
    </div>
  );
}
