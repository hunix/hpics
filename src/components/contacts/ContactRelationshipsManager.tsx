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
import { Loader2, Plus, Trash2, Link2, Sparkles } from 'lucide-react';
import { ContactPicker } from './ContactPicker';
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
  is_inferred?: boolean;
}

interface ProfileBasic {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

// Map labels to their proper inverse
const INVERSE_LABEL_MAP: Record<string, string> = {
  'father': 'child',
  'mother': 'child',
  'parent': 'child',
  'son': 'parent',
  'daughter': 'parent',
  'child': 'parent',
  'brother': 'sibling',
  'sister': 'sibling',
  'sibling': 'sibling',
  'spouse': 'spouse',
  'husband': 'wife',
  'wife': 'husband',
  'grandfather': 'grandchild',
  'grandmother': 'grandchild',
  'grandparent': 'grandchild',
  'grandson': 'grandparent',
  'granddaughter': 'grandparent',
  'grandchild': 'grandparent',
  'uncle': 'nephew',
  'aunt': 'niece',
  'nephew': 'uncle',
  'niece': 'aunt',
  'cousin': 'cousin',
  'stepfather': 'stepchild',
  'stepmother': 'stepchild',
  'stepson': 'stepparent',
  'stepdaughter': 'stepparent',
  'stepsibling': 'stepsibling',
  'ex-spouse': 'ex-spouse',
  'father-in-law': 'child-in-law',
  'mother-in-law': 'child-in-law',
  'son-in-law': 'parent-in-law',
  'daughter-in-law': 'parent-in-law',
  'brother-in-law': 'sibling-in-law',
  'sister-in-law': 'sibling-in-law',
};

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

  // Fetch all contacts for selection (with pagination)
  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-relations', user?.id, profileId],
    queryFn: async () => {
      const allProfiles: ProfileBasic[] = [];
      const pageSize = 1000;
      let page = 0;

      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('user_id', user!.id)
          .neq('id', profileId)
          .order('first_name')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allProfiles.push(...data);
        if (data.length < pageSize) break;
        page++;
      }
      return allProfiles;
    },
    enabled: !!user,
  });

  // Fetch relationships where this contact is the "from" side (explicit only)
  const { data: outgoingRelations, isLoading: loadingOutgoing } = useQuery({
    queryKey: ['contact-relationships-outgoing', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_relationships')
        .select('*')
        .eq('from_profile_id', profileId)
        .or('is_inferred.is.null,is_inferred.eq.false');
      if (error) throw error;
      return data as ContactRelationship[];
    },
  });

  // Fetch relationships where this contact is the "to" side (explicit only)
  const { data: incomingRelations, isLoading: loadingIncoming } = useQuery({
    queryKey: ['contact-relationships-incoming', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_relationships')
        .select('*')
        .eq('to_profile_id', profileId)
        .or('is_inferred.is.null,is_inferred.eq.false');
      if (error) throw error;
      return data as ContactRelationship[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newRelationship) => {
      const definition = getRelationshipDefinition(data.relationship_label);
      if (!definition) throw new Error('Invalid relationship type');

      // Create the primary relationship
      const { error } = await supabase.from('contact_relationships').insert({
        user_id: user!.id,
        from_profile_id: profileId,
        to_profile_id: data.to_profile_id,
        relationship_type: definition.type,
        relationship_label: data.relationship_label,
        is_bidirectional: definition.isBidirectional,
        inverse_label: definition.inverseLabel,
        notes: data.notes || null,
        is_inferred: false,
      });
      if (error) throw error;

      // Always create the inverse relationship for proper traversal
      const inverseLabel = INVERSE_LABEL_MAP[data.relationship_label] || data.relationship_label;
      await supabase.from('contact_relationships').insert({
        user_id: user!.id,
        from_profile_id: data.to_profile_id,
        to_profile_id: profileId,
        relationship_type: definition.type,
        relationship_label: inverseLabel,
        is_bidirectional: definition.isBidirectional,
        inverse_label: data.relationship_label,
        notes: data.notes || null,
        is_inferred: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-outgoing', profileId] });
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-incoming', profileId] });
      queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
      setNewRelationship({ to_profile_id: '', relationship_label: '', notes: '' });
      toast({ title: 'Relationship added with inverse link' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, toProfileId, label }: { id: string; toProfileId: string; label: string }) => {
      // Delete the primary relationship
      const { error } = await supabase.from('contact_relationships').delete().eq('id', id);
      if (error) throw error;

      // Delete the inverse relationship
      const inverseLabel = INVERSE_LABEL_MAP[label] || label;
      await supabase
        .from('contact_relationships')
        .delete()
        .eq('from_profile_id', toProfileId)
        .eq('to_profile_id', profileId)
        .eq('relationship_label', inverseLabel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-outgoing', profileId] });
      queryClient.invalidateQueries({ queryKey: ['contact-relationships-incoming', profileId] });
      queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
      toast({ title: 'Relationship removed' });
    },
  });

  const getContactName = (id: string) => {
    const contact = contacts?.find(c => c.id === id);
    return contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : 'Unknown';
  };

  const isLoading = loadingOutgoing || loadingIncoming;
  const availableLabels = getRelationshipsByType(selectedType);

  // Only show outgoing relationships to avoid duplicates from inverse links
  const displayRelationships = outgoingRelations || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Family & Connections
        </CardTitle>
        <CardDescription>
          Link {contactName} to other contacts. Inverse relationships are auto-created, and sibling/grandparent connections are inferred in the Family Tree.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {displayRelationships.length > 0 && (
              <div className="grid gap-2">
                {displayRelationships.map((rel) => {
                  const definition = getRelationshipDefinition(rel.relationship_label);
                  const displayLabel = definition?.label || rel.relationship_label;
                  const otherProfileId = rel.to_profile_id;
                  
                  return (
                    <div key={rel.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={RELATIONSHIP_TYPE_COLORS[rel.relationship_type]}>
                          {rel.relationship_type}
                        </Badge>
                        <div className="flex items-center gap-2 flex-wrap">
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

            {displayRelationships.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No relationships defined yet.</p>
                <p className="text-xs mt-1">Add family connections below. Siblings and grandparents will be auto-inferred!</p>
              </div>
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
                <ContactPicker
                  contacts={contacts || []}
                  selectedId={newRelationship.to_profile_id}
                  onSelect={(id) => setNewRelationship({ ...newRelationship, to_profile_id: id })}
                  placeholder="Search contacts..."
                />
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
