import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsMetric } from '@/hooks/intelligence/useAGISAnalytics';
import { getPhaseConfig } from '@/lib/agis/phaseConfig';
import { Activity } from 'lucide-react';

interface OperationHeatmapProps {
  metrics: AnalyticsMetric[];
  className?: string;
}

export function OperationHeatmap({ metrics, className }: OperationHeatmapProps) {
  const heatmapData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Initialize grid
    const grid: Record<string, Record<number, number>> = {};
    days.forEach(day => {
      grid[day] = {};
      hours.forEach(hour => {
        grid[day][hour] = 0;
      });
    });
    
    // Populate from metrics
    metrics.forEach(metric => {
      const date = new Date(metric.recordedAt);
      const day = days[date.getDay()];
      const hour = date.getHours();
      grid[day][hour]++;
    });
    
    // Find max for intensity calculation
    let max = 1;
    days.forEach(day => {
      hours.forEach(hour => {
        max = Math.max(max, grid[day][hour]);
      });
    });
    
    return { grid, days, hours, max };
  }, [metrics]);

  const phaseDistribution = useMemo(() => {
    const distribution: Record<number, number> = {};
    metrics.forEach(m => {
      distribution[m.phase] = (distribution[m.phase] || 0) + 1;
    });
    return Object.entries(distribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([phase, count]) => ({
        phase: Number(phase),
        name: getPhaseConfig(Number(phase))?.name || `Phase ${phase}`,
        count,
        percentage: (count / metrics.length) * 100
      }));
  }, [metrics]);

  const getIntensityColor = (value: number, max: number) => {
    if (value === 0) return 'bg-muted/30';
    const intensity = value / max;
    if (intensity > 0.75) return 'bg-primary';
    if (intensity > 0.5) return 'bg-primary/75';
    if (intensity > 0.25) return 'bg-primary/50';
    return 'bg-primary/25';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Operation Activity Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time-based Heatmap */}
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="flex gap-0.5 mb-1">
              <div className="w-8" />
              {[0, 6, 12, 18, 23].map(h => (
                <div key={h} className="text-[10px] text-muted-foreground" style={{ width: h === 23 ? 'auto' : '20%' }}>
                  {h}:00
                </div>
              ))}
            </div>
            {heatmapData.days.map(day => (
              <div key={day} className="flex gap-0.5 items-center">
                <div className="w-8 text-xs text-muted-foreground">{day}</div>
                <div className="flex gap-0.5 flex-1">
                  {heatmapData.hours.map(hour => (
                    <div
                      key={hour}
                      className={`h-3 flex-1 rounded-sm ${getIntensityColor(heatmapData.grid[day][hour], heatmapData.max)}`}
                      title={`${day} ${hour}:00 - ${heatmapData.grid[day][hour]} operations`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="pt-2 border-t">
          <div className="text-sm font-medium mb-2">Phase Distribution</div>
          <div className="flex flex-wrap gap-1">
            {phaseDistribution.length === 0 ? (
              <span className="text-xs text-muted-foreground">No data yet</span>
            ) : (
              phaseDistribution.slice(0, 8).map(item => (
                <div
                  key={item.phase}
                  className="px-2 py-1 rounded-full bg-primary/10 text-xs"
                  title={`${item.name}: ${item.count} operations`}
                >
                  P{item.phase}: {item.percentage.toFixed(0)}%
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
