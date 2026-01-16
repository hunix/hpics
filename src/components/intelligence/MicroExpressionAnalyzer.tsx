import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Camera,
  AlertTriangle, 
  Activity,
  Fingerprint,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { useMicroExpressionAnalysis } from "@/hooks/intelligence/useMicroExpressionAnalysis";

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

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happiness: "text-green-500",
      sadness: "text-blue-500",
      anger: "text-red-500",
      fear: "text-purple-500",
      surprise: "text-yellow-500",
      disgust: "text-orange-500",
      contempt: "text-pink-500",
      neutral: "text-gray-500"
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

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    // In real implementation, this would start frame capture
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
  };

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
              FACS analysis • Real-time deception detection • Behavioral fingerprinting
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleStopAnalysis}
            >
              <Pause className="h-4 w-4 mr-2" />
              Stop Analysis
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleStartAnalysis}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Live Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Deception Alert */}
      {highConfidenceDeception.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
              <div>
                <p className="font-medium text-red-500">High Deception Signatures Detected</p>
                <p className="text-sm text-muted-foreground">
                  {highConfidenceDeception.length} deception patterns identified with high confidence
                </p>
              </div>
              <Badge variant="destructive" className="ml-auto">
                {highConfidenceDeception.length} patterns
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed / Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Analysis Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              {mediaUrl ? (
                <video 
                  ref={videoRef}
                  src={mediaUrl} 
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No video feed available</p>
                  <p className="text-sm">Connect a camera or upload media</p>
                </div>
              )}
              
              {/* Overlay for real-time analysis */}
              {isAnalyzing && latestReading && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border-2 border-cyan-500 rounded-lg">
                    <div className="absolute -top-6 left-0 bg-cyan-500 text-white text-xs px-2 py-1 rounded">
                      Face Detected
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Primary:</span>
                        <span className={`font-medium ${getEmotionColor(primaryEmotion)}`}>
                          {primaryEmotion}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Intensity:</span>
                        <span className={deceptionLevel?.color}>
                          {Math.round(intensityScore * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Intensity Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Intensity Score</span>
                  <span className={`text-sm font-medium ${deceptionLevel?.color}`}>
                    {latestReading ? Math.round(intensityScore * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={latestReading ? intensityScore * 100 : 0} 
                  className={intensityScore > 0.7 ? '[&>div]:bg-red-500' : ''}
                />
                <p className={`text-xs mt-1 ${deceptionLevel?.color}`}>
                  {deceptionLevel?.label || 'No data'}
                </p>
              </div>

              {/* Emotion Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-3">Emotion Distribution</h4>
                <div className="space-y-2">
                  {latestReading?.detectedEmotions?.slice(0, 5).map((emo, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`text-xs capitalize ${getEmotionColor(emo.emotion)}`}>
                        {emo.emotion}
                      </span>
                      <Progress value={emo.confidence * 100} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-8">
                        {Math.round(emo.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                  {(!latestReading?.detectedEmotions || latestReading.detectedEmotions.length === 0) && (
                    <span className="text-xs text-muted-foreground">No emotions detected</span>
                  )}
                </div>
              </div>

              {/* FACS Units */}
              <div>
                <h4 className="text-sm font-medium mb-3">Active FACS Units</h4>
                <div className="flex flex-wrap gap-1">
                  {latestReading?.facsActionUnits && 
                    Object.keys(latestReading.facsActionUnits).slice(0, 8).map((unit, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        AU{unit}
                      </Badge>
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
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Reading History
          </TabsTrigger>
          <TabsTrigger value="deception" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Deception Signatures
          </TabsTrigger>
          <TabsTrigger value="fingerprints" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Behavioral Fingerprints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {readings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No readings captured yet</p>
                    </div>
                  ) : (
                    readings.slice(0, 20).map((reading) => (
                      <div key={reading.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getEmotionColor(reading.detectedEmotions?.[0]?.emotion || 'neutral')}>
                              {reading.detectedEmotions?.[0]?.emotion || 'neutral'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {reading.timestampMs}ms
                            </span>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${getDeceptionLevel(reading.intensityScore).color}`}>
                          {Math.round(reading.intensityScore * 100)}% intensity
                        </div>
                      </div>
                    ))
                  )}
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
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No deception signatures detected</p>
                    </div>
                  ) : (
                    deceptionSignatures.map((sig) => (
                      <div key={sig.id} className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="destructive">{sig.signatureType}</Badge>
                          <span className="text-sm font-medium">
                            Confidence: {Math.round(sig.confidenceScore * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Detected {sig.occurrenceCount} times
                        </p>
                        {sig.contextTriggers && sig.contextTriggers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {sig.contextTriggers.map((ctx, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {ctx}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
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
                      <Fingerprint className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No behavioral fingerprints captured</p>
                    </div>
                  ) : (
                    fingerprints.map((fp) => (
                      <div key={fp.id} className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{fp.fingerprintType}</span>
                          <Badge variant="outline">
                            Uniqueness: {Math.round(fp.uniquenessScore * 100)}%
                          </Badge>
                        </div>
                        <Progress value={fp.stabilityScore * 100} className="mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Stability: {Math.round(fp.stabilityScore * 100)}%
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-cyan-500">{totalReadings}</p>
              <p className="text-sm text-muted-foreground">Total Readings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{deceptionSignatures.length}</p>
              <p className="text-sm text-muted-foreground">Deception Patterns</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">{fingerprints.length}</p>
              <p className="text-sm text-muted-foreground">Fingerprints</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {Math.round(avgDeceptionAccuracy * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Detection Accuracy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
