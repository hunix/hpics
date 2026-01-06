import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, Activity, AlertTriangle, TrendingUp, 
  TrendingDown, Users, Clock, MapPin 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface MonitoredContact {
  id: string;
  name: string;
  last_activity: string | null;
  activity_count: number;
  sentiment_trend: 'positive' | 'negative' | 'neutral';
  alert_count: number;
  location?: string;
}

export function SurveillanceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['surveillance-dashboard', user?.id],
    queryFn: async () => {
      const { data: activities } = await supabase
        .from('contact_activity_feed')
        .select('*')
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false })
        .limit(50);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, is_favorite, updated_at')
        .eq('user_id', user!.id)
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(20);

      const { data: anomalies } = await supabase
        .from('behavioral_anomalies')
        .select('profile_id, severity')
        .eq('user_id', user!.id)
        .eq('is_resolved', false);

      const { data: locations } = await supabase
        .from('contact_locations')
        .select('profile_id, city, country')
        .eq('user_id', user!.id)
        .eq('is_current', true);

      const activityMap = new Map<string, { count: number; last: string }>();
      activities?.forEach(a => {
        if (!a.profile_id) return;
        const existing = activityMap.get(a.profile_id);
        if (!existing) {
          activityMap.set(a.profile_id, { count: 1, last: a.occurred_at });
        } else {
          existing.count++;
        }
      });

      const anomalyMap = new Map<string, number>();
      anomalies?.forEach(a => {
        anomalyMap.set(a.profile_id, (anomalyMap.get(a.profile_id) || 0) + 1);
      });

      const locationMap = new Map<string, string>();
      locations?.forEach(l => {
        locationMap.set(l.profile_id, [l.city, l.country].filter(Boolean).join(', '));
      });

      const monitored: MonitoredContact[] = (profiles || []).map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim(),
        last_activity: activityMap.get(p.id)?.last || null,
        activity_count: activityMap.get(p.id)?.count || 0,
        sentiment_trend: 'neutral' as const,
        alert_count: anomalyMap.get(p.id) || 0,
        location: locationMap.get(p.id),
      }));

      const totalActivity = activities?.length || 0;
      const alertContacts = anomalies?.length || 0;
      const activeContacts = activityMap.size;
      const healthScore = Math.max(0, Math.min(100, 
        80 + (activeContacts * 2) - (alertContacts * 10)
      ));

      return {
        monitored,
        recentActivities: activities?.slice(0, 10) || [],
        stats: { totalActivity, activeContacts, alertContacts, healthScore },
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Network Health</span>
            </div>
            <div className="text-2xl font-bold">{data?.stats.healthScore || 0}%</div>
            <Progress value={data?.stats.healthScore || 0} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Contacts</span>
            </div>
            <div className="text-2xl font-bold">{data?.stats.activeContacts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Recent Activity</span>
            </div>
            <div className="text-2xl font-bold">{data?.stats.totalActivity || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Active Alerts</span>
            </div>
            <div className="text-2xl font-bold text-amber-500">{data?.stats.alertContacts || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Monitored Contacts
            </CardTitle>
            <CardDescription>Real-time contact surveillance</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {data?.monitored.map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{contact.name}</span>
                        {contact.alert_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {contact.alert_count} alerts
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {contact.location && (
                          <>
                            <MapPin className="h-3 w-3" />
                            <span>{contact.location}</span>
                          </>
                        )}
                        {contact.last_activity && (
                          <span>
                            Active {formatDistanceToNow(new Date(contact.last_activity), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {contact.sentiment_trend === 'positive' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : contact.sentiment_trend === 'negative' ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : null}
                      <Badge variant="outline">{contact.activity_count}</Badge>
                    </div>
                  </div>
                ))}
                {(!data?.monitored || data.monitored.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No contacts to monitor</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time network activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {data?.recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className={`p-3 rounded-lg border ${
                      activity.is_anomaly ? 'border-amber-500/50 bg-amber-500/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type}
                      </Badge>
                      {activity.is_anomaly && (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                ))}
                {(!data?.recentActivities || data.recentActivities.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
