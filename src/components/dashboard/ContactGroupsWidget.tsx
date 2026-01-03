import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GroupWithCount {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  memberCount: number;
}

export function ContactGroupsWidget() {
  const { user } = useAuth();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['contact-groups-with-counts', user?.id],
    queryFn: async () => {
      const { data: groupsData, error: groupsError } = await supabase
        .from('contact_groups')
        .select('*')
        .order('name');
      
      if (groupsError) throw groupsError;

      const { data: membersData, error: membersError } = await supabase
        .from('contact_group_members')
        .select('group_id');
      
      if (membersError) throw membersError;

      const counts = membersData.reduce((acc, m) => {
        acc[m.group_id] = (acc[m.group_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return groupsData.map(g => ({
        ...g,
        memberCount: counts[g.id] || 0,
      })) as GroupWithCount[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contact Groups
        </CardTitle>
        <CardDescription>Organize and manage your contact circles</CardDescription>
      </CardHeader>
      <CardContent>
        {groups && groups.length > 0 ? (
          <div className="space-y-2">
            {groups.slice(0, 5).map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color || '#6366f1' }}
                  />
                  <div>
                    <p className="font-medium">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">{group.memberCount} contacts</Badge>
              </div>
            ))}
            {groups.length > 5 && (
              <Link
                to="/contacts"
                className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
              >
                View all groups
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No groups created yet</p>
            <p className="text-xs">Create groups from contact details</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
