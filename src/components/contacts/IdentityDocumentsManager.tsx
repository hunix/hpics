import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, CreditCard, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface IdentityDocumentsManagerProps {
  profileId: string;
}

const DOCUMENT_TYPES = ['Passport', 'National ID', 'Driver License', 'Residence Permit', 'Visa', 'Other'];

export function IdentityDocumentsManager({ profileId }: IdentityDocumentsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNumbers, setShowNumbers] = useState<Record<string, boolean>>({});
  const [newDoc, setNewDoc] = useState({
    document_type: '',
    document_number: '',
    issuing_country: '',
    expiry_date: '',
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['contact-identity-documents', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_identity_documents')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newDoc) => {
      const { error } = await supabase.from('contact_identity_documents').insert({
        profile_id: profileId,
        user_id: user!.id,
        document_type: data.document_type,
        document_number: data.document_number || null,
        issuing_country: data.issuing_country || null,
        expiry_date: data.expiry_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-identity-documents', profileId] });
      setNewDoc({ document_type: '', document_number: '', issuing_country: '', expiry_date: '' });
      toast({ title: 'Document added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_identity_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-identity-documents', profileId] });
      toast({ title: 'Document removed' });
    },
  });

  const maskNumber = (num: string) => {
    if (num.length <= 4) return num;
    return '•'.repeat(num.length - 4) + num.slice(-4);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Identity Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {documents && documents.length > 0 && (
              <div className="grid gap-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {doc.document_type}
                          {doc.issuing_country && <span className="text-sm text-muted-foreground">({doc.issuing_country})</span>}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {doc.document_number && (
                            <>
                              <span>{showNumbers[doc.id] ? doc.document_number : maskNumber(doc.document_number)}</span>
                              <button onClick={() => setShowNumbers(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}>
                                {showNumbers[doc.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </>
                          )}
                          {doc.expiry_date && (
                            <span className={new Date(doc.expiry_date) < new Date() ? 'text-destructive' : ''}>
                              Exp: {format(new Date(doc.expiry_date), 'MMM yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(doc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newDoc.document_type} onValueChange={(v) => setNewDoc({ ...newDoc, document_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number</Label>
                <Input
                  value={newDoc.document_number}
                  onChange={(e) => setNewDoc({ ...newDoc, document_number: e.target.value })}
                  placeholder="Document number"
                />
              </div>
              <div className="space-y-2">
                <Label>Issuing Country</Label>
                <Input
                  value={newDoc.issuing_country}
                  onChange={(e) => setNewDoc({ ...newDoc, issuing_country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={newDoc.expiry_date}
                  onChange={(e) => setNewDoc({ ...newDoc, expiry_date: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newDoc)}
                  disabled={!newDoc.document_type || addMutation.isPending}
                  size="sm"
                >
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
