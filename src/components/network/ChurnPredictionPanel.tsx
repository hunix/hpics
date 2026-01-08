import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { format, differenceInDays, subDays } from 'date-fns';
import { toast } from 'sonner';

interface ChurnRisk {
  profileId: string;
  name: string;
  avatarUrl?: string;
  riskScore: number;
  daysSinceContact: number;
  lastInteraction: string;
  factors: string[];
  recommendation: string;
}

export function ChurnPredictionPanel() {
  const { user } = useAuth();

  const { data: predictions, isLoading, refetch } = useQuery({
    queryKey: ['churn-predictions', user?.id],
    queryFn: async () => {
      // Get profiles with last communication date
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .limit(100);

      if (profileError) throw profileError;

      // Get last communication for each profile
      const { data: communications, error: commError } = await supabase
        .from('communications')
        .select('profile_id, occurred_at')
        .order('occurred_at', { ascending: false });

      if (commError) throw commError;

      // Get existing predictions
      const { data: existingPredictions } = await supabase
        .from('network_predictions')
        .select('*')
        .eq('prediction_type', 'churn')
        .order('created_at', { ascending: false });

      // Build churn risk assessments
      const now = new Date();
      const lastComm: Record<string, Date> = {};
      communications?.forEach(c => {
        if (!lastComm[c.profile_id]) {
          lastComm[c.profile_id] = new Date(c.occurred_at);
        }
      });

      const risks: ChurnRisk[] = profiles?.map(profile => {
        const lastContact = lastComm[profile.id];
        const daysSinceContact = lastContact ? differenceInDays(now, lastContact) : 999;
        
        // Calculate risk score based on days since contact
        let riskScore = 0;
        const factors: string[] = [];
        
        if (daysSinceContact > 90) {
          riskScore = 95;
          factors.push('No contact for 90+ days');
        } else if (daysSinceContact > 60) {
          riskScore = 80;
          factors.push('No contact for 60+ days');
        } else if (daysSinceContact > 30) {
          riskScore = 50;
          factors.push('No contact for 30+ days');
        } else if (daysSinceContact > 14) {
          riskScore = 30;
          factors.push('No recent contact');
        } else {
          riskScore = 10;
        }

        // Check for declining communication pattern
        const prediction = existingPredictions?.find(p => p.profile_id === profile.id);
        if (prediction?.contributing_factors) {
          const pf = prediction.contributing_factors as { declining_pattern?: boolean };
          if (pf.declining_pattern) {
            riskScore = Math.min(100, riskScore + 15);
            factors.push('Declining communication trend');
          }
        }

        // Generate recommendation
        let recommendation = 'Maintain regular contact';
        if (riskScore > 70) {
          recommendation = 'Urgent: Schedule a call or meeting this week';
        } else if (riskScore > 50) {
          recommendation = 'Send a personal check-in message';
        } else if (riskScore > 30) {
          recommendation = 'Plan to reconnect soon';
        }

        return {
          profileId: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          avatarUrl: profile.avatar_url || undefined,
          riskScore,
          daysSinceContact,
          lastInteraction: lastContact?.toISOString() || '',
          factors,
          recommendation,
        };
      }).filter(r => r.riskScore > 20)
        .sort((a, b) => b.riskScore - a.riskScore) || [];

      return risks;
    },
    enabled: !!user,
  });

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 50) return 'text-amber-600';
    return 'text-green-600';
  };

  const getRiskBg = (score: number) => {
    if (score >= 80) return 'bg-destructive/10';
    if (score >= 50) return 'bg-amber-500/10';
    return 'bg-green-500/10';
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Predictions refreshed');
  };

  const highRiskCount = predictions?.filter(p => p.riskScore >= 70).length || 0;
  const mediumRiskCount = predictions?.filter(p => p.riskScore >= 40 && p.riskScore < 70).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-500" />
              Relationship Churn Prediction
            </CardTitle>
            <CardDescription>
              {highRiskCount} high risk • {mediumRiskCount} medium risk contacts
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : predictions && predictions.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {predictions.map(prediction => (
                <div 
                  key={prediction.profileId} 
                  className={`p-4 rounded-lg border ${getRiskBg(prediction.riskScore)}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={prediction.avatarUrl} />
                      <AvatarFallback>{prediction.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{prediction.name}</span>
                        <Badge variant="outline" className={getRiskColor(prediction.riskScore)}>
                          {prediction.riskScore >= 80 ? 'High Risk' : 
                           prediction.riskScore >= 50 ? 'Medium Risk' : 'Low Risk'}
                        </Badge>
                      </div>
                      
                      {/* Risk Score Bar */}
                      <div className="flex items-center gap-2 mb-2">
                        <Progress 
                          value={prediction.riskScore} 
                          className="h-2 flex-1"
                        />
                        <span className={`text-sm font-medium ${getRiskColor(prediction.riskScore)}`}>
                          {prediction.riskScore}%
                        </span>
                      </div>

                      {/* Factors */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {prediction.factors.map((factor, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>

                      {/* Last Contact */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {prediction.daysSinceContact < 999 
                            ? `${prediction.daysSinceContact} days since contact`
                            : 'No recorded contact'}
                        </span>
                      </div>

                      {/* Recommendation */}
                      <div className="mt-2 p-2 rounded bg-background/50 text-sm">
                        <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />
                        {prediction.recommendation}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No churn risk detected</p>
            <p className="text-sm">Your relationships are healthy!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
