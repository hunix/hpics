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
import { Plus, Trash2, Building2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface BankAccountsManagerProps {
  profileId: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string | null;
  account_number: string | null;
  iban: string | null;
  swift_code: string | null;
  branch_name: string | null;
  branch_code: string | null;
  currency: string | null;
  account_type: string | null;
  is_primary: boolean | null;
  country: string | null;
  notes: string | null;
}

const accountTypes = ['Checking', 'Savings', 'Business', 'Investment', 'Other'];
const currencies = ['USD', 'EUR', 'GBP', 'KWD', 'JOD', 'AED', 'SAR', 'EGP', 'INR', 'Other'];

export function BankAccountsManager({ profileId }: BankAccountsManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    iban: '',
    swift_code: '',
    branch_name: '',
    branch_code: '',
    currency: 'USD',
    account_type: '',
    is_primary: false,
    country: '',
    notes: '',
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['bank-accounts', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_bank_accounts')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!profileId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingAccount) {
        const { error } = await supabase
          .from('contact_bank_accounts')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAccount.id);
        if (error) throw error;
      } else {
        if (!user?.id) throw new Error('not authenticated');
        const { error } = await supabase
          .from('contact_bank_accounts')
          .insert({
            ...data,
            profile_id: profileId,
            user_id: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', profileId] });
      toast.success(editingAccount ? 'Bank account updated' : 'Bank account added');
      resetForm();
    },
    onError: () => toast.error('Failed to save bank account'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_bank_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts', profileId] });
      toast.success('Bank account deleted');
    },
    onError: () => toast.error('Failed to delete bank account'),
  });

  const resetForm = () => {
    setFormData({
      bank_name: '',
      account_holder_name: '',
      account_number: '',
      iban: '',
      swift_code: '',
      branch_name: '',
      branch_code: '',
      currency: 'USD',
      account_type: '',
      is_primary: false,
      country: '',
      notes: '',
    });
    setEditingAccount(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_holder_name: account.account_holder_name || '',
      account_number: account.account_number || '',
      iban: account.iban || '',
      swift_code: account.swift_code || '',
      branch_name: account.branch_name || '',
      branch_code: account.branch_code || '',
      currency: account.currency || 'USD',
      account_type: account.account_type || '',
      is_primary: account.is_primary || false,
      country: account.country || '',
      notes: account.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_name.trim()) {
      toast.error('Bank name is required');
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading bank accounts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Accounts
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Bank Name *</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g., National Bank of Kuwait"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>IBAN</Label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="e.g., KW00..."
                  />
                </div>
                <div>
                  <Label>SWIFT/BIC Code</Label>
                  <Input
                    value={formData.swift_code}
                    onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={formData.account_type || undefined} onValueChange={(v) => setFormData({ ...formData, account_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((t) => (
                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Branch Name</Label>
                  <Input
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Branch Code</Label>
                  <Input
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={formData.is_primary}
                    onCheckedChange={(c) => setFormData({ ...formData, is_primary: c })}
                  />
                  <Label>Primary Account</Label>
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
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
                    {account.bank_name}
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
                {account.account_holder_name && <p><span className="text-muted-foreground">Holder:</span> {account.account_holder_name}</p>}
                {account.account_number && <p><span className="text-muted-foreground">Account:</span> {account.account_number}</p>}
                {account.iban && <p><span className="text-muted-foreground">IBAN:</span> {account.iban}</p>}
                {account.swift_code && <p><span className="text-muted-foreground">SWIFT:</span> {account.swift_code}</p>}
                {account.currency && <p><span className="text-muted-foreground">Currency:</span> {account.currency}</p>}
                {account.country && <p><span className="text-muted-foreground">Country:</span> {account.country}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No bank accounts added yet.</p>
      )}
    </div>
  );
}
