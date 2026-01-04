import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Mail, Phone, Linkedin, Twitter, Globe, Loader2, MessageCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { WhatsAppQuickAction } from '@/components/whatsapp/WhatsAppQuickAction';

type ContactMethod = Tables<'contact_methods'>;

const contactTypes = ['email', 'phone', 'linkedin', 'twitter', 'facebook', 'instagram', 'website', 'other'] as const;

interface ContactMethodsManagerProps {
  profileId: string;
  contactMethods: ContactMethod[];
}

export function ContactMethodsManager({ profileId, contactMethods }: ContactMethodsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    contact_type: 'email' as typeof contactTypes[number],
    value: '',
    label: '',
    is_primary: false,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('contact_methods').insert({
        profile_id: profileId,
        contact_type: data.contact_type,
        value: data.value,
        label: data.label || null,
        is_primary: data.is_primary,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-methods', profileId] });
      toast({ title: 'Contact method added' });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-methods', profileId] });
      toast({ title: 'Contact method removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      contact_type: 'email',
      value: '',
      label: '',
      is_primary: false,
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value.trim()) {
      toast({ title: 'Error', description: 'Value is required', variant: 'destructive' });
      return;
    }
    addMutation.mutate(formData);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Contact Methods</Label>
        <Button variant="ghost" size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {contactMethods.length > 0 ? (
        <div className="space-y-2">
          {contactMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group">
              <div className="flex items-center gap-3">
                {getIcon(method.contact_type)}
                <div>
                  <p className="text-sm font-medium">{method.value}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {method.label || method.contact_type}
                    {method.is_primary && ' • Primary'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {method.contact_type === 'phone' && (
                  <WhatsAppQuickAction 
                    phoneNumber={method.value} 
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMutation.mutate(method.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          No contact methods added
        </p>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Contact Method</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.contact_type}
                onValueChange={(value: typeof contactTypes[number]) => 
                  setFormData({ ...formData, contact_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contactTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Value *</Label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.contact_type === 'email' ? 'name@example.com' : 
                             formData.contact_type === 'phone' ? '+1 (555) 123-4567' :
                             'Enter value'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Work, Personal, etc."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
