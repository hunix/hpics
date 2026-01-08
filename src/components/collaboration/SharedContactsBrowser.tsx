import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search, ExternalLink, Loader2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface SharedContact {
  id: string;
  profile_id: string;
  workspace_id: string;
  permission_level: string;
  shared_at: string;
  notes: string | null;
  profiles: {
    id: string;
    first_name: string;
    last_name: string | null;
    organization: string | null;
    avatar_url: string | null;
    relationship_type: string | null;
  };
  workspaces: {
    name: string;
  };
}

export function SharedContactsBrowser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's workspaces
  const { data: workspaces = [] } = useQuery({
    queryKey: ['user-workspaces-browser'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(id, name)')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(d => d.workspaces).filter(Boolean);
    },
    enabled: !!user,
  });

  // Fetch shared contacts
  const { data: sharedContacts = [], isLoading } = useQuery({
    queryKey: ['shared-contacts-browser', selectedWorkspace, searchQuery],
    queryFn: async () => {
      if (!user) return [];

      // Get user's workspace IDs
      const workspaceIds = workspaces.map((w: any) => w.id);
      if (workspaceIds.length === 0) return [];

      let query = supabase
        .from('shared_contacts')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            organization,
            avatar_url,
            relationship_type
          ),
          workspaces (name)
        `)
        .in('workspace_id', workspaceIds)
        .order('shared_at', { ascending: false });

      if (selectedWorkspace !== 'all') {
        query = query.eq('workspace_id', selectedWorkspace);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search if provided
      let filtered = data as SharedContact[];
      if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.profiles?.first_name?.toLowerCase().includes(lowerSearch) ||
            c.profiles?.last_name?.toLowerCase().includes(lowerSearch) ||
            c.profiles?.organization?.toLowerCase().includes(lowerSearch)
        );
      }

      return filtered;
    },
    enabled: !!user && workspaces.length > 0,
  });

  const getPermissionColor = (level: string) => {
    switch (level) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-500';
      case 'edit':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared Contacts
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workspaces</SelectItem>
                {workspaces.map((workspace: any) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sharedContacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No shared contacts</p>
            <p className="text-sm">
              {workspaces.length === 0
                ? 'Join or create a workspace to share contacts'
                : 'Share contacts with your team to see them here'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {sharedContacts.map((shared) => (
                <div
                  key={shared.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={shared.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {shared.profiles?.first_name?.[0]}
                        {shared.profiles?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {shared.profiles?.first_name} {shared.profiles?.last_name}
                        </span>
                        {shared.profiles?.relationship_type && (
                          <Badge variant="outline" className="text-xs">
                            {shared.profiles.relationship_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {shared.profiles?.organization && (
                          <span>{shared.profiles.organization}</span>
                        )}
                        <span>•</span>
                        <span>{shared.workspaces?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getPermissionColor(shared.permission_level)}>
                      {shared.permission_level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(shared.shared_at), 'MMM d')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/contacts/${shared.profile_id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
