import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Network, AlertTriangle, CheckCircle2, TrendingUp,
  GitMerge, Zap, BarChart3
} from 'lucide-react';

interface ModalityData {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  confidence: number | null;
  isEnrolled: boolean;
}

interface CrossModalFusionViewerProps {
  profileId?: string;
  modalities: ModalityData[];
}

interface CorrelationPair {
  modality1: string;
  modality2: string;
  correlation: number;
  status: 'strong' | 'moderate' | 'weak' | 'conflict';
}

export function CrossModalFusionViewer({ profileId, modalities }: CrossModalFusionViewerProps) {
  const [selectedPair, setSelectedPair] = useState<CorrelationPair | null>(null);

  const enrolledModalities = useMemo(() => 
    modalities.filter(m => m.isEnrolled && m.confidence !== null), 
    [modalities]
  );

  // Cross-modal correlations derived from each modality's measured
  // confidence. A real correlation engine would compute these from
  // joint feature embeddings — until that exists, the pair score is
  // the deterministic average of the two confidences. No Math.random
  // jitter (which gave the chart fake variability between renders).
  const correlations = useMemo((): CorrelationPair[] => {
    const pairs: CorrelationPair[] = [];

    for (let i = 0; i < enrolledModalities.length; i++) {
      for (let j = i + 1; j < enrolledModalities.length; j++) {
        const m1 = enrolledModalities[i];
        const m2 = enrolledModalities[j];

        const c1 = m1.confidence ?? 0;
        const c2 = m2.confidence ?? 0;
        const correlation = Math.max(0, Math.min(1, (c1 + c2) / 2));

        let status: CorrelationPair['status'] = 'weak';
        if (correlation >= 0.8) status = 'strong';
        else if (correlation >= 0.6) status = 'moderate';
        else if (correlation < 0.3) status = 'conflict';

        pairs.push({
          modality1: m1.name,
          modality2: m2.name,
          correlation,
          status,
        });
      }
    }

    return pairs.sort((a, b) => b.correlation - a.correlation);
  }, [enrolledModalities]);

  const fusionScore = useMemo(() => {
    if (correlations.length === 0) return 0;
    const avgCorrelation = correlations.reduce((sum, c) => sum + c.correlation, 0) / correlations.length;
    const enrollmentBonus = Math.min(0.2, enrolledModalities.length * 0.025);
    return Math.min(1, avgCorrelation + enrollmentBonus);
  }, [correlations, enrolledModalities]);

  const conflicts = correlations.filter(c => c.status === 'conflict');
  const strongPairs = correlations.filter(c => c.status === 'strong');

  const getStatusColor = (status: CorrelationPair['status']) => {
    switch (status) {
      case 'strong': return 'text-green-500 bg-green-500/10';
      case 'moderate': return 'text-yellow-500 bg-yellow-500/10';
      case 'weak': return 'text-orange-500 bg-orange-500/10';
      case 'conflict': return 'text-red-500 bg-red-500/10';
    }
  };

  if (enrolledModalities.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Enroll at least 2 biometric modalities to view cross-modal fusion analysis
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Currently enrolled: {enrolledModalities.length}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fusion Score Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <GitMerge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fusion Score</p>
                <p className="text-2xl font-bold">{(fusionScore * 100).toFixed(0)}%</p>
              </div>
            </div>
            <Progress value={fusionScore * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Strong Correlations</p>
                <p className="text-2xl font-bold">{strongPairs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold">{conflicts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.length} modality pair{conflicts.length > 1 ? 's' : ''} showing conflicting signals. 
            This may indicate enrollment quality issues or identity discrepancy.
          </AlertDescription>
        </Alert>
      )}

      {/* Correlation Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Cross-Modal Correlation Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {correlations.map((pair, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPair === pair ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedPair(selectedPair === pair ? null : pair)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{pair.modality1}</span>
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{pair.modality2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(pair.status)}>
                      {pair.status}
                    </Badge>
                    <span className="text-sm font-mono">
                      {(pair.correlation * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={pair.correlation * 100} 
                  className="mt-2 h-1"
                />
                
                {selectedPair === pair && (
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                    <p>
                      {pair.status === 'strong' && 
                        'These modalities show consistent identity signals, providing strong verification.'}
                      {pair.status === 'moderate' && 
                        'Moderate agreement between modalities. Consider adding more samples.'}
                      {pair.status === 'weak' && 
                        'Weak correlation detected. May need re-enrollment of one or both modalities.'}
                      {pair.status === 'conflict' && 
                        'Conflicting signals detected! Verify this is the same individual or re-enroll.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification Strength */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Identity Verification Strength
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Single Modality Match</span>
              <Badge variant="outline">Basic</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dual Modality Fusion</span>
              <Badge variant={enrolledModalities.length >= 2 ? 'default' : 'outline'}>
                {enrolledModalities.length >= 2 ? 'Active' : 'Needs 2+'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Multi-Modal Fusion (3+)</span>
              <Badge variant={enrolledModalities.length >= 3 ? 'default' : 'outline'}>
                {enrolledModalities.length >= 3 ? 'Active' : 'Needs 3+'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Full Biometric Profile (5+)</span>
              <Badge variant={enrolledModalities.length >= 5 ? 'default' : 'outline'}>
                {enrolledModalities.length >= 5 ? 'Complete' : `${enrolledModalities.length}/5`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
