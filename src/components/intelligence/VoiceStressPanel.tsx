import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, Activity, AlertTriangle, TrendingUp, 
  TrendingDown, Clock, Volume2, Pause
} from 'lucide-react';
import {
  type VoiceAnalysisInput,
  type VoiceStressMarker,
  type VoiceBaseline,
  type VoiceDeceptionAnalysis,
  analyzePitchStress,
  analyzeTremor,
  analyzePaceAndPauses,
  analyzeFillers,
  estimateEmotionalState,
  analyzeVoiceDeception,
  buildVoiceBaseline
} from '@/lib/psychology/voiceStressAnalyzer';

interface VoiceStressPanelProps {
  audioSegments: VoiceAnalysisInput[];
  baseline?: VoiceBaseline;
  onSegmentSelect?: (segment: VoiceAnalysisInput, index: number) => void;
}

export function VoiceStressPanel({ 
  audioSegments, 
  baseline: externalBaseline,
  onSegmentSelect 
}: VoiceStressPanelProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const analysis = useMemo(() => {
    if (audioSegments.length === 0) return null;

    const baseline = externalBaseline || buildVoiceBaseline(audioSegments);
    
    const segmentAnalyses = audioSegments.map(segment => ({
      segment,
      pitchStress: analyzePitchStress(segment),
      tremor: analyzeTremor(segment),
      paceAndPauses: analyzePaceAndPauses(segment),
      fillers: analyzeFillers(segment),
      emotionalState: estimateEmotionalState(segment),
      deception: analyzeVoiceDeception(segment, baseline)
    }));

    // Aggregate metrics
    const avgStress = segmentAnalyses.reduce((sum, a) => sum + (a.deception?.overallDeceptionScore || 0), 0) / segmentAnalyses.length;
    const totalFillers = segmentAnalyses.reduce((sum, a) => sum + (a.fillers?.count || 0), 0);
    const avgCognitiveLoad = segmentAnalyses.reduce((sum, a) => sum + (a.deception?.cognitiveLoad || 0), 0) / segmentAnalyses.length;

    return {
      baseline,
      segments: segmentAnalyses,
      avgStress,
      totalFillers,
      avgCognitiveLoad
    };
  }, [audioSegments, externalBaseline]);

  const handleSegmentClick = (index: number) => {
    setSelectedSegment(index);
    if (analysis) {
      onSegmentSelect?.(analysis.segments[index].segment, index);
    }
  };

  const getStressColor = (score: number) => {
    if (score >= 0.7) return 'text-red-500';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-green-500';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!analysis || audioSegments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Stress Analysis
          </CardTitle>
          <CardDescription>
            Analyze vocal patterns for stress and deception indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No audio segments available for analysis. Upload or record audio to begin.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const selectedAnalysis = selectedSegment !== null ? analysis.segments[selectedSegment] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Stress Analysis
            </CardTitle>
            <CardDescription>
              Pitch stress, tremor, pace, and cognitive load analysis
            </CardDescription>
          </div>
          <Badge variant={analysis.avgStress > 0.6 ? 'destructive' : 'secondary'}>
            Avg Stress: {(analysis.avgStress * 100).toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="baseline">Baseline</TabsTrigger>
            <TabsTrigger value="deception">Deception</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Avg Stress</p>
                  <p className={`text-2xl font-bold ${getStressColor(analysis.avgStress)}`}>
                    {(analysis.avgStress * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Volume2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Cognitive Load</p>
                  <p className={`text-2xl font-bold ${getStressColor(analysis.avgCognitiveLoad)}`}>
                    {(analysis.avgCognitiveLoad * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Pause className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-xs text-muted-foreground">Total Fillers</p>
                  <p className="text-2xl font-bold">{analysis.totalFillers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-xs text-muted-foreground">Segments</p>
                  <p className="text-2xl font-bold">{analysis.segments.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Stress Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stress Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {analysis.segments.map((seg, idx) => {
                    const score = seg.deception?.overallDeceptionScore || 0;
                    const height = Math.max(10, score * 100);
                    return (
                      <button
                        key={idx}
                        className={`flex-1 rounded-t transition-all hover:opacity-80 ${
                          selectedSegment === idx ? 'ring-2 ring-primary' : ''
                        }`}
                        style={{ 
                          height: `${height}%`,
                          backgroundColor: score >= 0.7 
                            ? 'hsl(var(--destructive))' 
                            : score >= 0.4 
                              ? 'hsl(30 100% 50%)' 
                              : 'hsl(var(--primary))'
                        }}
                        onClick={() => handleSegmentClick(idx)}
                        title={`Segment ${idx + 1}: ${(score * 100).toFixed(0)}% stress`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Start</span>
                  <span>End</span>
                </div>
              </CardContent>
            </Card>

            {/* Emotional State Summary */}
            {analysis.segments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Dominant Emotional States</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(analysis.segments.map(s => s.emotionalState?.dominantEmotion).filter(Boolean)))
                      .map(emotion => {
                        const count = analysis.segments.filter(s => s.emotionalState?.dominantEmotion === emotion).length;
                        return (
                          <Badge key={emotion} variant="outline">
                            {emotion} ({count})
                          </Badge>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="segments" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {analysis.segments.map((seg, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                      selectedSegment === idx ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSegmentClick(idx)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Segment {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={seg.deception?.overallDeceptionScore && seg.deception.overallDeceptionScore > 0.6 ? 'destructive' : 'secondary'}>
                          {((seg.deception?.overallDeceptionScore || 0) * 100).toFixed(0)}% stress
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(seg.segment.duration || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Pitch Stress</p>
                        <p className="font-mono">{((seg.pitchStress?.stressScore || 0) * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Tremor</p>
                        <p className="font-mono">{((seg.tremor?.intensity || 0) * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Pace</p>
                        <p className="font-mono">{seg.paceAndPauses?.wordsPerMinute?.toFixed(0) || 0} wpm</p>
                      </div>
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Fillers</p>
                        <p className="font-mono">{seg.fillers?.count || 0}</p>
                      </div>
                    </div>

                    {seg.deception?.indicators && seg.deception.indicators.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {seg.deception.indicators.slice(0, 3).map((indicator, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {indicator.type}
                          </Badge>
                        ))}
                        {seg.deception.indicators.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{seg.deception.indicators.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="baseline" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Voice Baseline Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pitch Characteristics</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Mean Pitch</p>
                        <p className="font-mono">{analysis.baseline.meanPitch?.toFixed(1) || 0} Hz</p>
                      </div>
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Pitch Variance</p>
                        <p className="font-mono">{analysis.baseline.pitchVariance?.toFixed(2) || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Speech Patterns</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Normal Pace</p>
                        <p className="font-mono">{analysis.baseline.normalPace?.toFixed(0) || 0} wpm</p>
                      </div>
                      <div className="bg-muted/30 p-2 rounded">
                        <p className="text-muted-foreground">Pause Pattern</p>
                        <p className="font-mono">{analysis.baseline.averagePauseDuration?.toFixed(0) || 0} ms</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Baseline Quality</p>
                  <div className="flex items-center gap-4">
                    <Progress value={(analysis.baseline.confidence || 0) * 100} className="flex-1" />
                    <span className="font-mono text-sm">
                      {((analysis.baseline.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {analysis.baseline.sampleCount || 0} samples
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deception" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {analysis.segments
                  .filter(seg => seg.deception?.indicators && seg.deception.indicators.length > 0)
                  .map((seg, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            Segment {analysis.segments.indexOf(seg) + 1}
                          </CardTitle>
                          <Badge variant="destructive">
                            {((seg.deception?.overallDeceptionScore || 0) * 100).toFixed(0)}% deception score
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {seg.deception?.indicators.map((indicator, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 bg-muted/30 rounded">
                              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                              <div>
                                <p className="font-medium text-sm">{indicator.type}</p>
                                <p className="text-xs text-muted-foreground">{indicator.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={indicator.severity * 100} className="w-20 h-1" />
                                  <span className="text-xs">{(indicator.severity * 100).toFixed(0)}% severity</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {analysis.segments.every(seg => !seg.deception?.indicators || seg.deception.indicators.length === 0) && (
                  <Alert>
                    <TrendingDown className="h-4 w-4" />
                    <AlertDescription>
                      No significant deception indicators detected in the analyzed segments.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
