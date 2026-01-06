import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, TrendingUp, Sun, Moon } from 'lucide-react';
import { format, getHours, getDay, subDays, startOfDay } from 'date-fns';

interface TemporalAnalysisPanelProps {
  profileId?: string;
}

export function TemporalAnalysisPanel({ profileId }: TemporalAnalysisPanelProps) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['temporal-analysis', user?.id, profileId],
    queryFn: async () => {
      let query = supabase
        .from('communications')
        .select('occurred_at, direction, channel')
        .eq('user_id', user!.id)
        .gte('occurred_at', subDays(new Date(), 90).toISOString())
        .order('occurred_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data: communications } = await query;

      const hourlyDistribution = new Array(24).fill(0);
      const dailyDistribution = new Array(7).fill(0);
      const dayMap = new Map<string, number>();

      communications?.forEach(c => {
        const date = new Date(c.occurred_at);
        const hour = getHours(date);
        const day = getDay(date);
        const dayKey = format(startOfDay(date), 'yyyy-MM-dd');

        hourlyDistribution[hour]++;
        dailyDistribution[day]++;
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
      });

      const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
      const peakDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const day = format(subDays(new Date(), i), 'yyyy-MM-dd');
        return dayMap.get(day) || 0;
      }).reduce((a, b) => a + b, 0);

      const prev7Days = Array.from({ length: 7 }, (_, i) => {
        const day = format(subDays(new Date(), i + 7), 'yyyy-MM-dd');
        return dayMap.get(day) || 0;
      }).reduce((a, b) => a + b, 0);

      const trendPercentage = prev7Days > 0 
        ? Math.round(((last7Days - prev7Days) / prev7Days) * 100)
        : 0;

      const morningActivity = hourlyDistribution.slice(6, 12).reduce((a, b) => a + b, 0);
      const afternoonActivity = hourlyDistribution.slice(12, 18).reduce((a, b) => a + b, 0);
      const eveningActivity = hourlyDistribution.slice(18, 24).reduce((a, b) => a + b, 0);
      
      let timePreference = 'morning';
      let maxActivity = morningActivity;
      if (afternoonActivity > maxActivity) {
        timePreference = 'afternoon';
        maxActivity = afternoonActivity;
      }
      if (eveningActivity > maxActivity) {
        timePreference = 'evening';
      }

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return {
        hourlyDistribution,
        dailyDistribution,
        bestHour: peakHour,
        bestDay: dayNames[peakDay],
        timePreference,
        trendPercentage,
        totalCommunications: communications?.length || 0,
        avgPerDay: communications?.length ? (communications.length / 90).toFixed(1) : '0',
      };
    },
    enabled: !!user,
  });

  const heatmapData = useMemo(() => {
    if (!data) return [];
    return data.hourlyDistribution.map((count, hour) => ({
      hour,
      count,
      intensity: data.hourlyDistribution.length > 0 
        ? count / Math.max(...data.hourlyDistribution) 
        : 0,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Temporal Analysis
        </CardTitle>
        <CardDescription>
          Communication patterns and optimal contact timing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border bg-card text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{data?.bestDay}</div>
            <div className="text-xs text-muted-foreground">Best Day</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{formatHour(data?.bestHour || 0)}</div>
            <div className="text-xs text-muted-foreground">Best Time</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${
              (data?.trendPercentage || 0) >= 0 ? 'text-green-500' : 'text-destructive'
            }`} />
            <div className="text-lg font-bold">
              {(data?.trendPercentage || 0) >= 0 ? '+' : ''}{data?.trendPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">7-day Trend</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {data?.timePreference === 'evening' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="text-sm">Preferred communication time</span>
          </div>
          <Badge className="capitalize">{data?.timePreference}</Badge>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Activity by Hour</h4>
          <div className="flex gap-0.5">
            {heatmapData.map(({ hour, intensity }) => (
              <div
                key={hour}
                className="flex-1 h-8 rounded-sm transition-colors"
                style={{
                  backgroundColor: intensity > 0 
                    ? `hsl(var(--primary) / ${0.2 + intensity * 0.8})`
                    : 'hsl(var(--muted))',
                }}
                title={`${formatHour(hour)}: ${data?.hourlyDistribution[hour] || 0} communications`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Activity by Day</h4>
          <div className="space-y-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
              const count = data?.dailyDistribution[i] || 0;
              const max = Math.max(...(data?.dailyDistribution || [1]));
              const width = max > 0 ? (count / max) * 100 : 0;
              return (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-xs w-8">{day}</span>
                  <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-primary/70 rounded transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Based on {data?.totalCommunications || 0} communications over the last 90 days
          ({data?.avgPerDay}/day avg)
        </div>
      </CardContent>
    </Card>
  );
}
