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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Receipt, Edit2, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FinancialHistoryManagerProps {
  profileId: string;
}

interface FinancialTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  reference_number: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
}

const transactionTypes = [
  { value: 'sent', label: 'Money Sent', icon: ArrowUpRight, color: 'text-red-500' },
  { value: 'received', label: 'Money Received', icon: ArrowDownLeft, color: 'text-green-500' },
  { value: 'loan_given', label: 'Loan Given', icon: TrendingUp, color: 'text-orange-500' },
  { value: 'loan_received', label: 'Loan Received', icon: TrendingDown, color: 'text-blue-500' },
  { value: 'investment', label: 'Investment', icon: TrendingUp, color: 'text-purple-500' },
  { value: 'gift_given', label: 'Gift Given', icon: ArrowUpRight, color: 'text-pink-500' },
  { value: 'gift_received', label: 'Gift Received', icon: ArrowDownLeft, color: 'text-pink-500' },
  { value: 'repayment', label: 'Repayment', icon: ArrowDownLeft, color: 'text-green-600' },
  { value: 'other', label: 'Other', icon: Receipt, color: 'text-muted-foreground' },
];

const paymentMethods = [
  'Bank Transfer',
  'Cash',
  'PayPal',
  'Wamad',
  'CliQ',
  'Check',
  'Credit Card',
  'Cryptocurrency',
  'Wire Transfer',
  'Other',
];

const statuses = ['pending', 'completed', 'cancelled'];
const currencies = ['USD', 'EUR', 'GBP', 'KWD', 'JOD', 'AED', 'SAR', 'EGP', 'INR'];

export function FinancialHistoryManager({ profileId }: FinancialHistoryManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [formData, setFormData] = useState({
    transaction_type: '',
    amount: '',
    currency: 'USD',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: '',
    status: 'completed',
    notes: '',
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['financial-history', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_financial_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!profileId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
      };
      if (editingTransaction) {
        const { error } = await supabase
          .from('contact_financial_history')
          .update(payload)
          .eq('id', editingTransaction.id);
        if (error) throw error;
      } else {
        if (!user?.id) throw new Error('not authenticated');
        const { error } = await supabase
          .from('contact_financial_history')
          .insert({
            ...payload,
            profile_id: profileId,
            user_id: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-history', profileId] });
      toast.success(editingTransaction ? 'Transaction updated' : 'Transaction added');
      resetForm();
    },
    onError: () => toast.error('Failed to save transaction'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_financial_history')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-history', profileId] });
      toast.success('Transaction deleted');
    },
    onError: () => toast.error('Failed to delete transaction'),
  });

  const resetForm = () => {
    setFormData({
      transaction_type: '',
      amount: '',
      currency: 'USD',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      reference_number: '',
      status: 'completed',
      notes: '',
    });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (tx: FinancialTransaction) => {
    setEditingTransaction(tx);
    setFormData({
      transaction_type: tx.transaction_type,
      amount: tx.amount.toString(),
      currency: tx.currency,
      description: tx.description || '',
      transaction_date: tx.transaction_date,
      payment_method: tx.payment_method || '',
      reference_number: tx.reference_number || '',
      status: tx.status || 'completed',
      notes: tx.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transaction_type || !formData.amount || !formData.transaction_date) {
      toast.error('Type, amount, and date are required');
      return;
    }
    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    saveMutation.mutate(formData);
  };

  const getTypeInfo = (type: string) => {
    return transactionTypes.find(t => t.value === type) || transactionTypes[transactionTypes.length - 1];
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // Calculate summary
  const summary = transactions?.reduce(
    (acc, tx) => {
      if (['sent', 'loan_given', 'gift_given'].includes(tx.transaction_type)) {
        acc.totalOut += tx.amount;
      } else if (['received', 'loan_received', 'gift_received', 'repayment'].includes(tx.transaction_type)) {
        acc.totalIn += tx.amount;
      }
      return acc;
    },
    { totalIn: 0, totalOut: 0 }
  ) || { totalIn: 0, totalOut: 0 };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading financial history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Financial History
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Transaction Type *</Label>
                <Select value={formData.transaction_type || undefined} onValueChange={(v) => setFormData({ ...formData, transaction_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
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
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was this for?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.payment_method || undefined} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m} value={m.toLowerCase().replace(' ', '_')}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Reference Number</Label>
                <Input
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                />
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

      {transactions && transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-xl font-bold text-green-600">{formatAmount(summary.totalIn, 'USD')}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-xl font-bold text-red-600">{formatAmount(summary.totalOut, 'USD')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const typeInfo = getTypeInfo(tx.transaction_type);
            const Icon = typeInfo.icon;
            return (
              <Card key={tx.id}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                      <span>{typeInfo.label}</span>
                      {tx.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                      {tx.status === 'cancelled' && <Badge variant="destructive">Cancelled</Badge>}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${['sent', 'loan_given', 'gift_given'].includes(tx.transaction_type) ? 'text-red-500' : 'text-green-500'}`}>
                        {['sent', 'loan_given', 'gift_given'].includes(tx.transaction_type) ? '-' : '+'}
                        {formatAmount(tx.amount, tx.currency)}
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(tx)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(tx.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 text-sm space-y-1">
                  <p className="text-muted-foreground">{format(new Date(tx.transaction_date), 'PPP')}</p>
                  {tx.description && <p>{tx.description}</p>}
                  {tx.payment_method && <p><span className="text-muted-foreground">Method:</span> {tx.payment_method}</p>}
                  {tx.reference_number && <p><span className="text-muted-foreground">Ref:</span> {tx.reference_number}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No financial transactions recorded yet.</p>
      )}
    </div>
  );
}
