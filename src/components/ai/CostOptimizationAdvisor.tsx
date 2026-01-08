import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Lightbulb, TrendingDown, Zap, ArrowRight, DollarSign, Clock } from 'lucide-react';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

interface OptimizationSuggestion {
  id: string;
  type: 'model_downgrade' | 'caching' | 'batching' | 'prompt_optimization' | 'time_shift';
  title: string;
  description: string;
  estimatedSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  affectedFunctions: string[];
  priority: number;
}

export function CostOptimizationAdvisor() {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['cost-optimization-suggestions'],
    queryFn: async (): Promise<OptimizationSuggestion[]> => {
      const startDate = startOfDay(subDays(new Date(), 30)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      const { data: logs } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (!logs || logs.length === 0) return [];

      const suggestions: OptimizationSuggestion[] = [];
      let suggestionId = 1;

      // Analyze by function
      const byFunction: Record<string, { 
        cost: number; 
        calls: number; 
        models: Record<string, number>;
        avgTokens: number;
        avgResponseTime: number;
      }> = {};

      logs.forEach(log => {
        const fn = log.function_name || 'unknown';
        if (!byFunction[fn]) {
          byFunction[fn] = { cost: 0, calls: 0, models: {}, avgTokens: 0, avgResponseTime: 0 };
        }
        byFunction[fn].cost += log.actual_cost_cents || 0;
        byFunction[fn].calls += 1;
        byFunction[fn].avgTokens += log.total_tokens || 0;
        byFunction[fn].avgResponseTime += log.response_time_ms || 0;
        
        const model = log.model_name || 'unknown';
        byFunction[fn].models[model] = (byFunction[fn].models[model] || 0) + 1;
      });

      // Calculate averages
      Object.values(byFunction).forEach(fn => {
        fn.avgTokens = fn.calls > 0 ? fn.avgTokens / fn.calls : 0;
        fn.avgResponseTime = fn.calls > 0 ? fn.avgResponseTime / fn.calls : 0;
      });

      // Model downgrade suggestions (using expensive models for simple tasks)
      Object.entries(byFunction).forEach(([fnName, data]) => {
        const expensiveModels = Object.entries(data.models)
          .filter(([model]) => model.includes('pro') || model.includes('gpt-5') && !model.includes('mini') && !model.includes('nano'))
          .reduce((sum, [, count]) => sum + count, 0);
        
        if (expensiveModels > data.calls * 0.3 && data.avgTokens < 2000) {
          suggestions.push({
            id: `suggestion-${suggestionId++}`,
            type: 'model_downgrade',
            title: `Switch ${fnName} to lighter model`,
            description: `This function uses expensive models for relatively simple tasks (avg ${Math.round(data.avgTokens)} tokens). Consider using gemini-2.5-flash or gpt-5-mini.`,
            estimatedSavings: Math.round(data.cost * 0.4),
            implementationEffort: 'low',
            affectedFunctions: [fnName],
            priority: data.cost > 500 ? 1 : 2,
          });
        }
      });

      // Caching suggestions (repeated similar calls)
      const highVolumeNonCached = Object.entries(byFunction)
        .filter(([, data]) => data.calls > 50 && data.avgTokens < 1500)
        .sort((a, b) => b[1].cost - a[1].cost)
        .slice(0, 3);

      if (highVolumeNonCached.length > 0) {
        suggestions.push({
          id: `suggestion-${suggestionId++}`,
          type: 'caching',
          title: 'Implement response caching',
          description: `High-volume functions with small context could benefit from caching identical requests.`,
          estimatedSavings: highVolumeNonCached.reduce((sum, [, d]) => sum + d.cost * 0.3, 0),
          implementationEffort: 'medium',
          affectedFunctions: highVolumeNonCached.map(([fn]) => fn),
          priority: 1,
        });
      }

      // Batching suggestions
      const batchableFunctions = Object.entries(byFunction)
        .filter(([, data]) => data.calls > 100 && data.avgResponseTime > 2000)
        .sort((a, b) => b[1].calls - a[1].calls);

      if (batchableFunctions.length > 0) {
        suggestions.push({
          id: `suggestion-${suggestionId++}`,
          type: 'batching',
          title: 'Batch sequential requests',
          description: `Functions with many small calls could be batched for better throughput and reduced overhead.`,
          estimatedSavings: batchableFunctions.reduce((sum, [, d]) => sum + d.cost * 0.15, 0),
          implementationEffort: 'high',
          affectedFunctions: batchableFunctions.map(([fn]) => fn),
          priority: 2,
        });
      }

      // Prompt optimization (large average tokens)
      const largePromptFunctions = Object.entries(byFunction)
        .filter(([, data]) => data.avgTokens > 4000)
        .sort((a, b) => b[1].avgTokens - a[1].avgTokens);

      if (largePromptFunctions.length > 0) {
        suggestions.push({
          id: `suggestion-${suggestionId++}`,
          type: 'prompt_optimization',
          title: 'Optimize large prompts',
          description: `Some functions use very large prompts. Reducing prompt size by 20% could significantly cut costs.`,
          estimatedSavings: largePromptFunctions.reduce((sum, [, d]) => sum + d.cost * 0.2, 0),
          implementationEffort: 'medium',
          affectedFunctions: largePromptFunctions.map(([fn]) => fn),
          priority: 2,
        });
      }

      return suggestions.sort((a, b) => a.priority - b.priority || b.estimatedSavings - a.estimatedSavings);
    },
    staleTime: 300000,
  });

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low': return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Easy</Badge>;
      case 'medium': return <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Medium</Badge>;
      case 'high': return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Complex</Badge>;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'model_downgrade': return <TrendingDown className="h-4 w-4" />;
      case 'caching': return <Zap className="h-4 w-4" />;
      case 'batching': return <Clock className="h-4 w-4" />;
      case 'prompt_optimization': return <Lightbulb className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const totalSavings = suggestions?.reduce((sum, s) => sum + s.estimatedSavings, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Cost Optimization Advisor
        </CardTitle>
        <CardDescription>
          AI-powered recommendations to reduce costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalSavings > 0 && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Potential Monthly Savings</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCost(totalSavings)}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-green-500" />
            </div>
          </div>
        )}

        {suggestions && suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(suggestion.type)}
                    <h4 className="font-medium">{suggestion.title}</h4>
                  </div>
                  {getEffortBadge(suggestion.implementationEffort)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-green-600">
                      Save {formatCost(suggestion.estimatedSavings)}/mo
                    </Badge>
                    <span className="text-muted-foreground">
                      {suggestion.affectedFunctions.length} function{suggestion.affectedFunctions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Details <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No optimization suggestions available</p>
            <p className="text-sm">Your AI usage is already well optimized!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
