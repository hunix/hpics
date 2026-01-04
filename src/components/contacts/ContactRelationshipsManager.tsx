import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Users, ArrowRight, Link2 } from 'lucide-react';
import { 
  RELATIONSHIP_DEFINITIONS, 
  RELATIONSHIP_TYPE_COLORS,
  getRelationshipDefinition,
  getRelationshipsByType 
} from '@/lib/relationshipDefinitions';
import { useNavigate } from 'react-router-dom';

interface ContactRelationshipsManagerProps {
  profileId: string;
  contactName: string;
}

interface ContactRelationship {
  id: string;
  user_id: string;
  from_profile_id: string;
  to_profile_id: string;
  relationship_type: string;
  relationship_label: string;
  is_bidirectional: boolean;
  inverse_label: string | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface ProfileBasic {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

export function ContactRelationshipsManager({ profileId, contactName }: ContactRelationshipsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'family' | 'professional' | 'social' | 'custom'>('family');
  const [newRelationship, setNewRelationship] = useState({
    to_profile_id: '',
    relationship_label: '',
    notes: '',
  });

  // Fetch all contacts for selection
  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-relations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user!.id)
        .neq('id', profileId)
        .order('first_name');
      if (error) throw error;
      return data as ProfileBasic[];
    },
    enabled: !!user,
  });

  // Fetch relationships where this contact is the "from" side
  const { data: outgoingRelations, isLoading: loadingOutgoing } = useQuery({
    queryKey: ['contact-relationships-outgoing', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_relationships')
        .select('*')
        .eq('from_profile_id', profileId);
      if (error) throw error;
      return data as ContactRelationship[];
    },
  });

  // Fetch relationships where this contact is the "to" side
  const { data: incomingRelations, isLoading: loadingIncoming } = useQuery({
    queryKey: ['contact-relationships-incoming', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_relationships')
        .select('*')
        .eq('to_profile_id', profileId);
      if (error) throw error;
      return data as ContactRelationship[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newRelationship) => {
      const definition = getRelationshipDefinition(data.relationship_label);
      if (!definition) throw new Error('Invalid relationship type');

      const { error } = await supabase.from('contact_relationships').insert({
        user_id: user!.id,
        from_profile_id: profileId,
        to_profile_id: data.to_profile_id,
        relationship_type: definition.type,
        relationship_label: data.relationship_label,
        is_bidirectional: definition.isBidirectional,
        inverse_label: definition.inverseLabel,
        notes: data.notes || null,
      });
      if (error) throw error;

      // If bidirectional, create the reverse relationship too
      if (definition.isBidirectional) {
        await supabase.from('contact_relationships').insert({
          user_id: user!.id,
          from_profile_id: data.to_profile_id,
          to_profile_id: profileId,
          relationship_type: definition.type,
          relationship_label: data.relationship_label,
          is_bidirectional: true,
          inverse_label: definition.inverseLabel,
          notes: data.notes || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-outgoing', profileId] });
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-incoming', profileId] });
      setNewRelationship({ to_profile_id: '', relationship_label: '', notes: '' });
      toast({ title: 'Relationship added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, isBidirectional, toProfileId, label }: { id: string; isBidirectional: boolean; toProfileId: string; label: string }) => {
      const { error } = await supabase.from('contact_relationships').delete().eq('id', id);
      if (error) throw error;

      // If bidirectional, delete the reverse relationship too
      if (isBidirectional) {
        await supabase
          .from('contact_relationships')
          .delete()
          .eq('from_profile_id', toProfileId)
          .eq('to_profile_id', profileId)
          .eq('relationship_label', label);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-outgoing', profileId] });
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-incoming', profileId] });
      toast({ title: 'Relationship removed' });
    },
  });

  const getContactName = (id: string) => {
    const contact = contacts?.find(c => c.id === id);
    return contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : 'Unknown';
  };

  const isLoading = loadingOutgoing || loadingIncoming;
  const availableLabels = getRelationshipsByType(selectedType);

  // Combine outgoing and incoming for display
  const allRelationships = [
    ...(outgoingRelations || []).map(r => ({ ...r, direction: 'outgoing' as const })),
    ...(incomingRelations || []).filter(r => !r.is_bidirectional).map(r => ({ ...r, direction: 'incoming' as const })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Relationships with Other Contacts
        </CardTitle>
        <CardDescription>
          Link {contactName} to other contacts to build family trees and professional networks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {allRelationships.length > 0 && (
              <div className="grid gap-2">
                {allRelationships.map((rel) => {
                  const definition = getRelationshipDefinition(rel.relationship_label);
                  const otherProfileId = rel.direction === 'outgoing' ? rel.to_profile_id : rel.from_profile_id;
                  const displayLabel = rel.direction === 'outgoing' 
                    ? definition?.label || rel.relationship_label
                    : rel.inverse_label || definition?.inverseLabel || rel.relationship_label;
                  
                  return (
                    <div key={rel.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={RELATIONSHIP_TYPE_COLORS[rel.relationship_type]}>
                          {rel.relationship_type}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contactName}</span>
                          <span className="text-muted-foreground">is</span>
                          <Badge variant="outline">{displayLabel}</Badge>
                          <span className="text-muted-foreground">of</span>
                          <button 
                            onClick={() => navigate(`/contacts/${otherProfileId}`)}
                            className="font-medium text-primary hover:underline"
                          >
                            {getContactName(otherProfileId)}
                          </button>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate({ 
                          id: rel.id, 
                          isBidirectional: rel.is_bidirectional, 
                          toProfileId: rel.to_profile_id,
                          label: rel.relationship_label 
                        })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {allRelationships.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No relationships defined yet. Add one below.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedType} onValueChange={(v) => {
                  setSelectedType(v as any);
                  setNewRelationship({ ...newRelationship, relationship_label: '' });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{contactName} is the...</Label>
                <Select 
                  value={newRelationship.relationship_label} 
                  onValueChange={(v) => setNewRelationship({ ...newRelationship, relationship_label: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLabels.map((rel) => (
                      <SelectItem key={rel.value} value={rel.value}>{rel.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>...of</Label>
                <Select 
                  value={newRelationship.to_profile_id} 
                  onValueChange={(v) => setNewRelationship({ ...newRelationship, to_profile_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="e.g., Maternal side"
                  value={newRelationship.notes}
                  onChange={(e) => setNewRelationship({ ...newRelationship, notes: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newRelationship)}
                  disabled={!newRelationship.to_profile_id || !newRelationship.relationship_label || addMutation.isPending}
                  className="w-full"
                >
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Relationship
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
