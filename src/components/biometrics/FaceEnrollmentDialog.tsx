/**
 * Face Enrollment Dialog
 * 
 * Multi-angle facial enrollment with:
 * - Live camera capture
 * - Multiple sample collection (3-5 samples)
 * - Quality scoring
 * - Angle detection guidance
 * - Progress tracking
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Check, 
  X, 
  RotateCcw, 
  User, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { faceDetectionService, DetectedFace } from '@/lib/faceDetection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface FaceEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName?: string;
  onComplete?: () => void;
}

interface CapturedSample {
  id: string;
  imageDataUrl: string;
  descriptor: Float32Array;
  quality: number;
  angle: 'front' | 'left' | 'right' | 'up' | 'down';
  timestamp: Date;
}

const REQUIRED_SAMPLES = 3;
const MIN_QUALITY_SCORE = 0.7;
const ANGLES: Array<'front' | 'left' | 'right'> = ['front', 'left', 'right'];

const ANGLE_INSTRUCTIONS: Record<string, string> = {
  front: 'Look directly at the camera',
  left: 'Turn your head slightly left',
  right: 'Turn your head slightly right',
  up: 'Tilt your head up slightly',
  down: 'Tilt your head down slightly',
};

export function FaceEnrollmentDialog({
  open,
  onOpenChange,
  profileId,
  profileName,
  onComplete,
}: FaceEnrollmentDialogProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [samples, setSamples] = useState<CapturedSample[]>([]);
  const [currentAngle, setCurrentAngle] = useState<'front' | 'left' | 'right'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedFace, setDetectedFace] = useState<DetectedFace | null>(null);
  const [faceQuality, setFaceQuality] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Initialize camera and models
  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load face detection models
      const modelsLoaded = await faceDetectionService.loadModels();
      if (!modelsLoaded) {
        throw new Error('Failed to load face detection models');
      }

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      streamRef.current = stream;
      setIsInitialized(true);
    } catch (err) {
      console.error('Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize camera');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  // Handle dialog open/close
  useEffect(() => {
    if (open) {
      initialize();
    } else {
      stopCamera();
      setSamples([]);
      setCurrentAngle('front');
      setDetectedFace(null);
      setError(null);
    }
  }, [open, initialize, stopCamera]);

  // Face detection loop
  useEffect(() => {
    if (!isInitialized || !videoRef.current) return;

    let animationId: number;
    let lastDetection = 0;
    const DETECTION_INTERVAL = 200; // ms

    const detectLoop = async () => {
      const now = Date.now();
      
      if (now - lastDetection >= DETECTION_INTERVAL && videoRef.current) {
        lastDetection = now;
        
        try {
          const faces = await faceDetectionService.detectFaces(videoRef.current as unknown as HTMLImageElement, {
            withDescriptors: true,
          });

          if (faces.length > 0) {
            const face = faces[0];
            setDetectedFace(face);
            
            // Calculate quality score based on face size and confidence
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;
            const faceArea = (face.box.width * face.box.height) / (videoWidth * videoHeight);
            const sizeScore = Math.min(1, faceArea / 0.15); // Ideal: face is 15% of frame
            const quality = (face.confidence + sizeScore) / 2;
            
            setFaceQuality(quality);
          } else {
            setDetectedFace(null);
            setFaceQuality(0);
          }
        } catch (err) {
          // Ignore detection errors
        }
      }

      animationId = requestAnimationFrame(detectLoop);
    };

    detectLoop();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isInitialized]);

  // Capture sample
  const captureSample = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !detectedFace?.descriptor) {
      toast.error('No face detected - position your face in the frame');
      return;
    }

    if (faceQuality < MIN_QUALITY_SCORE) {
      toast.warning('Image quality too low - try better lighting');
      return;
    }

    setIsCapturing(true);
    
    try {
      // Haptic feedback
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }

      // Capture frame to canvas
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      ctx.drawImage(video, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const sample: CapturedSample = {
        id: crypto.randomUUID(),
        imageDataUrl,
        descriptor: detectedFace.descriptor,
        quality: faceQuality,
        angle: currentAngle,
        timestamp: new Date(),
      };

      setSamples(prev => [...prev, sample]);

      // Move to next angle
      const currentIndex = ANGLES.indexOf(currentAngle);
      if (currentIndex < ANGLES.length - 1) {
        setCurrentAngle(ANGLES[currentIndex + 1]);
      }

      toast.success(`Sample captured (${samples.length + 1}/${REQUIRED_SAMPLES})`);
      
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (err) {
      console.error('Capture failed:', err);
      toast.error('Failed to capture sample');
    } finally {
      setIsCapturing(false);
    }
  }, [detectedFace, faceQuality, currentAngle, samples.length, isMobile]);

  // Remove sample
  const removeSample = useCallback((sampleId: string) => {
    setSamples(prev => prev.filter(s => s.id !== sampleId));
  }, []);

  // Save enrollment
  const saveEnrollment = useCallback(async () => {
    if (!user?.id || samples.length < REQUIRED_SAMPLES) return;

    setIsSaving(true);
    
    try {
      // Average the descriptors for a more robust embedding
      const descriptorLength = samples[0].descriptor.length;
      const averagedDescriptor = new Float32Array(descriptorLength);
      
      for (let i = 0; i < descriptorLength; i++) {
        let sum = 0;
        for (const sample of samples) {
          sum += sample.descriptor[i];
        }
        averagedDescriptor[i] = sum / samples.length;
      }

      // Normalize the averaged descriptor
      let magnitude = 0;
      for (let i = 0; i < descriptorLength; i++) {
        magnitude += averagedDescriptor[i] * averagedDescriptor[i];
      }
      magnitude = Math.sqrt(magnitude);
      for (let i = 0; i < descriptorLength; i++) {
        averagedDescriptor[i] /= magnitude;
      }

      // Calculate average quality
      const avgQuality = samples.reduce((sum, s) => sum + s.quality, 0) / samples.length;

      // Prepare multi-angle data
      const multiAngleData = samples.map(s => ({
        angle: s.angle,
        quality: s.quality,
        descriptor: Array.from(s.descriptor),
        capturedAt: s.timestamp.toISOString(),
      }));

      // Update or insert biometrics record
      const { error: upsertError } = await supabase
        .from('contact_biometrics')
        .upsert({
          user_id: user.id,
          profile_id: profileId,
          facial_embedding: faceDetectionService.serializeDescriptor(averagedDescriptor),
          facial_sample_count: samples.length,
          facial_confidence: avgQuality,
          facial_multi_angle_data: multiAngleData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id',
        });

      if (upsertError) throw upsertError;

      toast.success('Face enrolled successfully!');
      
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      
      onComplete?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save enrollment:', err);
      toast.error('Failed to save enrollment');
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, samples, profileId, onComplete, onOpenChange, isMobile]);

  const progress = (samples.length / REQUIRED_SAMPLES) * 100;
  const canCapture = detectedFace && faceQuality >= MIN_QUALITY_SCORE && !isCapturing;
  const canSave = samples.length >= REQUIRED_SAMPLES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Enroll Face {profileName && `- ${profileName}`}
          </DialogTitle>
          <DialogDescription>
            Capture {REQUIRED_SAMPLES} photos from different angles for accurate recognition
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Camera view */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'w-full h-full object-cover',
                'transform scale-x-[-1]' // Mirror for selfie view
              )}
            />
            
            <canvas ref={canvasRef} className="hidden" />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
                <p className="text-center text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={initialize}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Face detection overlay */}
            {detectedFace && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                <svg className="w-full h-full">
                  <rect
                    x={`${(1 - detectedFace.normalizedBox.x - detectedFace.normalizedBox.width) * 100}%`}
                    y={`${detectedFace.normalizedBox.y * 100}%`}
                    width={`${detectedFace.normalizedBox.width * 100}%`}
                    height={`${detectedFace.normalizedBox.height * 100}%`}
                    fill="none"
                    stroke={faceQuality >= MIN_QUALITY_SCORE ? '#22c55e' : '#f59e0b'}
                    strokeWidth="2"
                    rx="8"
                  />
                </svg>
              </motion.div>
            )}

            {/* Angle instruction */}
            {isInitialized && !error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm">
                {ANGLE_INSTRUCTIONS[currentAngle]}
              </div>
            )}

            {/* Quality indicator */}
            {isInitialized && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 bg-black/70 rounded-lg p-2">
                  <span className="text-xs text-white">Quality:</span>
                  <Progress 
                    value={faceQuality * 100} 
                    className={cn(
                      'h-2 flex-1',
                      faceQuality >= MIN_QUALITY_SCORE ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    )}
                  />
                  <span className={cn(
                    'text-xs font-medium',
                    faceQuality >= MIN_QUALITY_SCORE ? 'text-green-400' : 'text-yellow-400'
                  )}>
                    {Math.round(faceQuality * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Enrollment Progress</span>
              <span className="text-muted-foreground">
                {samples.length}/{REQUIRED_SAMPLES} samples
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Captured samples */}
          <div className="flex gap-2 overflow-x-auto py-2">
            {ANGLES.map((angle, index) => {
              const sample = samples.find(s => s.angle === angle);
              const isCurrent = currentAngle === angle;
              
              return (
                <div
                  key={angle}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden',
                    sample ? 'border-green-500' : isCurrent ? 'border-primary' : 'border-muted'
                  )}
                >
                  {sample ? (
                    <>
                      <img 
                        src={sample.imageDataUrl} 
                        alt={`${angle} angle`}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      <button
                        onClick={() => removeSample(sample.id)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-green-500/80 text-white text-xs text-center py-0.5">
                        <Check className="h-3 w-3 inline" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                      <Camera className={cn(
                        'h-5 w-5 mb-1',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <span className="text-xs capitalize text-muted-foreground">{angle}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Capture button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={captureSample}
              disabled={!canCapture || samples.length >= REQUIRED_SAMPLES}
              className="w-32 h-32 rounded-full"
            >
              {isCapturing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveEnrollment}
            disabled={!canSave || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Complete Enrollment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
