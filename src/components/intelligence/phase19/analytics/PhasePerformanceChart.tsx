import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhasePerformance } from '@/hooks/intelligence/useAGISAnalytics';
import { getPhaseConfig } from '@/lib/agis/phaseConfig';

interface PhasePerformanceChartProps {
  phasePerformance: PhasePerformance[];
  className?: string;
}

export function PhasePerformanceChart({ phasePerformance, className }: PhasePerformanceChartProps) {
  const chartData = useMemo(() => {
    return phasePerformance.map(p => ({
      name: `P${p.phase}`,
      fullName: getPhaseConfig(p.phase)?.name || `Phase ${p.phase}`,
      successRate: Math.round(p.successRate * 100),
      operations: p.operationsCount,
      avgDuration: Math.round(p.avgDuration / 1000), // Convert to seconds
    }));
  }, [phasePerformance]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Phase Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="successRate" 
              stroke="hsl(var(--primary))" 
              name="Success Rate %"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="operations" 
              stroke="hsl(var(--accent))" 
              name="Operations"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
