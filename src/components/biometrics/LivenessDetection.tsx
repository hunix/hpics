/**
 * Liveness Detection Component
 * 
 * Verifies that a real person is present using multiple challenges:
 * - Blink detection
 * - Head movement tracking
 * - Expression mimicking
 * - Random challenge sequences
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, XCircle, AlertCircle, 
  Eye, Smile, Frown, MoveHorizontal, 
  Loader2, Camera, RefreshCw
} from 'lucide-react';
import { offlineMLService, EnhancedFaceDetection } from '@/lib/offlineMLService';
import { cn } from '@/lib/utils';

type ChallengeType = 'blink' | 'smile' | 'turn_left' | 'turn_right' | 'nod';

interface Challenge {
  type: ChallengeType;
  instruction: string;
  icon: React.ReactNode;
  validator: (detection: EnhancedFaceDetection, history: EnhancedFaceDetection[]) => boolean;
}

interface LivenessDetectionProps {
  onComplete: (success: boolean, confidence: number) => void;
  onCancel?: () => void;
  challengeCount?: number;
  timeLimit?: number; // seconds per challenge
  className?: string;
}

const CHALLENGES: Challenge[] = [
  {
    type: 'blink',
    instruction: 'Blink your eyes',
    icon: <Eye className="w-8 h-8" />,
    validator: (current, history) => {
      // Detect blink by looking for eye landmark changes
      if (history.length < 5) return false;
      const recent = history.slice(-10);
      // Check for eye aspect ratio changes
      let eyesClosed = 0;
      for (const det of recent) {
        if (det.landmarks) {
          const leftEye = det.landmarks.getLeftEye();
          const rightEye = det.landmarks.getRightEye();
          
          // Calculate eye aspect ratio (simplified)
          const leftHeight = Math.abs(leftEye[1].y - leftEye[5].y);
          const rightHeight = Math.abs(rightEye[1].y - rightEye[5].y);
          const avgHeight = (leftHeight + rightHeight) / 2;
          
          if (avgHeight < 5) eyesClosed++;
        }
      }
      return eyesClosed >= 2;
    },
  },
  {
    type: 'smile',
    instruction: 'Smile',
    icon: <Smile className="w-8 h-8" />,
    validator: (current) => {
      if (!current.expressions) return false;
      return current.expressions.happy > 0.6;
    },
  },
  {
    type: 'turn_left',
    instruction: 'Turn your head left',
    icon: <MoveHorizontal className="w-8 h-8" />,
    validator: (current) => {
      if (!current.headPose) return false;
      return current.headPose.yaw < -20;
    },
  },
  {
    type: 'turn_right',
    instruction: 'Turn your head right',
    icon: <MoveHorizontal className="w-8 h-8 scale-x-[-1]" />,
    validator: (current) => {
      if (!current.headPose) return false;
      return current.headPose.yaw > 20;
    },
  },
  {
    type: 'nod',
    instruction: 'Nod your head up and down',
    icon: <MoveHorizontal className="w-8 h-8 rotate-90" />,
    validator: (current, history) => {
      if (history.length < 10) return false;
      const recent = history.slice(-15);
      let minPitch = Infinity;
      let maxPitch = -Infinity;
      
      for (const det of recent) {
        if (det.headPose) {
          minPitch = Math.min(minPitch, det.headPose.pitch);
          maxPitch = Math.max(maxPitch, det.headPose.pitch);
        }
      }
      
      return (maxPitch - minPitch) > 25;
    },
  },
];

export function LivenessDetection({
  onComplete,
  onCancel,
  challengeCount = 3,
  timeLimit = 10,
  className,
}: LivenessDetectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const detectionHistoryRef = useRef<EnhancedFaceDetection[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeStartTime, setChallengeStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [challengeResults, setChallengeResults] = useState<boolean[]>([]);
  const [currentDetection, setCurrentDetection] = useState<EnhancedFaceDetection | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize camera and models
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Load models
        await offlineMLService.loadFaceApiModels();

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
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

        // Select random challenges
        const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5);
        setChallenges(shuffled.slice(0, challengeCount));
        setChallengeStartTime(Date.now());

        setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [challengeCount]);

  // Detection loop
  useEffect(() => {
    if (isLoading || isComplete || challenges.length === 0) return;

    const detect = async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const detections = await offlineMLService.detectFacesEnhanced(video, {
          withDescriptors: false,
          withAgeGender: false,
          withExpressions: true,
          withHeadPose: true,
        });

        if (detections.length > 0) {
          const detection = detections[0];
          setCurrentDetection(detection);
          detectionHistoryRef.current.push(detection);
          
          // Keep history manageable
          if (detectionHistoryRef.current.length > 30) {
            detectionHistoryRef.current = detectionHistoryRef.current.slice(-30);
          }

          // Validate current challenge
          const currentChallenge = challenges[currentChallengeIndex];
          if (currentChallenge) {
            const passed = currentChallenge.validator(
              detection, 
              detectionHistoryRef.current
            );

            if (passed) {
              handleChallengePass();
            }
          }
        }
      } catch (err) {
        console.error('[Liveness] Detection error:', err);
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    animationRef.current = requestAnimationFrame(detect);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isLoading, isComplete, challenges, currentChallengeIndex]);

  // Timer
  useEffect(() => {
    if (isLoading || isComplete || challenges.length === 0) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - challengeStartTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleChallengeFail();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, isComplete, challengeStartTime, timeLimit, challenges]);

  const handleChallengePass = useCallback(() => {
    const newResults = [...challengeResults, true];
    setChallengeResults(newResults);
    detectionHistoryRef.current = [];

    if (currentChallengeIndex + 1 >= challenges.length) {
      // All challenges complete
      setIsComplete(true);
      const passRate = newResults.filter(Boolean).length / newResults.length;
      onComplete(passRate >= 0.66, passRate);
    } else {
      // Next challenge
      setCurrentChallengeIndex(prev => prev + 1);
      setChallengeStartTime(Date.now());
      setTimeRemaining(timeLimit);
    }
  }, [challengeResults, currentChallengeIndex, challenges, timeLimit, onComplete]);

  const handleChallengeFail = useCallback(() => {
    const newResults = [...challengeResults, false];
    setChallengeResults(newResults);
    detectionHistoryRef.current = [];

    if (currentChallengeIndex + 1 >= challenges.length) {
      // All challenges complete
      setIsComplete(true);
      const passRate = newResults.filter(Boolean).length / newResults.length;
      onComplete(passRate >= 0.66, passRate);
    } else {
      // Next challenge
      setCurrentChallengeIndex(prev => prev + 1);
      setChallengeStartTime(Date.now());
      setTimeRemaining(timeLimit);
    }
  }, [challengeResults, currentChallengeIndex, challenges, timeLimit, onComplete]);

  const handleRetry = useCallback(() => {
    setIsComplete(false);
    setChallengeResults([]);
    setCurrentChallengeIndex(0);
    setChallengeStartTime(Date.now());
    setTimeRemaining(timeLimit);
    detectionHistoryRef.current = [];
    
    const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5);
    setChallenges(shuffled.slice(0, challengeCount));
  }, [challengeCount, timeLimit]);

  if (isLoading) {
    return (
      <Card className={cn('p-8', className)}>
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing liveness detection...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-8', className)}>
        <div className="flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  const currentChallenge = challenges[currentChallengeIndex];
  const passedCount = challengeResults.filter(Boolean).length;
  const successRate = challengeResults.length > 0 
    ? passedCount / challengeResults.length 
    : 0;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Video feed */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />

        {/* Face detection indicator */}
        {currentDetection && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Face detected
            </Badge>
          </div>
        )}

        {/* Timer */}
        {!isComplete && (
          <div className="absolute top-3 right-3">
            <Badge 
              variant={timeRemaining < 3 ? 'destructive' : 'secondary'}
              className="text-lg font-mono"
            >
              {Math.ceil(timeRemaining)}s
            </Badge>
          </div>
        )}

        {/* Challenge display */}
        {!isComplete && currentChallenge && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                {currentChallenge.icon}
              </div>
              <div className="flex-1">
                <p className="text-white text-xl font-medium">
                  {currentChallenge.instruction}
                </p>
                <Progress 
                  value={(timeRemaining / timeLimit) * 100} 
                  className="h-2 mt-2" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Complete overlay */}
        {isComplete && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            {successRate >= 0.66 ? (
              <>
                <CheckCircle2 className="w-20 h-20 text-green-500" />
                <p className="text-white text-2xl font-bold">Liveness Verified</p>
                <p className="text-white/70">
                  {passedCount} of {challengeResults.length} challenges passed
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-500" />
                <p className="text-white text-2xl font-bold">Verification Failed</p>
                <p className="text-white/70">
                  Only {passedCount} of {challengeResults.length} challenges passed
                </p>
                <Button onClick={handleRetry} className="mt-4 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress indicators */}
      <div className="flex items-center justify-center gap-2">
        {challenges.map((_, index) => {
          const result = challengeResults[index];
          const isCurrent = index === currentChallengeIndex && !isComplete;
          
          return (
            <div
              key={index}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                result === true && 'bg-green-500 border-green-500',
                result === false && 'bg-red-500 border-red-500',
                isCurrent && 'border-primary bg-primary/20 animate-pulse',
                result === undefined && !isCurrent && 'border-muted'
              )}
            >
              {result === true && <CheckCircle2 className="w-4 h-4 text-white" />}
              {result === false && <XCircle className="w-4 h-4 text-white" />}
              {isCurrent && <span className="text-primary font-bold">{index + 1}</span>}
            </div>
          );
        })}
      </div>

      {/* Cancel button */}
      {!isComplete && onCancel && (
        <Button variant="outline" onClick={onCancel} className="mt-2">
          Cancel
        </Button>
      )}
    </div>
  );
}

export default LivenessDetection;
