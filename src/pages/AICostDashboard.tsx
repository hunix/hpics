import { useState } from 'react';
import { useAIBudget } from '@/hooks/useAIBudget';
import { useAIUsageLogs, useAICacheStats, type CostTimeRange } from '@/hooks/intelligence/useCostAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, Zap, 
  BarChart3, PieChart, Clock, AlertTriangle, CheckCircle,
  Cpu, Brain, Database, RefreshCw
} from 'lucide-react';
import { formatCentsToUSD, AI_MODEL_PRICING, getProviderColor } from '@/lib/aiPricing';
import { format } from 'date-fns';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, 
  Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 
                '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AICostDashboard() {
  const budget = useAIBudget();
  const [timeRange, setTimeRange] = useState<CostTimeRange>('30d');

  const { data: usageLogs, isLoading: logsLoading, refetch } = useAIUsageLogs(timeRange);
  const { data: cacheStats } = useAICacheStats();

  // Process data for charts
  const processedData = usageLogs?.reduce((acc, log) => {
    const date = format(new Date(log.created_at), 'MMM dd');
    const existing = acc.find(d => d.date === date);
    const cost = log.actual_cost_cents || log.estimated_cost_cents || 0;
    const tokens = log.total_tokens || 0;
    
    if (existing) {
      existing.cost += cost;
      existing.tokens += tokens;
      existing.requests += 1;
    } else {
      acc.push({ date, cost, tokens, requests: 1 });
    }
    return acc;
  }, [] as { date: string; cost: number; tokens: number; requests: number }[]) || [];

  // Model usage breakdown
  const modelUsage = usageLogs?.reduce((acc, log) => {
    const model = log.model_name || 'unknown';
    const existing = acc.find(m => m.model === model);
    const cost = log.actual_cost_cents || log.estimated_cost_cents || 0;
    
    if (existing) {
      existing.cost += cost;
      existing.count += 1;
    } else {
      acc.push({ model, cost, count: 1, displayName: AI_MODEL_PRICING[model]?.displayName || model });
    }
    return acc;
  }, [] as { model: string; cost: number; count: number; displayName: string }[]) || [];

  // Function usage breakdown
  const functionUsage = usageLogs?.reduce((acc, log) => {
    const func = log.function_name || 'unknown';
    const existing = acc.find(f => f.function === func);
    const cost = log.actual_cost_cents || log.estimated_cost_cents || 0;
    
    if (existing) {
      existing.cost += cost;
      existing.count += 1;
    } else {
      acc.push({ function: func, cost, count: 1 });
    }
    return acc;
  }, [] as { function: string; cost: number; count: number }[])?.sort((a, b) => b.cost - a.cost).slice(0, 10) || [];

  // Calculate totals
  const totalCost = usageLogs?.reduce((sum, log) => sum + (log.actual_cost_cents || log.estimated_cost_cents || 0), 0) || 0;
  const totalTokens = usageLogs?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0;
  const totalRequests = usageLogs?.length || 0;
  const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
  const successRate = usageLogs?.filter(l => l.status === 'success').length || 0;
  const successPercentage = totalRequests > 0 ? (successRate / totalRequests) * 100 : 0;

  // Cost trend (compare to previous period)
  const midpoint = Math.floor((usageLogs?.length || 0) / 2);
  const recentCost = usageLogs?.slice(0, midpoint).reduce((sum, l) => sum + (l.actual_cost_cents || l.estimated_cost_cents || 0), 0) || 0;
  const olderCost = usageLogs?.slice(midpoint).reduce((sum, l) => sum + (l.actual_cost_cents || l.estimated_cost_cents || 0), 0) || 0;
  const costTrend = olderCost > 0 ? ((recentCost - olderCost) / olderCost) * 100 : 0;

  if (logsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Cost Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Monitor and optimize your AI usage and spending</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Budget Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Daily', data: budget.daily, icon: Clock },
            { label: 'Weekly', data: budget.weekly, icon: Activity },
            { label: 'Monthly', data: budget.monthly, icon: BarChart3 },
          ].map(({ label, data, icon: Icon }) => (
            <Card key={label} className={data.isOver ? 'border-destructive' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{label} Budget</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{formatCentsToUSD(data.spent)}</span>
                    {data.budget && (
                      <span className="text-sm text-muted-foreground">
                        of {formatCentsToUSD(data.budget)}
                      </span>
                    )}
                  </div>
                  {data.budget && (
                    <Progress 
                      value={data.percentage} 
                      className={data.percentage > 80 ? 'bg-destructive/20' : ''}
                    />
                  )}
                  {data.isOver && (
                    <div className="flex items-center gap-1 text-destructive text-sm">
                      <AlertTriangle className="h-3 w-3" />
                      Budget exceeded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Spend</span>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCentsToUSD(totalCost)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Total Tokens</span>
              </div>
              <p className="text-2xl font-bold mt-2">{(totalTokens / 1000).toFixed(1)}K</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Requests</span>
              </div>
              <p className="text-2xl font-bold mt-2">{totalRequests}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {costTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm text-muted-foreground">Cost Trend</span>
              </div>
              <p className={`text-2xl font-bold mt-2 ${costTrend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {costTrend >= 0 ? '+' : ''}{costTrend.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Success Rate</span>
              </div>
              <p className="text-2xl font-bold mt-2">{successPercentage.toFixed(1)}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Cache Saved</span>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCentsToUSD(cacheStats?.costSaved || 0)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Cost Trends</TabsTrigger>
            <TabsTrigger value="models">Model Usage</TabsTrigger>
            <TabsTrigger value="functions">Function Analysis</TabsTrigger>
            <TabsTrigger value="logs">Recent Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Cost Over Time</CardTitle>
                  <CardDescription>Track your spending patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={processedData.reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v/100).toFixed(2)}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [formatCentsToUSD(value), 'Cost']}
                      />
                      <Area type="monotone" dataKey="cost" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Token Usage Over Time</CardTitle>
                  <CardDescription>Input and output token consumption</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [`${(value/1000).toFixed(1)}K`, 'Tokens']}
                      />
                      <Line type="monotone" dataKey="tokens" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="models">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cost by Model</CardTitle>
                  <CardDescription>Breakdown of spending per AI model</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={modelUsage}
                        dataKey="cost"
                        nameKey="displayName"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ displayName, percent }) => `${displayName} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {modelUsage.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCentsToUSD(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requests by Model</CardTitle>
                  <CardDescription>Number of API calls per model</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modelUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="displayName" type="category" width={120} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="functions">
            <Card>
              <CardHeader>
                <CardTitle>Top Functions by Cost</CardTitle>
                <CardDescription>Most expensive edge functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {functionUsage.map((func, i) => (
                    <div key={func.function} className="flex items-center gap-4">
                      <span className="text-muted-foreground w-6">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{func.function}</span>
                          <span className="text-sm text-muted-foreground">{func.count} calls</span>
                        </div>
                        <Progress value={(func.cost / (functionUsage[0]?.cost || 1)) * 100} className="h-2" />
                      </div>
                      <span className="font-mono text-sm w-20 text-right">{formatCentsToUSD(func.cost)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Usage Logs</CardTitle>
                <CardDescription>Latest {Math.min(50, usageLogs?.length || 0)} requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {usageLogs?.slice(0, 50).map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className="w-16 justify-center"
                          >
                            {log.status}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{log.function_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {AI_MODEL_PRICING[log.model_name]?.displayName || log.model_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm">
                            {formatCentsToUSD(log.actual_cost_cents || log.estimated_cost_cents || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cache Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Cache Performance
            </CardTitle>
            <CardDescription>Semantic caching saves costs by reusing similar requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <p className="text-3xl font-bold text-green-500">{formatCentsToUSD(cacheStats?.costSaved || 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Cost Saved</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10">
                <p className="text-3xl font-bold text-blue-500">{((cacheStats?.tokensSaved || 0) / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground mt-1">Tokens Saved</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-500/10">
                <p className="text-3xl font-bold text-purple-500">{cacheStats?.totalHits || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Cache Hits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
