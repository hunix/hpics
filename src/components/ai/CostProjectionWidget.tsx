import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';
import { format, addDays, subDays, differenceInDays } from 'date-fns';

interface ProjectionData {
  date: string;
  actual?: number;
  projected?: number;
  budget?: number;
}

export function CostProjectionWidget() {
  const { user } = useAuth();
  const [projectionDays, setProjectionDays] = useState<'30' | '60' | '90'>('30');

  const { data: usageData } = useQuery({
    queryKey: ['ai-usage-projection', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents, created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: preferences } = useQuery({
    queryKey: ['user-budget-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as { ai_daily_budget_cents?: number; ai_weekly_budget_cents?: number; ai_monthly_budget_cents?: number } | null;
    },
    enabled: !!user,
  });

  // Calculate daily averages and projections
  const calculateProjections = (): { 
    chartData: ProjectionData[]; 
    totalProjected: number; 
    trend: number;
    exhaustionDate: Date | null;
  } => {
    if (!usageData || usageData.length === 0) {
      return { chartData: [], totalProjected: 0, trend: 0, exhaustionDate: null };
    }

    // Group by day
    const dailyTotals: Record<string, number> = {};
    usageData.forEach(log => {
      const day = format(new Date(log.created_at), 'yyyy-MM-dd');
      dailyTotals[day] = (dailyTotals[day] || 0) + (log.actual_cost_cents || 0);
    });

    const days = Object.keys(dailyTotals).sort();
    const values = days.map(d => dailyTotals[d]);
    
    // Calculate trend (simple linear regression slope)
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
    const intercept = (sumY - slope * sumX) / n;
    
    // Average daily spend
    const avgDaily = sumY / n;
    const trend = slope / (avgDaily || 1) * 100; // Trend as percentage

    // Build chart data with actuals
    const chartData: ProjectionData[] = days.map(day => ({
      date: day,
      actual: dailyTotals[day] / 100, // Convert to dollars
      budget: (preferences?.ai_daily_budget_cents || 0) / 100,
    }));

    // Add projections
    const projectionCount = parseInt(projectionDays);
    const lastDay = days[days.length - 1] || format(new Date(), 'yyyy-MM-dd');
    let cumulativeProjected = 0;
    
    for (let i = 1; i <= projectionCount; i++) {
      const projectedValue = Math.max(0, intercept + slope * (n + i - 1));
      cumulativeProjected += projectedValue;
      chartData.push({
        date: format(addDays(new Date(lastDay), i), 'yyyy-MM-dd'),
        projected: projectedValue / 100,
        budget: (preferences?.ai_daily_budget_cents || 0) / 100,
      });
    }

    // Calculate budget exhaustion date
    let exhaustionDate: Date | null = null;
    if (preferences?.ai_monthly_budget_cents) {
      const monthlyBudget = preferences.ai_monthly_budget_cents;
      const currentMonthSpend = sumY;
      const remaining = monthlyBudget - currentMonthSpend;
      if (remaining > 0 && avgDaily > 0) {
        const daysUntilExhaustion = remaining / avgDaily;
        exhaustionDate = addDays(new Date(), daysUntilExhaustion);
      } else if (remaining <= 0) {
        exhaustionDate = new Date(); // Already exhausted
      }
    }

    return { 
      chartData, 
      totalProjected: cumulativeProjected / 100, 
      trend,
      exhaustionDate 
    };
  };

  const { chartData, totalProjected, trend, exhaustionDate } = calculateProjections();

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Cost Projections
        </CardTitle>
        <Select value={projectionDays} onValueChange={(v: '30' | '60' | '90') => setProjectionDays(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">Projected Spend</div>
            <div className="text-xl font-bold">{formatCurrency(totalProjected)}</div>
            <div className="text-xs text-muted-foreground">Next {projectionDays} days</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">Trend</div>
            <div className={`text-xl font-bold flex items-center gap-1 ${trend > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Daily change</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">Budget Exhaustion</div>
            <div className="text-xl font-bold flex items-center gap-1">
              {exhaustionDate ? (
                <>
                  {differenceInDays(exhaustionDate, new Date()) <= 7 && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {differenceInDays(exhaustionDate, new Date())}d
                </>
              ) : (
                <span className="text-green-600">Safe</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {exhaustionDate ? format(exhaustionDate, 'MMM d') : 'No budget set'}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => format(new Date(v), 'M/d')}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="Actual"
              />
              <Line 
                type="monotone" 
                dataKey="projected" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Projected"
              />
              {preferences?.ai_daily_budget_cents && (
                <ReferenceLine 
                  y={preferences.ai_daily_budget_cents / 100} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Budget', position: 'right', fontSize: 10 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
