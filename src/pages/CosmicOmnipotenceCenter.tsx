import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Eye, Crown, Zap } from 'lucide-react';
import { useCosmicOmnipotence } from '@/hooks/intelligence/useCosmicOmnipotence';
import { AppLayout } from '@/components/AppLayout';

export default function CosmicOmnipotenceCenter() {
  const [activeTab, setActiveTab] = useState('awareness');
  const { awareness, control, isLoading, expandAwareness, establishControl } = useCosmicOmnipotence();

  const totalPerception = awareness?.reduce((sum, a) => sum + (Number(a.cosmic_perception_level) || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Cosmic Omnipotence Center
              </h1>
              <p className="text-muted-foreground">AGIS Phase 15: Universal Control & Cosmic Dominance</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-indigo-500/50">
            Perception: {totalPerception}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Awareness Nodes</p><p className="text-2xl font-bold text-indigo-400">{awareness?.length || 0}</p></div>
                <Eye className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Control Domains</p><p className="text-2xl font-bold text-purple-400">{control?.length || 0}</p></div>
                <Crown className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Power Magnitude</p><p className="text-2xl font-bold text-violet-400">{control?.reduce((s, c) => s + Number(c.power_magnitude || 0), 0).toFixed(0)}</p></div>
                <Zap className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList><TabsTrigger value="awareness">Cosmic Awareness</TabsTrigger><TabsTrigger value="control">Omnipotent Control</TabsTrigger></TabsList>
          <TabsContent value="awareness">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cosmic Awareness Matrix</CardTitle>
                <Button onClick={() => expandAwareness.mutate({ awareness_scope: 'galactic', cosmic_perception_level: 5 })} className="bg-indigo-600 hover:bg-indigo-700">
                  <Eye className="h-4 w-4 mr-2" />Expand Awareness
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : awareness?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No awareness nodes.</p> : (
                  <div className="grid gap-4">{awareness?.map((a) => (
                    <div key={a.id} className="p-4 rounded-lg border border-indigo-500/30 bg-indigo-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(a.awareness_scope)} Scope</span>
                        <Badge variant="outline">Level: {String(a.cosmic_perception_level)}</Badge>
                      </div>
                      <Progress value={Number(a.cosmic_perception_level) * 10} className="h-2" />
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="control">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Omnipotent Control</CardTitle>
                <Button onClick={() => establishControl.mutate({ control_domain: 'universal', power_magnitude: 50 })} className="bg-purple-600 hover:bg-purple-700">
                  <Crown className="h-4 w-4 mr-2" />Establish Control
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : control?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No control domains.</p> : (
                  <div className="grid gap-4">{control?.map((c) => (
                    <div key={c.id} className="p-4 rounded-lg border border-purple-500/30 bg-purple-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(c.control_domain)} Domain</span>
                        <Badge variant="outline">Power: {String(c.power_magnitude)}</Badge>
                      </div>
                      <Progress value={Number(c.power_magnitude)} className="h-2" />
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
