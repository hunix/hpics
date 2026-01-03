import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, Check, X, Loader2 } from 'lucide-react';

interface ContactGroupSelectorProps {
  profileId: string;
}

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export function ContactGroupSelector({ profileId }: ContactGroupSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['contact-groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_groups')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as ContactGroup[];
    },
    enabled: !!user,
  });

  const { data: memberships, isLoading: membershipsLoading } = useQuery({
    queryKey: ['contact-group-memberships', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_group_members')
        .select('group_id')
        .eq('profile_id', profileId);
      if (error) throw error;
      return data.map(m => m.group_id);
    },
    enabled: !!user && !!profileId,
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('contact_groups').insert({
        user_id: user!.id,
        name: newGroupName,
        description: newGroupDescription || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      toast({ title: 'Group created' });
      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error creating group', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMembershipMutation = useMutation({
    mutationFn: async ({ groupId, isMember }: { groupId: string; isMember: boolean }) => {
      if (isMember) {
        const { error } = await supabase
          .from('contact_group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('profile_id', profileId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contact_group_members').insert({
          group_id: groupId,
          profile_id: profileId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-group-memberships', profileId] });
    },
    onError: (error) => {
      toast({ title: 'Error updating group', description: error.message, variant: 'destructive' });
    },
  });

  const isLoading = groupsLoading || membershipsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups
          </CardTitle>
          <CardDescription>Organize contacts into custom groups</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Work Friends, College Alumni"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Brief description of this group"
                />
              </div>
              <Button
                onClick={() => createGroupMutation.mutate()}
                disabled={!newGroupName.trim() || createGroupMutation.isPending}
                className="w-full"
              >
                {createGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {groups && groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((group) => {
              const isMember = memberships?.includes(group.id) ?? false;
              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                    )}
                  </div>
                  <Button
                    variant={isMember ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMembershipMutation.mutate({ groupId: group.id, isMember })}
                    disabled={toggleMembershipMutation.isPending}
                  >
                    {isMember ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Member
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No groups yet</p>
            <p className="text-sm">Create groups to organize your contacts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
