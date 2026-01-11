import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, Clock, AlertTriangle, TrendingUp, TrendingDown, 
  Minus, ChevronLeft, ChevronRight, Play
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

interface EmotionalDataPoint {
  timestamp: number;
  displayTime: string;
  primary_emotion: string;
  intensity: number;
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  modalities: string[];
  deception_score: number;
  agreement_score: number;
  source_id?: string;
}

interface EmotionalMoment {
  timestamp: number;
  type: 'contradiction' | 'peak_emotion' | 'deception_indicator' | 'baseline_deviation';
  description: string;
  severity: 'low' | 'medium' | 'high';
  modalities: string[];
}

interface Props {
  profileId: string;
  onMomentClick?: (timestamp: number) => void;
}

const EMOTION_COLORS: Record<string, string> = {
  happiness: '#22c55e',
  joy: '#22c55e',
  excitement: '#eab308',
  surprise: '#3b82f6',
  neutral: '#6b7280',
  sadness: '#3b82f6',
  fear: '#8b5cf6',
  anger: '#ef4444',
  disgust: '#84cc16',
  contempt: '#f97316',
};

export function EmotionalStateTimeline({ profileId, onMomentClick }: Props) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMoment, setSelectedMoment] = useState<EmotionalMoment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['emotional-timeline', profileId, timeRange, user?.id],
    queryFn: async () => {
      const now = new Date();
      const rangeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const startDate = new Date(now.getTime() - rangeMs[timeRange]);

      // Fetch behavioral analyses with emotional data
      const { data: analyses } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user!.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch cross-modal syntheses
      const { data: syntheses } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user!.id)
        .eq('analysis_type', 'cross_modal')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch communications for sentiment
      const { data: communications } = await supabase
        .from('communications')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user!.id)
        .gte('occurred_at', startDate.toISOString())
        .order('occurred_at', { ascending: true });

      // Build timeline data points
      const dataPoints: EmotionalDataPoint[] = [];
      const moments: EmotionalMoment[] = [];

      // Process behavioral analyses
      (analyses || []).forEach(analysis => {
        const raw = analysis.raw_analysis as Record<string, unknown> || {};
        const patterns = analysis.behavioral_patterns as Record<string, unknown> || {};
        
        const emotion = (raw.primary_emotion || raw.emotion || 'neutral') as string;
        const intensity = (raw.intensity || analysis.confidence_score || 0.5) as number;
        
        // Map emotion to valence
        const positiveEmotions = ['happiness', 'joy', 'excitement', 'surprise'];
        const negativeEmotions = ['sadness', 'fear', 'anger', 'disgust', 'contempt'];
        let valence = 0;
        if (positiveEmotions.includes(emotion)) valence = 0.5 + intensity * 0.5;
        else if (negativeEmotions.includes(emotion)) valence = -0.5 - intensity * 0.5;

        dataPoints.push({
          timestamp: new Date(analysis.created_at).getTime(),
          displayTime: format(new Date(analysis.created_at), 'MMM d, HH:mm'),
          primary_emotion: emotion,
          intensity,
          valence,
          arousal: intensity,
          modalities: [analysis.analysis_type],
          deception_score: 0,
          agreement_score: analysis.confidence_score || 0.5,
        });
      });

      // Process cross-modal syntheses for deception and contradictions
      (syntheses || []).forEach(synthesis => {
        const raw = synthesis.raw_analysis as Record<string, unknown> || {};
        const deceptionAssessment = raw.deception_assessment as Record<string, unknown> || {};
        const contradictions = raw.contradictions as Array<Record<string, unknown>> || [];
        
        const timestamp = new Date(synthesis.created_at).getTime();
        const deceptionScore = (deceptionAssessment.confidence || 0) as number;
        const agreementScore = (raw.modality_agreement as Record<string, unknown>)?.overall_coherence as number || 0.5;

        // Add data point
        dataPoints.push({
          timestamp,
          displayTime: format(new Date(synthesis.created_at), 'MMM d, HH:mm'),
          primary_emotion: (raw.emotional_state as Record<string, unknown>)?.primary as string || 'neutral',
          intensity: synthesis.confidence_score || 0.5,
          valence: 0,
          arousal: 0.5,
          modalities: ['cross_modal'],
          deception_score: deceptionScore,
          agreement_score: agreementScore,
        });

        // Add moments for contradictions
        contradictions.forEach((contradiction) => {
          moments.push({
            timestamp,
            type: 'contradiction',
            description: contradiction.finding as string || 'Modality contradiction detected',
            severity: contradiction.severity as 'low' | 'medium' | 'high' || 'medium',
            modalities: contradiction.modalities as string[] || [],
          });
        });

        // Add moment for high deception
        if (deceptionScore > 0.6) {
          moments.push({
            timestamp,
            type: 'deception_indicator',
            description: `Deception indicators detected (${(deceptionScore * 100).toFixed(0)}% confidence)`,
            severity: deceptionScore > 0.8 ? 'high' : 'medium',
            modalities: Object.keys(raw.modal_weights || {}),
          });
        }
      });

      // Process communications for sentiment points
      (communications || []).forEach(comm => {
        if (comm.sentiment_score !== null) {
          const timestamp = new Date(comm.occurred_at).getTime();
          const sentiment = comm.sentiment_score as number;
          
          dataPoints.push({
            timestamp,
            displayTime: format(new Date(comm.occurred_at), 'MMM d, HH:mm'),
            primary_emotion: sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral',
            intensity: Math.abs(sentiment),
            valence: sentiment,
            arousal: Math.abs(sentiment),
            modalities: ['communication'],
            deception_score: 0,
            agreement_score: 0.8,
          });
        }
      });

      // Sort by timestamp
      dataPoints.sort((a, b) => a.timestamp - b.timestamp);
      moments.sort((a, b) => a.timestamp - b.timestamp);

      // Find peak emotion moments
      const intensities = dataPoints.map(d => d.intensity);
      const avgIntensity = intensities.reduce((a, b) => a + b, 0) / Math.max(1, intensities.length);
      const stdIntensity = Math.sqrt(
        intensities.reduce((sum, i) => sum + Math.pow(i - avgIntensity, 2), 0) / Math.max(1, intensities.length)
      );

      dataPoints.forEach(dp => {
        if (dp.intensity > avgIntensity + 1.5 * stdIntensity) {
          moments.push({
            timestamp: dp.timestamp,
            type: 'peak_emotion',
            description: `Peak ${dp.primary_emotion} detected (intensity: ${(dp.intensity * 100).toFixed(0)}%)`,
            severity: 'low',
            modalities: dp.modalities,
          });
        }
      });

      return {
        dataPoints,
        moments,
        stats: {
          avgValence: dataPoints.reduce((sum, d) => sum + d.valence, 0) / Math.max(1, dataPoints.length),
          avgArousal: dataPoints.reduce((sum, d) => sum + d.arousal, 0) / Math.max(1, dataPoints.length),
          dominantEmotion: getMostFrequent(dataPoints.map(d => d.primary_emotion)),
          totalMoments: moments.length,
          highSeverityMoments: moments.filter(m => m.severity === 'high').length,
        },
      };
    },
    enabled: !!user && !!profileId,
  });

  const handleMomentClick = (moment: EmotionalMoment) => {
    setSelectedMoment(moment);
    if (onMomentClick) {
      onMomentClick(moment.timestamp);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[400px]" />;
  }

  const chartData = data?.dataPoints || [];
  const moments = data?.moments || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Emotional State Timeline
            </CardTitle>
            <CardDescription>
              Track emotional patterns across modalities
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {data?.stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold">
                {data.stats.dominantEmotion}
              </div>
              <div className="text-xs text-muted-foreground">Dominant</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                {data.stats.avgValence > 0.1 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : data.stats.avgValence < -0.1 ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-lg font-bold">
                  {(data.stats.avgValence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Avg Valence</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold">{data.stats.totalMoments}</div>
              <div className="text-xs text-muted-foreground">Key Moments</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg text-center">
              <div className="text-lg font-bold text-destructive">
                {data.stats.highSeverityMoments}
              </div>
              <div className="text-xs text-muted-foreground">Alerts</div>
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        {chartData.length > 0 ? (
          <div className="h-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="valenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#6b7280" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="displayTime" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[-1, 1]} 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v > 0 ? '+' : v < 0 ? '-' : '0'}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload as EmotionalDataPoint;
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <div className="font-medium">{data.primary_emotion}</div>
                        <div className="text-xs text-muted-foreground">
                          Intensity: {(data.intensity * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Modalities: {data.modalities.join(', ')}
                        </div>
                        {data.deception_score > 0 && (
                          <div className="text-xs text-destructive">
                            Deception: {(data.deception_score * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="valence"
                  stroke="#3b82f6"
                  fill="url(#valenceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No emotional data available</p>
            </div>
          </div>
        )}

        {/* Key Moments List */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Key Moments</span>
            <Badge variant="outline">{moments.length}</Badge>
          </div>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {moments.slice(0, 20).map((moment, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedMoment === moment ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  } ${
                    moment.severity === 'high' ? 'border-destructive/50' :
                    moment.severity === 'medium' ? 'border-amber-500/50' : ''
                  }`}
                  onClick={() => handleMomentClick(moment)}
                >
                  <div className="flex items-center gap-2">
                    {moment.type === 'contradiction' && (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    {moment.type === 'deception_indicator' && (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    {moment.type === 'peak_emotion' && (
                      <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    )}
                    {moment.type === 'baseline_deviation' && (
                      <Activity className="h-4 w-4 text-purple-500 shrink-0" />
                    )}
                    <span className="text-sm flex-1 line-clamp-1">{moment.description}</span>
                    <Badge 
                      variant={moment.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {moment.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(moment.timestamp, { addSuffix: true })}</span>
                    <span>•</span>
                    <span>{moment.modalities.join(', ')}</span>
                  </div>
                </div>
              ))}
              {moments.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No significant moments detected
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function getMostFrequent(arr: string[]): string {
  const counts: Record<string, number> = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  let max = 0;
  let result = 'neutral';
  Object.entries(counts).forEach(([item, count]) => {
    if (count > max) {
      max = count;
      result = item;
    }
  });
  
  return result;
}
