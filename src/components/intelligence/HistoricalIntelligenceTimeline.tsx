/**
 * Historical Intelligence Timeline
 * Time-series visualization of AGIS metrics with anomaly detection
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntelligenceHistory, type TimeRange } from '@/hooks/intelligence/useIntelligenceHistory';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Clock,
  Camera,
  Calendar
} from 'lucide-react';

interface HistoricalIntelligenceTimelineProps {
  profileId?: string;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' },
];

export function HistoricalIntelligenceTimeline({ profileId }: HistoricalIntelligenceTimelineProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { 
    snapshots, 
    isLoading, 
    captureSnapshot, 
    calculateTrends, 
    detectAnomalies,
    getChartData,
    isCapturing 
  } = useIntelligenceHistory(profileId);

  const chartData = getChartData(timeRange);
  const trends = calculateTrends(timeRange);
  const anomalies = detectAnomalies(0.15);

  const getTrendIcon = (change: number) => {
    if (change > 0.05) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (change < -0.05) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const handleCaptureSnapshot = () => {
    if (!profileId) return;
    
    // Capture with default/mock values - in production this would aggregate real data
    captureSnapshot({
      profileId,
      miceScores: { money: 0.3, ideology: 0.2, compromise: 0.4, ego: 0.5, composite: 0.35 },
      betrayalScores: { defectionProbability: 0.25, trustScore: 0.7, gottmanTotal: 1.2 },
      sacredValues: { count: 3, averageProtection: 0.8 },
      gottmanScores: { criticism: 0.3, contempt: 0.2, defensiveness: 0.4, stonewalling: 0.3 },
      overallVulnerability: 0.4,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Intelligence Timeline</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCaptureSnapshot}
            disabled={isCapturing || !profileId}
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture Snapshot
          </Button>
        </div>
        <CardDescription>
          Historical tracking of AGIS metrics with trend analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-4">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Trend Summary */}
        {trends && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MICE Change</span>
                {getTrendIcon(trends.miceChange)}
              </div>
              <p className={`text-lg font-bold ${
                trends.miceChange > 0 ? 'text-red-500' : 
                trends.miceChange < 0 ? 'text-green-500' : ''
              }`}>
                {trends.miceChange > 0 ? '+' : ''}{(trends.miceChange * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Betrayal Change</span>
                {getTrendIcon(trends.betrayalChange)}
              </div>
              <p className={`text-lg font-bold ${
                trends.betrayalChange > 0 ? 'text-red-500' : 
                trends.betrayalChange < 0 ? 'text-green-500' : ''
              }`}>
                {trends.betrayalChange > 0 ? '+' : ''}{(trends.betrayalChange * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data Points</span>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold">{trends.dataPoints}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gottman">Gottman</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No snapshot data available. Capture snapshots to see trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="miceComposite" 
                    name="MICE Score" 
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="betrayalRisk" 
                    name="Betrayal Risk" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="trustScore" 
                    name="Trust Score" 
                    stroke="hsl(var(--chart-3))" 
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="gottman" className="mt-4">
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No Gottman data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="criticism" 
                    name="Criticism" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="contempt" 
                    name="Contempt" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="defensiveness" 
                    name="Defensiveness" 
                    stroke="#f97316" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stonewalling" 
                    name="Stonewalling" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="anomalies" className="mt-4">
            {anomalies.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No significant anomalies detected.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {anomalies.map((anomaly, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-sm">{anomaly.metric}</span>
                      <Badge variant="outline" className="ml-auto">
                        {anomaly.date.toLocaleDateString()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Changed from {(anomaly.previousValue * 100).toFixed(0)}% to{' '}
                      {(anomaly.newValue * 100).toFixed(0)}%{' '}
                      <span className={anomaly.change > 0 ? 'text-red-500' : 'text-green-500'}>
                        ({anomaly.change > 0 ? '+' : ''}{(anomaly.change * 100).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
