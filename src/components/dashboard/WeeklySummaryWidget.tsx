import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, RefreshCw, Sparkles, TrendingUp, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface WeeklySummaryData {
  weekStart: string;
  weekEnd: string;
  stats: {
    totalCommunications: number;
    inboundCommunications: number;
    outboundCommunications: number;
    uniqueContactsReached: number;
    eventsThisWeek: number;
    analysesGenerated: number;
    activeGoals: number;
    goalsCompleted: number;
  };
  channelBreakdown: Record<string, number>;
  topContacts: Array<{ profileId: string; name: string; interactions: number }>;
  aiSummary: {
    executiveSummary: string;
    highlights: string[];
    recommendations: string[];
    engagementScore: number;
  };
}

export function WeeklySummaryWidget() {
  const { user, session } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: summary, refetch, isLoading } = useQuery<WeeklySummaryData>({
    queryKey: ['weekly-summary', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('generate-weekly-summary', {}, { headers: {
          Authorization: `Bearer ${session?.access_token}`,
        } });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!session,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleRefresh = async () => {
    setIsGenerating(true);
    try {
      await refetch();
      toast.success('Weekly summary updated');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded w-full" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Weekly Summary
            </CardTitle>
            <CardDescription>
              {summary?.weekStart && summary?.weekEnd
                ? `${new Date(summary.weekStart).toLocaleDateString()} - ${new Date(summary.weekEnd).toLocaleDateString()}`
                : 'This week\'s relationship activity'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {summary?.aiSummary && (
          <>
            {/* Engagement Score */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(summary.aiSummary.engagementScore)}`}>
                  {summary.aiSummary.engagementScore}
                </div>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
              <div className="flex-1">
                <p className="text-sm">{summary.aiSummary.executiveSummary}</p>
              </div>
            </div>

            {/* Stats Grid */}
            {summary.stats && (
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-xl font-semibold">{summary.stats.totalCommunications}</div>
                  <div className="text-xs text-muted-foreground">Communications</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <div className="text-xl font-semibold">{summary.stats.uniqueContactsReached}</div>
                  <div className="text-xs text-muted-foreground">Contacts Reached</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/10">
                  <Sparkles className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <div className="text-xl font-semibold">{summary.stats.analysesGenerated}</div>
                  <div className="text-xs text-muted-foreground">AI Analyses</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <div className="text-xl font-semibold">{summary.stats.goalsCompleted}/{summary.stats.activeGoals}</div>
                  <div className="text-xs text-muted-foreground">Goals Met</div>
                </div>
              </div>
            )}

            {/* Top Contacts */}
            {summary.topContacts && summary.topContacts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Most Active Relationships</h4>
                <div className="flex flex-wrap gap-2">
                  {summary.topContacts.map((contact) => (
                    <Badge key={contact.profileId} variant="secondary">
                      {contact.name} ({contact.interactions})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights & Recommendations */}
            <div className="grid md:grid-cols-2 gap-4">
              {summary.aiSummary.highlights && summary.aiSummary.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Highlights
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {summary.aiSummary.highlights.slice(0, 3).map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.aiSummary.recommendations && summary.aiSummary.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {summary.aiSummary.recommendations.slice(0, 3).map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {!summary?.aiSummary && (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity this week yet.</p>
            <p className="text-sm">Start logging communications to see your summary!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
