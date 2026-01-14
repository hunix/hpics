import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HardwareTelemetry } from '@/types/hardware';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  Info,
  Zap,
  Thermometer,
  Radio,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

const priorityColors = {
  low: 'text-muted-foreground',
  normal: 'text-blue-500',
  high: 'text-yellow-500',
  critical: 'text-red-500',
};

const priorityIcons = {
  low: Info,
  normal: Activity,
  high: AlertTriangle,
  critical: Zap,
};

export function TelemetryFeed() {
  const { user } = useAuth();
  const [realtimeTelemetry, setRealtimeTelemetry] = useState<HardwareTelemetry[]>([]);

  const { data: telemetry = [], isLoading } = useQuery({
    queryKey: ['hardware-telemetry', user?.id],
    queryFn: async (): Promise<HardwareTelemetry[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('hardware_telemetry')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as HardwareTelemetry[];
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  // Subscribe to realtime telemetry
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('telemetry-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hardware_telemetry',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setRealtimeTelemetry((prev) => [
            payload.new as HardwareTelemetry,
            ...prev.slice(0, 49),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const allTelemetry = [...realtimeTelemetry, ...telemetry].slice(0, 100);

  // Group by telemetry type for stats
  const stats = allTelemetry.reduce((acc, t) => {
    acc[t.telemetry_type] = (acc[t.telemetry_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{allTelemetry.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allTelemetry.filter(t => t.priority === 'high' || t.priority === 'critical').length}
                </p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Thermometer className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats['sensor'] || 0}</p>
                <p className="text-sm text-muted-foreground">Sensor Readings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Radio className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats['capture'] || 0}</p>
                <p className="text-sm text-muted-foreground">Captures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Telemetry Feed
            {realtimeTelemetry.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {realtimeTelemetry.length} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {allTelemetry.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No telemetry data received yet</p>
                <p className="text-sm">Connect your devices to see real-time data</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTelemetry.map((item, index) => {
                  const PriorityIcon = priorityIcons[item.priority] || Activity;
                  const isNew = index < realtimeTelemetry.length;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isNew ? 'bg-primary/5 border-primary/20' : 'bg-card/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <PriorityIcon className={`h-4 w-4 mt-0.5 ${priorityColors[item.priority]}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{item.telemetry_type}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {item.priority}
                              </Badge>
                              {isNew && (
                                <Badge className="text-[10px] bg-primary/20 text-primary">
                                  new
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {JSON.stringify(item.data).slice(0, 100)}
                              {JSON.stringify(item.data).length > 100 && '...'}
                            </p>
                            {item.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(item.recorded_at))} ago
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
