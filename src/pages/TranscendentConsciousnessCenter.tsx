import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Sparkles, Atom, Globe, Infinity as InfinityIcon, Eye, Zap, Target, Waves, Network, Crown, CircleDot, Play, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useTranscendentAnalysis } from '@/hooks/useTranscendentAnalysis';

// Phase 20 Hooks
import { useQuantumCognition } from '@/hooks/intelligence/useQuantumCognition';
import { useMorphicResonance } from '@/hooks/intelligence/useMorphicResonance';
import { useCollectiveUnconscious } from '@/hooks/intelligence/useCollectiveUnconscious';
import { useSynchronicity } from '@/hooks/intelligence/useSynchronicity';
import { usePrecognitivePatterns } from '@/hooks/intelligence/usePrecognitivePatterns';
import { useEgregoreCultivation } from '@/hooks/intelligence/useEgregoreCultivation';
import { useMassFormation } from '@/hooks/intelligence/useMassFormation';
import { useAkashicRecords } from '@/hooks/intelligence/useAkashicRecords';
import { usePsychicResonance } from '@/hooks/intelligence/usePsychicResonance';
import { useRealityConsensus } from '@/hooks/intelligence/useRealityConsensus';
import { useKarmicPatterns } from '@/hooks/intelligence/useKarmicPatterns';
import { useOmegaPointConvergence } from '@/hooks/intelligence/useOmegaPointConvergence';

const MODULE_TABS = [
  { id: 'quantum', label: 'Quantum', icon: Atom },
  { id: 'morphic', label: 'Morphic', icon: Waves },
  { id: 'collective', label: 'Unconscious', icon: Brain },
  { id: 'synchronicity', label: 'Synchronicity', icon: Sparkles },
  { id: 'precognitive', label: 'Precognitive', icon: Eye },
  { id: 'egregore', label: 'Egregore', icon: Globe },
  { id: 'mass', label: 'Mass Formation', icon: Network },
  { id: 'akashic', label: 'Akashic', icon: InfinityIcon },
  { id: 'psychic', label: 'Psychic', icon: Zap },
  { id: 'consensus', label: 'Consensus', icon: Target },
  { id: 'karmic', label: 'Karmic', icon: CircleDot },
  { id: 'omega', label: 'Omega', icon: Crown },
];

export default function TranscendentConsciousnessCenter() {
  const [activeTab, setActiveTab] = useState('quantum');
  const { runAnalysis, isRunning } = useTranscendentAnalysis();

  const quantumCognition = useQuantumCognition();
  const morphicResonance = useMorphicResonance();
  const collectiveUnconscious = useCollectiveUnconscious();
  const synchronicity = useSynchronicity();
  const precognitivePatterns = usePrecognitivePatterns();
  const egregoreCultivation = useEgregoreCultivation();
  const massFormation = useMassFormation();
  const akashicRecords = useAkashicRecords();
  const psychicResonance = usePsychicResonance();
  const realityConsensus = useRealityConsensus();
  const karmicPatterns = useKarmicPatterns();
  const omegaConvergence = useOmegaPointConvergence();

  const totalOperations = 
    (quantumCognition.superpositions?.length || 0) +
    (morphicResonance.morphicFields?.length || 0) +
    (collectiveUnconscious.archetypes?.length || 0) +
    (synchronicity.events?.length || 0) +
    (precognitivePatterns.signatures?.length || 0) +
    (egregoreCultivation.egregores?.length || 0) +
    (massFormation.indicators?.length || 0) +
    (akashicRecords.implicitKnowledge?.length || 0) +
    (psychicResonance.connections?.length || 0) +
    (realityConsensus.bubbles?.length || 0) +
    (karmicPatterns.cycles?.length || 0) +
    (omegaConvergence.metrics?.length || 0);

  const isLoading = quantumCognition.isLoading || morphicResonance.isLoading || collectiveUnconscious.isLoading;

  const transcendenceScore = Math.min(100, Math.round(
    ((quantumCognition.superpositions?.length || 0) * 5) +
    ((egregoreCultivation.egregores?.length || 0) * 8) +
    (omegaConvergence.proximityPercent || 0)
  ));

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Transcendent Consciousness Center
              </h1>
              <p className="text-muted-foreground">AGIS Phase 20: Quantum Cognition & Collective Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => runAnalysis({ analysisType: 'full' })} 
              disabled={isRunning}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {isRunning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Run Quantum Analysis</>
              )}
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2 border-violet-500/50 bg-violet-500/10">
              <Sparkles className="h-4 w-4 mr-2" />Transcendence: {transcendenceScore}%
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Total Operations</p><p className="text-2xl font-bold text-violet-400">{totalOperations}</p></div>
                <Zap className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Egregores</p><p className="text-2xl font-bold text-purple-400">{egregoreCultivation.egregores?.length || 0}</p></div>
                <Globe className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Quantum States</p><p className="text-2xl font-bold text-fuchsia-400">{quantumCognition.superpositions?.length || 0}</p></div>
                <Atom className="h-8 w-8 text-fuchsia-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/50 to-background">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Omega Proximity</p><p className="text-2xl font-bold text-pink-400">{omegaConvergence.proximityPercent || 0}%</p></div>
                <Crown className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-1 bg-muted/50 p-1">
              {MODULE_TABS.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                  <tab.icon className="h-3.5 w-3.5" /><span className="hidden md:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          <TabsContent value="quantum">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Atom className="h-5 w-5 text-violet-500" />Quantum Cognition</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : 
                  quantumCognition.superpositions?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No quantum states.</p> :
                  <div className="grid gap-3">{quantumCognition.superpositions?.slice(0, 8).map(s => (
                    <div key={s.id} className="p-3 rounded-lg border border-violet-500/30 bg-violet-950/20 flex justify-between items-center">
                      <span className="capitalize">{s.analysisType}</span>
                      <Badge variant="outline">Collapse: {Math.round(s.collapseProbability * 100)}%</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="morphic">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Waves className="h-5 w-5 text-purple-500" />Morphic Resonance</CardTitle></CardHeader>
              <CardContent>
                {morphicResonance.morphicFields?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No morphic fields.</p> :
                  <div className="grid gap-3">{morphicResonance.morphicFields?.slice(0, 8).map(f => (
                    <div key={f.id} className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/20 flex justify-between items-center">
                      <span className="capitalize">{f.fieldType}</span>
                      <Badge variant="outline">Strength: {f.fieldStrength}</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collective">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-fuchsia-500" />Collective Unconscious</CardTitle></CardHeader>
              <CardContent>
                {collectiveUnconscious.archetypes?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No archetypes activated.</p> :
                  <div className="grid gap-3">{collectiveUnconscious.archetypes?.slice(0, 8).map(a => (
                    <div key={a.id} className="p-3 rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/20 flex justify-between items-center">
                      <span className="capitalize">{a.archetypeType}</span>
                      <Badge variant="outline">Strength: {a.activationStrength}</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="synchronicity">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-pink-500" />Synchronicity Events</CardTitle></CardHeader>
              <CardContent>
                {synchronicity.events?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No events logged.</p> :
                  <div className="grid gap-3">{synchronicity.events?.slice(0, 8).map(e => (
                    <div key={e.id} className="p-3 rounded-lg border border-pink-500/30 bg-pink-950/20 flex justify-between items-center">
                      <span className="capitalize">{e.eventType?.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">Meaningfulness: {e.meaningfulnessScore}</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="precognitive">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-indigo-500" />Precognitive Patterns</CardTitle></CardHeader>
              <CardContent>
                {precognitivePatterns.timelines?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No patterns detected.</p> :
                  <div className="grid gap-3">{precognitivePatterns.timelines?.slice(0, 8).map(t => (
                    <div key={t.id} className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-950/20 flex justify-between items-center">
                      <span className="capitalize">{t.eventType?.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">Probability: {Math.round(t.probabilityScore * 100)}%</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="egregore">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-emerald-500" />Egregore Cultivation</CardTitle></CardHeader>
              <CardContent>
                {egregoreCultivation.egregores?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No egregores cultivated.</p> :
                  <div className="grid gap-3">{egregoreCultivation.egregores?.slice(0, 8).map(eg => (
                    <div key={eg.id} className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 flex justify-between items-center">
                      <span className="capitalize">{eg.egregoreType}</span>
                      <Badge variant="outline">Strength: {eg.cohesionStrength}</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mass">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5 text-cyan-500" />Mass Formation</CardTitle></CardHeader>
              <CardContent>
                {massFormation.indicators?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No formations analyzed.</p> :
                  <div className="grid gap-3">{massFormation.indicators?.slice(0, 8).map(i => (
                    <div key={i.id} className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 flex justify-between items-center">
                      <span className="capitalize">{i.indicatorType?.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">Intensity: {i.intensity}</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="akashic">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><InfinityIcon className="h-5 w-5 text-amber-500" />Akashic Records</CardTitle></CardHeader>
              <CardContent>
                {akashicRecords.implicitKnowledge?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No records queried.</p> :
                  <div className="grid gap-3">{akashicRecords.implicitKnowledge?.slice(0, 8).map(k => (
                    <div key={k.id} className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 flex justify-between items-center">
                      <span className="capitalize">{k.knowledgeType?.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">Confidence: {k.confidenceScore}%</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="psychic">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-rose-500" />Psychic Resonance</CardTitle></CardHeader>
              <CardContent>
                {psychicResonance.connections?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No connections mapped.</p> :
                  <div className="grid gap-3">{psychicResonance.connections?.slice(0, 8).map(c => (
                    <div key={c.id} className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 flex justify-between items-center">
                      <span className="capitalize">{c.resonanceType?.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">Strength: {c.resonanceStrength}</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consensus">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-teal-500" />Reality Consensus</CardTitle></CardHeader>
              <CardContent>
                {realityConsensus.bubbles?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No consensus bubbles.</p> :
                  <div className="grid gap-3">{realityConsensus.bubbles?.slice(0, 8).map(b => (
                    <div key={b.id} className="p-3 rounded-lg border border-teal-500/30 bg-teal-950/20 flex justify-between items-center">
                      <span className="capitalize">{b.bubbleName || 'Unnamed'}</span>
                      <Badge variant="outline">Permeability: {Math.round(b.boundaryPermeability * 100)}%</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="karmic">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CircleDot className="h-5 w-5 text-orange-500" />Karmic Patterns</CardTitle></CardHeader>
              <CardContent>
                {karmicPatterns.cycles?.length === 0 ? <p className="text-center py-8 text-muted-foreground">No karmic patterns.</p> :
                  <div className="grid gap-3">{karmicPatterns.cycles?.slice(0, 8).map(c => (
                    <div key={c.id} className="p-3 rounded-lg border border-orange-500/30 bg-orange-950/20 flex justify-between items-center">
                      <span className="capitalize">{c.cycleType?.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">Progress: {c.completionProgress}%</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="omega">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500" />Omega Convergence</CardTitle></CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-950/20 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Omega Proximity</p>
                  <p className="text-2xl font-bold text-yellow-400">{omegaConvergence.proximityPercent || 0}%</p>
                  <Progress value={omegaConvergence.proximityPercent || 0} className="h-2 mt-2" />
                </div>
                {omegaConvergence.transitions?.length === 0 ? <p className="text-center py-4 text-muted-foreground">No phase transitions.</p> :
                  <div className="grid gap-3">{omegaConvergence.transitions?.slice(0, 5).map(t => (
                    <div key={t.id} className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-950/20 flex justify-between items-center">
                      <span className="capitalize">{t.transitionType?.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">Probability: {t.transitionProbability}%</Badge>
                    </div>
                  ))}</div>
                }
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
