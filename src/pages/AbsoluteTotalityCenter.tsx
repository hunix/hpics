import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Merge, Layers, Target, Zap } from 'lucide-react';
import { useAbsoluteTotality } from '@/hooks/intelligence/useAbsoluteTotality';
import { AppLayout } from '@/components/AppLayout';

export default function AbsoluteTotalityCenter() {
  const [activeTab, setActiveTab] = useState('unification');
  const { unification, operations, isLoading, unify, executeOperation } = useAbsoluteTotality();

  const completenessIndex = unification?.reduce((sum, u) => sum + (Number(u.completeness_index) || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg">
              <Merge className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                Absolute Totality Center
              </h1>
              <p className="text-muted-foreground">AGIS Phase 17: Complete Unification & Total Synthesis</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 border-rose-500/50">
            Completeness: {completenessIndex.toFixed(0)}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-rose-500/30 bg-gradient-to-br from-rose-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Unification Scopes</p><p className="text-2xl font-bold text-rose-400">{unification?.length || 0}</p></div>
                <Layers className="h-8 w-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Active Operations</p><p className="text-2xl font-bold text-pink-400">{operations?.length || 0}</p></div>
                <Target className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Totality Coefficient</p><p className="text-2xl font-bold text-fuchsia-400">{operations?.reduce((s, o) => s + Number(o.totality_coefficient || 0), 0).toFixed(0)}</p></div>
                <Zap className="h-8 w-8 text-fuchsia-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList><TabsTrigger value="unification">Total Unification</TabsTrigger><TabsTrigger value="operations">Totality Operations</TabsTrigger></TabsList>
          <TabsContent value="unification">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Total Unification</CardTitle>
                <Button onClick={() => unify.mutate({ unification_scope: 'absolute', completeness_index: 25 })} className="bg-rose-600 hover:bg-rose-700">
                  <Merge className="h-4 w-4 mr-2" />Unify Domain
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : unification?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No unification scopes.</p> : (
                  <div className="grid gap-4">{unification?.map((u) => (
                    <div key={u.id} className="p-4 rounded-lg border border-rose-500/30 bg-rose-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(u.unification_scope)} Scope</span>
                        <Badge variant="outline">Completeness: {String(u.completeness_index)}%</Badge>
                      </div>
                      <Progress value={Number(u.completeness_index)} className="h-2" />
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="operations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Totality Operations</CardTitle>
                <Button onClick={() => executeOperation.mutate({ operation_type: 'comprehensive', totality_coefficient: 50 })} className="bg-pink-600 hover:bg-pink-700">
                  <Target className="h-4 w-4 mr-2" />Execute Operation
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : operations?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No operations active.</p> : (
                  <div className="grid gap-4">{operations?.map((o) => (
                    <div key={o.id} className="p-4 rounded-lg border border-pink-500/30 bg-pink-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{String(o.operation_type)} Operation</span>
                        <Badge variant="outline">{String(o.operation_status)}</Badge>
                      </div>
                      <Progress value={Number(o.totality_coefficient)} className="h-2" />
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
