import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Crosshair, RefreshCw, Zap, Shield, Target, AlertTriangle, 
  Play, Eye, Brain, Swords, Clock, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface ReverseEngineeringPanelProps {
  profileId?: string;
  profileName?: string;
}

interface OODADisruptionTactic {
  phase: 'observe' | 'orient' | 'decide' | 'act';
  tactic: string;
  description: string;
  effectiveness: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const OODA_DISRUPTION_TACTICS: OODADisruptionTactic[] = [
  // Observe Phase Disruption
  { phase: 'observe', tactic: 'Information Denial', description: 'Restrict access to key data sources', effectiveness: 0.75, riskLevel: 'low' },
  { phase: 'observe', tactic: 'Sensor Deception', description: 'Provide false signals and indicators', effectiveness: 0.85, riskLevel: 'medium' },
  { phase: 'observe', tactic: 'Attention Hijacking', description: 'Create distracting stimuli to divert focus', effectiveness: 0.70, riskLevel: 'low' },
  
  // Orient Phase Disruption
  { phase: 'orient', tactic: 'Cognitive Overload', description: 'Flood with conflicting information', effectiveness: 0.80, riskLevel: 'medium' },
  { phase: 'orient', tactic: 'Frame Manipulation', description: 'Alter context to change interpretation', effectiveness: 0.90, riskLevel: 'medium' },
  { phase: 'orient', tactic: 'Cultural Exploitation', description: 'Leverage biases and cultural blind spots', effectiveness: 0.85, riskLevel: 'high' },
  
  // Decide Phase Disruption
  { phase: 'decide', tactic: 'Decision Paralysis', description: 'Create uncertainty about options', effectiveness: 0.75, riskLevel: 'low' },
  { phase: 'decide', tactic: 'False Dilemma', description: 'Present artificial binary choices', effectiveness: 0.70, riskLevel: 'medium' },
  { phase: 'decide', tactic: 'Temporal Pressure', description: 'Compress decision timeframes artificially', effectiveness: 0.80, riskLevel: 'medium' },
  
  // Act Phase Disruption
  { phase: 'act', tactic: 'Resource Denial', description: 'Limit access to execution resources', effectiveness: 0.85, riskLevel: 'high' },
  { phase: 'act', tactic: 'Action Misdirection', description: 'Guide actions toward ineffective targets', effectiveness: 0.75, riskLevel: 'medium' },
  { phase: 'act', tactic: 'Feedback Corruption', description: 'Distort outcome measurements', effectiveness: 0.80, riskLevel: 'high' },
];

const PHASE_CONFIG = {
  observe: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'OBSERVE' },
  orient: { color: 'text-violet-400', bgColor: 'bg-violet-500/20', label: 'ORIENT' },
  decide: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'DECIDE' },
  act: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'ACT' },
};

export function ReverseEngineeringPanel({ profileId, profileName }: ReverseEngineeringPanelProps) {
  const [selectedPhase, setSelectedPhase] = useState<'observe' | 'orient' | 'decide' | 'act' | 'all'>('all');
  const [adversaryContext, setAdversaryContext] = useState('');
  const [responseLevel, setResponseLevel] = useState<'proportional' | 'escalated' | 'de-escalated'>('proportional');

  // Generate proportional response
  const responseMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('proportional-response-engine', {
        body: {
          profileId,
          adversaryContext,
          responseLevel,
          operationType: 'generate_response',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Response strategy generated');
    },
    onError: (error) => {
      toast.error('Failed to generate response', { description: error instanceof Error ? error.message : 'Unknown error' });
    },
  });

  const filteredTactics = selectedPhase === 'all' 
    ? OODA_DISRUPTION_TACTICS 
    : OODA_DISRUPTION_TACTICS.filter(t => t.phase === selectedPhase);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return <Badge className="bg-emerald-500/20 text-emerald-400">Low Risk</Badge>;
      case 'medium': return <Badge className="bg-amber-500/20 text-amber-400">Medium Risk</Badge>;
      case 'high': return <Badge className="bg-red-500/20 text-red-400">High Risk</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="border-red-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-red-400" />
            <CardTitle>Reverse Engineering & Counter-Operations</CardTitle>
            <Badge variant="outline" className="text-red-400 border-red-400/50">Defensive Use</Badge>
          </div>
        </div>
        <CardDescription>
          Adversary OODA Loop Disruption • Proportional Response • Attribution Misdirection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ooda" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ooda">OODA Disruption</TabsTrigger>
            <TabsTrigger value="response">Response Engine</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
          </TabsList>

          <TabsContent value="ooda" className="space-y-4">
            {/* OODA Phase Selector */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={selectedPhase === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedPhase('all')}
              >
                All Phases
              </Button>
              {Object.entries(PHASE_CONFIG).map(([phase, config]) => (
                <Button
                  key={phase}
                  variant={selectedPhase === phase ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPhase(phase as any)}
                  className={selectedPhase === phase ? '' : config.color}
                >
                  {config.label}
                </Button>
              ))}
            </div>

            {/* OODA Loop Visualization */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PHASE_CONFIG).map(([phase, config]) => {
                const phaseTactics = OODA_DISRUPTION_TACTICS.filter(t => t.phase === phase);
                return (
                  <Card key={phase} className={`${config.bgColor} border-none`}>
                    <CardContent className="p-3 text-center">
                      <div className={`text-lg font-bold ${config.color}`}>{config.label}</div>
                      <div className="text-2xl font-bold">{phaseTactics.length}</div>
                      <div className="text-xs text-muted-foreground">tactics</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Tactics List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredTactics.map((tactic, idx) => {
                const phaseConfig = PHASE_CONFIG[tactic.phase];
                return (
                  <Card key={idx} className="bg-background/50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={phaseConfig.bgColor + ' ' + phaseConfig.color}>
                            {phaseConfig.label}
                          </Badge>
                          <span className="font-medium text-sm">{tactic.tactic}</span>
                        </div>
                        {getRiskBadge(tactic.riskLevel)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{tactic.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Effectiveness:</span>
                        <Progress value={tactic.effectiveness * 100} className="flex-1 h-1.5" />
                        <span className="text-xs font-medium">{Math.round(tactic.effectiveness * 100)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Adversary Action Description</label>
                <Textarea
                  placeholder="Describe the hostile action or threat to generate proportional response..."
                  value={adversaryContext}
                  onChange={(e) => setAdversaryContext(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Response Level</label>
                <Select value={responseLevel} onValueChange={(v: any) => setResponseLevel(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de-escalated">De-escalated (Minimize Conflict)</SelectItem>
                    <SelectItem value="proportional">Proportional (Equivalent Response)</SelectItem>
                    <SelectItem value="escalated">Escalated (Deterrence Focus)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full"
                onClick={() => responseMutation.mutate()}
                disabled={!adversaryContext || responseMutation.isPending}
              >
                <Swords className="h-4 w-4 mr-2" />
                {responseMutation.isPending ? 'Generating...' : 'Generate Response Strategy'}
              </Button>

              {responseMutation.data && (
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      Recommended Response
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>{responseMutation.data.recommendation || 'Response strategy generated. Review and adapt as needed.'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-amber-400">Legal Notice:</strong> All counter-operations must remain 
                  within legal boundaries. This tool is for defensive planning only.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-4">
            <div className="text-center py-8">
              <Eye className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Attribution Misdirection Module</p>
              <p className="text-xs text-muted-foreground mt-1">
                Plausible deniability frameworks and defensive attribution strategies
              </p>
              <Button variant="outline" className="mt-4" disabled>
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
