import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, CheckCircle, XCircle, Search, 
  MessageSquare, Clock, TrendingDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ConsistencyIssue {
  profile_id: string;
  profile_name: string;
  issue_type: 'statement_contradiction' | 'behavior_change' | 'timeline_inconsistency';
  description: string;
  evidence: string[];
  severity: 'low' | 'medium' | 'high';
  detected_at: string;
}

export function DeceptionAnalysisPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['deception-analysis', user?.id],
    queryFn: async () => {
      // Get interaction notes for consistency check
      const { data: notes } = await supabase
        .from('contact_interaction_notes')
        .select('*, profiles(id, first_name, last_name)')
        .eq('user_id', user!.id)
        .order('interaction_date', { ascending: false })
        .limit(200);

      // Get observations
      const { data: observations } = await supabase
        .from('contact_observations')
        .select('*, profiles(id, first_name, last_name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get trust assessments
      const { data: trustAssessments } = await supabase
        .from('trust_assessments')
        .select('*, profiles(id, first_name, last_name)')
        .eq('user_id', user!.id)
        .order('assessed_at', { ascending: false });

      // Analyze for inconsistencies
      const issues: ConsistencyIssue[] = [];
      const profileNotes = new Map<string, any[]>();

      // Group notes by profile
      notes?.forEach(n => {
        const existing = profileNotes.get(n.profile_id) || [];
        existing.push(n);
        profileNotes.set(n.profile_id, existing);
      });

      // Check for mood inconsistencies
      profileNotes.forEach((noteList, profileId) => {
        if (noteList.length < 2) return;
        
        const profile = noteList[0].profiles;
        const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

        // Check for rapid mood swings
        const moodHistory = noteList
          .filter(n => n.mood_observed)
          .map(n => ({ mood: n.mood_observed, date: n.interaction_date }));

        if (moodHistory.length >= 3) {
          const moodScores: Record<string, number> = {
            'great': 5, 'good': 4, 'neutral': 3, 'stressed': 2, 'difficult': 1
          };
          
          let moodSwings = 0;
          for (let i = 1; i < moodHistory.length; i++) {
            const diff = Math.abs(
              (moodScores[moodHistory[i-1].mood] || 3) - (moodScores[moodHistory[i].mood] || 3)
            );
            if (diff >= 3) moodSwings++;
          }

          if (moodSwings >= 2) {
            issues.push({
              profile_id: profileId,
              profile_name: profileName,
              issue_type: 'behavior_change',
              description: 'Significant mood inconsistencies detected across interactions',
              evidence: moodHistory.slice(0, 3).map(m => `${m.date}: ${m.mood}`),
              severity: 'medium',
              detected_at: new Date().toISOString(),
            });
          }
        }

        // Check for conflicting relationship temperatures
        const tempHistory = noteList
          .filter(n => n.relationship_temperature)
          .map(n => ({ temp: n.relationship_temperature, date: n.interaction_date }));

        if (tempHistory.length >= 2) {
          const first = tempHistory[0].temp;
          const last = tempHistory[tempHistory.length - 1].temp;
          
          const tempScores: Record<string, number> = {
            'warm': 3, 'neutral': 2, 'cool': 1, 'cold': 0
          };

          if (Math.abs((tempScores[first] || 2) - (tempScores[last] || 2)) >= 2) {
            issues.push({
              profile_id: profileId,
              profile_name: profileName,
              issue_type: 'timeline_inconsistency',
              description: 'Significant relationship temperature shift detected',
              evidence: [`Changed from "${last}" to "${first}" over recent interactions`],
              severity: 'low',
              detected_at: new Date().toISOString(),
            });
          }
        }
      });

      // Analyze trust assessments for low authenticity
      trustAssessments?.forEach(ta => {
        if (ta.authenticity_score !== null && ta.authenticity_score < 40) {
          const profile = ta.profiles as any;
          issues.push({
            profile_id: ta.profile_id,
            profile_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
            issue_type: 'statement_contradiction',
            description: 'Low authenticity score detected in trust assessment',
            evidence: ['Multiple inconsistencies detected'],
            severity: 'high',
            detected_at: ta.created_at,
          });
        }
      });

      // Sort by severity
      const severityOrder = { high: 0, medium: 1, low: 2 };
      issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      // Calculate overview stats
      const profilesAnalyzed = new Set([...profileNotes.keys()]).size;
      const issuesFound = issues.length;
      const highSeverity = issues.filter(i => i.severity === 'high').length;

      return {
        issues: issues.slice(0, 20),
        stats: {
          profilesAnalyzed,
          issuesFound,
          highSeverity,
          consistencyScore: profilesAnalyzed > 0 
            ? Math.round(100 - (issuesFound / profilesAnalyzed) * 20)
            : 100,
        },
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  const issueIcons = {
    statement_contradiction: XCircle,
    behavior_change: TrendingDown,
    timeline_inconsistency: Clock,
  };

  const severityColors = {
    low: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50',
    medium: 'bg-orange-500/10 text-orange-600 border-orange-500/50',
    high: 'bg-red-500/10 text-red-600 border-red-500/50',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Consistency & Pattern Analysis
        </CardTitle>
        <CardDescription>
          Detect behavioral inconsistencies and statement patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Consistency Score</span>
              <Badge variant="outline">{data?.stats.profilesAnalyzed || 0} analyzed</Badge>
            </div>
            <div className="text-3xl font-bold">{data?.stats.consistencyScore || 100}%</div>
            <Progress value={data?.stats.consistencyScore || 100} className="h-2 mt-2" />
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Issues Found</span>
            </div>
            <div className="text-3xl font-bold">{data?.stats.issuesFound || 0}</div>
            {(data?.stats.highSeverity || 0) > 0 && (
              <Badge variant="destructive" className="mt-2">
                {data?.stats.highSeverity} high severity
              </Badge>
            )}
          </div>
        </div>

        {/* Issues List */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Detected Inconsistencies</h4>
          <ScrollArea className="h-[300px]">
            {data?.issues && data.issues.length > 0 ? (
              <div className="space-y-3">
                {data.issues.map((issue, i) => {
                  const Icon = issueIcons[issue.issue_type] || AlertTriangle;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/contacts/${issue.profile_id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${severityColors[issue.severity]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{issue.profile_name}</span>
                            <Badge variant="outline" className={severityColors[issue.severity]}>
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {issue.description}
                          </p>
                          {issue.evidence.length > 0 && (
                            <div className="text-xs bg-muted/50 p-2 rounded">
                              <strong>Evidence:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {issue.evidence.slice(0, 2).map((e, j) => (
                                  <li key={j}>{e}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No inconsistencies detected</p>
                <p className="text-sm">All analyzed contacts show consistent patterns</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
