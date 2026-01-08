import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Share2, Users, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ShareContactDialogProps {
  profileId: string;
  profileName: string;
  trigger?: React.ReactNode;
}

export function ShareContactDialog({ profileId, profileName, trigger }: ShareContactDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [permissionLevel, setPermissionLevel] = useState<string>('view');
  const [notes, setNotes] = useState('');

  // Fetch user's workspaces
  const { data: workspaces = [] } = useQuery({
    queryKey: ['user-workspaces-for-share'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          workspace_members!inner (
            user_id,
            role
          )
        `)
        .eq('workspace_members.user_id', user.id);

      if (error) throw error;
      return data.filter(w => {
        const member = w.workspace_members?.[0];
        return member?.role === 'owner' || member?.role === 'admin' || member?.role === 'editor';
      });
    },
    enabled: !!user && open,
  });

  // Fetch existing shares for this contact
  const { data: existingShares = [] } = useQuery({
    queryKey: ['contact-shares', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_contacts')
        .select(`
          *,
          workspaces (name)
        `)
        .eq('profile_id', profileId);

      if (error) throw error;
      return data;
    },
    enabled: !!profileId && open,
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedWorkspace) throw new Error('Invalid input');

      const { error } = await supabase
        .from('shared_contacts')
        .insert({
          profile_id: profileId,
          workspace_id: selectedWorkspace,
          shared_by: user.id,
          permission_level: permissionLevel,
          notes: notes || null,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('This contact is already shared with this workspace');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Contact shared successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-shares', profileId] });
      setSelectedWorkspace('');
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Unshare mutation
  const unshareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from('shared_contacts')
        .delete()
        .eq('id', shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contact unshared');
      queryClient.invalidateQueries({ queryKey: ['contact-shares', profileId] });
    },
    onError: () => {
      toast.error('Failed to unshare contact');
    },
  });

  const availableWorkspaces = workspaces.filter(
    w => !existingShares.some(s => s.workspace_id === w.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Contact</DialogTitle>
          <DialogDescription>
            Share {profileName} with your team workspaces
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current shares */}
          {existingShares.length > 0 && (
            <div className="space-y-2">
              <Label>Currently shared with</Label>
              <div className="space-y-2">
                {existingShares.map((share: any) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{share.workspaces?.name}</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {share.permission_level}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => unshareMutation.mutate(share.id)}
                      disabled={unshareMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share to new workspace */}
          {availableWorkspaces.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label>Share to workspace</Label>
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkspaces.map((workspace: any) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Permission level</Label>
                <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View only</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                    <SelectItem value="admin">Full access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add context for your team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                onClick={() => shareMutation.mutate()}
                disabled={shareMutation.isPending || !selectedWorkspace}
                className="w-full"
              >
                {shareMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Share Contact
              </Button>
            </>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No workspaces available</p>
              <p className="text-xs">Create or join a workspace first</p>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Shared with all your workspaces</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
