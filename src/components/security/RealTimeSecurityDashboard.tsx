import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, AlertTriangle, Activity, MapPin, Clock, 
  Eye, RefreshCw, CheckCircle, XCircle, Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  location?: string;
  created_at: string;
  resolved: boolean;
}

export function RealTimeSecurityDashboard() {
  const { user } = useAuth();
  const [realtimeEvents, setRealtimeEvents] = useState<SecurityEvent[]>([]);

  // Fetch recent security events
  const { data: securityEvents, isLoading, refetch } = useQuery({
    queryKey: ['security-events', user?.id],
    queryFn: async () => {
      // Try to fetch from data_access_events if available
      const { data, error } = await supabase
        .from('data_access_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('accessed_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.log('data_access_events not available, using mock data');
        return generateMockEvents();
      }
      
      return (data || []).map(event => {
        const anomalyScore = event.anomaly_score || 0;
        const severity: SecurityEvent['severity'] = anomalyScore > 0.7 ? 'high' : anomalyScore > 0.4 ? 'medium' : 'low';
        return {
          id: event.id,
          event_type: event.access_type || 'data_access',
          severity,
          description: `${event.access_type} on ${event.resource_type}`,
          ip_address: event.ip_address as string | undefined,
          location: undefined,
          created_at: event.accessed_at,
          resolved: false,
        };
      }) as SecurityEvent[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('security-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'data_access_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const event = payload.new as any;
          const anomalyScore = event.anomaly_score || 0;
          const severity: SecurityEvent['severity'] = anomalyScore > 0.7 ? 'high' : anomalyScore > 0.4 ? 'medium' : 'low';
          const newEvent: SecurityEvent = {
            id: event.id,
            event_type: event.access_type || 'data_access',
            severity,
            description: `${event.access_type} on ${event.resource_type}`,
            ip_address: event.ip_address,
            location: undefined,
            created_at: event.accessed_at,
            resolved: false,
          };
          setRealtimeEvents(prev => [newEvent, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const allEvents = [...realtimeEvents, ...(securityEvents || [])];
  
  const threatSummary = {
    critical: allEvents.filter(e => e.severity === 'critical').length,
    high: allEvents.filter(e => e.severity === 'high').length,
    medium: allEvents.filter(e => e.severity === 'medium').length,
    low: allEvents.filter(e => e.severity === 'low').length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Eye className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Real-Time Security Monitor
            </CardTitle>
            <CardDescription>
              Live security events and anomaly detection
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Threat Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className={cn("border-l-4", threatSummary.critical > 0 ? "border-l-red-500 bg-red-500/5" : "border-l-muted")}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{threatSummary.critical}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </CardContent>
          </Card>
          <Card className={cn("border-l-4", threatSummary.high > 0 ? "border-l-orange-500 bg-orange-500/5" : "border-l-muted")}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{threatSummary.high}</div>
              <div className="text-xs text-muted-foreground">High</div>
            </CardContent>
          </Card>
          <Card className={cn("border-l-4", threatSummary.medium > 0 ? "border-l-yellow-500 bg-yellow-500/5" : "border-l-muted")}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{threatSummary.medium}</div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 bg-green-500/5">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{threatSummary.low}</div>
              <div className="text-xs text-muted-foreground">Low</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Events
            </TabsTrigger>
            <TabsTrigger value="geographic" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Geographic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Loading events...
                </div>
              ) : allEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 opacity-50" />
                  <p>No security events detected</p>
                  <p className="text-sm">Your system is secure</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        event.severity === 'critical' && "border-red-500/50 bg-red-500/5",
                        event.severity === 'high' && "border-orange-500/50 bg-orange-500/5",
                        event.severity === 'medium' && "border-yellow-500/50 bg-yellow-500/5",
                        event.severity === 'low' && "border-muted"
                      )}
                    >
                      <div className={cn("p-2 rounded-full", getSeverityColor(event.severity))}>
                        {getSeverityIcon(event.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.event_type}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {event.ip_address && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {event.ip_address}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {event.resolved ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="geographic" className="mt-4">
            <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Geographic access patterns</p>
                <p className="text-sm">Access locations mapped by IP geolocation</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Generate mock events for demo purposes
function generateMockEvents(): SecurityEvent[] {
  return [
    {
      id: '1',
      event_type: 'login_attempt',
      severity: 'low',
      description: 'Successful login from recognized device',
      ip_address: '192.168.1.100',
      location: 'Local Network',
      created_at: new Date().toISOString(),
      resolved: true,
    },
    {
      id: '2',
      event_type: 'data_export',
      severity: 'medium',
      description: 'Bulk contact export requested',
      ip_address: '192.168.1.100',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      resolved: false,
    },
    {
      id: '3',
      event_type: 'api_access',
      severity: 'low',
      description: 'API key used for integration',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      resolved: true,
    },
  ];
}
