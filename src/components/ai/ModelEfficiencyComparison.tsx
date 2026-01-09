import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Zap, DollarSign, Clock, Target, ArrowRight, Lightbulb } from 'lucide-react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip
} from 'recharts';

interface ModelStats {
  model: string;
  total_calls: number;
  total_cost_cents: number;
  total_tokens: number;
  avg_response_time_ms: number;
  success_rate: number;
  avg_cost_per_call: number;
  avg_tokens_per_call: number;
}

interface OptimizationSuggestion {
  current_model: string;
  suggested_model: string;
  potential_savings_cents: number;
  affected_calls: number;
  reason: string;
}

const MODEL_TIERS: Record<string, { tier: 'premium' | 'standard' | 'economy', costFactor: number }> = {
  'google/gemini-2.5-pro': { tier: 'premium', costFactor: 1.0 },
  'google/gemini-3-pro-preview': { tier: 'premium', costFactor: 1.0 },
  'openai/gpt-5': { tier: 'premium', costFactor: 1.2 },
  'openai/gpt-5.2': { tier: 'premium', costFactor: 1.3 },
  'google/gemini-2.5-flash': { tier: 'standard', costFactor: 0.5 },
  'google/gemini-3-flash-preview': { tier: 'standard', costFactor: 0.5 },
  'openai/gpt-5-mini': { tier: 'standard', costFactor: 0.4 },
  'google/gemini-2.5-flash-lite': { tier: 'economy', costFactor: 0.2 },
  'openai/gpt-5-nano': { tier: 'economy', costFactor: 0.15 },
};

export function ModelEfficiencyComparison() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['model-efficiency', user?.id],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('ai_usage_logs')
        .select('model_name, actual_cost_cents, total_tokens, response_time_ms, status, function_name')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      // Aggregate by model
      const modelMap = new Map<string, {
        calls: number;
        cost: number;
        tokens: number;
        responseTime: number;
        successes: number;
        functions: Set<string>;
      }>();

      for (const log of logs || []) {
        const model = log.model_name || 'unknown';
        const existing = modelMap.get(model) || {
          calls: 0,
          cost: 0,
          tokens: 0,
          responseTime: 0,
          successes: 0,
          functions: new Set(),
        };

        existing.calls += 1;
        existing.cost += log.actual_cost_cents || 0;
        existing.tokens += log.total_tokens || 0;
        existing.responseTime += log.response_time_ms || 0;
        if (log.status === 'completed') existing.successes += 1;
        if (log.function_name) existing.functions.add(log.function_name);

        modelMap.set(model, existing);
      }

      const modelStats: ModelStats[] = Array.from(modelMap.entries())
        .map(([model, stats]) => ({
          model,
          total_calls: stats.calls,
          total_cost_cents: stats.cost,
          total_tokens: stats.tokens,
          avg_response_time_ms: stats.calls > 0 ? stats.responseTime / stats.calls : 0,
          success_rate: stats.calls > 0 ? (stats.successes / stats.calls) * 100 : 100,
          avg_cost_per_call: stats.calls > 0 ? stats.cost / stats.calls : 0,
          avg_tokens_per_call: stats.calls > 0 ? stats.tokens / stats.calls : 0,
        }))
        .sort((a, b) => b.total_cost_cents - a.total_cost_cents);

      // Generate optimization suggestions
      const suggestions: OptimizationSuggestion[] = [];
      
      // Find opportunities to downgrade models for simple tasks
      for (const stat of modelStats) {
        const tier = MODEL_TIERS[stat.model];
        if (tier?.tier === 'premium' && stat.avg_tokens_per_call < 500) {
          // Low token usage suggests simple tasks that could use cheaper models
          const savings = Math.round(stat.total_cost_cents * 0.5); // Estimate 50% savings
          suggestions.push({
            current_model: stat.model,
            suggested_model: stat.model.includes('gemini') ? 'google/gemini-2.5-flash' : 'openai/gpt-5-mini',
            potential_savings_cents: savings,
            affected_calls: stat.total_calls,
            reason: 'Low token usage suggests simpler tasks that could use a faster, cheaper model',
          });
        }
      }

      return { modelStats, suggestions };
    },
    enabled: !!user,
  });

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatTime = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  const getTierColor = (model: string) => {
    const tier = MODEL_TIERS[model]?.tier;
    switch (tier) {
      case 'premium': return 'bg-amber-500';
      case 'standard': return 'bg-blue-500';
      case 'economy': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierLabel = (model: string) => {
    return MODEL_TIERS[model]?.tier?.toUpperCase() || 'CUSTOM';
  };

  // Prepare radar chart data
  const radarData = (data?.modelStats || []).slice(0, 5).map(stat => ({
    model: stat.model.split('/')[1] || stat.model,
    cost: Math.min(stat.avg_cost_per_call, 100),
    speed: Math.max(100 - (stat.avg_response_time_ms / 100), 0),
    reliability: stat.success_rate,
    efficiency: Math.min((stat.avg_tokens_per_call / stat.avg_cost_per_call) || 0, 100),
  }));

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
      {/* Optimization Suggestions */}
      {data?.suggestions && data.suggestions.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Optimization Opportunities
            </CardTitle>
            <CardDescription>Ways to reduce AI costs without sacrificing quality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.suggestions.map((suggestion, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-lg bg-background border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={getTierColor(suggestion.current_model)}>
                        {suggestion.current_model.split('/')[1]}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge className={getTierColor(suggestion.suggested_model)}>
                        {suggestion.suggested_model.split('/')[1]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      Save {formatCost(suggestion.potential_savings_cents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.affected_calls} calls affected
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Model Performance Comparison
          </CardTitle>
          <CardDescription>Compare efficiency across AI models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Model</th>
                  <th className="text-center py-2 px-2">Tier</th>
                  <th className="text-right py-2 px-2">Calls</th>
                  <th className="text-right py-2 px-2">Total Cost</th>
                  <th className="text-right py-2 px-2">Avg Cost</th>
                  <th className="text-right py-2 px-2">Avg Time</th>
                  <th className="text-right py-2 px-2">Success</th>
                </tr>
              </thead>
              <tbody>
                {(data?.modelStats || []).map((stat) => (
                  <tr key={stat.model} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-mono text-xs">
                      {stat.model.split('/')[1] || stat.model}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Badge className={`text-xs ${getTierColor(stat.model)}`}>
                        {getTierLabel(stat.model)}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-right">{stat.total_calls}</td>
                    <td className="py-2 px-2 text-right font-medium">
                      {formatCost(stat.total_cost_cents)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {formatCost(stat.avg_cost_per_call)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {formatTime(stat.avg_response_time_ms)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Badge variant={stat.success_rate >= 95 ? 'default' : 'destructive'}>
                        {stat.success_rate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tier Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm">Premium (Best quality)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Standard (Balanced)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Economy (Cost-effective)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
