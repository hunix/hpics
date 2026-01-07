import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, RefreshCw, Clock, MessageSquare, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface AtRiskRelationship {
  profileId: string;
  name: string;
  avatarUrl: string | null;
  relationshipType: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  daysSinceContact: number;
  lastContactDate: string | null;
}

interface AIRecommendation {
  name: string;
  action: string;
  urgency: 'immediate' | 'this_week' | 'this_month';
}

interface NetworkHealth {
  total: number;
  healthy: number;
  atRisk: number;
  critical: number;
  healthPercentage: number;
}

const riskLevelConfig = {
  low: { color: 'text-green-500', bg: 'bg-green-500', label: 'Low Risk' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500', label: 'Medium Risk' },
  high: { color: 'text-red-500', bg: 'bg-red-500', label: 'High Risk' },
};

const urgencyConfig = {
  immediate: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Urgent' },
  this_week: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'This Week' },
  this_month: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'This Month' },
};

const actionIcons: Record<string, React.ElementType> = {
  call: Phone,
  message: MessageSquare,
  email: Mail,
};

export function NetworkRiskPanel() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['network-risks', user?.id],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('predict-risks', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data as {
        networkHealth: NetworkHealth;
        atRiskRelationships: AtRiskRelationship[];
        aiRecommendations: AIRecommendation[];
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Risk analysis updated');
    } catch (error) {
      toast.error('Failed to refresh risk analysis');
    } finally {
      setIsRefreshing(false);
    }
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
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const { networkHealth, atRiskRelationships = [], aiRecommendations = [] } = data || {};

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Network Risk Monitor
          </CardTitle>
          <CardDescription>Relationships needing attention</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Health Overview */}
        {networkHealth && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Network Health</span>
              <span className={`text-lg font-bold ${
                networkHealth.healthPercentage >= 70 ? 'text-green-500' :
                networkHealth.healthPercentage >= 40 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {networkHealth.healthPercentage}%
              </span>
            </div>
            <Progress value={networkHealth.healthPercentage} className="h-2" />
            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
              <div>
                <div className="font-semibold text-green-500">{networkHealth.healthy}</div>
                <div className="text-muted-foreground">Healthy</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-500">{networkHealth.atRisk}</div>
                <div className="text-muted-foreground">At Risk</div>
              </div>
              <div>
                <div className="font-semibold text-red-500">{networkHealth.critical}</div>
                <div className="text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="font-semibold">{networkHealth.total}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {aiRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {aiRecommendations.slice(0, 3).map((rec, index) => {
                const urgency = urgencyConfig[rec.urgency];
                return (
                  <div key={index} className={`p-2 rounded-lg border ${urgency.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{rec.name}</span>
                      <Badge variant="outline" className={urgency.color}>
                        {urgency.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.action}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* At-Risk Relationships */}
        {atRiskRelationships.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">At-Risk Contacts</h4>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {atRiskRelationships.map((relationship) => {
                  const riskConfig = riskLevelConfig[relationship.riskLevel];
                  return (
                    <Link
                      key={relationship.profileId}
                      to={`/contacts/${relationship.profileId}`}
                      className="block"
                    >
                      <div className="p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{relationship.name}</span>
                          <Badge variant="outline" className={riskConfig.color}>
                            {relationship.riskScore}%
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {relationship.lastContactDate
                            ? `Last contact ${formatDistanceToNow(new Date(relationship.lastContactDate))} ago`
                            : 'Never contacted'}
                        </div>

                        {relationship.riskFactors.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {relationship.riskFactors[0]}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {atRiskRelationships.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-green-500">All Clear!</p>
            <p className="text-xs">No relationships at risk</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
