/**
 * Mobile Capture Tab
 * Central hub for all capture methods: photo, video, voice, document
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Video, 
  Mic, 
  ScanLine, 
  Upload, 
  X, 
  StopCircle,
  Pause,
  Play,
  Send,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

type CaptureMode = 'idle' | 'photo' | 'video' | 'voice' | 'document';
type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

interface CaptureTabProps {
  profileId?: string;
  profileName?: string;
  onCapture?: (type: CaptureMode, data: Blob | string) => void;
}

export function CaptureTab({ profileId, profileName, onCapture }: CaptureTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    try {
      await hapticFeedback('medium');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio analyzer for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      
      // Start audio level monitoring
      const updateLevel = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(avg / 255 * 100);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setRecordingState('stopped');
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setMode('voice');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  // Start video recording
  const startVideoRecording = async () => {
    try {
      await hapticFeedback('medium');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setRecordingState('stopped');
      };
      
      mediaRecorder.start(1000);
      setRecordingState('recording');
      setMode('video');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start video recording:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  // Take photo
  const takePhoto = async () => {
    try {
      await hapticFeedback('medium');
      setMode('photo');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play();
      }
      
      setRecordingState('recording');
      
    } catch (error) {
      console.error('Failed to access camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive'
      });
      setMode('idle');
    }
  };

  // Capture photo from stream
  const capturePhoto = async () => {
    if (!videoPreviewRef.current || !streamRef.current) return;
    
    await hapticFeedback('light');
    
    const canvas = document.createElement('canvas');
    canvas.width = videoPreviewRef.current.videoWidth;
    canvas.height = videoPreviewRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoPreviewRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setRecordedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          setRecordingState('stopped');
          
          // Stop the stream
          streamRef.current?.getTracks().forEach(track => track.stop());
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    await hapticFeedback('light');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Pause/Resume recording
  const togglePause = async () => {
    await hapticFeedback('light');
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingState('paused');
      } else if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(d => d + 1);
        }, 1000);
        setRecordingState('recording');
      }
    }
  };

  // Cancel and discard
  const cancelRecording = async () => {
    await hapticFeedback('medium');
    stopAllMedia();
    setMode('idle');
    setRecordingState('idle');
    setDuration(0);
    setAudioLevel(0);
    setPreviewUrl(null);
    setRecordedBlob(null);
  };

  // Upload recorded media
  const uploadRecording = async () => {
    if (!recordedBlob) return;
    
    setIsUploading(true);
    await hapticFeedback('medium');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const timestamp = Date.now();
      const extension = mode === 'voice' ? 'webm' : mode === 'video' ? 'webm' : 'jpg';
      const folder = mode === 'voice' ? 'voice-memos' : mode === 'video' ? 'video-captures' : 'photo-captures';
      const filename = `${user.id}/${folder}/${timestamp}.${extension}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filename, recordedBlob, {
          contentType: recordedBlob.type,
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filename);
      
      // Create device capture record
      const { error: insertError } = await supabase
        .from('device_captures')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          device_type: 'mobile',
          capture_type: mode === 'voice' ? 'voice_memo' : mode === 'video' ? 'video' : 'screenshot',
          raw_content: JSON.stringify({
            url: publicUrl,
            duration: mode !== 'photo' ? duration : undefined,
            type: recordedBlob.type
          }),
          status: 'pending'
        });
      
      if (insertError) throw insertError;
      
      toast({
        title: 'Capture Saved',
        description: `Your ${mode} has been saved${profileName ? ` for ${profileName}` : ''}.`
      });
      
      onCapture?.(mode, recordedBlob);
      cancelRecording();
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not save your capture. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quick Capture</CardTitle>
          {profileName && (
            <Badge variant="secondary" className="text-xs">
              {profileName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        {mode === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
              onClick={takePhoto}
            >
              <Camera className="h-8 w-8 text-blue-500" />
              <span className="text-sm font-medium">Photo</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
              onClick={startVideoRecording}
            >
              <Video className="h-8 w-8 text-red-500" />
              <span className="text-sm font-medium">Video</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
              onClick={startVoiceRecording}
            >
              <Mic className="h-8 w-8 text-orange-500" />
              <span className="text-sm font-medium">Voice Memo</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
              onClick={() => navigate('/share-receive')}
            >
              <Upload className="h-8 w-8 text-green-500" />
              <span className="text-sm font-medium">Import</span>
            </Button>
          </motion.div>
        )}

        {/* Recording UI */}
        <AnimatePresence mode="wait">
          {mode !== 'idle' && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Video Preview */}
              {(mode === 'video' || mode === 'photo') && (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className={cn(
                      "w-full h-full object-cover",
                      recordingState === 'stopped' && "hidden"
                    )}
                  />
                  {previewUrl && mode === 'photo' && recordingState === 'stopped' && (
                    <img 
                      src={previewUrl} 
                      alt="Captured" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  {previewUrl && mode === 'video' && recordingState === 'stopped' && (
                    <video 
                      src={previewUrl} 
                      controls 
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Recording indicator */}
                  {recordingState === 'recording' && mode === 'video' && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-white text-sm font-medium">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Voice Recording UI */}
              {mode === 'voice' && recordingState !== 'stopped' && (
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    {recordingState === 'recording' && (
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <span className="text-3xl font-mono font-bold">
                      {formatDuration(duration)}
                    </span>
                  </div>
                  
                  {/* Audio Level Visualization */}
                  <div className="h-16 flex items-center justify-center gap-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1.5 rounded-full transition-all duration-75",
                          audioLevel > (i * 5) ? "bg-orange-500" : "bg-muted"
                        )}
                        style={{
                          height: `${Math.max(8, Math.min(64, (audioLevel / 100) * 64 + Math.random() * 10))}px`
                        }}
                      />
                    ))}
                  </div>
                  
                  <p className="text-center text-sm text-muted-foreground">
                    {recordingState === 'paused' ? 'Recording paused' : 'Recording...'}
                  </p>
                </div>
              )}
              
              {/* Voice Playback */}
              {mode === 'voice' && recordingState === 'stopped' && previewUrl && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-4">
                  <audio src={previewUrl} controls className="w-full" />
                  <p className="text-center text-sm text-muted-foreground">
                    Duration: {formatDuration(duration)}
                  </p>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {/* Cancel */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={cancelRecording}
                >
                  <X className="h-5 w-5" />
                </Button>
                
                {/* Photo: Capture button */}
                {mode === 'photo' && recordingState === 'recording' && (
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full bg-white border-4 border-blue-500"
                    onClick={capturePhoto}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500" />
                  </Button>
                )}
                
                {/* Video/Voice: Stop button */}
                {(mode === 'video' || mode === 'voice') && recordingState !== 'stopped' && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={togglePause}
                    >
                      {recordingState === 'paused' ? (
                        <Play className="h-5 w-5" />
                      ) : (
                        <Pause className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      size="icon"
                      className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
                      onClick={stopRecording}
                    >
                      <StopCircle className="h-8 w-8 text-white" />
                    </Button>
                  </>
                )}
                
                {/* Save button (after recording) */}
                {recordingState === 'stopped' && recordedBlob && (
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
                    onClick={uploadRecording}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-6 w-6 text-white" />
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
