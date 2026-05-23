import React, { useState, useEffect } from 'react';
import { 
  Database, Brain, Zap, TrendingUp, Activity, AlertTriangle,
  Clock, Target, Users, FileText, Mic, Image, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';

interface IntelligenceStatsPanelProps {
  className?: string;
  compact?: boolean;
}

interface EmbeddingStats {
  total: number;
  byType: Record<string, number>;
  recentCount: number;
  lastProcessed?: string;
}

interface IntelStats {
  embeddings: EmbeddingStats;
  alerts: { total: number; unread: number; critical: number };
  entities: { total: number; people: number; companies: number; locations: number };
  insights: { total: number; today: number };
  predictions: { active: number; accuracy: number };
}

export function IntelligenceStatsPanel({ className, compact = false }: IntelligenceStatsPanelProps) {
  const [stats, setStats] = useState<IntelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all stats in parallel
      const [
        embeddingsResult,
        alertsResult,
        entitiesResult,
        insightsResult,
        predictionsResult,
      ] = await Promise.all([
        supabase
          .from('document_embeddings')
          .select('source_type, created_at')
          .eq('user_id', user.id),
        supabase
          .from('intelligence_alerts')
          .select('id, is_read, priority')
          .eq('user_id', user.id)
          .eq('is_dismissed', false),
        supabase
          .from('entity_mentions')
          .select('entity_type')
          .eq('user_id', user.id),
        supabase
          .from('ai_analyses')
          .select('id, generated_at')
          .eq('user_id', user.id),
        supabase
          .from('behavioral_predictions')
          .select('id, accuracy_score')
          .eq('user_id', user.id)
          .gte('valid_until', new Date().toISOString()),
      ]);

      // Process embeddings stats
      const embeddingsByType: Record<string, number> = {};
      const today = new Date().toDateString();
      let recentCount = 0;

      (embeddingsResult.data || []).forEach(e => {
        embeddingsByType[e.source_type] = (embeddingsByType[e.source_type] || 0) + 1;
        if (new Date(e.created_at).toDateString() === today) {
          recentCount++;
        }
      });

      // Process entities
      const entityCounts = { people: 0, companies: 0, locations: 0 };
      (entitiesResult.data || []).forEach(e => {
        if (e.entity_type === 'person') entityCounts.people++;
        if (e.entity_type === 'company') entityCounts.companies++;
        if (e.entity_type === 'location') entityCounts.locations++;
      });

      // Calculate prediction accuracy
      const predictions = predictionsResult.data || [];
      const avgAccuracy = predictions.length > 0
        ? predictions.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / predictions.length
        : 0;

      // Calculate today's insights
      const todayInsights = (insightsResult.data || []).filter(
        i => new Date(i.generated_at).toDateString() === today
      ).length;

      setStats({
        embeddings: {
          total: embeddingsResult.data?.length || 0,
          byType: embeddingsByType,
          recentCount,
        },
        alerts: {
          total: alertsResult.data?.length || 0,
          unread: (alertsResult.data || []).filter(a => !a.is_read).length,
          critical: (alertsResult.data || []).filter(a => a.priority === 'critical').length,
        },
        entities: {
          total: entitiesResult.data?.length || 0,
          ...entityCounts,
        },
        insights: {
          total: insightsResult.data?.length || 0,
          today: todayInsights,
        },
        predictions: {
          active: predictions.length,
          accuracy: avgAccuracy * 100,
        },
      });
    } catch (error) {
      console.error('Failed to load intelligence stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEmbeddingProcessor = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await invokeFunction('universal-embedding-processor', { mode: 'full' },);

      if (error) throw error;

      toast({
        title: 'Processing Started',
        description: `Processing ${data?.queued || 0} items for embedding`,
      });

      // Reload stats after a delay
      setTimeout(loadStats, 5000);
    } catch (error) {
      console.error('Embedding processor error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start embedding processor',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading intelligence stats...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const typeIcons: Record<string, React.ElementType> = {
    message: FileText,
    voice: Mic,
    media: Image,
    email: Mail,
    document: FileText,
    social: Users,
  };

  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
        <Card>
          <CardContent className="p-3 text-center">
            <Database className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{stats.embeddings.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Embeddings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{stats.entities.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Entities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Brain className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{stats.insights.total}</div>
            <div className="text-xs text-muted-foreground">Insights</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-warning" />
            <div className="text-xl font-bold">{stats.alerts.unread}</div>
            <div className="text-xs text-muted-foreground">Alerts</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            RAG Knowledge Base
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={triggerEmbeddingProcessor}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Activity className="h-3 w-3 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Sync All
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Embeddings Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Total Embeddings</span>
            <span className="font-bold text-primary">{stats.embeddings.total.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.embeddings.byType).map(([type, count]) => {
              const Icon = typeIcons[type] || FileText;
              return (
                <Badge key={type} variant="secondary" className="text-xs gap-1">
                  <Icon className="h-3 w-3" />
                  {type}: {count}
                </Badge>
              );
            })}
          </div>
          {stats.embeddings.recentCount > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {stats.embeddings.recentCount} processed today
            </p>
          )}
        </div>

        {/* Alerts Summary */}
        {stats.alerts.total > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Alerts
              </span>
              <Badge variant={stats.alerts.critical > 0 ? 'destructive' : 'secondary'}>
                {stats.alerts.unread} unread
              </Badge>
            </div>
            {stats.alerts.critical > 0 && (
              <p className="text-xs text-destructive">
                {stats.alerts.critical} critical alert(s) require attention
              </p>
            )}
          </div>
        )}

        {/* Entity Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/30 rounded">
            <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{stats.entities.people}</div>
            <div className="text-[10px] text-muted-foreground">People</div>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <Target className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold">{stats.entities.companies}</div>
            <div className="text-[10px] text-muted-foreground">Companies</div>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-bold">{stats.entities.locations}</div>
            <div className="text-[10px] text-muted-foreground">Locations</div>
          </div>
        </div>

        {/* Predictions Accuracy */}
        {stats.predictions.active > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Prediction Accuracy</span>
              <span className="font-medium">{stats.predictions.accuracy.toFixed(1)}%</span>
            </div>
            <Progress value={stats.predictions.accuracy} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              Based on {stats.predictions.active} active predictions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IntelligenceStatsPanel;
