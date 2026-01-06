import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Activity, 
  MessageSquare, 
  TrendingUp,
  Clock,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function TeamDashboard() {
  const { user } = useAuth();

  const { data: workspaces = [] } = useQuery({
    queryKey: ['team-workspaces'],
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

  const { data: sharedContacts = [] } = useQuery({
    queryKey: ['shared-contacts'],
    queryFn: async () => {
      if (!user) return [];
      
      const workspaceIds = workspaces.map(w => w.id);
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, workspace_id')
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: workspaces.length > 0,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['team-activity'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('contact_activity_feed')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalMembers = workspaces.reduce((sum, w) => 
    sum + (w.workspace_members?.length || 0), 0
  );

  return (
    <AppLayout title="Team Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaces.length}</div>
              <p className="text-xs text-muted-foreground">Active teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground">Across all workspaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared Contacts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sharedContacts.length}</div>
              <p className="text-xs text-muted-foreground">In shared workspaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentActivity.length}</div>
              <p className="text-xs text-muted-foreground">Actions this week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Workspaces */}
          <Card>
            <CardHeader>
              <CardTitle>Your Workspaces</CardTitle>
              <CardDescription>Teams you're a member of</CardDescription>
            </CardHeader>
            <CardContent>
              {workspaces.length > 0 ? (
                <div className="space-y-4">
                  {workspaces.map((workspace: any) => (
                    <div key={workspace.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{workspace.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {workspace.workspace_members?.length || 0} members
                          </p>
                        </div>
                      </div>
                      <Badge variant={workspace.owner_id === user?.id ? 'default' : 'secondary'}>
                        {workspace.owner_id === user?.id ? 'Owner' : 'Member'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No workspaces yet</p>
                  <p className="text-sm">Create or join a workspace to collaborate</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across your contacts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.occurred_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Shared Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Shared Contacts</CardTitle>
            <CardDescription>Contacts shared in your workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            {sharedContacts.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {sharedContacts.map((contact: any) => (
                  <div key={contact.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarFallback>
                        {contact.first_name?.[0]}{contact.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.organization && (
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.organization}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No shared contacts yet</p>
                <p className="text-sm">Assign contacts to a workspace to share them</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
