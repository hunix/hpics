import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { offlineMLService, type EnhancedFaceDetection } from '@/lib/offlineMLService';
import { getAngleGuidance, type HeadPose } from '@/lib/headPoseEstimation';
import { cn } from '@/lib/utils';

interface EnrollmentFrame {
  timestamp: number;
  angle: HeadPose;
  quality: number;
  descriptor: Float32Array;
  landmarks: { x: number; y: number }[];
  expression: string;
  age: number;
  gender: string;
  imageData: string; // base64
}

interface AngleCoverage {
  front: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface VideoFaceEnrollmentProps {
  profileId: string;
  onComplete: (frames: EnrollmentFrame[]) => void;
  onCancel: () => void;
}

const REQUIRED_ANGLES = ['front', 'left', 'right', 'up', 'down'] as const;
const MIN_QUALITY_THRESHOLD = 0.6;
const TARGET_FRAME_COUNT = 6;

export function VideoFaceEnrollment({ profileId, onComplete, onCancel }: VideoFaceEnrollmentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [enrollmentFrames, setEnrollmentFrames] = useState<EnrollmentFrame[]>([]);
  const [currentPose, setCurrentPose] = useState<HeadPose | null>(null);
  const [guidance, setGuidance] = useState<string>('Initializing camera...');
  const [angleCoverage, setAngleCoverage] = useState<AngleCoverage>({
    front: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });
  const [quality, setQuality] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [processingFrame, setProcessingFrame] = useState(false);
  
  const { toast } = useToast();

  // Initialize camera and ML models
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Initialize ML service
        await offlineMLService.loadFaceApiModels();
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });
        
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        
        setIsInitializing(false);
        setGuidance('Position your face in the frame');
        
        // Start face detection loop
        startDetectionLoop();
      } catch (error) {
        console.error('Failed to initialize:', error);
        toast({
          title: 'Camera Error',
          description: 'Failed to access camera. Please check permissions.',
          variant: 'destructive'
        });
      }
    }
    
    initialize();
    
    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startDetectionLoop = useCallback(() => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      
      if (processingFrame) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      
      setProcessingFrame(true);
      
      try {
        const results = await offlineMLService.detectFacesEnhanced(videoRef.current);
        
        if (results.length > 0) {
          const face = results[0];
          setFaceDetected(true);
          
          // Use head pose from detection
          const pose: HeadPose = face.headPose || { yaw: 0, pitch: 0, roll: 0, confidence: 0.5 };
          setCurrentPose(pose);
          
          // Calculate quality
          const frameQuality = calculateFrameQuality(face, pose);
          setQuality(frameQuality);
          
          // Get guidance
          const guidanceResult = getAngleGuidance(pose, angleCoverage);
          setGuidance(guidanceResult.instruction);
          
          // Draw overlay
          drawOverlay(face, pose, frameQuality);
          
          // Auto-capture if recording and quality is good
          if (isRecording && frameQuality >= MIN_QUALITY_THRESHOLD) {
            await captureFrame(face, pose, frameQuality);
          }
        } else {
          setFaceDetected(false);
          setCurrentPose(null);
          setQuality(0);
          setGuidance('Position your face in the frame');
          clearOverlay();
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
      
      setProcessingFrame(false);
      animationRef.current = requestAnimationFrame(detect);
    };
    
    animationRef.current = requestAnimationFrame(detect);
  }, [isRecording, angleCoverage, processingFrame]);

  const calculateFrameQuality = (face: FaceAnalysisResult, pose: HeadPose): number => {
    let quality = 1.0;
    
    // Penalize extreme angles
    const angleScore = Math.max(0, 1 - (Math.abs(pose.roll) / 30));
    quality *= angleScore;
    
    // Penalize low confidence
    quality *= face.confidence;
    
    // Bonus for neutral expression (more stable for enrollment)
    if (face.expression === 'neutral') {
      quality *= 1.1;
    }
    
    return Math.min(1, Math.max(0, quality));
  };

  const captureFrame = async (face: FaceAnalysisResult, pose: HeadPose, frameQuality: number) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Determine which angle category this belongs to
    const angleCategory = categorizeAngle(pose);
    
    // Check if we already have this angle covered with good quality
    if (angleCoverage[angleCategory]) {
      const existingFrame = enrollmentFrames.find(f => 
        categorizeAngle(f.angle) === angleCategory
      );
      if (existingFrame && existingFrame.quality >= frameQuality) {
        return; // Already have a better frame for this angle
      }
    }
    
    // Capture frame image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = tempCanvas.toDataURL('image/jpeg', 0.9);
    
    const newFrame: EnrollmentFrame = {
      timestamp: Date.now(),
      angle: pose,
      quality: frameQuality,
      descriptor: face.descriptor,
      landmarks: face.landmarks,
      expression: face.expression,
      age: face.age,
      gender: face.gender,
      imageData
    };
    
    // Update frames - replace if same angle with better quality
    setEnrollmentFrames(prev => {
      const filtered = prev.filter(f => categorizeAngle(f.angle) !== angleCategory);
      return [...filtered, newFrame];
    });
    
    // Update angle coverage
    setAngleCoverage(prev => ({
      ...prev,
      [angleCategory]: true
    }));
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const categorizeAngle = (pose: HeadPose): keyof AngleCoverage => {
    const { yaw, pitch } = pose;
    
    // Thresholds in degrees
    if (Math.abs(yaw) < 15 && Math.abs(pitch) < 15) return 'front';
    if (yaw < -20) return 'left';
    if (yaw > 20) return 'right';
    if (pitch < -15) return 'up';
    if (pitch > 15) return 'down';
    
    return 'front';
  };

  const drawOverlay = (face: FaceAnalysisResult, pose: HeadPose, frameQuality: number) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Match video dimensions
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face landmarks
    ctx.fillStyle = frameQuality >= MIN_QUALITY_THRESHOLD 
      ? 'rgba(34, 197, 94, 0.8)' 
      : 'rgba(234, 179, 8, 0.8)';
    
    face.landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw pose indicator
    const centerX = canvas.width / 2;
    const centerY = 60;
    
    // Draw angle indicator circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw current angle position
    const indicatorX = centerX + (pose.yaw / 45) * 40;
    const indicatorY = centerY + (pose.pitch / 30) * 40;
    
    ctx.fillStyle = frameQuality >= MIN_QUALITY_THRESHOLD 
      ? 'rgba(34, 197, 94, 1)' 
      : 'rgba(234, 179, 8, 1)';
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw quality bar
    const barWidth = 200;
    const barHeight = 8;
    const barX = (canvas.width - barWidth) / 2;
    const barY = canvas.height - 40;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = frameQuality >= MIN_QUALITY_THRESHOLD 
      ? 'rgba(34, 197, 94, 0.8)' 
      : 'rgba(234, 179, 8, 0.8)';
    ctx.fillRect(barX, barY, barWidth * frameQuality, barHeight);
  };

  const clearOverlay = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startEnrollment = () => {
    setCountdown(3);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setIsRecording(true);
          setCountdown(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishEnrollment = () => {
    setIsRecording(false);
    
    if (enrollmentFrames.length < 3) {
      toast({
        title: 'Insufficient Data',
        description: 'Please capture at least 3 different angles.',
        variant: 'destructive'
      });
      return;
    }
    
    onComplete(enrollmentFrames);
  };

  const resetEnrollment = () => {
    setEnrollmentFrames([]);
    setAngleCoverage({
      front: false,
      left: false,
      right: false,
      up: false,
      down: false,
    });
    setIsRecording(false);
  };

  const coverageCount = Object.values(angleCoverage).filter(Boolean).length;
  const progress = (coverageCount / REQUIRED_ANGLES.length) * 100;

  return (
    <div className="relative w-full h-full min-h-[500px] bg-background rounded-lg overflow-hidden">
      {/* Video feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      
      {/* Canvas overlay for AR */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Loading state */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Initializing camera & ML models...</p>
          </div>
        </div>
      )}
      
      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <div className="text-8xl font-bold text-primary animate-pulse">
            {countdown}
          </div>
        </div>
      )}
      
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4">
        <Card className="p-3 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {faceDetected ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                {isRecording ? 'Recording...' : guidance}
              </span>
            </div>
            <Badge variant={isRecording ? 'destructive' : 'secondary'}>
              {isRecording ? 'LIVE' : 'READY'}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex gap-1 mt-2">
            {REQUIRED_ANGLES.map(angle => (
              <Badge
                key={angle}
                variant={angleCoverage[angle] ? 'default' : 'outline'}
                className={cn(
                  'text-xs capitalize',
                  angleCoverage[angle] && 'bg-green-500'
                )}
              >
                {angle}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Bottom controls */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="p-4 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isRecording}
            >
              Cancel
            </Button>
            
            <div className="flex items-center gap-2">
              {enrollmentFrames.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetEnrollment}
                  disabled={isRecording}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              )}
              
              {!isRecording ? (
                <Button
                  onClick={startEnrollment}
                  disabled={!faceDetected || isInitializing}
                  className="gap-2"
                >
                  <Video className="w-5 h-5" />
                  Start Enrollment
                </Button>
              ) : (
                <Button
                  onClick={finishEnrollment}
                  disabled={coverageCount < 3}
                  variant="default"
                  className="gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Complete ({coverageCount}/{REQUIRED_ANGLES.length})
                </Button>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">{enrollmentFrames.length}</div>
              <div className="text-xs text-muted-foreground">Frames</div>
            </div>
          </div>
          
          {/* Captured frames preview */}
          {enrollmentFrames.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {enrollmentFrames.map((frame, idx) => (
                <div
                  key={frame.timestamp}
                  className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 border-green-500"
                >
                  <img
                    src={frame.imageData}
                    alt={`Frame ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center">
                    {categorizeAngle(frame.angle)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      
      {/* Age/Gender/Expression badges (when face detected) */}
      {faceDetected && enrollmentFrames.length > 0 && (
        <div className="absolute top-24 right-4 space-y-1">
          <Badge variant="secondary" className="block">
            Age: ~{Math.round(enrollmentFrames[0]?.age || 0)}
          </Badge>
          <Badge variant="secondary" className="block capitalize">
            {enrollmentFrames[0]?.gender || 'Unknown'}
          </Badge>
          <Badge variant="secondary" className="block capitalize">
            {enrollmentFrames[0]?.expression || 'Neutral'}
          </Badge>
        </div>
      )}
    </div>
  );
}
