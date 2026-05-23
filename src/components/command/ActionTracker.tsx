/**
 * Action Tracker Component
 * Influence campaign performance analytics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Zap, CheckCircle2, Clock, XCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActionTrackerProps {
  compact?: boolean;
}

interface TrackedAction {
  id: string;
  title: string;
  description: string;
  profileName: string;
  profileId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  principle: string;
  createdAt: Date;
  completedAt?: Date;
  successScore?: number;
  lessonsLearned?: string[];
}

export function ActionTracker({ compact = false }: ActionTrackerProps) {
  const { user } = useAuth();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['action-tracker', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Return sample actions for demonstration (table may not have all columns yet)
      return [
        {
          id: 'action-1',
          title: 'Reciprocity Play: Coffee Meeting',
          description: 'Offered valuable introduction before making request',
          profileName: 'Sample Contact',
          profileId: '',
          status: 'completed' as const,
          principle: 'reciprocity',
          createdAt: new Date(Date.now() - 86400000 * 3),
          completedAt: new Date(Date.now() - 86400000),
          successScore: 95,
          lessonsLearned: ['Timing was optimal', 'Introduction was highly valued']
        },
        {
          id: 'action-2',
          title: 'Commitment Escalation',
          description: 'Started with small ask, building to larger request',
          profileName: 'Another Contact',
          profileId: '',
          status: 'in_progress' as const,
          principle: 'commitment',
          createdAt: new Date(Date.now() - 86400000 * 2),
          successScore: 70
        }
      ];
    },
    enabled: !!user?.id
  });

  const getStatusIcon = (status: TrackedAction['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TrackedAction['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPrincipleEmoji = (principle: string) => {
    switch (principle) {
      case 'reciprocity': return '🎁';
      case 'commitment': return '🤝';
      case 'social_proof': return '👥';
      case 'authority': return '🏆';
      case 'liking': return '💖';
      case 'scarcity': return '⏳';
      case 'unity': return '🤗';
      default: return '✨';
    }
  };

  const stats = {
    total: actions.length,
    completed: actions.filter(a => a.status === 'completed').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    successRate: actions.length > 0 
      ? (actions.filter(a => a.status === 'completed').length / actions.length) * 100 
      : 0
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'h-[300px]')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-blue-500" />
            Action Tracker
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
            <Zap className="h-5 w-5 text-blue-500" />
            Action Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats.successRate.toFixed(0)}% success
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        {!compact && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-500/10">
              <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-500/10">
              <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
        )}

        <ScrollArea className={cn(compact ? 'h-[200px]' : 'h-[350px]')}>
          <div className="space-y-3">
            {actions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No campaigns tracked yet</p>
                <p className="text-sm">Start an influence campaign</p>
              </div>
            ) : (
              actions.map(action => (
                <div
                  key={action.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getPrincipleEmoji(action.principle)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{action.title}</span>
                        <Badge variant="outline" className={cn('text-xs', getStatusColor(action.status))}>
                          {getStatusIcon(action.status)}
                          <span className="ml-1 capitalize">{action.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{action.profileName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                      
                      {action.successScore !== undefined && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Success Score</span>
                            <span className="font-medium">{action.successScore.toFixed(0)}%</span>
                          </div>
                          <Progress value={action.successScore} className="h-1" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(action.createdAt, { addSuffix: true })}
                        </span>
                        {action.status === 'in_progress' && (
                          <Button size="sm" variant="ghost" className="h-6 text-xs gap-1">
                            Continue <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
