import React from 'react';
import { 
  Activity, Database, TrendingUp, Zap, CheckCircle2, 
  AlertTriangle, Clock, Brain, DollarSign 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QualityMetric {
  label: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ElementType;
}

export function IntelligenceQualityDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['intelligence-quality-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get embedding coverage
      const { count: totalEmbeddable } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      const { count: totalEmbedded } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get freshness (embeddings updated in last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: freshEmbeddings } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('last_embedded_at', weekAgo);

      // Get AI usage this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: aiUsage } = await supabase
        .from('ai_usage_logs')
        .select('estimated_cost_cents')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());

      const totalCost = (aiUsage || []).reduce((sum, log) => sum + (log.estimated_cost_cents || 0), 0);

      // Get pattern detection activity - use a generic query
      const patternsThisWeek = 0; // Will be populated when table exists

      // Get entity extraction coverage
      const { count: entitiesExtracted } = await supabase
        .from('entity_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const embeddingCoverage = totalEmbeddable ? Math.round(((totalEmbedded || 0) / totalEmbeddable) * 100) : 0;
      const freshness = totalEmbedded ? Math.round(((freshEmbeddings || 0) / totalEmbedded) * 100) : 0;

      return {
        embeddingCoverage,
        totalEmbedded: totalEmbedded || 0,
        freshness,
        monthlySpendCents: totalCost,
        patternsDetected: patternsThisWeek || 0,
        entitiesExtracted: entitiesExtracted || 0,
      };
    },
    refetchInterval: 30000,
  });

  const qualityMetrics: QualityMetric[] = [
    {
      label: 'Embedding Coverage',
      value: metrics?.embeddingCoverage || 0,
      target: 90,
      status: (metrics?.embeddingCoverage || 0) >= 90 ? 'good' : (metrics?.embeddingCoverage || 0) >= 50 ? 'warning' : 'critical',
      icon: Database,
    },
    {
      label: 'Data Freshness',
      value: metrics?.freshness || 0,
      target: 80,
      status: (metrics?.freshness || 0) >= 80 ? 'good' : (metrics?.freshness || 0) >= 40 ? 'warning' : 'critical',
      icon: Clock,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Healthy</Badge>;
      case 'warning': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Needs Attention</Badge>;
      case 'critical': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Critical</Badge>;
      default: return null;
    }
  };

  const overallHealth = metrics ? 
    (metrics.embeddingCoverage >= 70 && metrics.freshness >= 60) ? 'good' :
    (metrics.embeddingCoverage >= 30 || metrics.freshness >= 30) ? 'warning' : 'critical'
    : 'critical';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Intelligence Quality
          </span>
          {getStatusBadge(overallHealth)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Metrics */}
        {qualityMetrics.map((metric, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <metric.icon className={`h-3 w-3 ${getStatusColor(metric.status)}`} />
                {metric.label}
              </span>
              <span className="font-medium">{metric.value}%</span>
            </div>
            <Progress 
              value={metric.value} 
              className="h-1.5"
            />
          </div>
        ))}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Brain className="h-3 w-3" />
              Embedded Docs
            </div>
            <div className="text-xl font-bold">{metrics?.totalEmbedded?.toLocaleString() || 0}</div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Zap className="h-3 w-3" />
              Entities
            </div>
            <div className="text-xl font-bold">{metrics?.entitiesExtracted?.toLocaleString() || 0}</div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              Patterns/Week
            </div>
            <div className="text-xl font-bold">{metrics?.patternsDetected || 0}</div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              AI Spend
            </div>
            <div className="text-xl font-bold">
              ${((metrics?.monthlySpendCents || 0) / 100).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {overallHealth !== 'good' && (
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  Improve Intelligence Quality
                </p>
                <p className="text-muted-foreground mt-1">
                  {(metrics?.embeddingCoverage || 0) < 50 
                    ? 'Run the embedding pipeline to improve semantic search coverage.'
                    : 'Some embeddings are outdated. Consider refreshing stale data.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IntelligenceQualityDashboard;
