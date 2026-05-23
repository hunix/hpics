import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera, 
  CameraOff, 
  Scan, 
  User, 
  Users,
  Smile,
  Meh,
  Frown,
  Activity,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { offlineMLService, type EnhancedFaceDetection } from '@/lib/offlineMLService';
import { emotionRecorder, type EmotionSample } from '@/lib/emotionRecorder';
import { cn } from '@/lib/utils';

interface DetectedFace {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  age: number;
  gender: string;
  expression: string;
  confidence: number;
  matchedContact?: {
    id: string;
    name: string;
    confidence: number;
  };
  pose: { yaw: number; pitch: number; roll: number };
}

interface LiveIntelligenceScannerProps {
  onFaceDetected?: (faces: DetectedFace[]) => void;
  enrolledDescriptors?: Map<string, { name: string; descriptor: Float32Array }>;
  showLandmarks?: boolean;
  showEmotions?: boolean;
  className?: string;
}

const EXPRESSION_ICONS: Record<string, React.ReactNode> = {
  happy: <Smile className="w-4 h-4 text-green-500" />,
  sad: <Frown className="w-4 h-4 text-blue-500" />,
  angry: <Frown className="w-4 h-4 text-red-500" />,
  fearful: <Meh className="w-4 h-4 text-yellow-500" />,
  disgusted: <Meh className="w-4 h-4 text-purple-500" />,
  surprised: <Smile className="w-4 h-4 text-orange-500" />,
  neutral: <Meh className="w-4 h-4 text-muted-foreground" />,
};

export function LiveIntelligenceScanner({
  onFaceDetected,
  enrolledDescriptors,
  showLandmarks = true,
  showEmotions = true,
  className
}: LiveIntelligenceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [fps, setFps] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<EmotionSample[]>([]);
  const [isRecordingEmotions, setIsRecordingEmotions] = useState(false);
  
  const { toast } = useToast();
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });
  const faceIdCounter = useRef(0);

  // Start camera and detection
  const startScanner = async () => {
    setIsInitializing(true);
    
    try {
      await offlineMLService.loadFaceApiModels();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsActive(true);
      setIsInitializing(false);
      startDetectionLoop();
      
    } catch (error) {
      console.error('Failed to start scanner:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera',
        variant: 'destructive'
      });
      setIsInitializing(false);
    }
  };

  // Stop camera
  const stopScanner = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    if (isRecordingEmotions) {
      emotionRecorder.stop();
      setIsRecordingEmotions(false);
    }
    
    setIsActive(false);
    setDetectedFaces([]);
  };

  // Detection loop
  const startDetectionLoop = useCallback(() => {
    let isProcessing = false;
    
    const detect = async () => {
      if (!videoRef.current || videoRef.current.paused) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      
      if (isProcessing) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      
      isProcessing = true;
      
      try {
        const results = await offlineMLService.detectFacesEnhanced(videoRef.current);
        
        const faces: DetectedFace[] = results.map((face, idx) => {
          const pose = face.headPose || { yaw: 0, pitch: 0, roll: 0 };
          
          // Try to match with enrolled contacts
          let matchedContact: DetectedFace['matchedContact'] | undefined;
          if (enrolledDescriptors && face.descriptor) {
            let bestMatch = { id: '', name: '', confidence: 0 };
            
            enrolledDescriptors.forEach((enrolled, id) => {
              const distance = computeDescriptorDistance(face.descriptor!, enrolled.descriptor);
              const confidence = 1 - distance;
              
              if (confidence > bestMatch.confidence && confidence > 0.6) {
                bestMatch = { id, name: enrolled.name, confidence };
              }
            });
            
            if (bestMatch.confidence > 0.6) {
              matchedContact = bestMatch;
            }
          }
          
          // Get dominant expression
          const dominantExpression = face.expressions 
            ? Object.entries(face.expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0]
            : 'neutral';
          
          // Record emotion if tracking
          if (isRecordingEmotions) {
            emotionRecorder.recordSample(dominantExpression, face.confidence);
          }
          
          return {
            id: `face-${faceIdCounter.current++}`,
            boundingBox: face.box,
            age: face.age || 0,
            gender: face.gender || 'unknown',
            expression: dominantExpression,
            confidence: face.confidence,
            matchedContact,
            pose
          };
        });
        
        setDetectedFaces(faces);
        onFaceDetected?.(faces);
        
        // Update emotion history
        if (isRecordingEmotions) {
          setEmotionHistory(emotionRecorder.getRecentSamples(20));
        }
        
        // Draw overlay
        if (showOverlay) {
          drawOverlay(results, faces);
        }
        
        // Update FPS
        fpsCounterRef.current.frames++;
        const now = Date.now();
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          setFps(fpsCounterRef.current.frames);
          fpsCounterRef.current.frames = 0;
          fpsCounterRef.current.lastTime = now;
        }
        
      } catch (error) {
        console.error('Detection error:', error);
      }
      
      isProcessing = false;
      animationRef.current = requestAnimationFrame(detect);
    };
    
    animationRef.current = requestAnimationFrame(detect);
  }, [enrolledDescriptors, onFaceDetected, showOverlay, isRecordingEmotions]);

  // Compute descriptor distance
  const computeDescriptorDistance = (d1: Float32Array, d2: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < d1.length; i++) {
      sum += (d1[i] - d2[i]) ** 2;
    }
    return Math.sqrt(sum);
  };

  // Draw AR overlay
  const drawOverlay = (results: EnhancedFaceDetection[], faces: DetectedFace[]) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    results.forEach((result, idx) => {
      const face = faces[idx];
      const { x, y, width, height } = result.box;
      
      // Face bounding box
      ctx.strokeStyle = face.matchedContact 
        ? 'rgba(34, 197, 94, 0.9)' 
        : 'rgba(59, 130, 246, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      // Corner accents
      const cornerSize = 15;
      ctx.fillStyle = ctx.strokeStyle;
      // Top-left
      ctx.fillRect(x, y, cornerSize, 3);
      ctx.fillRect(x, y, 3, cornerSize);
      // Top-right
      ctx.fillRect(x + width - cornerSize, y, cornerSize, 3);
      ctx.fillRect(x + width - 3, y, 3, cornerSize);
      // Bottom-left
      ctx.fillRect(x, y + height - 3, cornerSize, 3);
      ctx.fillRect(x, y + height - cornerSize, 3, cornerSize);
      // Bottom-right
      ctx.fillRect(x + width - cornerSize, y + height - 3, cornerSize, 3);
      ctx.fillRect(x + width - 3, y + height - cornerSize, 3, cornerSize);
      
      // Landmarks
      if (showLandmarks && result.landmarks) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        result.landmarks.positions.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Info label background
      const labelY = y - 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, labelY, width, 55);
      
      // Info text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px sans-serif';
      
      if (face.matchedContact) {
        ctx.fillText(face.matchedContact.name, x + 5, labelY + 18);
        ctx.font = '11px sans-serif';
        ctx.fillText(`${Math.round(face.matchedContact.confidence * 100)}% match`, x + 5, labelY + 32);
      } else {
        ctx.fillText('Unknown', x + 5, labelY + 18);
      }
      
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(
        `${face.gender}, ~${Math.round(face.age)}y, ${face.expression}`,
        x + 5,
        labelY + 48
      );
    });
  };

  // Toggle emotion recording
  const toggleEmotionRecording = () => {
    if (isRecordingEmotions) {
      const timeline = emotionRecorder.stop();
      console.log('Emotion timeline:', timeline);
      setIsRecordingEmotions(false);
      toast({
        title: 'Emotion Recording Stopped',
        description: `Recorded ${timeline.samples.length} samples, ${timeline.shifts.length} shifts`
      });
    } else {
      emotionRecorder.start();
      setIsRecordingEmotions(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className={cn('relative', isFullscreen && 'fixed inset-0 z-50 bg-background', className)}>
      {/* Video feed */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        
        {/* Status overlay */}
        {!isActive && !isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center space-y-4">
              <Scan className="w-16 h-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Camera inactive</p>
              <Button onClick={startScanner}>
                <Camera className="w-4 h-4 mr-2" />
                Start Scanner
              </Button>
            </div>
          </div>
        )}
        
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Initializing ML models...</p>
            </div>
          </div>
        )}
        
        {/* Top HUD */}
        {isActive && (
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            <Card className="p-2 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Activity className="w-3 h-3" />
                  {fps} FPS
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {detectedFaces.length} faces
                </Badge>
              </div>
            </Card>
            
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setShowOverlay(!showOverlay)}
                className="h-8 w-8 bg-background/80"
              >
                {showOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 bg-background/80"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={stopScanner}
                className="h-8 w-8"
              >
                <CameraOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Bottom controls */}
        {isActive && (
          <div className="absolute bottom-2 left-2 right-2">
            <Card className="p-2 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant={isRecordingEmotions ? 'destructive' : 'outline'}
                  onClick={toggleEmotionRecording}
                  className="gap-1"
                >
                  <Activity className="w-4 h-4" />
                  {isRecordingEmotions ? 'Stop Recording' : 'Record Emotions'}
                </Button>
                
                {showEmotions && detectedFaces.length > 0 && (
                  <div className="flex items-center gap-2">
                    {detectedFaces.slice(0, 3).map(face => (
                      <Badge key={face.id} variant="secondary" className="gap-1">
                        {EXPRESSION_ICONS[face.expression] || EXPRESSION_ICONS.neutral}
                        {face.expression}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
      
      {/* Detected faces list */}
      {isActive && detectedFaces.length > 0 && (
        <Card className="mt-2 p-2">
          <ScrollArea className="max-h-40">
            <div className="space-y-2">
              {detectedFaces.map(face => (
                <div
                  key={face.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md',
                    face.matchedContact ? 'bg-green-500/10' : 'bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <div>
                      <div className="font-medium text-sm">
                        {face.matchedContact?.name || 'Unknown Person'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {face.gender}, ~{Math.round(face.age)} years
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {EXPRESSION_ICONS[face.expression]}
                    <Badge variant="outline" className="text-xs">
                      {Math.round(face.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
      
      {/* Emotion history chart (when recording) */}
      {isRecordingEmotions && emotionHistory.length > 0 && (
        <Card className="mt-2 p-2">
          <div className="text-xs font-medium mb-2">Emotion Timeline</div>
          <div className="flex gap-0.5 h-8">
            {emotionHistory.map((sample, idx) => {
              const colors: Record<string, string> = {
                happy: 'bg-green-500',
                sad: 'bg-blue-500',
                angry: 'bg-red-500',
                fearful: 'bg-yellow-500',
                disgusted: 'bg-purple-500',
                surprised: 'bg-orange-500',
                neutral: 'bg-gray-400',
              };
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex-1 rounded-sm transition-colors',
                    colors[sample.expression] || 'bg-gray-400'
                  )}
                  title={`${sample.expression} (${Math.round(sample.confidence * 100)}%)`}
                />
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
