import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, DollarSign, Briefcase, Heart, Activity, 
  Sparkles, Loader2, ArrowUp, ArrowDown, Minus 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FortuneTrajectoryPanelProps {
  profileId: string;
  profileName?: string;
}

interface TrajectoryPrediction {
  current: number;
  predicted: number;
  confidence: number;
  timeframe: string;
  keyFactors: string[];
}

interface FortuneData {
  financialTrajectory: TrajectoryPrediction & {
    incomeGrowth: string;
    wealthAccumulation: string;
    riskFactors: string[];
  };
  careerTrajectory: TrajectoryPrediction & {
    nextMilestone: string;
    promotionProbability: number;
    industryOutlook: string;
  };
  healthTrajectory: TrajectoryPrediction & {
    stressIndicators: string[];
    lifestyleScore: number;
    recommendations: string[];
  };
  relationshipTrajectory: TrajectoryPrediction & {
    satisfactionTrend: string;
    stabilityScore: number;
    growthAreas: string[];
  };
  luckyWindows: Array<{
    period: string;
    opportunityType: string;
    probability: number;
    action: string;
  }>;
  crisisWarnings: Array<{
    area: string;
    timeframe: string;
    probability: number;
    prevention: string;
  }>;
}

export function FortuneTrajectoryPanel({ profileId, profileName }: FortuneTrajectoryPanelProps) {
  const [data, setData] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const projectFortune = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.functions.invoke('fortune-trajectory-engine', {
        body: { profileId, userId: user.id, forecastHorizon: 'extended' }
      });

      if (!isMountedRef.current) return;
      if (error) throw error;
      setData(result.analysis);
      toast.success('Fortune trajectory projection complete');
    } catch (error: any) {
      if (isMountedRef.current) {
        toast.error(error.message || 'Projection failed');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getTrendIcon = (current: number, predicted: number) => {
    if (predicted > current) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (predicted < current) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const TrajectoryCard = ({ 
    icon: Icon, 
    title, 
    trajectory, 
    color 
  }: { 
    icon: any; 
    title: string; 
    trajectory: TrajectoryPrediction; 
    color: string;
  }) => (
    <div className={`p-4 rounded-lg bg-gradient-to-br ${color} border border-border/50`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span className="font-medium">{title}</span>
        </div>
        {getTrendIcon(trajectory.current, trajectory.predicted)}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-muted-foreground">Current</div>
          <div className="text-lg font-bold">{trajectory.current}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Predicted</div>
          <div className="text-lg font-bold">{trajectory.predicted}%</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{trajectory.timeframe}</span>
        <Badge variant="outline">{Math.round(trajectory.confidence * 100)}% conf</Badge>
      </div>
    </div>
  );

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Fortune Trajectory Engine
          </CardTitle>
          <Button 
            onClick={projectFortune} 
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-yellow-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            Project
          </Button>
        </div>
        {profileName && <p className="text-sm text-muted-foreground">Trajectory for {profileName}</p>}
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Project future trajectories for financial, career, health, and relationship outcomes.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="warnings">Warnings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                <TrajectoryCard
                  icon={DollarSign}
                  title="Financial"
                  trajectory={data.financialTrajectory}
                  color="from-green-500/10 to-emerald-500/10"
                />
                <TrajectoryCard
                  icon={Briefcase}
                  title="Career"
                  trajectory={data.careerTrajectory}
                  color="from-blue-500/10 to-indigo-500/10"
                />
                <TrajectoryCard
                  icon={Activity}
                  title="Health"
                  trajectory={data.healthTrajectory}
                  color="from-red-500/10 to-pink-500/10"
                />
                <TrajectoryCard
                  icon={Heart}
                  title="Relationship"
                  trajectory={data.relationshipTrajectory}
                  color="from-pink-500/10 to-rose-500/10"
                />
              </div>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.luckyWindows?.map((window, i) => (
                  <div key={i} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{window.opportunityType}</Badge>
                      <span className="text-sm text-green-600">{window.probability}% likely</span>
                    </div>
                    <div className="text-sm font-medium mb-1">{window.period}</div>
                    <p className="text-xs text-muted-foreground">{window.action}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="warnings" className="mt-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.crisisWarnings?.map((warning, i) => (
                  <div key={i} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">{warning.area}</Badge>
                      <span className="text-sm text-red-600">{warning.probability}% risk</span>
                    </div>
                    <div className="text-sm font-medium mb-1">{warning.timeframe}</div>
                    <p className="text-xs text-muted-foreground">Prevention: {warning.prevention}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
