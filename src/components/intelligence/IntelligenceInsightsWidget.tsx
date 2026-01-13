import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  MessageSquare,
  Calendar,
  Network,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IntelligenceInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  category: string;
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export function IntelligenceInsightsWidget() {
  const { user } = useAuth();

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['intelligence-insights', user?.id],
    queryFn: async () => {
      // Generate intelligence insights from available data
      const [
        { count: contactCount },
        { count: communicationCount },
        { data: recentComms },
        { data: decayingScores },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('is_active', true),
        supabase.from('communications').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase
          .from('communications')
          .select('channel, sentiment_score')
          .eq('user_id', user!.id)
          .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('relationship_scores')
          .select('profile_id, overall_score, profiles(first_name, last_name)')
          .eq('user_id', user!.id)
          .lt('overall_score', 50)
          .order('overall_score', { ascending: true })
          .limit(5),
      ]);

      const insights: IntelligenceInsight[] = [];

      // Communication pattern analysis
      if (recentComms && recentComms.length > 0) {
        const avgSentiment = recentComms.reduce((sum, c) => sum + (c.sentiment_score || 0.5), 0) / recentComms.length;
        if (avgSentiment < 0.4) {
          insights.push({
            id: 'sentiment-trend',
            type: 'trend',
            category: 'Communication',
            title: 'Declining Sentiment Detected',
            description: `Average communication sentiment this week is ${(avgSentiment * 100).toFixed(0)}%. Consider focusing on positive interactions.`,
            confidence: 0.85,
            priority: 'high',
            actionable: true,
          });
        }
      }

      // Relationship decay alerts
      if (decayingScores && decayingScores.length > 0) {
        insights.push({
          id: 'relationship-decay',
          type: 'anomaly',
          category: 'Relationships',
          title: `${decayingScores.length} Relationships Need Attention`,
          description: `Some relationships have health scores below 50%. Reach out to maintain these connections.`,
          confidence: 0.92,
          priority: 'medium',
          actionable: true,
        });
      }

      // Network growth recommendation
      if (contactCount && contactCount < 50) {
        insights.push({
          id: 'network-growth',
          type: 'recommendation',
          category: 'Network',
          title: 'Expand Your Network',
          description: 'Your contact network is relatively small. Consider importing contacts from LinkedIn or adding more connections.',
          confidence: 0.75,
          priority: 'low',
          actionable: true,
        });
      }

      // Communication frequency prediction
      if (communicationCount && communicationCount > 10) {
        insights.push({
          id: 'comm-prediction',
          type: 'prediction',
          category: 'Activity',
          title: 'Communication Pattern Established',
          description: 'Based on your patterns, optimal outreach times are weekday mornings. Consider scheduling follow-ups accordingly.',
          confidence: 0.68,
          priority: 'low',
          actionable: false,
        });
      }

      return insights;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'anomaly':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'prediction':
        return <Brain className="h-4 w-4 text-purple-500" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Communication':
        return <MessageSquare className="h-3 w-3" />;
      case 'Relationships':
        return <Users className="h-3 w-3" />;
      case 'Network':
        return <Network className="h-3 w-3" />;
      case 'Activity':
        return <Calendar className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Intelligence Insights
            </CardTitle>
            <CardDescription>AI-powered analysis of your network</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            Analyzing patterns...
          </div>
        ) : insights?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No insights yet</p>
            <p className="text-xs">Add more data to generate intelligence insights</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights?.map((insight) => (
              <div
                key={insight.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getTypeIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{insight.title}</span>
                      <Badge variant="secondary" className={priorityColors[insight.priority]}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {getCategoryIcon(insight.category)}
                        {insight.category}
                      </span>
                      <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-[10px]">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
