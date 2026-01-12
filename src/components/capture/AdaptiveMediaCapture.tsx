/**
 * AdaptiveMediaCapture - Mobile-native full-screen capture for Samsung S25 Ultra
 * Detects device and renders appropriate UI (full-screen on mobile, dialog on desktop)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, X, SwitchCamera, Image, Save, Sparkles, Loader2, Check, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { QuickMediaCapture } from './QuickMediaCapture';

interface AdaptiveMediaCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (mediaUrl?: string, mediaType?: 'photo' | 'video') => void;
  profileId?: string;
}

export function AdaptiveMediaCapture(props: AdaptiveMediaCaptureProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return <QuickMediaCapture {...props} />;
  }

  return <MobileMediaCapture {...props} />;
}

function MobileMediaCapture({ 
  open, 
  onOpenChange, 
  onComplete,
  profileId 
}: AdaptiveMediaCaptureProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ blob: Blob; url: string; type: 'photo' | 'video' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_VIDEO_DURATION = 60;

  useEffect(() => {
    if (open) {
      startCamera();
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      stopCamera();
      document.body.style.overflow = '';
    };
  }, [open, facingMode]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      if (capturedMedia?.url) URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
      setRecordingDuration(0);
    }
  }, [open]);

  useEffect(() => {
    if (recordingDuration >= MAX_VIDEO_DURATION && isRecordingVideo) {
      stopVideoRecording();
      triggerHaptic();
      toast.info(`Maximum ${MAX_VIDEO_DURATION}s reached`);
    }
  }, [recordingDuration, isRecordingVideo]);

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: mode === 'video'
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera access denied');
    }
  }, [facingMode, mode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsCapturing(false);
    setIsRecordingVideo(false);
  }, []);

  const switchCamera = useCallback(async () => {
    await triggerHaptic();
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    await triggerHaptic();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ blob, url, type: 'photo' });
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  }, [stopCamera]);

  const startVideoRecording = useCallback(async () => {
    if (!streamRef.current) return;
    await triggerHaptic();

    videoChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        videoChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ blob, url, type: 'video' });
      stopCamera();
    };

    mediaRecorder.start(100);
    setIsRecordingVideo(true);
    setRecordingDuration(0);
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  }, [stopCamera]);

  const stopVideoRecording = useCallback(async () => {
    await triggerHaptic();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVideo(false);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Select an image or video');
      return;
    }

    const url = URL.createObjectURL(file);
    setCapturedMedia({ blob: file, url, type: isVideo ? 'video' : 'photo' });
    stopCamera();
  }, [stopCamera]);

  const discardCapture = useCallback(async () => {
    await triggerHaptic();
    if (capturedMedia?.url) URL.revokeObjectURL(capturedMedia.url);
    setCapturedMedia(null);
    startCamera();
  }, [capturedMedia, startCamera]);

  const saveMedia = useCallback(async (withAnalysis: boolean = false) => {
    if (!capturedMedia || !user) return;

    setIsProcessing(true);
    try {
      const extension = capturedMedia.type === 'photo' ? 'jpg' : 'webm';
      const fileName = `${capturedMedia.type}-${Date.now()}.${extension}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, capturedMedia.blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('media')
        .insert([{
          user_id: user.id,
          profile_id: profileId || null,
          file_url: publicUrl,
          storage_path: filePath,
          mime_type: capturedMedia.blob.type,
          file_size: capturedMedia.blob.size,
          caption: `${capturedMedia.type === 'photo' ? 'Photo' : 'Video'} - ${new Date().toLocaleDateString()}`,
          processing_status: withAnalysis ? 'pending' : 'completed'
        }]);

      if (insertError) throw insertError;

      await triggerHaptic();
      toast.success(withAnalysis ? 'Saved! Analysis started...' : 'Saved!');
      onComplete?.(publicUrl, capturedMedia.type);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error('Failed to save');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedMedia, user, profileId, onComplete, onOpenChange]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open) return null;

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
          {!capturedMedia ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Top Bar */}
              <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
                >
                  <X className="h-6 w-6" />
                </Button>
                
                {isRecordingVideo && (
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-4 py-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white font-mono">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                )}
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={switchCamera}
                  disabled={isRecordingVideo}
                  className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
                >
                  <SwitchCamera className="h-6 w-6" />
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              {capturedMedia.type === 'photo' ? (
                <img src={capturedMedia.url} alt="Captured" className="w-full h-full object-contain" />
              ) : (
                <video src={capturedMedia.url} controls className="w-full h-full object-contain" />
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-black/90 backdrop-blur-lg p-6 pb-8">
          {!capturedMedia ? (
            <>
              {/* Mode Selector */}
              <div className="flex justify-center gap-8 mb-6">
                <button
                  onClick={() => setMode('photo')}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    mode === 'photo' ? 'text-amber-400' : 'text-white/60'
                  )}
                >
                  PHOTO
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    mode === 'video' ? 'text-amber-400' : 'text-white/60'
                  )}
                >
                  VIDEO
                </button>
              </div>

              {/* Capture Controls */}
              <div className="flex items-center justify-center gap-8">
                {/* Gallery Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center"
                >
                  <Upload className="h-6 w-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Main Capture Button */}
                {mode === 'photo' ? (
                  <button
                    onClick={capturePhoto}
                    disabled={!isCapturing}
                    className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <div className="h-16 w-16 rounded-full bg-white" />
                  </button>
                ) : (
                  <button
                    onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                    disabled={!isCapturing}
                    className={cn(
                      "h-20 w-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-all",
                      isRecordingVideo && "border-red-500"
                    )}
                  >
                    {isRecordingVideo ? (
                      <div className="h-8 w-8 rounded-md bg-red-500" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-red-500" />
                    )}
                  </button>
                )}

                {/* Placeholder for symmetry */}
                <div className="h-12 w-12" />
              </div>
            </>
          ) : (
            /* Preview Actions */
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={discardCapture}
                className="flex-1 h-14 rounded-xl border-white/20 text-white bg-white/10"
              >
                <X className="h-5 w-5 mr-2" />
                Retake
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => saveMedia(false)}
                disabled={isProcessing}
                className="flex-1 h-14 rounded-xl"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                size="lg"
                onClick={() => saveMedia(true)}
                disabled={isProcessing}
                className="flex-1 h-14 rounded-xl bg-amber-500 hover:bg-amber-600"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
