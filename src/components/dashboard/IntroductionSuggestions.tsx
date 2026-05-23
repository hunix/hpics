import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, RefreshCw, ArrowRight, Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

type IntroductionSuggestion = {
  contact1Id: string;
  contact1Name: string;
  contact2Id: string;
  contact2Name: string;
  reason: string;
  potentialValue: number;
  suggestedContext: string;
};

export function IntroductionSuggestions() {
  const { user } = useAuth();
  const [dismissedPairs, setDismissedPairs] = useState<string[]>([]);

  const { data: introductions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['introduction-suggestions', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('suggest-introductions');
      
      if (error) {
        console.error('Error fetching introductions:', error);
        throw error;
      }
      
      return (data?.introductions ?? []) as IntroductionSuggestion[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const handleDismiss = (contact1Id: string, contact2Id: string) => {
    const pairKey = [contact1Id, contact2Id].sort().join('-');
    setDismissedPairs(prev => [...prev, pairKey]);
    toast.success('Suggestion dismissed');
  };

  const handleIntroduce = (intro: IntroductionSuggestion) => {
    // Copy introduction template to clipboard
    const template = `Hi ${intro.contact1Name} and ${intro.contact2Name},

I wanted to introduce you two! ${intro.reason}

${intro.suggestedContext}

Best,`;
    
    navigator.clipboard.writeText(template);
    toast.success('Introduction template copied to clipboard!');
  };

  const filteredIntroductions = introductions?.filter(intro => {
    const pairKey = [intro.contact1Id, intro.contact2Id].sort().join('-');
    return !dismissedPairs.includes(pairKey);
  }) ?? [];

  const getValueBadgeColor = (value: number) => {
    if (value >= 8) return 'bg-green-500 text-white';
    if (value >= 5) return 'bg-yellow-500 text-white';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Introduction Suggestions
          </CardTitle>
          <CardDescription>
            Connect people in your network who could benefit from knowing each other
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredIntroductions.length > 0 ? (
          <div className="space-y-3">
            {filteredIntroductions.map((intro, idx) => (
              <div
                key={`${intro.contact1Id}-${intro.contact2Id}-${idx}`}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium">{intro.contact1Name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{intro.contact2Name}</span>
                      <Badge className={getValueBadgeColor(intro.potentialValue)}>
                        {intro.potentialValue}/10 value
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {intro.reason}
                    </p>
                    <div className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{intro.suggestedContext}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleIntroduce(intro)}
                    >
                      Introduce
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(intro.contact1Id, intro.contact2Id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No introduction suggestions yet.</p>
            <p className="text-sm">Add more contacts with interests and skills to get suggestions!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
