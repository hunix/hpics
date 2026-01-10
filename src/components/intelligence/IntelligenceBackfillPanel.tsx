import React, { useState, useEffect } from 'react';
import { 
  Database, Play, Pause, RefreshCw, CheckCircle2, 
  XCircle, Loader2, Zap, Brain, TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BackfillStats {
  totalMessages: number;
  embeddedMessages: number;
  totalObservations: number;
  embeddedObservations: number;
  totalVoice: number;
  embeddedVoice: number;
  totalEntities: number;
}

export function IntelligenceBackfillPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['intelligence-backfill-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get message counts
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Get embedded message counts
      const { count: embeddedMessages } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('source_type', 'message')
        .eq('user_id', user.id);

      // Get observation counts
      const { count: totalObservations } = await supabase
        .from('contact_observations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: embeddedObservations } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('source_type', 'observation')
        .eq('user_id', user.id);

      // Get voice counts
      const { count: totalVoice } = await supabase
        .from('voice_insights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: embeddedVoice } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('source_type', 'voice')
        .eq('user_id', user.id);

      // Get entity counts
      const { count: totalEntities } = await supabase
        .from('entity_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        totalMessages: totalMessages || 0,
        embeddedMessages: embeddedMessages || 0,
        totalObservations: totalObservations || 0,
        embeddedObservations: embeddedObservations || 0,
        totalVoice: totalVoice || 0,
        embeddedVoice: embeddedVoice || 0,
        totalEntities: totalEntities || 0,
      } as BackfillStats;
    },
    refetchInterval: isRunning ? 5000 : false,
  });

  const runBackfillMutation = useMutation({
    mutationFn: async (type: 'embeddings' | 'entities' | 'patterns') => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      setIsRunning(true);
      setProgress(0);

      if (type === 'embeddings') {
        setCurrentTask('Generating embeddings...');
        
        // Process in batches
        for (let i = 0; i < 3; i++) {
          setProgress((i + 1) * 30);
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-embed-content`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ backfillType: 'all', batchSize: 50 }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Backfill failed');
          }

          await new Promise(r => setTimeout(r, 1000));
        }
      } else if (type === 'entities') {
        setCurrentTask('Extracting entities...');
        setProgress(30);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entity-extraction`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ processExisting: true, limit: 100 }),
          }
        );

        setProgress(70);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Entity extraction failed');
        }
      } else if (type === 'patterns') {
        setCurrentTask('Detecting cross-contact patterns...');
        setProgress(30);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-cross-patterns`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({}),
          }
        );

        setProgress(70);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Pattern detection failed');
        }
      }

      setProgress(100);
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Backfill Complete',
        description: `${currentTask} finished successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['intelligence-backfill-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Backfill Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsRunning(false);
      setCurrentTask('');
      setProgress(0);
    },
  });

  const coveragePercent = stats ? Math.round(
    ((stats.embeddedMessages + stats.embeddedObservations + stats.embeddedVoice) /
    Math.max(1, stats.totalMessages + stats.totalObservations + stats.totalVoice)) * 100
  ) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Intelligence Data Pipeline
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Coverage */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Embedding Coverage</span>
            <span className="font-medium">{coveragePercent}%</span>
          </div>
          <Progress value={coveragePercent} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Brain className="h-3 w-3" />
              Messages
            </div>
            <div className="text-lg font-bold">
              {stats?.embeddedMessages || 0}
              <span className="text-xs font-normal text-muted-foreground">
                / {stats?.totalMessages || 0}
              </span>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="h-3 w-3" />
              Entities
            </div>
            <div className="text-lg font-bold">{stats?.totalEntities || 0}</div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-3 w-3" />
              Observations
            </div>
            <div className="text-lg font-bold">
              {stats?.embeddedObservations || 0}
              <span className="text-xs font-normal text-muted-foreground">
                / {stats?.totalObservations || 0}
              </span>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              Voice
            </div>
            <div className="text-lg font-bold">
              {stats?.embeddedVoice || 0}
              <span className="text-xs font-normal text-muted-foreground">
                / {stats?.totalVoice || 0}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Progress Indicator */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{currentTask}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runBackfillMutation.mutate('embeddings')}
            disabled={isRunning}
            className="text-xs"
          >
            <Database className="h-3 w-3 mr-1" />
            Embeddings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runBackfillMutation.mutate('entities')}
            disabled={isRunning}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Entities
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runBackfillMutation.mutate('patterns')}
            disabled={isRunning}
            className="text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Patterns
          </Button>
        </div>

        <Button
          className="w-full"
          onClick={async () => {
            await runBackfillMutation.mutateAsync('embeddings');
            await runBackfillMutation.mutateAsync('entities');
            await runBackfillMutation.mutateAsync('patterns');
          }}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Full Intelligence Pipeline
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default IntelligenceBackfillPanel;
