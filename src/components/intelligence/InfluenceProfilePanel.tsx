import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Target, Zap, AlertTriangle, ThumbsUp, ThumbsDown,
  RefreshCw, Clock, Lightbulb, TrendingUp, Shield, Users
} from 'lucide-react';
import { useInfluenceProfile, useAnalyzeInfluenceProfile, useMethodologyLibrary } from '@/hooks/useInfluenceProfile';

interface InfluenceProfilePanelProps {
  profileId: string;
  contactName: string;
}

export function InfluenceProfilePanel({ profileId, contactName }: InfluenceProfilePanelProps) {
  const { toast } = useToast();
  const { data: profile, isLoading } = useInfluenceProfile(profileId);
  const { data: methodologies } = useMethodologyLibrary();
  const analyzeMutation = useAnalyzeInfluenceProfile();

  const handleAnalyze = async () => {
    try {
      await analyzeMutation.mutateAsync({ profileId });
      toast({ title: 'Profile analyzed', description: 'Influence profile has been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  };

  const susceptibilityItems = [
    { key: 'reciprocity_susceptibility', label: 'Reciprocity', icon: '🎁', description: 'Responds to favors/gifts' },
    { key: 'commitment_consistency_susceptibility', label: 'Commitment', icon: '🤝', description: 'Honors prior commitments' },
    { key: 'social_proof_susceptibility', label: 'Social Proof', icon: '👥', description: 'Influenced by others' },
    { key: 'authority_susceptibility', label: 'Authority', icon: '👔', description: 'Respects expertise' },
    { key: 'liking_susceptibility', label: 'Liking', icon: '❤️', description: 'Persuaded by likeable people' },
    { key: 'scarcity_susceptibility', label: 'Scarcity', icon: '⏰', description: 'Responds to urgency' },
    { key: 'unity_susceptibility', label: 'Unity', icon: '🏠', description: 'Values shared identity' },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Influence Profile
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Psychological susceptibility mapping for {contactName}
            </p>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzeMutation.isPending}
            variant="outline"
          >
            {analyzeMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {profile ? 'Re-Analyze' : 'Generate Profile'}
          </Button>
        </CardHeader>
        {profile && (
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Confidence: {Math.round((profile.confidence_score || 0) * 100)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Last analyzed: {profile.last_analyzed_at ? new Date(profile.last_analyzed_at).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {profile ? (
        <>
          {/* Cialdini's Principles Susceptibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Persuasion Susceptibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {susceptibilityItems.map((item) => {
                  const value = (profile as any)[item.key] || 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                          <span className="text-muted-foreground">- {item.description}</span>
                        </span>
                        <span className="font-semibold">{Math.round(value)}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Decision Making Style */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Decision-Making Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Decision Style</p>
                  <Badge variant="secondary" className="text-sm">{profile.decision_style || 'Unknown'}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Information Preference</p>
                  <Badge variant="secondary" className="text-sm">{profile.information_preference || 'Unknown'}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Risk Appetite</p>
                  <Badge variant="secondary" className="text-sm">{profile.risk_appetite || 'Unknown'}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Time Pressure Response</p>
                  <Badge variant="secondary" className="text-sm">{profile.time_pressure_response || 'Unknown'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Triggers */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <ThumbsUp className="h-5 w-5" />
                  Positive Triggers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  {(profile.positive_triggers as any)?.triggers ? (
                    <ul className="space-y-2">
                      {((profile.positive_triggers as any).triggers || []).map((trigger: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Zap className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {trigger}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No triggers identified yet</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <ThumbsDown className="h-5 w-5" />
                  Negative Triggers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  {(profile.negative_triggers as any)?.triggers ? (
                    <ul className="space-y-2">
                      {((profile.negative_triggers as any).triggers || []).map((trigger: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          {trigger}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No triggers identified yet</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Power Words */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Power Words
                </CardTitle>
                <p className="text-sm text-muted-foreground">Words that resonate with them</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(profile.power_words || []).map((word: string, i: number) => (
                    <Badge key={i} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {word}
                    </Badge>
                  ))}
                  {(!profile.power_words || profile.power_words.length === 0) && (
                    <p className="text-sm text-muted-foreground">No power words identified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Words to Avoid
                </CardTitle>
                <p className="text-sm text-muted-foreground">Words that trigger resistance</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(profile.avoid_words || []).map((word: string, i: number) => (
                    <Badge key={i} variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {word}
                    </Badge>
                  ))}
                  {(!profile.avoid_words || profile.avoid_words.length === 0) && (
                    <p className="text-sm text-muted-foreground">No words to avoid identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Methodologies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recommended Influence Approaches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.recommended_methodologies && profile.recommended_methodologies.length > 0 ? (
                <div className="space-y-3">
                  {profile.recommended_methodologies.slice(0, 5).map((methodId: string, i: number) => {
                    const method = methodologies?.find(m => m.id === methodId);
                    return method ? (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          <Badge variant="outline">{method.category}</Badge>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Analyze profile to get recommendations</p>
              )}
            </CardContent>
          </Card>

          {/* Approach Sequence */}
          {profile.approach_sequence && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommended Approach Sequence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {((profile.approach_sequence as any)?.steps || []).map((step: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Influence Profile Yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Generate an influence profile to understand {contactName}'s psychological patterns, 
              decision-making style, and what approaches work best with them.
            </p>
            <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
              {analyzeMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Generate Influence Profile
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
