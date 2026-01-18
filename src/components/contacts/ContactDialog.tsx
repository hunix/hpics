import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SmartNameInput } from '@/components/ui/SmartNameInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Profile, ProfileInsert } from '@/types/database-helpers';
import { 
  RELATIONSHIP_SUBTYPES, 
  HIERARCHY_LEVELS, 
  getSubtypesForRelationship, 
  needsHierarchy 
} from '@/lib/relationshipSubtypes';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Profile;
}

const relationshipTypes = [
  'family',
  'friend',
  'colleague',
  'client',
  'mentor',
  'mentee',
  'acquaintance',
  'other',
] as const;

export function ContactDialog({ open, onOpenChange, contact }: ContactDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!contact;

  const [formData, setFormData] = useState({
    first_name: contact?.first_name ?? '',
    last_name: contact?.last_name ?? '',
    nickname: contact?.nickname ?? '',
    organization: contact?.organization ?? '',
    job_title: contact?.job_title ?? '',
    relationship_type: contact?.relationship_type ?? 'other',
    relationship_subtype: (contact as any)?.relationship_subtype ?? '',
    hierarchy_level: (contact as any)?.hierarchy_level ?? '',
    bio: contact?.bio ?? '',
    notes: contact?.notes ?? '',
    tags: contact?.tags?.join(', ') ?? '',
  });

  // Reset subtype and hierarchy when relationship type changes
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        relationship_subtype: '',
        hierarchy_level: '',
      }));
    }
  }, [formData.relationship_type, isEditing]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const profileData: ProfileInsert & { relationship_subtype?: string; hierarchy_level?: string } = {
        user_id: user!.id,
        first_name: data.first_name,
        last_name: data.last_name || null,
        nickname: data.nickname || null,
        organization: data.organization || null,
        job_title: data.job_title || null,
        relationship_type: data.relationship_type as 'family' | 'friend' | 'colleague' | 'client' | 'mentor' | 'mentee' | 'acquaintance' | 'other',
        bio: data.bio || null,
        notes: data.notes || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        relationship_subtype: data.relationship_subtype || null,
        hierarchy_level: data.hierarchy_level || null,
      };

      if (isEditing && contact) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert(profileData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-contacts'] });
      toast({
        title: isEditing ? 'Contact updated' : 'Contact created',
        description: `${formData.first_name} has been ${isEditing ? 'updated' : 'added'} successfully.`,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      nickname: '',
      organization: '',
      job_title: '',
      relationship_type: 'other',
      relationship_subtype: '',
      hierarchy_level: '',
      bio: '',
      notes: '',
      tags: '',
    });
  };

  const subtypes = getSubtypesForRelationship(formData.relationship_type);
  const showHierarchy = needsHierarchy(formData.relationship_type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) {
      toast({
        title: 'Validation error',
        description: 'First name is required',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <SmartNameInput
                id="first_name"
                value={formData.first_name}
                onChange={(value) => setFormData({ ...formData, first_name: value })}
                placeholder="First name"
                nameType="first"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <SmartNameInput
                id="last_name"
                value={formData.last_name}
                onChange={(value) => setFormData({ ...formData, last_name: value })}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship_type">Relationship Type</Label>
            <Select
              value={formData.relationship_type}
              onValueChange={(value: typeof relationshipTypes[number]) => setFormData({ ...formData, relationship_type: value, relationship_subtype: '', hierarchy_level: '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subtypes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="relationship_subtype">
                {formData.relationship_type === 'family' ? 'Family Relation' :
                 formData.relationship_type === 'friend' ? 'Friendship Type' :
                 formData.relationship_type === 'colleague' ? 'Work Relationship' :
                 formData.relationship_type === 'client' ? 'Client Type' :
                 formData.relationship_type === 'mentor' ? 'Mentorship Area' :
                 formData.relationship_type === 'mentee' ? 'Mentee Type' :
                 formData.relationship_type === 'acquaintance' ? 'Connection Type' :
                 'Subtype'}
              </Label>
              <Select
                value={formData.relationship_subtype}
                onValueChange={(value) => setFormData({ ...formData, relationship_subtype: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specific type..." />
                </SelectTrigger>
                <SelectContent>
                  {subtypes.map((subtype) => (
                    <SelectItem key={subtype.value} value={subtype.value}>
                      {subtype.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showHierarchy && (
            <div className="space-y-2">
              <Label htmlFor="hierarchy_level">Position / Hierarchy</Label>
              <Select
                value={formData.hierarchy_level}
                onValueChange={(value) => setFormData({ ...formData, hierarchy_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position level..." />
                </SelectTrigger>
                <SelectContent>
                  {HIERARCHY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description about this person..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Private Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Personal notes, reminders, conversation starters..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="tech, startup, investor (comma separated)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
