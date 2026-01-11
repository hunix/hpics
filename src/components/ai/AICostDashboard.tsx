import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Zap, Clock, AlertTriangle,
  Brain, Target, Activity, Users
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface UsageStats {
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  avgCostPerCall: number;
  avgTokensPerCall: number;
  avgResponseTime: number;
  successRate: number;
  costByDay: { date: string; cost: number; calls: number }[];
  costByFunction: { function: string; cost: number; calls: number }[];
  costByModel: { model: string; cost: number; calls: number }[];
  costByContact: { profileId: string; name: string; cost: number; calls: number }[];
  recentCalls: any[];
  budget: { daily: number; weekly: number; monthly: number } | null;
  previousPeriodCost: number;
}

export function AICostDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ai-usage-stats', timeRange, user?.id],
    queryFn: async (): Promise<UsageStats> => {
      const days = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();
      const previousStart = startOfDay(subDays(new Date(), days * 2)).toISOString();

      // Fetch logs with profile info
      const { data: logs, error } = await supabase
        .from('ai_usage_logs')
        .select('*, profiles:profile_id(first_name, last_name)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch previous period for comparison
      const { data: prevLogs } = await supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents')
        .gte('created_at', previousStart)
        .lt('created_at', startDate);

      // Fetch budget from user_preferences
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('ai_budget_daily_limit_cents, ai_budget_weekly_limit_cents, ai_budget_monthly_limit_cents')
        .eq('user_id', user?.id)
        .single();

      const allLogs = logs || [];
      const previousPeriodCost = (prevLogs || []).reduce((sum, log) => sum + (log.actual_cost_cents || 0), 0);

      // Calculate totals
      const totalCost = allLogs.reduce((sum, log) => sum + (log.actual_cost_cents || 0), 0);
      const totalTokens = allLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
      const successfulCalls = allLogs.filter(log => log.status === 'completed');
      const avgResponseTime = successfulCalls.length > 0
        ? successfulCalls.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / successfulCalls.length
        : 0;

      // Group by day
      const costByDayMap: Record<string, { cost: number; calls: number }> = {};
      allLogs.forEach(log => {
        const date = format(new Date(log.created_at), 'yyyy-MM-dd');
        if (!costByDayMap[date]) {
          costByDayMap[date] = { cost: 0, calls: 0 };
        }
        costByDayMap[date].cost += log.actual_cost_cents || 0;
        costByDayMap[date].calls += 1;
      });

      // Group by function
      const costByFunctionMap: Record<string, { cost: number; calls: number }> = {};
      allLogs.forEach(log => {
        const fn = log.function_name || 'unknown';
        if (!costByFunctionMap[fn]) {
          costByFunctionMap[fn] = { cost: 0, calls: 0 };
        }
        costByFunctionMap[fn].cost += log.actual_cost_cents || 0;
        costByFunctionMap[fn].calls += 1;
      });

      // Group by model
      const costByModelMap: Record<string, { cost: number; calls: number }> = {};
      allLogs.forEach(log => {
        const model = log.model_name || 'unknown';
        if (!costByModelMap[model]) {
          costByModelMap[model] = { cost: 0, calls: 0 };
        }
        costByModelMap[model].cost += log.actual_cost_cents || 0;
        costByModelMap[model].calls += 1;
      });

      // Group by contact
      const costByContactMap: Record<string, { name: string; cost: number; calls: number }> = {};
      allLogs.forEach(log => {
        if (log.profile_id) {
          const profile = log.profiles as { first_name?: string; last_name?: string } | null;
          const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
          if (!costByContactMap[log.profile_id]) {
            costByContactMap[log.profile_id] = { name, cost: 0, calls: 0 };
          }
          costByContactMap[log.profile_id].cost += log.actual_cost_cents || 0;
          costByContactMap[log.profile_id].calls += 1;
        }
      });

      return {
        totalCost,
        totalTokens,
        totalCalls: allLogs.length,
        avgCostPerCall: allLogs.length > 0 ? totalCost / allLogs.length : 0,
        avgTokensPerCall: allLogs.length > 0 ? totalTokens / allLogs.length : 0,
        avgResponseTime,
        successRate: allLogs.length > 0 ? (successfulCalls.length / allLogs.length) * 100 : 100,
        costByDay: Object.entries(costByDayMap)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        costByFunction: Object.entries(costByFunctionMap)
          .map(([fn, data]) => ({ function: fn, ...data }))
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 10),
        costByModel: Object.entries(costByModelMap)
          .map(([model, data]) => ({ model, ...data }))
          .sort((a, b) => b.cost - a.cost),
        costByContact: Object.entries(costByContactMap)
          .map(([profileId, data]) => ({ profileId, ...data }))
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 10),
        recentCalls: allLogs.slice(0, 20),
        budget: userPrefs ? {
          daily: userPrefs.ai_budget_daily_limit_cents || 0,
          weekly: userPrefs.ai_budget_weekly_limit_cents || 0,
          monthly: userPrefs.ai_budget_monthly_limit_cents || 0,
        } : null,
        previousPeriodCost,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Cost Dashboard</h2>
          <p className="text-muted-foreground">Monitor AI usage, costs, and performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget Progress Section */}
      {stats?.budget && (stats.budget.daily > 0 || stats.budget.weekly > 0 || stats.budget.monthly > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.budget.daily > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily</span>
                    <span>{formatCost(stats.totalCost / parseInt(timeRange))} / {formatCost(stats.budget.daily)}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, ((stats.totalCost / parseInt(timeRange)) / stats.budget.daily) * 100)} 
                    className="h-2"
                  />
                </div>
              )}
              {stats.budget.weekly > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weekly</span>
                    <span>{formatCost(stats.totalCost)} / {formatCost(stats.budget.weekly)}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (stats.totalCost / stats.budget.weekly) * 100)} 
                    className="h-2"
                  />
                </div>
              )}
              {stats.budget.monthly > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly</span>
                    <span>{formatCost(stats.totalCost)} / {formatCost(stats.budget.monthly)}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (stats.totalCost / stats.budget.monthly) * 100)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatCost(stats?.totalCost || 0)}</p>
                  {stats?.previousPeriodCost !== undefined && stats.previousPeriodCost > 0 && (
                    <Badge variant={stats.totalCost > stats.previousPeriodCost ? 'destructive' : 'default'} className="text-xs">
                      {stats.totalCost > stats.previousPeriodCost ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(((stats.totalCost - stats.previousPeriodCost) / stats.previousPeriodCost) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{formatNumber(stats?.totalCalls || 0)}</p>
              </div>
              <Zap className="h-8 w-8 text-chart-2 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{formatNumber(stats?.totalTokens || 0)}</p>
              </div>
              <Brain className="h-8 w-8 text-chart-3 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{(stats?.successRate || 100).toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-chart-4 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="spending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spending">Spending Trend</TabsTrigger>
          <TabsTrigger value="contacts">By Contact</TabsTrigger>
          <TabsTrigger value="functions">By Function</TabsTrigger>
          <TabsTrigger value="models">By Model</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="spending">
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending</CardTitle>
              <CardDescription>AI costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.costByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(v) => format(new Date(v), 'MM/dd')}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${(v / 100).toFixed(2)}`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCost(value), 'Cost']}
                      labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cost by Contact
              </CardTitle>
              <CardDescription>Top 10 contacts by AI spend</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.costByContact && stats.costByContact.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.costByContact} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(v) => formatCost(v)}
                        className="text-xs"
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'cost' ? formatCost(value) : value,
                          name === 'cost' ? 'Cost' : 'Calls'
                        ]}
                      />
                      <Bar dataKey="cost" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No contact-specific AI usage recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Function</CardTitle>
              <CardDescription>Top 10 most expensive functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.costByFunction || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => formatCost(v)}
                      className="text-xs"
                    />
                    <YAxis 
                      type="category" 
                      dataKey="function" 
                      width={150}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'cost' ? formatCost(value) : value,
                        name === 'cost' ? 'Cost' : 'Calls'
                      ]}
                    />
                    <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Distribution</CardTitle>
              <CardDescription>Cost and usage by AI model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.costByModel || []}
                      dataKey="cost"
                      nameKey="model"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ model, percent }) => `${model.split('/')[1] || model}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(stats?.costByModel || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCost(value), 'Cost']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto text-primary opacity-50 mb-2" />
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">{((stats?.avgResponseTime || 0) / 1000).toFixed(2)}s</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-chart-2 opacity-50 mb-2" />
                  <p className="text-sm text-muted-foreground">Avg Cost / Call</p>
                  <p className="text-2xl font-bold">{formatCost(stats?.avgCostPerCall || 0)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto text-chart-3 opacity-50 mb-2" />
                  <p className="text-sm text-muted-foreground">Avg Tokens / Call</p>
                  <p className="text-2xl font-bold">{formatNumber(Math.round(stats?.avgTokensPerCall || 0))}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Calls</CardTitle>
          <CardDescription>Last 20 AI operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Function</th>
                  <th className="text-left py-2 px-2">Model</th>
                  <th className="text-right py-2 px-2">Tokens</th>
                  <th className="text-right py-2 px-2">Cost</th>
                  <th className="text-right py-2 px-2">Time</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentCalls || []).map((call, i) => (
                  <tr key={call.id || i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-mono text-xs">{call.function_name}</td>
                    <td className="py-2 px-2 text-xs">{call.model_name?.split('/')[1] || call.model_name}</td>
                    <td className="py-2 px-2 text-right">{formatNumber(call.total_tokens || 0)}</td>
                    <td className="py-2 px-2 text-right">{formatCost(call.actual_cost_cents || 0)}</td>
                    <td className="py-2 px-2 text-right">{((call.response_time_ms || 0) / 1000).toFixed(2)}s</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant={call.status === 'completed' ? 'default' : 'destructive'} className="text-xs">
                        {call.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
