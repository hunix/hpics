/**
 * Behavioral Economics Panel
 * Cognitive bias exploitation and financial psychology visualization
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Brain, 
  TrendingDown, 
  Anchor,
  AlertTriangle,
  Target,
  Loader2
} from 'lucide-react';
import { useBehavioralEconomics } from '@/hooks/intelligence/useBehavioralEconomics';

interface BehavioralEconomicsPanelProps {
  profileId: string;
}

export function BehavioralEconomicsPanel({ profileId }: BehavioralEconomicsPanelProps) {
  const { isAnalyzing, analyzeProfile, loadProfile, getProfile } = useBehavioralEconomics();
  const [profile, setProfile] = useState<ReturnType<typeof getProfile>>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (profileId) {
      loadProfile(profileId).then((result) => {
        if (isMountedRef.current) {
          setProfile(result);
        }
      });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [profileId, loadProfile]);

  const handleAnalyze = async () => {
    const result = await analyzeProfile(profileId);
    if (result) setProfile(result);
  };

  const biases = profile?.biases ? [
    { name: 'Loss Aversion', value: profile.lossAversion / 3, description: 'Fear of losses > desire for gains' },
    { name: 'Endowment Effect', value: profile.biases.endowmentEffect, description: 'Overvalues owned items' },
    { name: 'Sunk Cost Fallacy', value: profile.biases.sunkCostFallacy, description: 'Continues based on past investment' },
    { name: 'Anchoring Bias', value: profile.biases.anchoringBias, description: 'Relies heavily on first info' },
    { name: 'Status Quo Bias', value: profile.biases.statusQuoBias, description: 'Prefers current state' },
    { name: 'Hyperbolic Discounting', value: profile.biases.hyperbolicDiscounting, description: 'Prefers immediate rewards' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold">Behavioral Economics</h3>
            <p className="text-sm text-muted-foreground">Financial psychology & cognitive biases</p>
          </div>
        </div>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
          Analyze Psychology
        </Button>
      </div>

      {profile ? (
        <Tabs defaultValue="biases">
          <TabsList>
            <TabsTrigger value="biases">Cognitive Biases</TabsTrigger>
            <TabsTrigger value="strategies">Exploitation Strategies</TabsTrigger>
          </TabsList>

          <TabsContent value="biases" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {biases.map((bias) => (
                <Card key={bias.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{bias.name}</span>
                      <Badge variant={bias.value > 0.7 ? 'destructive' : bias.value > 0.4 ? 'default' : 'secondary'}>
                        {Math.round(bias.value * 100)}%
                      </Badge>
                    </div>
                    <Progress value={bias.value * 100} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">{bias.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Loss Aversion Indicator */}
            <Card className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                  Loss Aversion Coefficient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{profile.lossAversion.toFixed(2)}x</span>
                  <span className="text-muted-foreground">loss sensitivity</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Losses feel {profile.lossAversion.toFixed(1)}x more painful than equivalent gains.
                  {profile.lossAversion > 2.5 && ' Highly susceptible to loss-framed messaging.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Recommended Exploitation Strategies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.lossAversion > 2 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">Loss Framing</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Frame propositions in terms of what they stand to lose, not gain.
                      Example: "Don't miss out on $X" instead of "Save $X"
                    </p>
                  </div>
                )}
                
                {profile.biases?.anchoringBias && profile.biases.anchoringBias > 0.5 && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Anchor className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Anchor High</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start negotiations with a high anchor. They'll adjust from your initial number.
                      Recommended anchor: 1.5-2x your target price.
                    </p>
                  </div>
                )}

                {profile.biases?.sunkCostFallacy && profile.biases.sunkCostFallacy > 0.6 && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-sm">Invoke Past Investment</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Remind them of time/money already invested. They'll feel compelled to continue.
                      "You've already put in X hours..."
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No financial psychology profile available</p>
            <Button onClick={handleAnalyze} className="mt-4" disabled={isAnalyzing}>
              Generate Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BehavioralEconomicsPanel;
