import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dna, Brain, Repeat, Fingerprint, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BehavioralDNAPanelProps {
  profileId: string;
  profileName?: string;
}

interface Trait {
  trait: string;
  score: number;
  confidence: number;
  manifestations: string[];
}

interface HabitLoop {
  cue: string;
  routine: string;
  reward: string;
  strength: number;
  modifiable: boolean;
}

interface BehavioralDNA {
  coreTraits: Trait[];
  decisionArchitecture: {
    primaryStyle: string;
    secondaryStyle: string;
    riskTolerance: number;
    decisionSpeed: string;
    influenceFactors: string[];
  };
  habitLoops: HabitLoop[];
  behavioralTells: Array<{
    tell: string;
    meaning: string;
    reliability: number;
  }>;
  consistencyMatrix: {
    overallConsistency: number;
    contextVariations: Array<{
      context: string;
      behaviorShift: string;
    }>;
  };
}

export function BehavioralDNAPanel({ profileId, profileName }: BehavioralDNAPanelProps) {
  const [dna, setDna] = useState<BehavioralDNA | null>(null);
  const [loading, setLoading] = useState(false);

  const sequenceDNA = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('behavioral-dna-sequencer', {
        body: { profileId, userId: user.id }
      });

      if (error) throw error;
      setDna(data.analysis);
      toast.success('Behavioral DNA sequencing complete');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sequencing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-cyan-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dna className="h-5 w-5 text-cyan-500" />
            Behavioral DNA
          </CardTitle>
          <Button 
            onClick={sequenceDNA} 
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-cyan-500 to-teal-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Fingerprint className="h-4 w-4 mr-2" />}
            Sequence
          </Button>
        </div>
        {profileName && <p className="text-sm text-muted-foreground">DNA for {profileName}</p>}
      </CardHeader>
      <CardContent>
        {!dna ? (
          <div className="text-center py-8 text-muted-foreground">
            <Dna className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Sequence behavioral DNA to extract 50+ personality traits, decision patterns, and habit loops.</p>
          </div>
        ) : (
          <Tabs defaultValue="traits" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="traits">Core Traits</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="habits">Habit Loops</TabsTrigger>
              <TabsTrigger value="tells">Behavioral Tells</TabsTrigger>
            </TabsList>

            <TabsContent value="traits" className="mt-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dna.coreTraits.slice(0, 10).map((trait, i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{trait.trait}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{trait.confidence}% conf</span>
                        <Badge variant="secondary">{trait.score}%</Badge>
                      </div>
                    </div>
                    <Progress value={trait.score} className="h-1.5" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="decisions" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Primary Style</div>
                  <div className="font-medium">{dna.decisionArchitecture.primaryStyle}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Decision Speed</div>
                  <div className="font-medium">{dna.decisionArchitecture.decisionSpeed}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Risk Tolerance</span>
                  <span className="text-sm">{dna.decisionArchitecture.riskTolerance}%</span>
                </div>
                <Progress value={dna.decisionArchitecture.riskTolerance} className="h-2" />
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Key Influence Factors</div>
                <div className="flex flex-wrap gap-1">
                  {dna.decisionArchitecture.influenceFactors.map((factor, i) => (
                    <Badge key={i} variant="outline">{factor}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="habits" className="mt-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dna.habitLoops.map((loop, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        Habit Loop {i + 1}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant={loop.modifiable ? 'secondary' : 'destructive'}>
                          {loop.modifiable ? 'Modifiable' : 'Fixed'}
                        </Badge>
                        <span className="text-xs">{loop.strength}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Cue:</span>
                        <div className="font-medium">{loop.cue}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Routine:</span>
                        <div className="font-medium">{loop.routine}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reward:</span>
                        <div className="font-medium">{loop.reward}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tells" className="mt-4">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {dna.behavioralTells.map((tell, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{tell.tell}</div>
                      <div className="text-xs text-muted-foreground">{tell.meaning}</div>
                    </div>
                    <Badge variant="outline">{tell.reliability}%</Badge>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-cyan-500" />
                    <span className="font-medium">Overall Consistency</span>
                  </div>
                  <span className="font-bold text-cyan-500">{dna.consistencyMatrix.overallConsistency}%</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
