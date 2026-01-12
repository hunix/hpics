import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Image, Video, X, Send, Loader2, SwitchCamera, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickMediaCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (mediaUrl?: string, mediaType?: 'photo' | 'video') => void;
  profileId?: string;
}

export function QuickMediaCapture({ 
  open, 
  onOpenChange, 
  onComplete,
  profileId 
}: QuickMediaCaptureProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'photo' | 'video' | 'upload'>('photo');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ blob: Blob; url: string; type: 'photo' | 'video' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera when dialog opens
  useEffect(() => {
    if (open && mode !== 'upload') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, mode, facingMode]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      if (capturedMedia?.url) URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
    }
  }, [open]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: mode === 'video'
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera');
    }
  }, [facingMode, mode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setIsRecordingVideo(false);
  }, []);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

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
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const startVideoRecording = useCallback(() => {
    if (!streamRef.current) return;

    videoChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);
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
  }, [stopCamera]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVideo(false);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Please select an image or video file');
      return;
    }

    const url = URL.createObjectURL(file);
    setCapturedMedia({ 
      blob: file, 
      url, 
      type: isVideo ? 'video' : 'photo' 
    });
  }, []);

  const discardCapture = useCallback(() => {
    if (capturedMedia?.url) URL.revokeObjectURL(capturedMedia.url);
    setCapturedMedia(null);
    if (mode !== 'upload') {
      startCamera();
    }
  }, [capturedMedia, mode, startCamera]);

  const saveMedia = useCallback(async () => {
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

      // Create media record
      const { error: insertError } = await supabase
        .from('media')
        .insert([{
          user_id: user.id,
          profile_id: profileId || null,
          file_url: publicUrl,
          storage_path: filePath,
          mime_type: capturedMedia.blob.type,
          file_size: capturedMedia.blob.size,
          caption: `${capturedMedia.type === 'photo' ? 'Photo' : 'Video'} captured on ${new Date().toLocaleDateString()}`
        }]);

      if (insertError) throw insertError;

      toast.success(`${capturedMedia.type === 'photo' ? 'Photo' : 'Video'} saved!`);
      onComplete?.(publicUrl, capturedMedia.type);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error('Failed to save media');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedMedia, user, profileId, onComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Quick Capture
          </DialogTitle>
          <DialogDescription>
            Capture photos or videos for AI analysis
          </DialogDescription>
        </DialogHeader>

        {!capturedMedia && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="photo" className="gap-1.5">
                <Image className="h-4 w-4" />
                Photo
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-1.5">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1.5">
                <Zap className="h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="mt-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {isCapturing && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={switchCamera}
                      className="h-10 w-10 rounded-full"
                    >
                      <SwitchCamera className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={capturePhoto}
                      className="h-16 w-16 rounded-full bg-white hover:bg-gray-100"
                    >
                      <div className="h-12 w-12 rounded-full border-4 border-gray-300" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {isCapturing && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={switchCamera}
                      className="h-10 w-10 rounded-full"
                    >
                      <SwitchCamera className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                      className={cn(
                        "h-16 w-16 rounded-full",
                        isRecordingVideo ? "bg-red-500 hover:bg-red-600" : "bg-white hover:bg-gray-100"
                      )}
                    >
                      {isRecordingVideo ? (
                        <div className="h-6 w-6 rounded-sm bg-white" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-red-500" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div 
                className="aspect-video border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Click to upload an image or video</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Preview captured media */}
        {capturedMedia && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {capturedMedia.type === 'photo' ? (
              <img src={capturedMedia.url} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <video src={capturedMedia.url} controls className="w-full h-full object-contain" />
            )}
            <Button
              size="icon"
              variant="destructive"
              onClick={discardCapture}
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {capturedMedia && (
            <Button onClick={saveMedia} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Save & Analyze
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
