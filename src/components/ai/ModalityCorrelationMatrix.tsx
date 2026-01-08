import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Mic, Activity, Brain, MessageSquare } from 'lucide-react';

interface CorrelationData {
  modality1: string;
  modality2: string;
  correlation: number; // -1 to 1
  agreement: 'strong_agree' | 'agree' | 'neutral' | 'disagree' | 'strong_disagree';
  sampleSize: number;
}

const MODALITIES = ['vocal', 'facial', 'body_language', 'behavioral'];

const getModalityIcon = (type: string) => {
  switch (type) {
    case 'vocal': return <Mic className="h-4 w-4" />;
    case 'facial': return <Eye className="h-4 w-4" />;
    case 'body_language': return <Activity className="h-4 w-4" />;
    case 'behavioral': return <Brain className="h-4 w-4" />;
    case 'text': return <MessageSquare className="h-4 w-4" />;
    default: return null;
  }
};

const getCorrelationColor = (correlation: number) => {
  if (correlation >= 0.7) return 'bg-green-500';
  if (correlation >= 0.4) return 'bg-green-300';
  if (correlation >= 0.1) return 'bg-green-100';
  if (correlation >= -0.1) return 'bg-muted';
  if (correlation >= -0.4) return 'bg-amber-100';
  if (correlation >= -0.7) return 'bg-amber-300';
  return 'bg-red-400';
};

interface Props {
  profileId: string;
}

export function ModalityCorrelationMatrix({ profileId }: Props) {
  const { data: correlations, isLoading } = useQuery({
    queryKey: ['modality-correlations', profileId],
    queryFn: async (): Promise<CorrelationData[]> => {
      // Fetch cross-modal synthesis for correlation data
      const { data: synthesis } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'cross_modal')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!synthesis) {
        // Generate synthetic correlations based on available data
        const correlations: CorrelationData[] = [];
        
        for (let i = 0; i < MODALITIES.length; i++) {
          for (let j = i + 1; j < MODALITIES.length; j++) {
            // Default neutral correlation
            correlations.push({
              modality1: MODALITIES[i],
              modality2: MODALITIES[j],
              correlation: 0,
              agreement: 'neutral',
              sampleSize: 0,
            });
          }
        }
        return correlations;
      }

      const raw = synthesis.raw_analysis as Record<string, unknown>;
      const corroborated = (raw.corroborated_findings || []) as Array<{ modalities: string[]; confidence: number }>;
      const contradictions = (raw.contradictions || []) as Array<{ modalities: string[]; severity: string }>;

      // Build correlation matrix from findings
      const correlationMap: Record<string, { sum: number; count: number }> = {};

      // Corroborated findings increase correlation
      corroborated.forEach(finding => {
        const mods = finding.modalities || [];
        for (let i = 0; i < mods.length; i++) {
          for (let j = i + 1; j < mods.length; j++) {
            const key = [mods[i], mods[j]].sort().join('-');
            if (!correlationMap[key]) correlationMap[key] = { sum: 0, count: 0 };
            correlationMap[key].sum += finding.confidence;
            correlationMap[key].count += 1;
          }
        }
      });

      // Contradictions decrease correlation
      contradictions.forEach(finding => {
        const mods = finding.modalities || [];
        const penalty = finding.severity === 'high' ? -0.8 : finding.severity === 'medium' ? -0.5 : -0.2;
        for (let i = 0; i < mods.length; i++) {
          for (let j = i + 1; j < mods.length; j++) {
            const key = [mods[i], mods[j]].sort().join('-');
            if (!correlationMap[key]) correlationMap[key] = { sum: 0, count: 0 };
            correlationMap[key].sum += penalty;
            correlationMap[key].count += 1;
          }
        }
      });

      // Generate final correlations
      const result: CorrelationData[] = [];
      for (let i = 0; i < MODALITIES.length; i++) {
        for (let j = i + 1; j < MODALITIES.length; j++) {
          const key = [MODALITIES[i], MODALITIES[j]].sort().join('-');
          const data = correlationMap[key] || { sum: 0, count: 0 };
          const correlation = data.count > 0 ? Math.max(-1, Math.min(1, data.sum / data.count)) : 0;
          
          let agreement: CorrelationData['agreement'] = 'neutral';
          if (correlation >= 0.6) agreement = 'strong_agree';
          else if (correlation >= 0.3) agreement = 'agree';
          else if (correlation <= -0.6) agreement = 'strong_disagree';
          else if (correlation <= -0.3) agreement = 'disagree';

          result.push({
            modality1: MODALITIES[i],
            modality2: MODALITIES[j],
            correlation,
            agreement,
            sampleSize: data.count,
          });
        }
      }

      return result;
    },
    enabled: !!profileId,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  // Build matrix data
  const matrix: Record<string, Record<string, number>> = {};
  MODALITIES.forEach(m => {
    matrix[m] = {};
    MODALITIES.forEach(m2 => {
      matrix[m][m2] = m === m2 ? 1 : 0;
    });
  });

  correlations?.forEach(c => {
    matrix[c.modality1][c.modality2] = c.correlation;
    matrix[c.modality2][c.modality1] = c.correlation;
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {MODALITIES.map(m => (
                <th key={m} className="p-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    {getModalityIcon(m)}
                    <span className="text-xs capitalize">{m.replace('_', ' ')}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODALITIES.map(row => (
              <tr key={row}>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {getModalityIcon(row)}
                    <span className="text-xs capitalize">{row.replace('_', ' ')}</span>
                  </div>
                </td>
                {MODALITIES.map(col => (
                  <td key={col} className="p-1">
                    <div 
                      className={`w-12 h-12 rounded flex items-center justify-center text-xs font-medium ${
                        row === col ? 'bg-primary text-primary-foreground' : getCorrelationColor(matrix[row][col])
                      }`}
                      title={`${row} vs ${col}: ${(matrix[row][col] * 100).toFixed(0)}%`}
                    >
                      {row === col ? '—' : `${(matrix[row][col] * 100).toFixed(0)}%`}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Strong Agreement</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-muted" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-400" />
          <span>Contradiction</span>
        </div>
      </div>

      {correlations && correlations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Notable Correlations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {correlations
              .filter(c => Math.abs(c.correlation) >= 0.3)
              .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
              .slice(0, 4)
              .map((c, idx) => (
                <div key={idx} className="p-2 border rounded text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getModalityIcon(c.modality1)}
                    <span>↔</span>
                    {getModalityIcon(c.modality2)}
                  </div>
                  <span className={c.correlation > 0 ? 'text-green-600' : 'text-red-600'}>
                    {c.correlation > 0 ? '+' : ''}{(c.correlation * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
