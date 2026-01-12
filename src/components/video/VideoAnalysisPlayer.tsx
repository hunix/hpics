/**
 * Video Analysis Player Component
 * 
 * Extends video preview with face detection overlay and analysis controls.
 * Used for post-recording video analysis to extract faces and build profiles.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, Pause, SkipBack, SkipForward, Users, Scan, 
  Download, CheckCircle2, AlertCircle, Loader2,
  Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { 
  analyzeVideo, 
  VideoAnalysisResult, 
  FaceCluster,
  getBestEnrollmentFrames 
} from '@/lib/videoFrameAnalyzer';
import { cn } from '@/lib/utils';

interface VideoAnalysisPlayerProps {
  videoUrl: string;
  onAnalysisComplete?: (result: VideoAnalysisResult) => void;
  onClusterSelect?: (cluster: FaceCluster) => void;
  autoAnalyze?: boolean;
  className?: string;
}

export function VideoAnalysisPlayer({
  videoUrl,
  onAnalysisComplete,
  onClusterSelect,
  autoAnalyze = false,
  className,
}: VideoAnalysisPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ stage: string; progress: number } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<FaceCluster | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  // Video metadata
  const [videoMeta, setVideoMeta] = useState<{ width: number; height: number } | null>(null);

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoMeta({ width: video.videoWidth, height: video.videoHeight });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl]);

  // Auto-analyze on load
  useEffect(() => {
    if (autoAnalyze && videoUrl && !analysisResult && !isAnalyzing) {
      handleAnalyze();
    }
  }, [autoAnalyze, videoUrl]);

  // Draw overlay when cluster is selected
  useEffect(() => {
    if (!selectedCluster || !showOverlay || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Find faces at current time
    const currentFaces = selectedCluster.faces.filter(
      f => Math.abs(f.frameTimestamp - currentTime) < 0.5
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale factor for display
    const scaleX = canvas.width / (videoMeta?.width || canvas.width);
    const scaleY = canvas.height / (videoMeta?.height || canvas.height);

    currentFaces.forEach(face => {
      const box = face.detection.box;
      
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        box.x * scaleX,
        box.y * scaleY,
        box.width * scaleX,
        box.height * scaleY
      );

      // Label
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(
        `Quality: ${Math.round(face.quality * 100)}%`,
        box.x * scaleX,
        box.y * scaleY - 5
      );
    });
  }, [selectedCluster, currentTime, showOverlay, videoMeta]);

  // Playback controls
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value[0];
    setVolume(value[0]);
  }, []);

  const skipToTime = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(video.currentTime);
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  // Analysis
  const handleAnalyze = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisProgress({ stage: 'Initializing', progress: 0 });

    try {
      const result = await analyzeVideo(
        videoUrl,
        { targetFPS: 2, maxFrames: 200 },
        (stage, progress) => setAnalysisProgress({ stage, progress })
      );

      setAnalysisResult(result);
      onAnalysisComplete?.(result);

      // Auto-select first cluster if available
      if (result.clusters.length > 0) {
        setSelectedCluster(result.clusters[0]);
      }
    } catch (error) {
      console.error('[VideoAnalysis] Failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  }, [videoUrl, isAnalyzing, onAnalysisComplete]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Video Player */}
      <div 
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-black group"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          muted={isMuted}
          playsInline
          crossOrigin="anonymous"
        />
        
        {/* Overlay canvas */}
        {showOverlay && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* Large play button overlay */}
        {!isPlaying && !isAnalyzing && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-10 h-10 text-primary-foreground ml-1" />
            </div>
          </div>
        )}

        {/* Analysis progress overlay */}
        {isAnalyzing && analysisProgress && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-white font-medium mb-2">{analysisProgress.stage}</p>
            <div className="w-48">
              <Progress value={analysisProgress.progress * 100} className="h-2" />
            </div>
            <p className="text-white/70 text-sm mt-2">
              {Math.round(analysisProgress.progress * 100)}%
            </p>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress bar */}
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="mb-3"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => skipToTime(currentTime - 10)}
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => skipToTime(currentTime + 10)}
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Volume */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Scan className="w-4 h-4" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
        </Button>

        {analysisResult && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {analysisResult.uniqueFaces} {analysisResult.uniqueFaces === 1 ? 'Person' : 'People'}
            </Badge>
            <Badge variant="outline">
              {analysisResult.processedFrames} frames
            </Badge>
            <Badge variant="outline">
              {Math.round(analysisResult.processingTimeMs / 1000)}s
            </Badge>
          </div>
        )}
      </div>

      {/* Face Clusters */}
      {analysisResult && analysisResult.clusters.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Detected Faces
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              <div className="p-3 space-y-2">
                {analysisResult.clusters.map((cluster, index) => (
                  <div
                    key={cluster.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                      selectedCluster?.id === cluster.id 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted'
                    )}
                    onClick={() => {
                      setSelectedCluster(cluster);
                      onClusterSelect?.(cluster);
                      // Jump to first appearance
                      skipToTime(cluster.firstSeen);
                    }}
                  >
                    {/* Thumbnail placeholder */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        Person {index + 1}
                        {cluster.matchedProfileId && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Matched
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cluster.frameCount} appearances • 
                        {cluster.averageAge && ` ~${cluster.averageAge}yo`}
                        {cluster.gender && ` • ${cluster.gender}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(cluster.firstSeen)} - {formatTime(cluster.lastSeen)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipToTime(cluster.firstSeen);
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipToTime(cluster.lastSeen);
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VideoAnalysisPlayer;
