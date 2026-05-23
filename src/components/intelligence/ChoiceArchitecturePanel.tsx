/**
 * Choice Architecture Panel
 * Nudge design and behavioral intervention interface
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  LayoutGrid, 
  Zap, 
  Target,
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface ChoiceArchitecturePanelProps {
  profileId: string;
}

const NUDGE_TYPES = [
  { id: 'default_effect', label: 'Default Effect', description: 'Pre-select optimal option' },
  { id: 'decoy_effect', label: 'Decoy Effect', description: 'Add inferior option to boost target' },
  { id: 'middle_option', label: 'Middle Option Bias', description: 'Position target in the middle' },
  { id: 'scarcity', label: 'Scarcity', description: 'Limited availability messaging' },
  { id: 'social_proof', label: 'Social Proof', description: 'Show popular choices' },
  { id: 'anchoring', label: 'Anchoring', description: 'Set reference point high' },
  { id: 'loss_framing', label: 'Loss Framing', description: 'Emphasize potential losses' },
];

export function ChoiceArchitecturePanel({ profileId }: ChoiceArchitecturePanelProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedNudges, setSelectedNudges] = useState<string[]>([]);
  const [targetBehavior, setTargetBehavior] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<any>(null);

  const toggleNudge = (nudgeId: string) => {
    setSelectedNudges(prev => 
      prev.includes(nudgeId) 
        ? prev.filter(n => n !== nudgeId)
        : [...prev, nudgeId]
    );
  };

  const handleOptimize = async () => {
    if (!user || !targetBehavior || selectedNudges.length === 0) return;
    setIsProcessing(true);

    try {
      const { data, error } = await invokeFunction('choice-architecture-optimizer', {
          userId: user.id,
          profileId,
          targetBehavior,
          context,
          nudgeTypes: selectedNudges,
          action: 'optimize'
        });

      if (error) throw error;
      setResult(data?.optimization);
      toast.success('Choice architecture optimized');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to optimize');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <LayoutGrid className="h-5 w-5 text-cyan-500" />
        </div>
        <div>
          <h3 className="font-semibold">Choice Architecture</h3>
          <p className="text-sm text-muted-foreground">Nudge design & behavioral interventions</p>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Target Behavior</CardTitle>
            <CardDescription>What action do you want to encourage?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Desired Outcome</Label>
              <Input
                placeholder="e.g., Purchase premium plan, Sign contract..."
                value={targetBehavior}
                onChange={(e) => setTargetBehavior(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Context</Label>
              <Input
                placeholder="e.g., Pricing page, Negotiation meeting..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nudge Selection</CardTitle>
            <CardDescription>Select techniques to apply</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {NUDGE_TYPES.map((nudge) => (
                <div key={nudge.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{nudge.label}</p>
                    <p className="text-xs text-muted-foreground">{nudge.description}</p>
                  </div>
                  <Switch
                    checked={selectedNudges.includes(nudge.id)}
                    onCheckedChange={() => toggleNudge(nudge.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={handleOptimize} 
        disabled={isProcessing || !targetBehavior || selectedNudges.length === 0}
        className="w-full"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
        Generate Choice Architecture
      </Button>

      {/* Results */}
      {result && (
        <Card className="border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-500" />
              Optimized Choice Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.recommendations?.map((rec: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">{rec.technique}</span>
                  <Badge variant="secondary">{Math.round(rec.effectiveness * 100)}% effective</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.implementation}</p>
              </div>
            )) || (
              <div className="space-y-3">
                {selectedNudges.map((nudgeId) => {
                  const nudge = NUDGE_TYPES.find(n => n.id === nudgeId);
                  return nudge && (
                    <div key={nudgeId} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-sm">{nudge.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Apply {nudge.description.toLowerCase()} to encourage {targetBehavior}.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expected Impact */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm font-medium text-green-400">Expected Conversion Lift</p>
              <p className="text-2xl font-bold">+{15 + selectedNudges.length * 8}%</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ChoiceArchitecturePanel;
