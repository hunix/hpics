import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, Clock, CheckCircle, TrendingUp, Users, 
  MessageSquare, Phone, Gift, AlertCircle, ChevronRight, Star
} from 'lucide-react';
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { Link } from 'react-router-dom';
import { usePendingActions } from '@/hooks/useInfluenceProfile';

const actionIcons: Record<string, React.ElementType> = {
  message: MessageSquare,
  call: Phone,
  gift: Gift,
  introduction: Users,
  check_in: Target,
  appreciation: Star,
};

export function RelationshipOverviewWidget() {
  const { user } = useAuth();
  const { data: pendingActions, isLoading: loadingActions } = usePendingActions();

  // Fetch methodology effectiveness stats
  const { data: effectivenessStats, isLoading: loadingStats } = useQuery({
    queryKey: ['methodology-effectiveness-stats'],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('methodology_outcomes')
        .select('outcome_score, response_observed, methodology_name')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.length || 0;
      const positive = data?.filter(d => d.response_observed === 'positive').length || 0;
      const avgScore = total > 0 
        ? data.reduce((sum, d) => sum + (d.outcome_score || 0), 0) / total 
        : 0;

      // Group by methodology
      const methodologyStats = data?.reduce((acc, d) => {
        const name = d.methodology_name || 'Unknown';
        if (!acc[name]) acc[name] = { total: 0, positive: 0, sumScore: 0 };
        acc[name].total++;
        if (d.response_observed === 'positive') acc[name].positive++;
        acc[name].sumScore += d.outcome_score || 0;
        return acc;
      }, {} as Record<string, { total: number; positive: number; sumScore: number }>);

      const topMethodologies = Object.entries(methodologyStats || {})
        .map(([name, stats]) => ({
          name,
          successRate: stats.total > 0 ? (stats.positive / stats.total) * 100 : 0,
          avgScore: stats.total > 0 ? stats.sumScore / stats.total : 0,
          total: stats.total,
        }))
        .filter(m => m.total >= 2)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 3);

      return {
        total,
        positive,
        successRate: total > 0 ? (positive / total) * 100 : 0,
        avgScore,
        topMethodologies,
      };
    },
    enabled: !!user,
  });

  // Fetch contacts needing attention
  const { data: needsAttention, isLoading: loadingAttention } = useQuery({
    queryKey: ['contacts-needing-attention'],
    queryFn: async () => {
      if (!user) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, last_contact_date')
        .eq('user_id', user.id)
        .or(`last_contact_date.is.null,last_contact_date.lt.${thirtyDaysAgo.toISOString()}`)
        .order('last_contact_date', { ascending: true, nullsFirst: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getDateLabel = (dateString: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'Overdue';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getDateColor = (dateString: string | null) => {
    if (!dateString) return 'text-muted-foreground';
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'text-red-600';
    if (isToday(date)) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const isLoading = loadingActions || loadingStats || loadingAttention;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const urgentActions = pendingActions?.filter(a => {
    const date = a.scheduled_for ? new Date(a.scheduled_for) : null;
    return date && (isToday(date) || isPast(date));
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Influence Command Center
        </CardTitle>
        <CardDescription>
          Pending actions and relationship effectiveness across all contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{pendingActions?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Pending Actions</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-red-600">{urgentActions.length}</div>
            <div className="text-sm text-muted-foreground">Due Today/Overdue</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">
              {effectivenessStats?.successRate.toFixed(0) || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{needsAttention?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Need Attention</div>
          </div>
        </div>

        {/* Urgent Actions */}
        {urgentActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Urgent Actions
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {urgentActions.slice(0, 5).map((action) => {
                  const ActionIcon = actionIcons[action.action_type] || MessageSquare;
                  const profile = action.profiles as any;
                  return (
                    <Link
                      key={action.id}
                      to={`/contacts/${action.profile_id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                        <ActionIcon className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{action.action_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                      </div>
                      <Badge variant="destructive" className="shrink-0">
                        {getDateLabel(action.scheduled_for)}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Upcoming Actions */}
        {pendingActions && pendingActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Actions
            </h4>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {pendingActions
                  .filter(a => !urgentActions.includes(a))
                  .slice(0, 8)
                  .map((action) => {
                    const ActionIcon = actionIcons[action.action_type] || MessageSquare;
                    const profile = action.profiles as any;
                    return (
                      <Link
                        key={action.id}
                        to={`/contacts/${action.profile_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="p-2 rounded-full bg-primary/10">
                          <ActionIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{action.action_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {profile?.first_name} {profile?.last_name}
                          </p>
                        </div>
                        <span className={`text-xs ${getDateColor(action.scheduled_for)}`}>
                          {getDateLabel(action.scheduled_for)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Top Methodologies */}
        {effectivenessStats?.topMethodologies && effectivenessStats.topMethodologies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              What's Working
            </h4>
            <div className="grid gap-2">
              {effectivenessStats.topMethodologies.map((method) => (
                <div
                  key={method.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20"
                >
                  <span className="text-sm font-medium">{method.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {method.successRate.toFixed(0)}% success
                    </Badge>
                    <div className="flex">
                      {Array.from({ length: Math.round(method.avgScore) }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts Needing Attention */}
        {needsAttention && needsAttention.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts Needing Attention
            </h4>
            <div className="flex flex-wrap gap-2">
              {needsAttention.map((contact) => (
                <Link key={contact.id} to={`/contacts/${contact.id}`}>
                  <Badge
                    variant="outline"
                    className="hover:bg-muted cursor-pointer"
                  >
                    {contact.first_name} {contact.last_name}
                    {contact.last_contact_date && (
                      <span className="ml-1 text-muted-foreground">
                        ({formatDistanceToNow(new Date(contact.last_contact_date))} ago)
                      </span>
                    )}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!pendingActions || pendingActions.length === 0) && (!needsAttention || needsAttention.length === 0) && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">All caught up! No pending actions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
