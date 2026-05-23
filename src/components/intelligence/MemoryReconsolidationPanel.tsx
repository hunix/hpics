/**
 * Memory Reconsolidation Panel
 * Memory modification and belief updating interface
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Zap, 
  AlertTriangle,
  RefreshCw,
  Target,
  Loader2,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface MemoryReconsolidationPanelProps {
  profileId: string;
}

export function MemoryReconsolidationPanel({ profileId }: MemoryReconsolidationPanelProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetMemory, setTargetMemory] = useState('');
  const [desiredModification, setDesiredModification] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!user || !targetMemory) return;
    setIsProcessing(true);

    try {
      const { data, error } = await invokeFunction('memory-reconsolidation-engine', {
          userId: user.id,
          profileId,
          targetMemory,
          desiredModification,
          action: 'generate_intervention'
        });

      if (error) throw error;
      setResult(data?.intervention);
      toast.success('Memory intervention generated');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate intervention');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Warning */}
      <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-200">
          Memory reconsolidation techniques are powerful psychological tools. 
          Use responsibly and ethically. These techniques should only be used for 
          therapeutic purposes or with full informed consent.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <Brain className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">Memory Reconsolidation Engine</h3>
          <p className="text-sm text-muted-foreground">Belief updating & memory modification</p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configure Intervention</CardTitle>
          <CardDescription>
            Define the target memory/belief and desired modification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Memory/Belief</Label>
            <Textarea
              placeholder="Describe the memory or belief to be modified..."
              value={targetMemory}
              onChange={(e) => setTargetMemory(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Desired Modification</Label>
            <Input
              placeholder="What should the new belief/memory be?"
              value={desiredModification}
              onChange={(e) => setDesiredModification(e.target.value)}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isProcessing || !targetMemory} className="w-full">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Intervention Protocol
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Intervention Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phase 1: Activation */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Phase 1</Badge>
                <span className="font-medium text-sm">Memory Activation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {result.activationPhase || 'Recall the target memory in a safe environment to make it malleable.'}
              </p>
            </div>

            {/* Phase 2: Prediction Error */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Phase 2</Badge>
                <span className="font-medium text-sm">Prediction Error</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {result.predictionError || 'Introduce information that contradicts the original memory.'}
              </p>
            </div>

            {/* Phase 3: Reconsolidation */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Phase 3</Badge>
                <span className="font-medium text-sm">Reconsolidation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {result.reconsolidation || 'During the reconsolidation window, reinforce the new belief.'}
              </p>
            </div>

            {/* Ethical Considerations */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Ethical Considerations</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure informed consent before any intervention</li>
                <li>• Document all modifications for transparency</li>
                <li>• Monitor for unintended psychological effects</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MemoryReconsolidationPanel;
