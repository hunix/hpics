import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Flame, Dna, Zap } from 'lucide-react';
import { usePrimordialGenesis } from '@/hooks/intelligence/usePrimordialGenesis';
import { AppLayout } from '@/components/AppLayout';

export default function PrimordialGenesisCenter() {
  const [activeTab, setActiveTab] = useState('origins');
  const { origins, synthesis, isLoading, createOrigin, createSynthesis } = usePrimordialGenesis();

  const totalPower = origins?.reduce((sum, o) => sum + (Number(o.genesis_power_level) || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Flame className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Primordial Genesis Center
              </h1>
              <p className="text-muted-foreground">AGIS Phase 14: Origin Control & Creation Matrix</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-orange-500/50">
            Genesis Power: {totalPower}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-orange-500/30 bg-gradient-to-br from-orange-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Origins</p>
                  <p className="text-2xl font-bold text-orange-400">{origins?.length || 0}</p>
                </div>
                <Dna className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-gradient-to-br from-red-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Synthesis Operations</p>
                  <p className="text-2xl font-bold text-red-400">{synthesis?.length || 0}</p>
                </div>
                <Sparkles className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Creation Potential</p>
                  <p className="text-2xl font-bold text-amber-400">{synthesis?.reduce((s, x) => s + Number(x.creation_potential || 0), 0).toFixed(0)}%</p>
                </div>
                <Zap className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList><TabsTrigger value="origins">Primordial Origins</TabsTrigger><TabsTrigger value="synthesis">Genesis Synthesis</TabsTrigger></TabsList>
          <TabsContent value="origins">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Primordial Origins</CardTitle>
                <Button onClick={() => createOrigin.mutate({ origin_type: 'foundational', genesis_power_level: 10 })} className="bg-orange-600 hover:bg-orange-700">
                  <Flame className="h-4 w-4 mr-2" />Create Origin
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : origins?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No origins created. Begin genesis.</p> : (
                  <div className="grid gap-4">{origins?.map((o) => (
                    <div key={o.id} className="p-4 rounded-lg border border-orange-500/30 bg-orange-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(o.origin_type)} Origin</span>
                        <Badge variant="outline">Power: {String(o.genesis_power_level)}</Badge>
                      </div>
                      <Progress value={Number(o.genesis_power_level) * 10} className="h-2" />
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="synthesis">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Genesis Synthesis</CardTitle>
                <Button onClick={() => createSynthesis.mutate({ synthesis_type: 'matter-energy', creation_potential: 25 })} className="bg-red-600 hover:bg-red-700">
                  <Sparkles className="h-4 w-4 mr-2" />Initiate Synthesis
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : synthesis?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No synthesis operations.</p> : (
                  <div className="grid gap-4">{synthesis?.map((s) => (
                    <div key={s.id} className="p-4 rounded-lg border border-red-500/30 bg-red-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(s.synthesis_type)}</span>
                        <Badge variant="outline">Potential: {String(s.creation_potential)}%</Badge>
                      </div>
                      <Progress value={Number(s.creation_potential)} className="h-2" />
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
