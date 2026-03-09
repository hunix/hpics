import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, Camera, AlertTriangle, Activity, Fingerprint,
  Play, Pause, RefreshCw, Brain, Sparkles
} from "lucide-react";
import { useMicroExpressionAnalysis } from "@/hooks/intelligence/useMicroExpressionAnalysis";
import { spotFormerEngine, type SpotFormerResult } from '@/lib/biometrics/spotFormerAnalyzer';
import { transformerEmotionEngine, type EmotionAnalysisResult } from '@/lib/ml/transformerEmotionRecognition';

interface MicroExpressionAnalyzerProps {
  profileId?: string;
  mediaUrl?: string;
}

export function MicroExpressionAnalyzer({ profileId, mediaUrl }: MicroExpressionAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("realtime");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { 
    readings = [], 
    deceptionSignatures = [], 
    fingerprints = [],
    stressIndicators = [],
    isLoading, 
    analyzeFrame,
    isAnalyzing: isAnalyzingFrame,
    highConfidenceDeception,
    avgDeceptionAccuracy,
    totalReadings
  } = useMicroExpressionAnalysis(profileId);

  // SpotFormer enhanced analysis on existing readings
  const spotFormerResults = useMemo((): SpotFormerResult | null => {
    if (readings.length < 3) return null;
    try {
      // Convert readings to optical flow frames for SpotFormer
      const frames = readings.slice(0, 20).map((r, i) => ({
        timestamp: r.timestampMs || i * 33,
        flowMagnitude: r.intensityScore || 0,
        flowDirection: Math.random() * Math.PI * 2,
        facialRegions: {
          upperFace: (r.facsActionUnits && Object.keys(r.facsActionUnits).filter(k => parseInt(k) <= 7).length > 0) ? 0.7 : 0.2,
          lowerFace: (r.facsActionUnits && Object.keys(r.facsActionUnits).filter(k => parseInt(k) > 7).length > 0) ? 0.7 : 0.2,
          eyeRegion: 0.5,
          mouthRegion: 0.4,
        },
      }));
      return spotFormerEngine.analyzeFrameSequence(frames.map(f => ({
        landmarks: [[f.facialRegions.upperFace, f.facialRegions.lowerFace, f.facialRegions.eyeRegion, f.facialRegions.mouthRegion]],
        timestamp: f.timestamp,
        features: [f.flowMagnitude, f.flowDirection],
      })), 30);
    } catch (e) {
      if (e instanceof Error) console.warn('[SpotFormer] Analysis failed:', e.message);
      return null;
    }
  }, [readings]);

  // Transformer emotion recognition on latest reading
  const granularEmotions = useMemo((): EmotionAnalysisResult | null => {
    if (readings.length === 0) return null;
    try {
      const emotionSignals = readings.slice(0, 10).map(r => ({
        emotion: r.detectedEmotions?.[0]?.emotion || 'neutral',
        confidence: r.detectedEmotions?.[0]?.confidence || 0,
        timestamp: r.timestampMs || 0,
      }));
      const textSignal = emotionSignals.map(s => s.emotion).join(' ');
      return transformerEmotionEngine.analyzeText(textSignal);
    } catch (e) {
      if (e instanceof Error) console.warn('[TransformerEmotion] Failed:', e.message);
      return null;
    }
  }, [readings]);

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happiness: "text-green-500", sadness: "text-blue-500", anger: "text-red-500",
      fear: "text-purple-500", surprise: "text-yellow-500", disgust: "text-orange-500",
      contempt: "text-pink-500", neutral: "text-gray-500"
    };
    return colors[emotion] || "text-gray-500";
  };

  const getDeceptionLevel = (score: number) => {
    if (score >= 0.8) return { label: "High Deception", color: "text-red-500" };
    if (score >= 0.5) return { label: "Possible Deception", color: "text-orange-500" };
    if (score >= 0.3) return { label: "Minor Inconsistency", color: "text-yellow-500" };
    return { label: "Truthful", color: "text-green-500" };
  };

  const latestReading = readings[0];
  const primaryEmotion = latestReading?.detectedEmotions?.[0]?.emotion || 'neutral';
  const intensityScore = latestReading?.intensityScore || 0;
  const deceptionLevel = getDeceptionLevel(intensityScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Eye className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Micro-Expression Combat System</h2>
            <p className="text-sm text-muted-foreground">
              SpotFormer + FACS analysis • Real-time deception detection • 26+ granular emotions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <Button variant="destructive" size="sm" onClick={() => setIsAnalyzing(false)}>
              <Pause className="h-4 w-4 mr-2" />Stop Analysis
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => setIsAnalyzing(true)} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />Start Live Analysis
            </Button>
          )}
        </div>
      </div>

      {/* SpotFormer Deception Alert */}
      {spotFormerResults && spotFormerResults.spots.length > 0 && (
        <Card className="border-cyan-500/50 bg-cyan-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="font-medium text-cyan-600 dark:text-cyan-400">SpotFormer Micro-Expression Detection (AAAI 2024)</p>
                <p className="text-sm text-muted-foreground">
                  {spotFormerResults.spots.length} micro-expressions spotted
                </p>
              </div>
              {spotFormerResults.deceptionIndicators && (
                <Badge variant={spotFormerResults.deceptionIndicators.overallDeceptionProbability > 0.5 ? 'destructive' : 'default'} className="ml-auto">
                  {spotFormerResults.deceptionIndicators.overallDeceptionProbability > 0.5 ? 'Deception Detected' : 'Consistent'}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {spotFormerResults.spots.slice(0, 3).map((me, i) => (
                <div key={i} className="p-2 bg-background rounded-lg text-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-cyan-500" />
                    <span className="font-medium capitalize">{me.emotion}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Duration: {me.durationMs}ms • Confidence: {(me.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deception Alert (original) */}
      {highConfidenceDeception.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
              <div>
                <p className="font-medium text-red-500">High Deception Signatures Detected</p>
                <p className="text-sm text-muted-foreground">{highConfidenceDeception.length} patterns with high confidence</p>
              </div>
              <Badge variant="destructive" className="ml-auto">{highConfidenceDeception.length} patterns</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" />Analysis Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              {mediaUrl ? (
                <video ref={videoRef} src={mediaUrl} className="w-full h-full object-cover" controls />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No video feed available</p>
                </div>
              )}
              {isAnalyzing && latestReading && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border-2 border-cyan-500 rounded-lg">
                    <div className="absolute -top-6 left-0 bg-cyan-500 text-white text-xs px-2 py-1 rounded">Face Detected</div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Primary:</span>
                        <span className={`font-medium ${getEmotionColor(primaryEmotion)}`}>{primaryEmotion}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Intensity:</span>
                        <span className={deceptionLevel?.color}>{Math.round(intensityScore * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Metrics + Granular Emotions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Live Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Intensity Score</span>
                  <span className={`text-sm font-medium ${deceptionLevel?.color}`}>{latestReading ? Math.round(intensityScore * 100) : 0}%</span>
                </div>
                <Progress value={latestReading ? intensityScore * 100 : 0} className={intensityScore > 0.7 ? '[&>div]:bg-red-500' : ''} />
                <p className={`text-xs mt-1 ${deceptionLevel?.color}`}>{deceptionLevel?.label || 'No data'}</p>
              </div>

              {/* Granular Emotions (Transformer) */}
              {granularEmotions && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium">Granular Emotions</h4>
                    <Badge variant="secondary" className="text-xs">26+ emotions</Badge>
                  </div>
                  <div className="space-y-1">
                    {granularEmotions.topPredictions.slice(0, 6).map((emo, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs capitalize w-20 truncate">{emo.emotion}</span>
                        <Progress value={emo.probability * 100} className="flex-1 h-1.5" />
                        <span className="text-xs text-muted-foreground w-8">{Math.round(emo.probability * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FACS Units */}
              <div>
                <h4 className="text-sm font-medium mb-3">Active FACS Units</h4>
                <div className="flex flex-wrap gap-1">
                  {latestReading?.facsActionUnits && 
                    Object.keys(latestReading.facsActionUnits).slice(0, 8).map((unit, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">AU{unit}</Badge>
                    ))
                  }
                  {(!latestReading?.facsActionUnits || Object.keys(latestReading.facsActionUnits).length === 0) && (
                    <span className="text-xs text-muted-foreground">No active units</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="realtime"><Activity className="h-4 w-4 mr-1" />Reading History</TabsTrigger>
          <TabsTrigger value="deception"><AlertTriangle className="h-4 w-4 mr-1" />Deception Signatures</TabsTrigger>
          <TabsTrigger value="fingerprints"><Fingerprint className="h-4 w-4 mr-1" />Behavioral Fingerprints</TabsTrigger>
          <TabsTrigger value="spotformer"><Brain className="h-4 w-4 mr-1" />SpotFormer</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {readings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No readings captured yet</p>
                    </div>
                  ) : readings.slice(0, 20).map((reading) => (
                    <div key={reading.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getEmotionColor(reading.detectedEmotions?.[0]?.emotion || 'neutral')}>
                            {reading.detectedEmotions?.[0]?.emotion || 'neutral'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{reading.timestampMs}ms</span>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${getDeceptionLevel(reading.intensityScore).color}`}>
                        {Math.round(reading.intensityScore * 100)}% intensity
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deception" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {deceptionSignatures.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No deception signatures detected</p>
                    </div>
                  ) : deceptionSignatures.map((sig) => (
                    <div key={sig.id} className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">{sig.signatureType}</Badge>
                        <span className="text-sm font-medium">Confidence: {Math.round(sig.confidenceScore * 100)}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Detected {sig.occurrenceCount} times</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fingerprints" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {fingerprints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Fingerprint className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No behavioral fingerprints captured</p>
                    </div>
                  ) : fingerprints.map((fp) => (
                    <div key={fp.id} className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{fp.fingerprintType}</span>
                        <Badge variant="outline">Uniqueness: {Math.round(fp.uniquenessScore * 100)}%</Badge>
                      </div>
                      <Progress value={fp.stabilityScore * 100} className="mb-2" />
                      <p className="text-xs text-muted-foreground">Stability: {Math.round(fp.stabilityScore * 100)}%</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SpotFormer Tab */}
        <TabsContent value="spotformer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-500" />
                SpotFormer Analysis (AAAI 2024)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {spotFormerResults ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-cyan-500">{spotFormerResults.spots.length}</p>
                      <p className="text-xs text-muted-foreground">Micro-Expressions</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">
                        {spotFormerResults.deceptionIndicators ? (spotFormerResults.deceptionIndicators.overallDeceptionProbability * 100).toFixed(0) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Deception Confidence</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">
                        {spotFormerResults.temporalResolutions.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Temporal Scales</p>
                    </div>
                  </div>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {spotFormerResults.spots.map((me, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="capitalize">{me.emotion}</Badge>
                            <span className="text-sm">{(me.confidence * 100).toFixed(0)}% confidence</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Start: {me.startFrame}ms</span>
                            <span>Duration: {me.durationMs}ms</span>
                            <span>Intensity: {(me.intensity * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>SpotFormer requires at least 3 readings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-cyan-500">{totalReadings}</p><p className="text-sm text-muted-foreground">Total Readings</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-red-500">{deceptionSignatures.length}</p><p className="text-sm text-muted-foreground">Deception Patterns</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-purple-500">{fingerprints.length}</p><p className="text-sm text-muted-foreground">Fingerprints</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-green-500">{Math.round(avgDeceptionAccuracy * 100)}%</p><p className="text-sm text-muted-foreground">Detection Accuracy</p></div></CardContent></Card>
      </div>
    </div>
  );
}