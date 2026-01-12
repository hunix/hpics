/**
 * LiveFaceScanner - Real-time camera face detection and identification
 * Uses face-api.js for zero-cost offline face recognition
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, X, Check, Maximize2, Minimize2, Loader2, SwitchCamera, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { faceDetectionService, DetectedFace as FaceAPIDetectedFace, FaceMatchResult } from '@/lib/faceDetection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface DetectedFace {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  matchedProfile?: {
    id: string;
    name: string;
    avatar?: string;
  };
  matchDistance?: number;
}

interface EnrolledDescriptor {
  profileId: string;
  profileName: string;
  profileAvatar?: string;
  descriptor: Float32Array;
}

interface LiveFaceScannerProps {
  className?: string;
  onFaceDetected?: (face: DetectedFace) => void;
  onProfileMatch?: (profileId: string) => void;
  fullscreenMode?: boolean;
}

export function LiveFaceScanner({ className, onFaceDetected, onProfileMatch, fullscreenMode = false }: LiveFaceScannerProps) {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(fullscreenMode);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [modelsReady, setModelsReady] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const enrolledDescriptorsRef = useRef<EnrolledDescriptor[]>([]);
  const lastDetectionTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  const DETECTION_INTERVAL = 200; // 5 FPS for smooth performance

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load enrolled face descriptors on mount
  useEffect(() => {
    if (user) {
      loadEnrolledDescriptors();
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
    try {
      await Haptics.impact({ style });
    } catch {}
  };

  const loadEnrolledDescriptors = async () => {
    if (!user) return;

    try {
      const { data: biometrics, error } = await supabase
        .from('contact_biometrics')
        .select(`
          profile_id,
          facial_embedding,
          profiles:profile_id (
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .not('facial_embedding', 'is', null);

      if (error) throw error;

      const descriptors: EnrolledDescriptor[] = [];
      for (const bio of biometrics || []) {
        if (bio.facial_embedding) {
          try {
            const descriptor = faceDetectionService.deserializeDescriptor(bio.facial_embedding);
            const profile = bio.profiles as { display_name?: string; avatar_url?: string } | null;
            descriptors.push({
              profileId: bio.profile_id,
              profileName: profile?.display_name || 'Unknown',
              profileAvatar: profile?.avatar_url,
              descriptor
            });
          } catch (e) {
            console.warn('Failed to deserialize descriptor for profile:', bio.profile_id);
          }
        }
      }

      enrolledDescriptorsRef.current = descriptors;
      setEnrolledCount(descriptors.length);
      console.log(`[FaceScanner] Loaded ${descriptors.length} enrolled faces`);
    } catch (error) {
      console.error('Failed to load enrolled descriptors:', error);
    }
  };

  const startScanning = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load face-api.js models
      const modelsLoaded = await faceDetectionService.loadModels();
      if (!modelsLoaded) {
        toast.error('Failed to load face detection models');
        setIsLoading(false);
        return;
      }
      setModelsReady(true);

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsScanning(true);
      setIsLoading(false);
      await triggerHaptic();

      // Start detection loop
      detectFacesLoop();
    } catch (error) {
      console.error('Camera access denied:', error);
      toast.error('Camera access denied');
      setIsLoading(false);
    }
  }, [facingMode]);

  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setDetectedFaces([]);
  }, []);

  const switchCamera = useCallback(async () => {
    await triggerHaptic();
    stopScanning();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    // Restart with new facing mode after state updates
    setTimeout(() => startScanning(), 100);
  }, [stopScanning, startScanning]);

  const detectFacesLoop = useCallback(async () => {
    const now = Date.now();
    
    // Throttle detection
    if (now - lastDetectionTimeRef.current < DETECTION_INTERVAL || isProcessingRef.current) {
      animationRef.current = requestAnimationFrame(detectFacesLoop);
      return;
    }

    if (!videoRef.current || !canvasRef.current || !isScanning || videoRef.current.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectFacesLoop);
      return;
    }

    isProcessingRef.current = true;
    lastDetectionTimeRef.current = now;

    try {
      // Draw video frame to canvas for face-api.js
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isProcessingRef.current = false;
        animationRef.current = requestAnimationFrame(detectFacesLoop);
        return;
      }
      ctx.drawImage(video, 0, 0);
      
      const faces = await faceDetectionService.detectFaces(canvas, { withDescriptors: true });
      
      const detectedWithMatches: DetectedFace[] = faces.map((face, index) => {
        let matchedProfile: DetectedFace['matchedProfile'] = undefined;
        let matchDistance: number | undefined = undefined;

        if (face.descriptor && enrolledDescriptorsRef.current.length > 0) {
          const match = faceDetectionService.findBestMatch(
            face.descriptor,
            enrolledDescriptorsRef.current.map(e => ({
              profileId: e.profileId,
              descriptor: e.descriptor
            })),
            0.6 // threshold
          );

          if (match) {
            const enrolled = enrolledDescriptorsRef.current.find(e => e.profileId === match.profileId);
            matchedProfile = {
              id: match.profileId,
              name: enrolled?.profileName || 'Unknown',
              avatar: enrolled?.profileAvatar
            };
            matchDistance = match.distance;
            
            // Trigger haptic on new high-confidence match
            if (match.confidence >= 0.85) {
              triggerHaptic(ImpactStyle.Heavy);
            }
          }
        }

        return {
          id: `face-${index}-${Date.now()}`,
          boundingBox: {
            x: face.normalizedBox.x * 100,
            y: face.normalizedBox.y * 100,
            width: face.normalizedBox.width * 100,
            height: face.normalizedBox.height * 100
          },
          confidence: face.confidence,
          matchedProfile,
          matchDistance
        };
      });

      setDetectedFaces(detectedWithMatches);

      // Notify callbacks
      detectedWithMatches.forEach(face => {
        onFaceDetected?.(face);
        if (face.matchedProfile) {
          onProfileMatch?.(face.matchedProfile.id);
        }
      });
    } catch (error) {
      console.error('Face detection error:', error);
    }

    isProcessingRef.current = false;
    animationRef.current = requestAnimationFrame(detectFacesLoop);
  }, [isScanning, onFaceDetected, onProfileMatch]);

  const handleProfileClick = (profileId: string) => {
    onProfileMatch?.(profileId);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'border-emerald-400 shadow-emerald-400/30';
    if (confidence >= 0.6) return 'border-amber-400 shadow-amber-400/30';
    return 'border-red-400 shadow-red-400/30';
  };

  const getConfidenceBadgeVariant = (confidence: number): 'default' | 'secondary' | 'destructive' => {
    if (confidence >= 0.85) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  // Mobile fullscreen mode
  if (isMobile && isFullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Camera View */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Face Detection Overlays */}
            <AnimatePresence>
              {detectedFaces.map((face) => (
                <motion.div
                  key={face.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "absolute border-2 rounded-lg shadow-lg",
                    getConfidenceColor(face.matchedProfile ? 0.9 : face.confidence)
                  )}
                  style={{
                    left: `${face.boundingBox.x}%`,
                    top: `${face.boundingBox.y}%`,
                    width: `${face.boundingBox.width}%`,
                    height: `${face.boundingBox.height}%`,
                  }}
                >
                  {face.matchedProfile && (
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur rounded-xl p-2 flex items-center gap-2 whitespace-nowrap shadow-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={face.matchedProfile.avatar} />
                        <AvatarFallback className="text-xs">{face.matchedProfile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{face.matchedProfile.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round((1 - (face.matchDistance || 0)) * 100)}% match
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { stopScanning(); setIsFullscreen(false); }}
                className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
              >
                <X className="h-6 w-6" />
              </Button>
              
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-4 py-2">
                {isScanning ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-white text-sm">{detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''}</span>
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="text-white text-sm">Loading...</span>
                  </>
                ) : (
                  <span className="text-white/60 text-sm">Ready</span>
                )}
              </div>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={switchCamera}
                disabled={!isScanning}
                className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
              >
                <SwitchCamera className="h-6 w-6" />
              </Button>
            </div>

            {/* Enrolled Count Badge */}
            <div className="absolute bottom-4 left-4">
              <Badge variant="secondary" className="bg-black/60 backdrop-blur">
                <Zap className="w-3 h-3 mr-1" />
                {enrolledCount} enrolled
              </Badge>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-black/90 backdrop-blur-lg p-6 pb-8">
            <div className="flex justify-center">
              {isScanning ? (
                <Button 
                  size="lg"
                  variant="destructive" 
                  onClick={stopScanning}
                  className="h-16 px-10 rounded-full"
                >
                  <X className="h-5 w-5 mr-2" />
                  Stop Scanning
                </Button>
              ) : (
                <Button 
                  size="lg"
                  onClick={startScanning}
                  disabled={isLoading}
                  className="h-16 px-10 rounded-full bg-amber-500 hover:bg-amber-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 mr-2" />
                  )}
                  Start Scanning
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop/Card mode
  return (
    <Card className={cn(
      "border-border/50 overflow-hidden",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Live Face Scanner
            {modelsReady && (
              <Badge variant="outline" className="text-[10px] h-5">
                <Zap className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isScanning ? 'default' : 'secondary'}>
              {isLoading ? 'Loading...' : isScanning ? `Scanning (${detectedFaces.length})` : 'Ready'}
            </Badge>
            {isScanning && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={switchCamera}
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera View */}
        <div className={cn(
          "relative bg-black rounded-lg overflow-hidden",
          isFullscreen ? "h-[60vh]" : "aspect-video"
        )}>
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Face Detection Overlays */}
              <AnimatePresence>
                {detectedFaces.map((face) => (
                  <motion.div
                    key={face.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "absolute border-2 rounded-lg",
                      face.matchedProfile ? "border-emerald-400" : "border-amber-400"
                    )}
                    style={{
                      left: `${face.boundingBox.x}%`,
                      top: `${face.boundingBox.y}%`,
                      width: `${face.boundingBox.width}%`,
                      height: `${face.boundingBox.height}%`,
                    }}
                  >
                    {face.matchedProfile && (
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur rounded-lg p-2 flex items-center gap-2 whitespace-nowrap">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={face.matchedProfile.avatar} />
                          <AvatarFallback>{face.matchedProfile.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{face.matchedProfile.name}</span>
                        <Badge className="text-[10px] h-4" variant={getConfidenceBadgeVariant(1 - (face.matchDistance || 0))}>
                          {Math.round((1 - (face.matchDistance || 0)) * 100)}%
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Scanning Indicator */}
              <div className="absolute top-2 left-2">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-2 bg-background/80 backdrop-blur rounded-full px-3 py-1"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs">Scanning</span>
                </motion.div>
              </div>

              {/* Enrolled count */}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                  {enrolledCount} enrolled
                </Badge>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="h-12 w-12 mb-3 animate-spin opacity-50" />
                  <p className="text-sm">Loading face detection models...</p>
                </>
              ) : (
                <>
                  <Camera className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">Tap Start to begin scanning</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{enrolledCount} faces enrolled for matching</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isScanning ? (
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={stopScanning}
            >
              <X className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button 
              className="flex-1"
              onClick={startScanning}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Start Scanning
            </Button>
          )}
          {isMobile && !isScanning && (
            <Button
              variant="outline"
              onClick={() => { setIsFullscreen(true); startScanning(); }}
              disabled={isLoading}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Detected Faces List */}
        {detectedFaces.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Detected ({detectedFaces.length})</p>
            {detectedFaces.map((face) => (
              <div
                key={face.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {face.matchedProfile ? (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={face.matchedProfile.avatar} />
                        <AvatarFallback>{face.matchedProfile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{face.matchedProfile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((1 - (face.matchDistance || 0)) * 100)}% match
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Unknown</p>
                        <p className="text-xs text-muted-foreground">No match found</p>
                      </div>
                    </>
                  )}
                </div>
                {face.matchedProfile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleProfileClick(face.matchedProfile!.id)}
                  >
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
