/**
 * Opportunity Queue Component
 * Prioritized influence opportunities with edge function integration
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Target, Clock, Zap, TrendingUp, CheckCircle2, RefreshCw, Sparkles, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface OpportunityQueueProps {
  compact?: boolean;
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  profileName: string;
  profileId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  successProbability: number | null;
  optimalTiming: Date | null;
  expiresAt: Date;
  principleType: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export function OpportunityQueue({ compact = false }: OpportunityQueueProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mutation to generate new opportunities
  const generateOpportunities = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('action-recommendation-engine', {
          type: 'generate_opportunities',
          userId: user?.id
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-queue'] });
      toast.success('New opportunities generated');
    },
    onError: (error) => {
      console.error('Generation failed:', error);
      toast.error('Failed to generate opportunities');
    }
  });

  // Mutation to act on an opportunity
  const actOnOpportunity = useMutation({
    mutationFn: async (opportunityId: string) => {
      const { error } = await supabase
        .from('action_recommendations')
        .update({ 
          status: 'in_progress',
          actioned_at: new Date().toISOString()
        })
        .eq('id', opportunityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-queue'] });
      toast.success('Action started');
    }
  });

  // Mutation to complete an opportunity
  const completeOpportunity = useMutation({
    mutationFn: async (opportunityId: string) => {
      const { error } = await supabase
        .from('action_recommendations')
        .update({ status: 'completed' })
        .eq('id', opportunityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-queue'] });
      toast.success('Opportunity completed');
    }
  });

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunity-queue', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data } = await supabase
        .from('action_recommendations')
        .select(`
          id,
          title,
          description,
          profile_id,
          priority_score,
          success_probability,
          expires_at,
          status,
          recommendation_type,
          profiles!action_recommendations_profile_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('user_id', user.id)
        .order('priority_score', { ascending: false })
        .limit(compact ? 5 : 20);

      if (!data) return [];

      return data.map(rec => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        profileName: rec.profiles
          ? `${rec.profiles.first_name || ''} ${rec.profiles.last_name || ''}`.trim()
          : 'Unknown',
        profileId: rec.profile_id || '',
        priority: rec.priority_score > 80 ? 'critical' :
                  rec.priority_score > 60 ? 'high' :
                  rec.priority_score > 40 ? 'medium' : 'low',
        // Null when the recommendation engine hasn't scored this row yet;
        // the UI shows "—" rather than a fabricated percentage.
        successProbability: rec.success_probability ?? null,
        optimalTiming: null,
        expiresAt: rec.expires_at ? new Date(rec.expires_at) : new Date(Date.now() + 86400000 * 7),
        principleType: rec.recommendation_type || 'reciprocity',
        status: (rec.status as Opportunity['status']) || 'pending'
      }));
    },
    enabled: !!user?.id
  });

  const getPriorityColor = (priority: Opportunity['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPrincipleIcon = (type: string) => {
    switch (type) {
      case 'reciprocity': return '🎁';
      case 'commitment': return '🤝';
      case 'social_proof': return '👥';
      case 'authority': return '🏆';
      case 'liking': return '💖';
      case 'scarcity': return '⏳';
      default: return '✨';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'h-[300px]')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-emerald-500" />
            Opportunity Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && 'h-[300px]')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-emerald-500" />
            Opportunity Queue
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateOpportunities.mutate()}
              disabled={generateOpportunities.isPending}
              className="h-8 gap-1"
            >
              {generateOpportunities.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Generate</span>
            </Button>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {opportunities.filter(o => o.status === 'pending').length} Active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(compact ? 'h-[200px]' : 'h-[500px]')}>
          <div className="space-y-3">
            {opportunities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No opportunities detected yet</p>
                <p className="text-sm">Click Generate to find opportunities</p>
              </div>
            ) : (
              opportunities.map(opp => (
                <div
                  key={opp.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getPrincipleIcon(opp.principleType)}</span>
                      <div>
                        <h4 className="font-medium text-sm">{opp.title}</h4>
                        <p className="text-xs text-muted-foreground">{opp.profileName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', getPriorityColor(opp.priority as Opportunity['priority']))}>
                      {opp.priority}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {opp.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {opp.optimalTiming && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(opp.optimalTiming, { addSuffix: true })}
                        </span>
                      )}
                      {opp.successProbability !== null && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {opp.successProbability.toFixed(0)}% success
                        </span>
                      )}
                    </div>
                    {opp.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : opp.status === 'in_progress' ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs gap-1"
                        onClick={() => completeOpportunity.mutate(opp.id)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs gap-1"
                        onClick={() => actOnOpportunity.mutate(opp.id)}
                      >
                        <Play className="h-3 w-3" />
                        Act Now
                      </Button>
                    )}
                  </div>

                  {!compact && opp.successProbability !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Success Probability</span>
                        <span className="font-medium">{opp.successProbability.toFixed(0)}%</span>
                      </div>
                      <Progress value={opp.successProbability} className="h-1" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
