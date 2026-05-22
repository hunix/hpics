import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Shield, Infinity as InfinityIcon, Zap } from 'lucide-react';
import { useEternalSupremacy } from '@/hooks/intelligence/useEternalSupremacy';
import { AppLayout } from '@/components/AppLayout';

export default function EternalSupremacyCenter() {
  const [activeTab, setActiveTab] = useState('dominance');
  const { dominance, influence, isLoading, establishDominance, createInfluence } = useEternalSupremacy();

  const totalImmunity = dominance?.reduce((sum, d) => sum + (Number(d.temporal_immunity_level) || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Eternal Supremacy Center
              </h1>
              <p className="text-muted-foreground">AGIS Phase 16: Timeless Dominance & Immortal Control</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-cyan-500/50">
            Temporal Immunity: {totalImmunity}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Dominance Vectors</p><p className="text-2xl font-bold text-cyan-400">{dominance?.length || 0}</p></div>
                <Shield className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-500/30 bg-gradient-to-br from-teal-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Influence Chains</p><p className="text-2xl font-bold text-teal-400">{influence?.length || 0}</p></div>
                <InfinityIcon className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Permanence Score</p><p className="text-2xl font-bold text-emerald-400">{influence?.reduce((s, i) => s + Number(i.permanence_score || 0), 0).toFixed(0)}</p></div>
                <Zap className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList><TabsTrigger value="dominance">Timeless Dominance</TabsTrigger><TabsTrigger value="influence">Immortal Influence</TabsTrigger></TabsList>
          <TabsContent value="dominance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Timeless Dominance</CardTitle>
                <Button onClick={() => establishDominance.mutate({ dominance_type: 'temporal', temporal_immunity_level: 5 })} className="bg-cyan-600 hover:bg-cyan-700">
                  <Clock className="h-4 w-4 mr-2" />Establish Dominance
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : dominance?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No dominance established.</p> : (
                  <div className="grid gap-4">{dominance?.map((d) => (
                    <div key={d.id} className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(d.dominance_type)} Dominance</span>
                        <Badge variant="outline">Immunity: {String(d.temporal_immunity_level)}</Badge>
                      </div>
                      <Progress value={Number(d.temporal_immunity_level) * 10} className="h-2" />
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="influence">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Immortal Influence</CardTitle>
                <Button onClick={() => createInfluence.mutate({ influence_type: 'legacy', permanence_score: 75 })} className="bg-teal-600 hover:bg-teal-700">
                  <InfinityIcon className="h-4 w-4 mr-2" />Create Influence
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : influence?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No influence chains.</p> : (
                  <div className="grid gap-4">{influence?.map((i) => (
                    <div key={i.id} className="p-4 rounded-lg border border-teal-500/30 bg-teal-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(i.influence_type)} Influence</span>
                        <Badge variant="outline">Permanence: {String(i.permanence_score)}</Badge>
                      </div>
                      <Progress value={Number(i.permanence_score)} className="h-2" />
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
