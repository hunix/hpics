/**
 * LiveFaceScanner - Real-time camera face detection and identification
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, X, Check, AlertCircle, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DetectedFace {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  matchedProfile?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface LiveFaceScannerProps {
  className?: string;
  onFaceDetected?: (face: DetectedFace) => void;
  onProfileMatch?: (profileId: string) => void;
}

export function LiveFaceScanner({ className, onFaceDetected, onProfileMatch }: LiveFaceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsScanning(true);

      // Simulate face detection
      setTimeout(() => {
        const mockFace: DetectedFace = {
          id: crypto.randomUUID(),
          boundingBox: { x: 30, y: 20, width: 40, height: 50 },
          confidence: 0.92,
          matchedProfile: {
            id: 'mock-profile',
            name: 'John Smith',
            avatar: undefined
          }
        };
        setDetectedFaces([mockFace]);
        onFaceDetected?.(mockFace);
      }, 2000);
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  }, [onFaceDetected]);

  const stopScanning = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setDetectedFaces([]);
  }, []);

  const handleProfileClick = (profileId: string) => {
    onProfileMatch?.(profileId);
  };

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
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isScanning ? 'default' : 'secondary'}>
              {isScanning ? 'Scanning' : 'Ready'}
            </Badge>
            {isScanning && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
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
              
              {/* Face Detection Overlays */}
              <AnimatePresence>
                {detectedFaces.map((face) => (
                  <motion.div
                    key={face.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute border-2 border-emerald-400 rounded-lg"
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
                        <Badge className="text-[10px] h-4">
                          {Math.round(face.confidence * 100)}%
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
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs">Scanning</span>
                </motion.div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Tap Start to begin scanning</p>
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
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
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
                          {Math.round(face.confidence * 100)}% match
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
