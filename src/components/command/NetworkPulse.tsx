/**
 * Network Pulse Component
 * Real-time network health indicator
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkPulse() {
  const { user } = useAuth();

  const { data: pulse } = useQuery({
    queryKey: ['network-pulse', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get contact count
      const { count: contactCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get recent communications as proxy for interactions
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { count: recentInteractions } = await supabase
        .from('communications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo);

      // Get active anomalies
      const { count: activeAnomalies } = await supabase
        .from('behavioral_anomalies')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_resolved', false);

      // Calculate health score
      const interactionRate = contactCount ? (recentInteractions || 0) / contactCount : 0;
      const anomalyPenalty = (activeAnomalies || 0) * 5;
      const healthScore = Math.max(0, Math.min(100, (interactionRate * 50) + 50 - anomalyPenalty));

      return {
        healthScore,
        contactCount: contactCount || 0,
        recentInteractions: recentInteractions || 0,
        activeAnomalies: activeAnomalies || 0,
        trend: healthScore > 60 ? 'up' : healthScore < 40 ? 'down' : 'stable'
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000 // Refresh every minute
  });

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-rose-500" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (!pulse) {
    return (
      <Badge variant="outline" className="gap-1">
        <Activity className="h-3 w-3 animate-pulse" />
        Loading...
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            'gap-1.5 cursor-help transition-colors',
            pulse.healthScore >= 70 ? 'border-emerald-500/30 bg-emerald-500/5' :
            pulse.healthScore >= 40 ? 'border-amber-500/30 bg-amber-500/5' :
            'border-rose-500/30 bg-rose-500/5'
          )}
        >
          <Activity className={cn('h-3 w-3', getHealthColor(pulse.healthScore))} />
          <span className={cn('font-semibold', getHealthColor(pulse.healthScore))}>
            {pulse.healthScore.toFixed(0)}%
          </span>
          {getTrendIcon(pulse.trend)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-64">
        <div className="space-y-2">
          <div className="font-medium">Network Health</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Contacts:</span>
              <span className="ml-1 font-medium">{pulse.contactCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">30d Activity:</span>
              <span className="ml-1 font-medium">{pulse.recentInteractions}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Active Risks:</span>
              <span className={cn('ml-1 font-medium', pulse.activeAnomalies > 0 && 'text-amber-500')}>
                {pulse.activeAnomalies}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Trend:</span>
              <span className="ml-1 font-medium capitalize">{pulse.trend}</span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
