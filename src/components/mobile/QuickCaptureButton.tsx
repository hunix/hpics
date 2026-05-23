import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Upload, User, FileText, Image, Mic, Video, Sparkles, StopCircle, Square, Grid3X3, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { takePhoto, hapticFeedback, isNativePlatform } from '@/lib/nativeFeatures';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickCaptureButtonProps {
  profileId?: string;
  onCapture?: (imageUrl: string) => void;
  className?: string;
}

type CaptureType = 'profile_photo' | 'document' | 'media' | 'voice_memo' | 'video';
type CaptureMode = 'photo' | 'video' | 'voice' | 'batch';

interface BatchPhoto {
  id: string;
  dataUrl: string;
  blob?: Blob;
}

const MAX_VIDEO_DURATION = 30; // seconds
const MAX_VOICE_DURATION = 120; // seconds
const MAX_BATCH_PHOTOS = 10;

export function QuickCaptureButton({ profileId, onCapture, className }: QuickCaptureButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isModeSelect, setIsModeSelect] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [captureType, setCaptureType] = useState<CaptureType>('media');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  
  // Batch capture state
  const [batchPhotos, setBatchPhotos] = useState<BatchPhoto[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleModeSelect = async (mode: CaptureMode) => {
    setIsModeSelect(false);
    setCaptureMode(mode);
    
    if (mode === 'photo') {
      await handlePhotoCapture();
    } else if (mode === 'video') {
      await handleVideoCapture();
    } else if (mode === 'voice') {
      await handleVoiceCapture();
    } else if (mode === 'batch') {
      await handleBatchCapture();
    }
  };

  const handleCapture = async () => {
    await hapticFeedback('medium');
    await handlePhotoCapture();
  };

  const handleLongPress = async () => {
    await hapticFeedback('heavy');
    setIsModeSelect(true);
    setIsOpen(true);
  };

  const handlePhotoCapture = async () => {
    setIsCapturing(true);
    
    try {
      const imageData = await takePhoto();
      if (imageData) {
        setCapturedImage(imageData);
        setCaptureType('media');
        setIsOpen(true);
        setIsModeSelect(false);
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleBatchCapture = async () => {
    setIsBatchMode(true);
    setBatchPhotos([]);
    setCaptureType('media');
    setIsOpen(true);
    setIsModeSelect(false);
    await addPhotoBatch();
  };

  const addPhotoBatch = async () => {
    if (batchPhotos.length >= MAX_BATCH_PHOTOS) {
      toast.error(`Maximum ${MAX_BATCH_PHOTOS} photos per batch`);
      return;
    }
    
    setIsCapturing(true);
    try {
      const imageData = await takePhoto();
      if (imageData) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        setBatchPhotos(prev => [...prev, {
          id: `batch-${Date.now()}`,
          dataUrl: imageData,
          blob,
        }]);
        
        await hapticFeedback('light');
      }
    } catch (error) {
      console.error('Batch capture error:', error);
      toast.error('Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const removeFromBatch = (id: string) => {
    setBatchPhotos(prev => prev.filter(p => p.id !== id));
    hapticFeedback('light');
  };

  const handleVideoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      streamRef.current = stream;
      
      // Show video preview
      setCaptureType('video');
      setIsOpen(true);
      setIsModeSelect(false);
      
      // Wait for dialog to open and video element to be available
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
        startVideoRecording(stream);
      }, 100);
      
    } catch (error) {
      console.error('Video capture error:', error);
      toast.error('Failed to access camera');
    }
  };

  const startVideoRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setCapturedBlob(blob);
      setCapturedImage(URL.createObjectURL(blob));
      setIsRecording(false);
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // Collect data every second
    setIsRecording(true);
    setRecordingDuration(0);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= MAX_VIDEO_DURATION - 1) {
          stopRecording();
          return MAX_VIDEO_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    
    hapticFeedback('light');
  };

  const handleVoiceCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      setCaptureType('voice_memo');
      setIsOpen(true);
      setIsModeSelect(false);
      
      // Start recording immediately
      startVoiceRecording(stream);
      
    } catch (error) {
      console.error('Voice capture error:', error);
      toast.error('Failed to access microphone');
    }
  };

  const startVoiceRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setCapturedBlob(blob);
      setCapturedImage(URL.createObjectURL(blob));
      setIsRecording(false);
      
      stream.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
    setRecordingDuration(0);
    
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= MAX_VOICE_DURATION - 1) {
          stopRecording();
          return MAX_VOICE_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    
    hapticFeedback('light');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!capturedImage && !capturedBlob) return;
    
    await hapticFeedback('light');
    setIsSaving(true);
    
    try {
      let blob: Blob;
      let fileName: string;
      let mimeType: string;
      
      if (captureType === 'video' && capturedBlob) {
        blob = capturedBlob;
        fileName = `video-${Date.now()}.webm`;
        mimeType = 'video/webm';
      } else if (captureType === 'voice_memo' && capturedBlob) {
        blob = capturedBlob;
        fileName = `voice-${Date.now()}.webm`;
        mimeType = capturedBlob.type || 'audio/webm';
      } else if (capturedImage) {
        const response = await fetch(capturedImage);
        blob = await response.blob();
        fileName = `quick-capture-${Date.now()}.jpg`;
        mimeType = 'image/jpeg';
      } else {
        throw new Error('No captured content');
      }
      
      const timestamp = Date.now();
      let storagePath = '';
      
      switch (captureType) {
        case 'profile_photo':
          storagePath = `${user.id}/${profileId || 'general'}/profile/${fileName}`;
          break;
        case 'document':
          storagePath = `${user.id}/${profileId || 'general'}/documents/${fileName}`;
          break;
        case 'video':
          storagePath = `${user.id}/${profileId || 'general'}/videos/${fileName}`;
          break;
        case 'voice_memo':
          storagePath = `${user.id}/${profileId || 'general'}/audio/${fileName}`;
          break;
        default:
          storagePath = `${user.id}/${profileId || 'general'}/media/${fileName}`;
      }
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, blob, {
          contentType: mimeType,
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);
      
      // Create media record
      let mediaRecord = null;
      if (profileId) {
        const { data: insertedMedia, error: mediaError } = await supabase
          .from('media')
          .insert([{
            user_id: user.id,
            profile_id: profileId,
            file_url: publicUrl,
            mime_type: mimeType,
            storage_path: data.path,
            caption: `Quick capture - ${captureType}`
          }])
          .select()
          .single();
        
        if (mediaError) throw mediaError;
        mediaRecord = insertedMedia;
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['contact-media', profileId] });
        queryClient.invalidateQueries({ queryKey: ['contact-media-count', profileId] });
        queryClient.invalidateQueries({ queryKey: ['contact', profileId] });
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        
        // Queue appropriate analysis based on capture type
        if (autoAnalyze && mediaRecord) {
          if (captureType === 'profile_photo') {
            await supabase.from('enrichment_queue').insert({
              user_id: user.id,
              profile_id: profileId,
              enrichment_type: 'facial_biometrics',
              source_type: 'media',
              source_id: mediaRecord.id,
              priority: 10,
              status: 'pending',
              scheduled_for: new Date().toISOString(),
            });
            toast.success('Photo saved - Facial analysis queued', {
              description: 'AI will analyze biometrics shortly'
            });
          } else if (captureType === 'document') {
            await supabase.from('enrichment_queue').insert({
              user_id: user.id,
              profile_id: profileId,
              enrichment_type: 'document_ocr',
              source_type: 'media',
              source_id: mediaRecord.id,
              priority: 8,
              status: 'pending',
              scheduled_for: new Date().toISOString(),
            });
            toast.success('Document saved - OCR queued', {
              description: 'Text extraction will begin shortly'
            });
          } else if (captureType === 'video') {
            // Queue video for body language + vocal analysis
            await supabase.from('enrichment_queue').insert([
              {
                user_id: user.id,
                profile_id: profileId,
                enrichment_type: 'body_language',
                source_type: 'media',
                source_id: mediaRecord.id,
                priority: 7,
                status: 'pending',
                scheduled_for: new Date().toISOString(),
              },
              {
                user_id: user.id,
                profile_id: profileId,
                enrichment_type: 'vocal_analysis',
                source_type: 'media',
                source_id: mediaRecord.id,
                priority: 7,
                status: 'pending',
                scheduled_for: new Date().toISOString(),
              }
            ]);
            toast.success('Video saved - Analysis queued', {
              description: 'Body language & vocal analysis will begin shortly'
            });
          } else if (captureType === 'voice_memo') {
            // Queue for transcription + vocal biometrics
            await supabase.from('enrichment_queue').insert([
              {
                user_id: user.id,
                profile_id: profileId,
                enrichment_type: 'transcription',
                source_type: 'media',
                source_id: mediaRecord.id,
                priority: 9,
                status: 'pending',
                scheduled_for: new Date().toISOString(),
              },
              {
                user_id: user.id,
                profile_id: profileId,
                enrichment_type: 'voice_biometrics',
                source_type: 'media',
                source_id: mediaRecord.id,
                priority: 7,
                status: 'pending',
                scheduled_for: new Date().toISOString(),
              }
            ]);
            toast.success('Voice memo saved - Transcription queued', {
              description: 'AI will transcribe & analyze shortly'
            });
          } else {
            toast.success('Media saved successfully');
          }
        } else {
          toast.success('Saved successfully');
        }
      } else {
        toast.success('Saved successfully');
      }
      
      onCapture?.(publicUrl);
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopRecording();
    setIsOpen(false);
    setCapturedImage(null);
    setCapturedBlob(null);
    setCaptureType('media');
    setIsModeSelect(false);
    setRecordingDuration(0);
    setIsBatchMode(false);
    setBatchPhotos([]);
  };

  const handleSaveBatch = async () => {
    if (!user || batchPhotos.length === 0) return;
    
    await hapticFeedback('light');
    setIsSaving(true);
    
    try {
      const savedMediaIds: string[] = [];
      
      for (let i = 0; i < batchPhotos.length; i++) {
        const photo = batchPhotos[i];
        const blob: Blob = photo.blob ?? (await (await fetch(photo.dataUrl)).blob());
        const fileName = `batch-${Date.now()}-${i}.jpg`;
        const storagePath = `${user.id}/${profileId || 'general'}/media/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('media')
          .upload(storagePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (error) {
          console.error(`Failed to upload photo ${i}:`, error);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(data.path);
        
        if (profileId) {
          const { data: mediaRecord, error: mediaError } = await supabase
            .from('media')
            .insert([{
              user_id: user.id,
              profile_id: profileId,
              file_url: publicUrl,
              mime_type: 'image/jpeg',
              storage_path: data.path,
              caption: `Batch capture ${i + 1}/${batchPhotos.length}`
            }])
            .select()
            .single();
          
          if (!mediaError && mediaRecord) {
            savedMediaIds.push(mediaRecord.id);
            
            // Queue for facial analysis if auto-analyze is on
            if (autoAnalyze) {
              await supabase.from('enrichment_queue').insert({
                user_id: user.id,
                profile_id: profileId,
                enrichment_type: 'facial_biometrics',
                source_type: 'media',
                source_id: mediaRecord.id,
                priority: 8,
                status: 'pending',
                scheduled_for: new Date().toISOString(),
              });
            }
          }
        }
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['contact-media', profileId] });
      queryClient.invalidateQueries({ queryKey: ['contact-media-count', profileId] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      toast.success(`Saved ${savedMediaIds.length} photos`, {
        description: autoAnalyze ? 'Facial analysis queued for all photos' : undefined
      });
      
      handleClose();
    } catch (error) {
      console.error('Batch save error:', error);
      toast.error('Failed to save batch');
    } finally {
      setIsSaving(false);
    }
  };

  const maxDuration = captureType === 'video' ? MAX_VIDEO_DURATION : MAX_VOICE_DURATION;
  const progressPercent = (recordingDuration / maxDuration) * 100;

  return (
    <>
      <Button
        size="icon"
        variant="default"
        className={cn(
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:hidden",
          "bg-primary hover:bg-primary/90",
          className
        )}
        onClick={handleCapture}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
        disabled={isCapturing}
      >
        <Camera className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isModeSelect ? 'Capture Mode' : isBatchMode ? `Batch Capture (${batchPhotos.length}/${MAX_BATCH_PHOTOS})` : isRecording ? 'Recording...' : 'Quick Capture'}
            </DialogTitle>
          </DialogHeader>
          
          {isModeSelect ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-6"
                onClick={() => handleModeSelect('photo')}
              >
                <Camera className="h-8 w-8" />
                <span>Photo</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-6"
                onClick={() => handleModeSelect('video')}
              >
                <Video className="h-8 w-8" />
                <span>Video</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-6"
                onClick={() => handleModeSelect('voice')}
              >
                <Mic className="h-8 w-8" />
                <span>Voice</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-6"
                onClick={() => handleModeSelect('batch')}
              >
                <Grid3X3 className="h-8 w-8" />
                <span>Batch</span>
              </Button>
            </div>
          ) : isBatchMode ? (
            <div className="space-y-4">
              {/* Batch photo grid */}
              {batchPhotos.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-3 gap-2">
                    {batchPhotos.map((photo, index) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img 
                          src={photo.dataUrl} 
                          alt={`Batch ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFromBatch(photo.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Badge className="absolute bottom-1 left-1 text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Grid3X3 className="h-12 w-12 mb-2 opacity-50" />
                  <p>No photos captured yet</p>
                </div>
              )}
              
              {/* Add more button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={addPhotoBatch}
                disabled={isCapturing || batchPhotos.length >= MAX_BATCH_PHOTOS}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCapturing ? 'Capturing...' : `Add Photo (${batchPhotos.length}/${MAX_BATCH_PHOTOS})`}
              </Button>
              
              {/* Auto-analyze toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm">Auto-analyze with AI</span>
                </div>
                <Button
                  variant={autoAnalyze ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoAnalyze(!autoAnalyze)}
                >
                  {autoAnalyze ? 'On' : 'Off'}
                </Button>
              </div>
              
              {/* Save/Cancel buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSaveBatch} 
                  disabled={isSaving || batchPhotos.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : `Save ${batchPhotos.length} Photos`}
                </Button>
              </div>
            </div>
          ) : isRecording ? (
            <div className="space-y-4 py-4">
              {captureType === 'video' && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <video 
                    ref={videoPreviewRef}
                    autoPlay 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <Badge variant="destructive">REC</Badge>
                  </div>
                </div>
              )}
              
              {captureType === 'voice_memo' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <Mic className="h-16 w-16 text-primary animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                  </div>
                  <p className="text-lg font-mono mt-4">{formatDuration(recordingDuration)}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatDuration(recordingDuration)}</span>
                  <span>Max: {formatDuration(maxDuration)}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 mr-2 fill-current" />
                Stop Recording
              </Button>
            </div>
          ) : capturedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                {captureType === 'video' ? (
                  <video 
                    src={capturedImage}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : captureType === 'voice_memo' ? (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                    <audio src={capturedImage} controls className="w-full max-w-xs" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Duration: {formatDuration(recordingDuration)}
                    </p>
                  </div>
                ) : (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                )}
                {autoAnalyze && (
                  <Badge className="absolute top-2 right-2 bg-primary/80">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-analyze
                  </Badge>
                )}
              </div>
              
              {/* Type selection - only for photos */}
              {(captureType !== 'video' && captureType !== 'voice_memo') && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Save as:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={captureType === 'profile_photo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCaptureType('profile_photo')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-xs">Profile</span>
                    </Button>
                    <Button
                      variant={captureType === 'document' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCaptureType('document')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-xs">Document</span>
                    </Button>
                    <Button
                      variant={captureType === 'media' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCaptureType('media')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Image className="h-4 w-4" />
                      <span className="text-xs">Media</span>
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Auto-analyze toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm">Auto-analyze with AI</span>
                </div>
                <Button
                  variant={autoAnalyze ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoAnalyze(!autoAnalyze)}
                >
                  {autoAnalyze ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
