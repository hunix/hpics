import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay } from 'date-fns';

export interface PredictionMetrics {
  type: string;
  totalPredictions: number;
  verifiedPredictions: number;
  accuracy: number;
  // precision/recall are null until we have label-level data to compute
  // them — no hardcoded placeholders.
  precision: number | null;
  recall: number | null;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
}

export interface HistoricalAccuracyPoint {
  date: string;
  churn: number | null;
  behavioral: number | null;
}

export interface RecentPrediction {
  id: string;
  type: string;
  profileId: string | null;
  predicted: string;
  actual: string;
  correct: boolean;
  date: string | null;
}

export interface CalibrationBin {
  bin: string;
  predicted: number;
  actual: number | null;
  sampleCount: number;
}

export interface PredictionAccuracyData {
  metrics: PredictionMetrics[];
  historical: HistoricalAccuracyPoint[];
  recent: RecentPrediction[];
  overallAccuracy: number;
  calibration: CalibrationBin[];
}

interface ChurnRow {
  id: string;
  profile_id: string | null;
  outcome_verified: boolean | null;
  predicted_churn_probability: number | null;
  actual_outcome: string | null;
  prediction_date: string | null;
  created_at: string | null;
}

interface BehavioralRow {
  accuracy_score: number | null;
  actual_outcome: string | null;
  created_at: string | null;
}

// Bucket verified predictions by day, compute per-bucket accuracy.
function bucketByDay<T>(
  rows: T[],
  getDate: (r: T) => string | null | undefined,
  getCorrect: (r: T) => boolean,
  days: number
): Map<string, { correct: number; total: number }> {
  const buckets = new Map<string, { correct: number; total: number }>();
  const since = subDays(new Date(), days);
  for (const r of rows) {
    const raw = getDate(r);
    if (!raw) continue;
    const d = new Date(raw);
    if (d < since) continue;
    const key = format(startOfDay(d), 'yyyy-MM-dd');
    const entry = buckets.get(key) ?? { correct: 0, total: 0 };
    entry.total++;
    if (getCorrect(r)) entry.correct++;
    buckets.set(key, entry);
  }
  return buckets;
}

function computeTrend(rows: { correct: boolean; date: Date }[]): PredictionMetrics['trend'] {
  if (rows.length < 6) return 'unknown';
  const sorted = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half);
  const secondHalf = sorted.slice(half);
  const firstAcc = firstHalf.filter((r) => r.correct).length / firstHalf.length;
  const secondAcc = secondHalf.filter((r) => r.correct).length / secondHalf.length;
  const delta = secondAcc - firstAcc;
  if (delta > 0.05) return 'improving';
  if (delta < -0.05) return 'declining';
  return 'stable';
}

export function usePredictionAccuracy(timeRange: string) {
  const { user } = useAuth();
  return useQuery<PredictionAccuracyData>({
    queryKey: ['prediction-accuracy', user?.id, timeRange],
    enabled: !!user,
    staleTime: 60000,
    queryFn: async () => {
      const days = parseInt(timeRange);
      const startDate = subDays(new Date(), days).toISOString();

      const { data: churnPredictions } = await supabase
        .from('churn_predictions')
        .select('*')
        .gte('created_at', startDate);
      const churn = ((churnPredictions ?? []) as unknown) as ChurnRow[];

      const { data: behavioralPredictions } = await supabase
        .from('behavioral_predictions')
        .select('*')
        .gte('created_at', startDate);
      const behavioral = ((behavioralPredictions ?? []) as unknown) as BehavioralRow[];

      const verifiedChurn = churn.filter((p) => p.outcome_verified);
      const churnVerifiedWithCorrectness = verifiedChurn.map((p) => ({
        correct: ((p.predicted_churn_probability ?? 0) > 0.5) === (p.actual_outcome === 'churned'),
        date: new Date(p.prediction_date ?? p.created_at ?? Date.now()),
      }));
      const correctChurnCount = churnVerifiedWithCorrectness.filter((r) => r.correct).length;

      const verifiedBehavioral = behavioral.filter((p) => p.actual_outcome);
      const behavioralWithCorrectness = verifiedBehavioral.map((p) => ({
        correct: p.accuracy_score !== null && (p.accuracy_score ?? 0) > 0.7,
        date: new Date(p.created_at ?? Date.now()),
      }));
      const correctBehavioralCount = behavioralWithCorrectness.filter((r) => r.correct).length;

      const metrics: PredictionMetrics[] = [
        {
          type: 'Churn Risk',
          totalPredictions: churn.length,
          verifiedPredictions: verifiedChurn.length,
          accuracy: verifiedChurn.length > 0 ? correctChurnCount / verifiedChurn.length : 0,
          precision: null,
          recall: null,
          trend: computeTrend(churnVerifiedWithCorrectness),
        },
        {
          type: 'Behavioral',
          totalPredictions: behavioral.length,
          verifiedPredictions: verifiedBehavioral.length,
          accuracy: verifiedBehavioral.length > 0 ? correctBehavioralCount / verifiedBehavioral.length : 0,
          precision: null,
          recall: null,
          trend: computeTrend(behavioralWithCorrectness),
        },
      ];

      // Real per-day accuracy buckets across the requested window. Days
      // with no verified predictions show as null on the chart, not as
      // a fabricated value.
      const churnBuckets = bucketByDay(
        verifiedChurn,
        (p) => p.prediction_date ?? p.created_at,
        (p) => ((p.predicted_churn_probability ?? 0) > 0.5) === (p.actual_outcome === 'churned'),
        days,
      );
      const behavBuckets = bucketByDay(
        verifiedBehavioral,
        (p) => p.created_at,
        (p) => p.accuracy_score !== null && (p.accuracy_score ?? 0) > 0.7,
        days,
      );

      const historical: HistoricalAccuracyPoint[] = [];
      for (let i = days; i >= 0; i -= Math.max(1, Math.ceil(days / 10))) {
        const dayKey = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const c = churnBuckets.get(dayKey);
        const b = behavBuckets.get(dayKey);
        historical.push({
          date: format(subDays(new Date(), i), 'MMM dd'),
          churn: c ? c.correct / c.total : null,
          behavioral: b ? b.correct / b.total : null,
        });
      }

      const recent: RecentPrediction[] = verifiedChurn
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          type: 'Churn Risk',
          profileId: p.profile_id,
          predicted: (p.predicted_churn_probability ?? 0) > 0.5 ? 'High Risk' : 'Low Risk',
          actual: p.actual_outcome ?? 'Unknown',
          correct: ((p.predicted_churn_probability ?? 0) > 0.5) === (p.actual_outcome === 'churned'),
          date: p.prediction_date,
        }));

      const measured = metrics.filter((m) => m.verifiedPredictions > 0);
      const overallAccuracy = measured.length > 0
        ? measured.reduce((sum, m) => sum + m.accuracy, 0) / measured.length
        : 0;

      // Real calibration: bucket verified churn predictions by their
      // predicted probability and compute the actual churn frequency
      // in each bucket. Bins with no samples report actual=null so
      // the chart doesn't fabricate a value.
      const calibrationBins: Array<{ low: number; high: number; predictedMid: number; label: string }> = [
        { low: 0, high: 0.2, predictedMid: 0.1, label: '0-20%' },
        { low: 0.2, high: 0.4, predictedMid: 0.3, label: '20-40%' },
        { low: 0.4, high: 0.6, predictedMid: 0.5, label: '40-60%' },
        { low: 0.6, high: 0.8, predictedMid: 0.7, label: '60-80%' },
        { low: 0.8, high: 1.01, predictedMid: 0.9, label: '80-100%' },
      ];
      const calibration: CalibrationBin[] = calibrationBins.map((bin) => {
        const inBin = verifiedChurn.filter((p) => {
          const prob = p.predicted_churn_probability ?? 0;
          return prob >= bin.low && prob < bin.high;
        });
        const actualRate = inBin.length > 0
          ? inBin.filter((p) => p.actual_outcome === 'churned').length / inBin.length
          : null;
        return {
          bin: bin.label,
          predicted: bin.predictedMid,
          actual: actualRate,
          sampleCount: inBin.length,
        };
      });

      return { metrics, historical, recent, overallAccuracy, calibration };
    },
  });
}
