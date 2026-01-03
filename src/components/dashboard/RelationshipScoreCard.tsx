import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type RelationshipScore = {
  id: string;
  profile_id: string;
  overall_score: number;
  frequency_score: number;
  recency_score: number;
  diversity_score: number;
  sentiment_score: number;
  decay_rate: number;
  profiles: {
    first_name: string;
    last_name: string | null;
    is_favorite: boolean;
  };
};

export function RelationshipScoreCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scores, isLoading } = useQuery({
    queryKey: ['relationship-scores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_scores')
        .select(`
          *,
          profiles (first_name, last_name, is_favorite)
        `)
        .order('overall_score', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as RelationshipScore[];
    },
    enabled: !!user,
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('calculate-relationship-scores', {
        body: { recalculateAll: true },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relationship-scores'] });
      toast({ 
        title: 'Scores recalculated', 
        description: `Updated ${data?.updated || 0} relationship scores.` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 25) return 'text-orange-500';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) return { label: 'Strong', variant: 'default' as const };
    if (score >= 50) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 25) return { label: 'Needs Attention', variant: 'outline' as const };
    return { label: 'At Risk', variant: 'destructive' as const };
  };

  const getTrendIcon = (decayRate: number) => {
    if (decayRate < -0.5) return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (decayRate > 0.5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Relationship Health Scores
            </CardTitle>
            <CardDescription>
              AI-calculated scores based on interaction frequency, recency, and sentiment
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
          >
            {recalculateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : scores && scores.length > 0 ? (
          <div className="space-y-4">
            {scores.map((score) => {
              const badge = getScoreBadge(score.overall_score);
              return (
                <div key={score.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {score.profiles.first_name} {score.profiles.last_name}
                      </span>
                      {score.profiles.is_favorite && (
                        <Heart className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(score.decay_rate)}
                      <span className={`font-bold ${getScoreColor(score.overall_score)}`}>
                        {score.overall_score}
                      </span>
                    </div>
                  </div>
                  <Progress value={score.overall_score} className="h-2" />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Frequency: {score.frequency_score}</span>
                    <span>Recency: {score.recency_score}</span>
                    <span>Diversity: {score.diversity_score}</span>
                    <span>Sentiment: {score.sentiment_score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No relationship scores yet</p>
            <p className="text-sm">Add communications to start tracking relationship health.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
            >
              {recalculateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Calculate Scores
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
