import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  Loader2, 
  Mail,
  Crown,
  Shield,
  UserPlus,
  Settings,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function WorkspaceSettings() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members (
            id,
            user_id,
            role,
            accepted_at
          )
        `)
        .or(`owner_id.eq.${user.id},workspace_members.user_id.eq.${user.id}`);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as member
      await supabase.from('workspace_members').insert({
        workspace_id: data.id,
        user_id: user.id,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

      return data;
    },
    onSuccess: () => {
      toast.success('Workspace created');
      setIsCreateOpen(false);
      setWorkspaceName('');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspace) throw new Error('No workspace selected');

      // For now, we'll create the member record - in production you'd send an email
      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: selectedWorkspace,
          user_id: user?.id, // This would be the invited user's ID after they accept
          role: inviteRole,
          invited_by: user?.id,
        });

      if (error) throw error;

      // Email sending would happen in an edge function
      return { email: inviteEmail };
    },
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('viewer');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle>Team Workspaces</CardTitle>
              <CardDescription>Collaborate and share contacts with your team</CardDescription>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to share contacts with your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input
                    placeholder="My Team"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !workspaceName}
                  className="w-full"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Workspace'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : workspaces.length > 0 ? (
          <div className="space-y-4">
            {workspaces.map((workspace: any) => {
              const isOwner = workspace.owner_id === user?.id;
              const members = workspace.workspace_members || [];
              
              return (
                <div key={workspace.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{workspace.name}</h4>
                        {isOwner && (
                          <Badge variant="secondary">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {members.length} member{members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {isOwner && (
                      <Dialog open={isInviteOpen && selectedWorkspace === workspace.id} onOpenChange={(open) => {
                        setIsInviteOpen(open);
                        if (open) setSelectedWorkspace(workspace.id);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-1" />
                            Invite
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                              Invite someone to join {workspace.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Email Address</Label>
                              <Input
                                type="email"
                                placeholder="colleague@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer - Can view contacts</SelectItem>
                                  <SelectItem value="editor">Editor - Can edit contacts</SelectItem>
                                  <SelectItem value="admin">Admin - Full access</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button 
                              onClick={() => inviteMutation.mutate()}
                              disabled={inviteMutation.isPending || !inviteEmail}
                              className="w-full"
                            >
                              {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invitation'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {members.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {members.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-1 text-sm">
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                          {!member.accepted_at && (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No workspaces yet</p>
            <p className="text-sm">Create a workspace to collaborate with your team</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
