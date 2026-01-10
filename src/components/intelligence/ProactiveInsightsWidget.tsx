import React from 'react';
import { 
  Sparkles, AlertTriangle, TrendingUp, Gift, Users, 
  Calendar, ArrowRight, RefreshCw, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface ProactiveInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  profile_id?: string;
  priority: string;
  suggested_action: string;
  due_date?: string;
  metadata?: any;
  created_at: string;
  status: string;
}

const insightIcons: Record<string, React.ElementType> = {
  action_needed: AlertTriangle,
  opportunity: Sparkles,
  risk: AlertTriangle,
  milestone: Gift,
  pattern: TrendingUp,
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
};

export function ProactiveInsightsWidget({ limit = 5 }: { limit?: number }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['proactive-insights', limit],
    queryFn: async () => {
      // Return empty until table exists
      return [] as ProactiveInsight[];
    },
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proactive-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate insights');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Insights Generated',
        description: `${data.insightsGenerated} new insights created`,
      });
      queryClient.invalidateQueries({ queryKey: ['proactive-insights'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const dismissInsightMutation = useMutation({
    mutationFn: async (insightId: string) => {
      // Will work when table exists
      console.log('Dismissing insight:', insightId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactive-insights'] });
    },
  });

  const handleInsightClick = (insight: ProactiveInsight) => {
    if (insight.profile_id) {
      navigate(`/contacts/${insight.profile_id}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Proactive Insights
          </span>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
            >
              {generateInsightsMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !insights || insights.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No active insights</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
            >
              Generate Insights
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-3">
              {insights.map((insight) => {
                const Icon = insightIcons[insight.insight_type] || Sparkles;
                return (
                  <div
                    key={insight.id}
                    className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer group"
                    onClick={() => handleInsightClick(insight)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{insight.title}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${priorityColors[insight.priority]}`}
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                          </span>
                          {insight.profile_id && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </div>
                    {insight.due_date && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(insight.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default ProactiveInsightsWidget;
