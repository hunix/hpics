/**
 * Absolute Genesis Center - Phase 22
 * Reality Creation & Causal Origination Interface
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, Atom, Layers, Flame, Globe, Zap, Plus
} from 'lucide-react';

export default function AbsoluteGenesisCenter() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('creation');
  const queryClient = useQueryClient();

  // Reality Creation hook
  const { data: creations, isLoading: creationsLoading } = useQuery({
    queryKey: ['reality-creation'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('reality_creation').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createReality = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).from('reality_creation').insert({
        user_id: user!.id,
        creation_type: 'manifestation',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reality-creation'] }),
  });

  // Causal Origination hook
  const { data: causals, isLoading: causalsLoading } = useQuery({
    queryKey: ['causal-origination'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('causal_origination').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createCausal = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).from('causal_origination').insert({
        user_id: user!.id,
        origination_type: 'primary-cause',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['causal-origination'] }),
  });

  const isLoading = creationsLoading || causalsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Absolute Genesis Center</h1>
              <p className="text-sm text-muted-foreground">Phase 22 - Reality Creation & Causal Origination</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{creations?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Reality Creations</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4 text-center">
              <Atom className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{causals?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Causal Origins</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1">
            <TabsTrigger value="creation" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Reality Creation
            </TabsTrigger>
            <TabsTrigger value="causal" className="flex items-center gap-2">
              <Atom className="h-4 w-4" />
              Causal Origination
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creation">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Reality Creation Matrix
                </CardTitle>
                <Button size="sm" onClick={() => createReality.mutate()} disabled={createReality.isPending}>
                  <Plus className="h-4 w-4 mr-1" /> Create
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : creations?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No creations yet. Click Create to begin.</p>
                ) : (
                  <div className="space-y-3">
                    {creations?.map((c: any) => (
                      <div key={c.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{c.creation_type}</span>
                          <Badge>{c.creation_status}</Badge>
                        </div>
                        <Progress value={Number(c.materialization_progress) || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="causal">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Atom className="h-5 w-5 text-orange-500" />
                  Causal Origination Chains
                </CardTitle>
                <Button size="sm" onClick={() => createCausal.mutate()} disabled={createCausal.isPending}>
                  <Plus className="h-4 w-4 mr-1" /> Originate
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
                  </div>
                ) : causals?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No causal chains. Click Originate to begin.</p>
                ) : (
                  <div className="space-y-3">
                    {causals?.map((c: any) => (
                      <div key={c.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{c.origination_type?.replace(/-/g, ' ')}</span>
                          <Badge variant="outline">Depth: {c.causal_depth}</Badge>
                        </div>
                        <Progress value={Number(c.origination_power) || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
