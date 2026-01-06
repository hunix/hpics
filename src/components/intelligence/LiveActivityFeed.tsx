import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, MessageSquare, Mail, Phone, Video, FileText, 
  Image, Brain, AlertTriangle, MapPin, RefreshCw, Filter,
  ChevronDown, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActivityItem {
  id: string;
  profile_id: string | null;
  activity_type: string;
  activity_subtype: string | null;
  source: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  importance_score: number;
  is_anomaly: boolean;
  anomaly_reason: string | null;
  occurred_at: string;
  profile?: { first_name: string; last_name: string | null };
}

const activityIcons: Record<string, any> = {
  communication: Mail,
  message: MessageSquare,
  media: Image,
  document: FileText,
  event: Clock,
  analysis: Brain,
  location: MapPin,
  call: Phone,
  meeting: Video,
};

const sourceColors: Record<string, string> = {
  email: 'bg-blue-500/10 text-blue-600',
  whatsapp: 'bg-green-500/10 text-green-600',
  phone: 'bg-purple-500/10 text-purple-600',
  meeting: 'bg-orange-500/10 text-orange-600',
  manual: 'bg-gray-500/10 text-gray-600',
  ai: 'bg-pink-500/10 text-pink-600',
};

export function LiveActivityFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string[]>(['all']);
  const [isRealtime, setIsRealtime] = useState(true);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ['activity-feed', user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('contact_activity_feed')
        .select(`
          *,
          profile:profiles(first_name, last_name)
        `)
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (!filter.includes('all')) {
        query = query.in('activity_type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityItem[];
    },
    enabled: !!user,
    refetchInterval: isRealtime ? 30000 : false,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !isRealtime) return;

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
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isRealtime, refetch]);

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'communication', label: 'Communications' },
    { value: 'message', label: 'Messages' },
    { value: 'media', label: 'Media' },
    { value: 'document', label: 'Documents' },
    { value: 'analysis', label: 'AI Analysis' },
    { value: 'event', label: 'Events' },
  ];

  const toggleFilter = (value: string) => {
    if (value === 'all') {
      setFilter(['all']);
    } else {
      setFilter(prev => {
        const newFilter = prev.filter(f => f !== 'all');
        if (newFilter.includes(value)) {
          const result = newFilter.filter(f => f !== value);
          return result.length === 0 ? ['all'] : result;
        }
        return [...newFilter, value];
      });
    }
  };

  const getIcon = (item: ActivityItem) => {
    const Icon = activityIcons[item.activity_type] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
              {isRealtime && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Real-time tracking of all contact activities
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {activityTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type.value}
                    checked={filter.includes(type.value)}
                    onCheckedChange={() => toggleFilter(type.value)}
                  >
                    {type.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    item.is_anomaly ? 'border-orange-500/50 bg-orange-500/5' : ''
                  }`}
                  onClick={() => item.profile_id && navigate(`/contacts/${item.profile_id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${sourceColors[item.source || 'manual'] || 'bg-muted'}`}>
                      {getIcon(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{item.title}</span>
                        {item.is_anomaly && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Anomaly
                          </Badge>
                        )}
                        {item.importance_score >= 80 && (
                          <Badge variant="secondary">High Priority</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {item.profile && (
                          <span className="font-medium text-foreground">
                            {item.profile.first_name} {item.profile.last_name}
                          </span>
                        )}
                        <span>{formatDistanceToNow(new Date(item.occurred_at), { addSuffix: true })}</span>
                        {item.source && (
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.is_anomaly && item.anomaly_reason && (
                    <div className="mt-2 p-2 bg-orange-500/10 rounded text-sm text-orange-700 dark:text-orange-400">
                      {item.anomaly_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No activities recorded yet</p>
              <p className="text-sm">Activities will appear here as you interact with contacts</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
