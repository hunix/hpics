/**
 * AI Cost Analytics Dashboard
 * Enhancement Roadmap Phase 5: Cost Dashboard UI
 * 
 * Provides comprehensive spend tracking, anomaly detection,
 * model breakdown, and trend visualization.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, 
  BarChart3, PieChart, Activity, Zap, Brain, Sparkles,
  RefreshCw, Download, Clock, Target
} from 'lucide-react';
import { formatCentsToUSD } from '@/lib/aiPricing';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

interface SpendByModel {
  model: string;
  totalCost: number;
  callCount: number;
  avgCost: number;
  tokens: number;
}

interface SpendByFunction {
  functionName: string;
  totalCost: number;
  callCount: number;
  avgLatency: number;
  successRate: number;
}

interface DailySpend {
  date: string;
  cost: number;
  calls: number;
}

interface CostAnomaly {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  value: number;
  threshold: number;
  detectedAt: string;
}

export function CostAnalyticsDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), days)).toISOString();
  const endDate = endOfDay(new Date()).toISOString();

  // Fetch usage logs
  const { data: usageLogs, isLoading } = useQuery({
    queryKey: ['cost-analytics', user?.id, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch cost anomalies
  const { data: anomalies } = useQuery({
    queryKey: ['cost-anomalies', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('cost_anomaly_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return (data || []).map((a: any): CostAnomaly => ({
        id: a.id,
        type: a.anomaly_type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        value: a.anomaly_value,
        threshold: a.threshold_value,
        detectedAt: a.created_at,
      }));
    },
    enabled: !!user,
  });

  // Calculate aggregated metrics
  const metrics = usageLogs ? calculateMetrics(usageLogs) : null;
  const modelBreakdown = usageLogs ? calculateModelBreakdown(usageLogs) : [];
  const functionBreakdown = usageLogs ? calculateFunctionBreakdown(usageLogs) : [];
  const dailySpend = usageLogs ? calculateDailySpend(usageLogs, days) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
            <DollarSign className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Cost Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Spending insights, model efficiency, and anomaly detection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: '7d' | '30d' | '90d') => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Anomalies Alert */}
      {anomalies && anomalies.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium text-amber-400">
                  {anomalies.length} Cost Anomal{anomalies.length === 1 ? 'y' : 'ies'} Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  {anomalies[0].title}: {anomalies[0].description}
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                Review
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total Spend</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCentsToUSD(metrics?.totalCost || 0)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {(metrics?.costTrend || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-400" />
              )}
              <span className="text-xs text-muted-foreground">
                {Math.abs(metrics?.costTrend || 0).toFixed(1)}% vs prev period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">API Calls</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {(metrics?.totalCalls || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {formatCentsToUSD(metrics?.avgCostPerCall || 0)}/call
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Tokens Used</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {formatTokens(metrics?.totalTokens || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCentsToUSD((metrics?.totalCost || 0) / ((metrics?.totalTokens || 1) / 1000000))}/1M tokens
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {((metrics?.avgLatency || 0) / 1000).toFixed(1)}s
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics?.successRate || 0) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed breakdown */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models" className="gap-2">
            <Brain className="h-4 w-4" />
            By Model
          </TabsTrigger>
          <TabsTrigger value="functions" className="gap-2">
            <Target className="h-4 w-4" />
            By Function
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Anomalies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spend by Model</CardTitle>
              <CardDescription>Cost distribution across AI models</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {modelBreakdown.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No usage data</p>
                  ) : (
                    modelBreakdown.map((model) => (
                      <div key={model.model} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">{model.model}</span>
                          </div>
                          <span className="font-bold">{formatCentsToUSD(model.totalCost)}</span>
                        </div>
                        <Progress 
                          value={(model.totalCost / (metrics?.totalCost || 1)) * 100} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{model.callCount.toLocaleString()} calls</span>
                          <span>Avg {formatCentsToUSD(model.avgCost)}/call</span>
                          <span>{formatTokens(model.tokens)} tokens</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spend by Function</CardTitle>
              <CardDescription>Cost breakdown by edge function</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {functionBreakdown.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No usage data</p>
                  ) : (
                    functionBreakdown.map((fn) => (
                      <div key={fn.functionName} className="p-3 rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{fn.functionName}</span>
                          <span className="font-bold text-sm">{formatCentsToUSD(fn.totalCost)}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Calls</span>
                            <p className="font-medium">{fn.callCount}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Cost</span>
                            <p className="font-medium">{formatCentsToUSD(fn.totalCost / fn.callCount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latency</span>
                            <p className="font-medium">{(fn.avgLatency / 1000).toFixed(1)}s</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Success</span>
                            <p className={`font-medium ${fn.successRate >= 0.95 ? 'text-green-400' : fn.successRate >= 0.8 ? 'text-amber-400' : 'text-red-400'}`}>
                              {(fn.successRate * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Spend Timeline</CardTitle>
              <CardDescription>Cost trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-end gap-1">
                {dailySpend.map((day, idx) => {
                  const maxCost = Math.max(...dailySpend.map(d => d.cost), 1);
                  const height = (day.cost / maxCost) * 100;
                  return (
                    <div 
                      key={day.date} 
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${day.date}: ${formatCentsToUSD(day.cost)} (${day.calls} calls)`}
                    >
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-500/50 to-emerald-400/30 rounded-t transition-all hover:from-emerald-500/70 hover:to-emerald-400/50"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {idx % (days > 30 ? 10 : days > 7 ? 5 : 1) === 0 && (
                        <span className="text-[9px] text-muted-foreground rotate-45 origin-left">
                          {format(new Date(day.date), 'MM/dd')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Anomalies</CardTitle>
              <CardDescription>Unusual spending patterns detected</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {!anomalies || anomalies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No anomalies detected</p>
                    <p className="text-sm">Your spending patterns look normal</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalies.map((anomaly) => (
                      <div 
                        key={anomaly.id} 
                        className={`p-4 rounded-lg border ${
                          anomaly.severity === 'high' 
                            ? 'bg-red-500/10 border-red-500/30' 
                            : anomaly.severity === 'medium'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 ${
                                anomaly.severity === 'high' ? 'text-red-400' :
                                anomaly.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                              }`} />
                              <span className="font-medium">{anomaly.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span>Value: {formatCentsToUSD(anomaly.value * 100)}</span>
                              <span>Threshold: {formatCentsToUSD(anomaly.threshold * 100)}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {anomaly.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function calculateMetrics(logs: any[]) {
  const completed = logs.filter(l => l.status === 'completed');
  const totalCost = completed.reduce((sum, l) => sum + (l.actual_cost_cents || 0), 0);
  const totalCalls = completed.length;
  const totalTokens = completed.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
  const avgLatency = completed.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / (totalCalls || 1);
  const successRate = logs.length > 0 ? completed.length / logs.length : 1;
  
  // Calculate trend (simplified - comparing first half to second half)
  const mid = Math.floor(completed.length / 2);
  const firstHalf = completed.slice(mid);
  const secondHalf = completed.slice(0, mid);
  const firstCost = firstHalf.reduce((s, l) => s + (l.actual_cost_cents || 0), 0);
  const secondCost = secondHalf.reduce((s, l) => s + (l.actual_cost_cents || 0), 0);
  const costTrend = firstCost > 0 ? ((secondCost - firstCost) / firstCost) * 100 : 0;

  return {
    totalCost,
    totalCalls,
    totalTokens,
    avgCostPerCall: totalCost / (totalCalls || 1),
    avgLatency,
    successRate,
    costTrend,
  };
}

function calculateModelBreakdown(logs: any[]): SpendByModel[] {
  const byModel = new Map<string, { cost: number; calls: number; tokens: number }>();
  
  logs.filter(l => l.status === 'completed').forEach(log => {
    const model = log.model_used || 'unknown';
    const existing = byModel.get(model) || { cost: 0, calls: 0, tokens: 0 };
    byModel.set(model, {
      cost: existing.cost + (log.actual_cost_cents || 0),
      calls: existing.calls + 1,
      tokens: existing.tokens + (log.tokens_used || 0),
    });
  });

  return Array.from(byModel.entries())
    .map(([model, data]) => ({
      model,
      totalCost: data.cost,
      callCount: data.calls,
      avgCost: data.cost / data.calls,
      tokens: data.tokens,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

function calculateFunctionBreakdown(logs: any[]): SpendByFunction[] {
  const byFunction = new Map<string, { cost: number; calls: number; latency: number; success: number; total: number }>();
  
  logs.forEach(log => {
    const fn = log.function_name || 'unknown';
    const existing = byFunction.get(fn) || { cost: 0, calls: 0, latency: 0, success: 0, total: 0 };
    byFunction.set(fn, {
      cost: existing.cost + (log.actual_cost_cents || 0),
      calls: existing.calls + (log.status === 'completed' ? 1 : 0),
      latency: existing.latency + (log.latency_ms || 0),
      success: existing.success + (log.status === 'completed' ? 1 : 0),
      total: existing.total + 1,
    });
  });

  return Array.from(byFunction.entries())
    .map(([functionName, data]) => ({
      functionName,
      totalCost: data.cost,
      callCount: data.calls,
      avgLatency: data.latency / (data.calls || 1),
      successRate: data.total > 0 ? data.success / data.total : 1,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

function calculateDailySpend(logs: any[], days: number): DailySpend[] {
  const interval = eachDayOfInterval({
    start: subDays(new Date(), days - 1),
    end: new Date(),
  });

  const byDate = new Map<string, { cost: number; calls: number }>();
  interval.forEach(date => {
    byDate.set(format(date, 'yyyy-MM-dd'), { cost: 0, calls: 0 });
  });

  logs.filter(l => l.status === 'completed').forEach(log => {
    const date = format(new Date(log.created_at), 'yyyy-MM-dd');
    const existing = byDate.get(date);
    if (existing) {
      byDate.set(date, {
        cost: existing.cost + (log.actual_cost_cents || 0),
        calls: existing.calls + 1,
      });
    }
  });

  return Array.from(byDate.entries()).map(([date, data]) => ({
    date,
    cost: data.cost,
    calls: data.calls,
  }));
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}
