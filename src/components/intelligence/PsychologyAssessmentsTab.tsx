import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePsychologyAssessments, useLatestPsychologyAssessment } from '@/hooks/usePsychologyAssessment';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  profileId: string;
}

export function PsychologyAssessmentsTab({ profileId }: Props) {
  const { data: assessments = [], isLoading } = usePsychologyAssessments(profileId);
  const { data: latest } = useLatestPsychologyAssessment(profileId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading assessments...
        </CardContent>
      </Card>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No psychology assessments yet for this contact.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest Assessment Summary */}
      {latest?.dark_triad_scores && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Latest Dark Triad Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(['narcissism', 'machiavellianism', 'psychopathy'] as const).map((trait) => (
                <div key={trait} className="text-center">
                  <div className="text-2xl font-bold">
                    {((latest.dark_triad_scores?.[trait] ?? 0) * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{trait}</p>
                </div>
              ))}
            </div>
            {latest.risk_level && (
              <div className="mt-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Risk Level:</span>
                <Badge variant={latest.risk_level === 'high' ? 'destructive' : 'secondary'}>
                  {latest.risk_level}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assessment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assessment History ({assessments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {assessments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium capitalize">{a.assessment_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.confidence_score && (
                    <Badge variant="outline" className="text-xs">
                      {(a.confidence_score * 100).toFixed(0)}% confidence
                    </Badge>
                  )}
                  {a.risk_level && (
                    <Badge variant={a.risk_level === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {a.risk_level}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
