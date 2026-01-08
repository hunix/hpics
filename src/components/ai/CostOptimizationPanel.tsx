import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingDown, Zap, RefreshCcw, Check } from 'lucide-react';
import { useState } from 'react';

interface Optimization {
  id: string;
  type: 'model_downgrade' | 'batch_processing' | 'caching' | 'prompt_reduction';
  title: string;
  description: string;
  savings: number;
  impact: 'low' | 'medium' | 'high';
  functionName?: string;
  currentModel?: string;
  suggestedModel?: string;
  applied?: boolean;
}

const IMPACT_COLORS = {
  low: 'bg-green-500/10 text-green-700',
  medium: 'bg-amber-500/10 text-amber-700',
  high: 'bg-destructive/10 text-destructive',
};

export function CostOptimizationPanel() {
  const { user } = useAuth();
  const [appliedOptimizations, setAppliedOptimizations] = useState<Set<string>>(new Set());

  const { data: usageStats } = useQuery({
    queryKey: ['optimization-analysis', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('function_name, model_name, actual_cost_cents, input_tokens, output_tokens')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('actual_cost_cents', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Analyze usage and generate optimization suggestions
  const optimizations: Optimization[] = [];

  if (usageStats && usageStats.length > 0) {
    // Group by function and model
    const functionCosts: Record<string, { total: number; model: string; count: number }> = {};
    usageStats.forEach(log => {
      const key = log.function_name;
      if (!functionCosts[key]) {
        functionCosts[key] = { total: 0, model: log.model_name, count: 0 };
      }
      functionCosts[key].total += log.actual_cost_cents || 0;
      functionCosts[key].count++;
    });

    // Check for expensive models that could be downgraded
    Object.entries(functionCosts).forEach(([func, data]) => {
      if (data.model?.includes('pro') || data.model?.includes('gpt-5')) {
        const potentialSavings = data.total * 0.7; // 70% savings estimate
        if (potentialSavings > 100) { // Only suggest if savings > $1
          optimizations.push({
            id: `downgrade-${func}`,
            type: 'model_downgrade',
            title: `Use lighter model for ${func}`,
            description: `Switch from ${data.model} to a flash/mini model for simple operations`,
            savings: potentialSavings / 100,
            impact: potentialSavings > 500 ? 'low' : 'medium',
            functionName: func,
            currentModel: data.model,
            suggestedModel: data.model.includes('gemini') ? 'gemini-2.5-flash-lite' : 'gpt-5-nano',
          });
        }
      }
    });

    // Check for functions that run frequently (batch opportunity)
    Object.entries(functionCosts).forEach(([func, data]) => {
      if (data.count > 50) {
        optimizations.push({
          id: `batch-${func}`,
          type: 'batch_processing',
          title: `Batch ${func} operations`,
          description: `This function ran ${data.count} times. Batching could reduce overhead costs.`,
          savings: data.total * 0.2 / 100, // 20% savings estimate
          impact: 'low',
          functionName: func,
        });
      }
    });

    // Check for repeated similar queries (caching opportunity)
    const modelUsage: Record<string, number> = {};
    usageStats.forEach(log => {
      const key = `${log.function_name}-${log.model_name}`;
      modelUsage[key] = (modelUsage[key] || 0) + 1;
    });

    Object.entries(modelUsage).forEach(([key, count]) => {
      if (count > 20) {
        const [func] = key.split('-');
        const totalCost = functionCosts[func]?.total || 0;
        optimizations.push({
          id: `cache-${key}`,
          type: 'caching',
          title: `Cache repeated ${func} results`,
          description: `${count} similar queries detected. Implement result caching.`,
          savings: totalCost * 0.3 / 100,
          impact: 'low',
          functionName: func,
        });
      }
    });
  }

  // Add general recommendations
  if (optimizations.length < 3) {
    optimizations.push({
      id: 'prompt-optimization',
      type: 'prompt_reduction',
      title: 'Optimize prompt templates',
      description: 'Review and reduce token usage in system prompts by 20-30%',
      savings: 0,
      impact: 'low',
    });
  }

  const totalPotentialSavings = optimizations.reduce((sum, o) => sum + o.savings, 0);

  const handleApplyOptimization = (id: string) => {
    setAppliedOptimizations(prev => new Set([...prev, id]));
    // In a real implementation, this would apply the optimization
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Cost Optimization Suggestions
        </CardTitle>
        <CardDescription>
          Potential monthly savings: <span className="font-semibold text-green-600">${totalPotentialSavings.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {optimizations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No optimization suggestions yet</p>
            <p className="text-sm">Use more AI features to get insights</p>
          </div>
        ) : (
          optimizations.slice(0, 5).map(opt => (
            <div 
              key={opt.id} 
              className={`p-3 rounded-lg border ${appliedOptimizations.has(opt.id) ? 'bg-green-50 border-green-200' : 'bg-card'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{opt.title}</span>
                    <Badge variant="outline" className={IMPACT_COLORS[opt.impact]}>
                      {opt.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                  {opt.savings > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <TrendingDown className="h-3 w-3" />
                      Save ~${opt.savings.toFixed(2)}/month
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={appliedOptimizations.has(opt.id) ? 'ghost' : 'outline'}
                  onClick={() => handleApplyOptimization(opt.id)}
                  disabled={appliedOptimizations.has(opt.id)}
                >
                  {appliedOptimizations.has(opt.id) ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
