import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  UserPlus, 
  MessageSquare, 
  Share2, 
  Edit, 
  Trash2,
  Eye,
  Star,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  activity_type: string;
  activity_subtype: string | null;
  title: string;
  description: string | null;
  occurred_at: string;
  profile_id: string | null;
  metadata: Record<string, any> | null;
}

interface TeamActivityFeedProps {
  workspaceId?: string;
  profileId?: string;
  limit?: number;
  compact?: boolean;
}

export function TeamActivityFeed({ 
  workspaceId, 
  profileId, 
  limit = 20,
  compact = false 
}: TeamActivityFeedProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch activity feed
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['team-activity-feed', workspaceId, profileId, limit],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('contact_activity_feed')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityItem[];
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_activity_feed',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['team-activity-feed'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const getActivityIcon = (type: string, subtype: string | null) => {
    switch (type) {
      case 'contact':
        switch (subtype) {
          case 'created': return <UserPlus className="h-4 w-4 text-green-500" />;
          case 'updated': return <Edit className="h-4 w-4 text-blue-500" />;
          case 'deleted': return <Trash2 className="h-4 w-4 text-red-500" />;
          case 'viewed': return <Eye className="h-4 w-4 text-gray-500" />;
          case 'favorited': return <Star className="h-4 w-4 text-yellow-500" />;
          default: return <Activity className="h-4 w-4 text-muted-foreground" />;
        }
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'contact': return 'bg-blue-500/10';
      case 'comment': return 'bg-purple-500/10';
      case 'share': return 'bg-indigo-500/10';
      default: return 'bg-muted';
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center gap-2 text-sm">
              {getActivityIcon(activity.activity_type, activity.activity_subtype)}
              <span className="truncate flex-1">{activity.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Actions on contacts will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)} shrink-0`}>
                    {getActivityIcon(activity.activity_type, activity.activity_subtype)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {activity.activity_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.occurred_at), 'MMM d, yyyy HH:mm')}
                    </p>
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
