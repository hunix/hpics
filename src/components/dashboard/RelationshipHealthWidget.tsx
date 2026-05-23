import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface RiskData {
  networkHealth: {
    total: number;
    healthy: number;
    atRisk: number;
    critical: number;
    healthPercentage: number;
  };
  atRiskRelationships: Array<{
    profileId: string;
    name: string;
    avatarUrl: string | null;
    relationshipType: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    daysSinceContact: number;
  }>;
  aiRecommendations: Array<{
    name: string;
    action: string;
    urgency: string;
  }>;
}

export function RelationshipHealthWidget() {
  const { user, session } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: riskData, refetch, isLoading } = useQuery<RiskData>({
    queryKey: ['relationship-risks', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('predict-risks', {}, { headers: {
          Authorization: `Bearer ${session?.access_token}`,
        } });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Risk analysis updated');
    } catch (error) {
      toast.error('Failed to refresh analysis');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskBadgeVariant = (level: string): 'default' | 'secondary' | 'destructive' => {
    if (level === 'high') return 'destructive';
    if (level === 'medium') return 'secondary';
    return 'default';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Network Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-20 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Network Health
            </CardTitle>
            <CardDescription>Overall relationship health status</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {riskData?.networkHealth && (
          <>
            {/* Health Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getHealthColor(riskData.networkHealth.healthPercentage)}`}>
                {riskData.networkHealth.healthPercentage}%
              </div>
              <p className="text-sm text-muted-foreground">Network Health Score</p>
            </div>

            <Progress value={riskData.networkHealth.healthPercentage} className="h-2" />

            {/* Status Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 rounded-lg bg-green-500/10">
                <div className="font-semibold text-green-600">{riskData.networkHealth.healthy}</div>
                <div className="text-muted-foreground">Healthy</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <div className="font-semibold text-yellow-600">{riskData.networkHealth.atRisk}</div>
                <div className="text-muted-foreground">At Risk</div>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <div className="font-semibold text-red-600">{riskData.networkHealth.critical}</div>
                <div className="text-muted-foreground">Critical</div>
              </div>
            </div>
          </>
        )}

        {/* At Risk Relationships */}
        {riskData?.atRiskRelationships && riskData.atRiskRelationships.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Needs Attention
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {riskData.atRiskRelationships.slice(0, 5).map((rel) => (
                <div key={rel.profileId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {rel.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{rel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rel.daysSinceContact} days ago
                      </p>
                    </div>
                  </div>
                  <Badge variant={getRiskBadgeVariant(rel.riskLevel)}>
                    {rel.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {riskData?.aiRecommendations && riskData.aiRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Shield className="h-4 w-4 text-primary" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {riskData.aiRecommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="p-2 rounded-lg border text-sm">
                  <p className="font-medium">{rec.name}</p>
                  <p className="text-muted-foreground">{rec.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!riskData?.atRiskRelationships?.length && (
          <div className="text-center py-4 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>All relationships are healthy!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
