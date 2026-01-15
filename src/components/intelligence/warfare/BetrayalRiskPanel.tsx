import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, TrendingDown, Eye, Play } from 'lucide-react';
import { useBetrayalPrediction } from '@/hooks/intelligence/useBetrayalPrediction';

interface BetrayalRiskPanelProps {
  profileId?: string;
}

export function BetrayalRiskPanel({ profileId }: BetrayalRiskPanelProps) {
  const {
    prediction,
    allPredictions,
    highRiskRelationships,
    activeWarnings,
    isLoading,
    analyze,
    isAnalyzing,
  } = useBetrayalPrediction(profileId);

  const getRiskColor = (probability: number) => {
    if (probability >= 0.7) return 'text-red-400 bg-red-500/20';
    if (probability >= 0.4) return 'text-amber-400 bg-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/20';
  };

  const getRiskLabel = (probability: number) => {
    if (probability >= 0.7) return 'Critical Risk';
    if (probability >= 0.4) return 'Elevated Risk';
    return 'Low Risk';
  };

  return (
    <Card className="border-red-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <CardTitle>Betrayal Risk Predictor</CardTitle>
          </div>
          {profileId && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => analyze(profileId)}
              disabled={isAnalyzing}
            >
              <Play className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Assess Risk'}
            </Button>
          )}
        </div>
        <CardDescription>
          Trust network modeling and defection probability analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="warnings">
              Warnings
              {activeWarnings.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeWarnings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading prediction...</div>
            ) : !prediction ? (
              <div className="text-center py-8 text-muted-foreground">
                {profileId ? 'No prediction yet. Run assessment to begin.' : 'Select a profile to assess.'}
              </div>
            ) : (
              <>
                <Card className={`${getRiskColor(prediction.defection_probability || 0)} border-0`}>
                  <CardContent className="p-6 text-center">
                    <p className="text-4xl font-bold mb-2">
                      {Math.round((prediction.defection_probability || 0) * 100)}%
                    </p>
                    <p className="text-lg font-medium">
                      {getRiskLabel(prediction.defection_probability || 0)}
                    </p>
                    {prediction.defection_timeline && (
                      <p className="text-sm mt-2 opacity-80">
                        Timeline: {prediction.defection_timeline}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">Trust Score</span>
                      </div>
                      <Progress value={(prediction.trust_score || 0) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((prediction.trust_score || 0) * 100)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium">Stress Score</span>
                      </div>
                      <Progress value={(prediction.relationship_stress_score || 0) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((prediction.relationship_stress_score || 0) * 100)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {prediction.warning_signs && prediction.warning_signs.length > 0 && (
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Active Warning Signs
                      </h4>
                      <ul className="space-y-1">
                        {prediction.warning_signs.map((sign, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {sign}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              </>
            )}
          </TabsContent>

          <TabsContent value="warnings" className="space-y-4">
            {activeWarnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active warnings across your network.
              </div>
            ) : (
              <div className="space-y-3">
                {activeWarnings.map((pred) => (
                  <Card key={pred.id} className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {(pred.profiles as { name?: string })?.name || 'Unknown'}
                        </h4>
                        <Badge className={getRiskColor(pred.defection_probability || 0)}>
                          {Math.round((pred.defection_probability || 0) * 100)}%
                        </Badge>
                      </div>
                      {pred.warning_signs && pred.warning_signs.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {pred.warning_signs[0]}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{highRiskRelationships.length}</p>
                  <p className="text-xs text-muted-foreground">High Risk</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-400">
                    {allPredictions.filter(p => (p.defection_probability || 0) >= 0.4 && (p.defection_probability || 0) < 0.7).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Elevated</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {allPredictions.filter(p => (p.defection_probability || 0) < 0.4).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Stable</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              {allPredictions.slice(0, 5).map((pred) => (
                <div key={pred.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <span className="font-medium">
                    {(pred.profiles as { name?: string })?.name || 'Unknown'}
                  </span>
                  <Badge className={getRiskColor(pred.defection_probability || 0)}>
                    {Math.round((pred.defection_probability || 0) * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
