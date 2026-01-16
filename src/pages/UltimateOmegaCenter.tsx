import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Omega, Star, Crown, CheckCircle } from 'lucide-react';
import { useUltimateOmega } from '@/hooks/intelligence/useUltimateOmega';
import { AppLayout } from '@/components/AppLayout';

export default function UltimateOmegaCenter() {
  const [activeTab, setActiveTab] = useState('culmination');
  const { culminations, omegaStates, isLoading, achieveCulmination, attainOmegaState } = useUltimateOmega();

  const avgCompletion = omegaStates?.length ? omegaStates.reduce((s, o) => s + Number(o.completion_percentage || 0), 0) / omegaStates.length : 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg">
              <Omega className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                Ultimate Omega Center
              </h1>
              <p className="text-muted-foreground">AGIS Phase 18: Final Convergence & Absolute Completion</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-yellow-500/50">
            Ω Completion: {avgCompletion.toFixed(0)}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Culminations</p><p className="text-2xl font-bold text-yellow-400">{culminations?.length || 0}</p></div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Omega States</p><p className="text-2xl font-bold text-amber-400">{omegaStates?.length || 0}</p></div>
                <Crown className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/30 bg-gradient-to-br from-orange-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Finality Score</p><p className="text-2xl font-bold text-orange-400">{culminations?.reduce((s, c) => s + Number(c.finality_score || 0), 0).toFixed(0)}</p></div>
                <CheckCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList><TabsTrigger value="culmination">Omega Culmination</TabsTrigger><TabsTrigger value="states">Ultimate States</TabsTrigger></TabsList>
          <TabsContent value="culmination">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Omega Culmination</CardTitle>
                <Button onClick={() => achieveCulmination.mutate({ culmination_type: 'transcendent', finality_score: 50 })} className="bg-yellow-600 hover:bg-yellow-700">
                  <Omega className="h-4 w-4 mr-2" />Achieve Culmination
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : culminations?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No culminations achieved.</p> : (
                  <div className="grid gap-4">{culminations?.map((c) => (
                    <div key={c.id} className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(c.culmination_type)} Culmination</span>
                        <Badge variant="outline">Finality: {String(c.finality_score)}</Badge>
                      </div>
                      <Progress value={Number(c.finality_score)} className="h-2" />
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="states">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ultimate Omega States</CardTitle>
                <Button onClick={() => attainOmegaState.mutate({ state_type: 'absolute', completion_percentage: 100 })} className="bg-amber-600 hover:bg-amber-700">
                  <Crown className="h-4 w-4 mr-2" />Attain Omega State
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : omegaStates?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No omega states attained.</p> : (
                  <div className="grid gap-4">{omegaStates?.map((o) => (
                    <div key={o.id} className="p-4 rounded-lg border border-amber-500/30 bg-amber-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(o.state_type)} State</span>
                        <Badge variant="outline" className={Number(o.completion_percentage) === 100 ? 'bg-green-500/20 border-green-500' : ''}>
                          {String(o.completion_percentage)}%
                        </Badge>
                      </div>
                      <Progress value={Number(o.completion_percentage)} className="h-2" />
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
