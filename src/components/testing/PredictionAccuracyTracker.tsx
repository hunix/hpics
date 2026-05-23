import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Target, TrendingUp, TrendingDown, CheckCircle, XCircle,
  AlertTriangle, BarChart3, Calendar
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { usePredictionAccuracy } from '@/hooks/testing/usePredictionAccuracy';

export function PredictionAccuracyTracker() {
  const [timeRange, setTimeRange] = useState('30');
  const { data: metrics, isLoading } = usePredictionAccuracy(timeRange);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Prediction Accuracy Tracker
          </h2>
          <p className="text-muted-foreground">Monitor and calibrate ML prediction models</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Accuracy</p>
            <p className="text-2xl font-bold">{((metrics?.overallAccuracy || 0) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics?.metrics.map(m => (
          <Card key={m.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                {m.type}
                {getTrendIcon(m.trend)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {m.verifiedPredictions > 0 ? `${(m.accuracy * 100).toFixed(0)}%` : '—'}
                </div>
                <Progress value={m.verifiedPredictions > 0 ? m.accuracy * 100 : 0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>P: {m.precision !== null ? `${(m.precision * 100).toFixed(0)}%` : '—'}</span>
                  <span>R: {m.recall !== null ? `${(m.recall * 100).toFixed(0)}%` : '—'}</span>
                  <span>{m.verifiedPredictions}/{m.totalPredictions}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Accuracy Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent Predictions</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Accuracy Over Time</CardTitle>
              <CardDescription>Track model performance trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.historical || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0.5, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} className="text-xs" />
                    <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                    <Line type="monotone" dataKey="churn" name="Churn" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="network" name="Network" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    <Line type="monotone" dataKey="behavioral" name="Behavioral" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Verified Predictions</CardTitle>
              <CardDescription>Predictions compared to actual outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {metrics?.recent.map(pred => (
                    <div key={pred.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {pred.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{pred.type}</p>
                          <p className="text-sm text-muted-foreground">
                            Predicted: {pred.predicted} | Actual: {pred.actual}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={pred.correct ? 'default' : 'destructive'}>
                          {pred.correct ? 'Correct' : 'Incorrect'}
                        </Badge>
                        {pred.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(pred.date), 'MMM dd')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!metrics?.recent || metrics.recent.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No verified predictions yet</p>
                      <p className="text-sm">Predictions need outcome verification</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Calibration</CardTitle>
              <CardDescription>Compare predicted probabilities vs actual frequencies</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.calibration && metrics.calibration.some((c) => c.sampleCount > 0) ? (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.calibration}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="bin" className="text-xs" />
                        <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} className="text-xs" />
                        <Tooltip
                          formatter={(v, name) => {
                            if (v === null || v === undefined) return ['no samples', name as string];
                            return [`${(Number(v) * 100).toFixed(1)}%`, name as string];
                          }}
                          labelFormatter={(label, payload) => {
                            const sample = (payload?.[0]?.payload as { sampleCount?: number } | undefined)?.sampleCount ?? 0;
                            return `${label} · ${sample} sample${sample === 1 ? '' : 's'}`;
                          }}
                        />
                        <Bar dataKey="predicted" name="Predicted" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Actual" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Well-calibrated models show predicted and actual bars at similar heights
                  </p>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No verified churn predictions in this window yet — calibration plot will populate once outcomes are recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
