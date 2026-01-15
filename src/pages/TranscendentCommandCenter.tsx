import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, Clock, Brain, Orbit, Users, Zap } from 'lucide-react';
import { useRealityEngineering } from '@/hooks/intelligence/useRealityEngineering';
import { useTemporalOrchestration } from '@/hooks/intelligence/useTemporalOrchestration';
import { useQuantumInfluence } from '@/hooks/intelligence/useQuantumInfluence';
import { useTranscendentOperations } from '@/hooks/intelligence/useTranscendentOperations';

export default function TranscendentCommandCenter() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { stats: realityStats } = useRealityEngineering();
  const { stats: temporalStats } = useTemporalOrchestration();
  const { stats: quantumStats } = useQuantumInfluence();
  const { stats: transcendenceStats } = useTranscendentOperations();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="Transcendent Command">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Transcendent Operations
            </h1>
            <p className="text-muted-foreground mt-1">AGIS Phase 6 - Reality Engineering & Quantum Influence</p>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50">
            TRANSCENDENT MODE
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Brain className="h-4 w-4" />
                <span className="text-sm">Reality Frameworks</span>
              </div>
              <p className="text-2xl font-bold mt-1">{realityStats.activeFrameworks}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Temporal Ops</span>
              </div>
              <p className="text-2xl font-bold mt-1">{temporalStats.activeOrchestrations}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Orbit className="h-4 w-4" />
                <span className="text-sm">Quantum States</span>
              </div>
              <p className="text-2xl font-bold mt-1">{quantumStats.activeQuantumStates}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-pink-400">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Meta Patterns</span>
              </div>
              <p className="text-2xl font-bold mt-1">{transcendenceStats.metaPatternsDiscovered}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="reality" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="reality">Reality Engineering</TabsTrigger>
            <TabsTrigger value="temporal">Temporal</TabsTrigger>
            <TabsTrigger value="quantum">Quantum</TabsTrigger>
            <TabsTrigger value="transcendence">Transcendence</TabsTrigger>
          </TabsList>

          <TabsContent value="reality">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Reality Engineering Console
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Perception manipulation and belief architecture control. {realityStats.totalBeliefMaps} belief maps analyzed.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="temporal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Temporal Orchestration Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{temporalStats.capturedMoments} moments captured, {temporalStats.unLeveragedMoments} awaiting leverage.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quantum">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Orbit className="h-5 w-5" />
                  Quantum Influence Field
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{quantumStats.totalEntanglements} entanglements active across {quantumStats.collectiveFields} collective fields.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcendence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Transcendence Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-muted-foreground">{transcendenceStats.activeOperations} active, {transcendenceStats.completedOperations} completed.</p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Completion</span>
                      <span>{Math.round(transcendenceStats.avgCompletionRate)}%</span>
                    </div>
                    <Progress value={transcendenceStats.avgCompletionRate} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
