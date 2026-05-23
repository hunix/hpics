import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Mail, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Target,
  Clock
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';
import { toast } from 'sonner';

interface EmailInsight {
  threadId: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
  topics: string[];
  actionItems: string[];
  keyPoints: string[];
  suggestedResponse?: string;
  relationshipImpact: string;
}

interface EmailInsightsPanelProps {
  profileId?: string;
  contactName?: string;
}

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  neutral: { icon: Minus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  negative: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const urgencyConfig = {
  high: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'High Priority' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Medium' },
  low: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Low' },
};

export function EmailInsightsPanel({ profileId, contactName }: EmailInsightsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['email-insights', profileId, user?.id],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await invokeFunction('analyze-email-insights', { profileId }, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

      if (response.error) throw response.error;
      return response.data as { insights: EmailInsight[] };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await invokeFunction('analyze-email-insights', { profileId, analyzeAll: true }, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-insights'] });
      toast.success('Email insights analyzed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to analyze emails');
    },
  });

  const toggleExpanded = (threadId: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const insights = data?.insights || [];
  const highUrgency = insights.filter(i => i.urgency === 'high');
  const actionItems = insights.flatMap(i => i.actionItems || []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Email Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of email conversations{contactName ? ` with ${contactName}` : ''}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
          Analyze
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-lg font-bold">{insights.length}</div>
            <div className="text-xs text-muted-foreground">Threads</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <div className="text-lg font-bold text-red-500">{highUrgency.length}</div>
            <div className="text-xs text-muted-foreground">Urgent</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <div className="text-lg font-bold text-primary">{actionItems.length}</div>
            <div className="text-xs text-muted-foreground">Actions</div>
          </div>
        </div>

        {/* Action Items Summary */}
        {actionItems.length > 0 && (
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              Action Items
            </h4>
            <ul className="space-y-1">
              {actionItems.slice(0, 5).map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-1 text-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Insights List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {insights.map((insight) => {
              const sentimentCfg = sentimentConfig[insight.sentiment];
              const urgencyCfg = urgencyConfig[insight.urgency];
              const SentimentIcon = sentimentCfg.icon;
              const isExpanded = expandedInsights.has(insight.threadId);

              return (
                <Collapsible
                  key={insight.threadId}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(insight.threadId)}
                >
                  <div className="rounded-lg border p-3">
                    <CollapsibleTrigger asChild>
                      <div className="cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={urgencyCfg.color}>
                              <Clock className="h-3 w-3 mr-1" />
                              {urgencyCfg.label}
                            </Badge>
                            <Badge variant="outline" className={sentimentCfg.color}>
                              <SentimentIcon className="h-3 w-3 mr-1" />
                              {insight.sentiment}
                            </Badge>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <p className="text-sm">{insight.summary}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {insight.topics?.slice(0, 3).map((topic, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {insight.keyPoints?.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">Key Points</h5>
                            <ul className="text-sm space-y-1">
                              {insight.keyPoints.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {insight.actionItems?.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">Action Items</h5>
                            <ul className="text-sm space-y-1">
                              {insight.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Target className="h-3 w-3 mt-1 text-primary" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {insight.suggestedResponse && (
                          <div className="p-2 rounded bg-muted/50">
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">Suggested Response</h5>
                            <p className="text-sm italic">{insight.suggestedResponse}</p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {insight.relationshipImpact}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}

            {insights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No email insights available</p>
                <p className="text-xs">Sync your emails to get AI-powered insights</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
