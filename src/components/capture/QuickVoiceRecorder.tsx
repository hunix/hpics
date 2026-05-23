import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface QuickVoiceRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (audioUrl?: string, transcription?: string) => void;
  profileId?: string;
}

export function QuickVoiceRecorder({ 
  open, 
  onOpenChange, 
  onComplete,
  profileId 
}: QuickVoiceRecorderProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      stopRecording();
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setDuration(0);
      setAudioLevels(new Array(20).fill(0));
    }
  }, [open]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualization
      const updateLevels = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const levels = Array.from(dataArray.slice(0, 20)).map(v => v / 255);
        setAudioLevels(levels);
        animationRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setAudioLevels(new Array(20).fill(0));
  }, [audioUrl]);

  const saveRecording = useCallback(async () => {
    if (!audioBlob || !user) return;

    setIsProcessing(true);
    try {
      // Upload to Supabase storage
      const fileName = `voice-${Date.now()}.webm`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(filePath);

      // Create voice note record
      const { data: voiceNote, error: insertError } = await supabase
        .from('voice_notes')
        .insert({
          user_id: user.id,
          profile_id: profileId || null,
          file_url: publicUrl,
          duration_seconds: duration,
          transcription_status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger transcription
      const { error: transcribeError } = await invokeFunction('transcribe-voice-note', { voiceNoteId: voiceNote.id, audioUrl: publicUrl });

      if (transcribeError) {
        console.warn('Transcription queued but may have issues:', transcribeError);
      }

      toast.success('Voice recording saved!');
      onComplete?.(publicUrl);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording');
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, user, profileId, duration, onComplete, onOpenChange]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Quick Voice Recording
          </DialogTitle>
          <DialogDescription>
            Record a voice note for instant transcription and analysis
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Audio Visualization */}
          <div className="flex items-center justify-center gap-1 h-24 mb-4">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 rounded-full transition-all duration-75",
                  isRecording && !isPaused ? "bg-red-500" : "bg-muted-foreground/30"
                )}
                style={{ 
                  height: `${Math.max(8, level * 100)}%`,
                  opacity: isRecording ? 0.5 + level * 0.5 : 0.3
                }}
              />
            ))}
          </div>

          {/* Duration */}
          <div className="text-center mb-6">
            <span className={cn(
              "text-4xl font-mono font-bold",
              isRecording && !isPaused && "text-red-500"
            )}>
              {formatDuration(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !audioBlob && (
              <Button
                size="lg"
                onClick={startRecording}
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}

            {isRecording && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="h-14 w-14 rounded-full"
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </Button>
                <Button
                  size="lg"
                  onClick={stopRecording}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {audioBlob && !isRecording && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={discardRecording}
                  className="h-14 w-14 rounded-full text-destructive"
                >
                  <Trash2 className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="h-14 w-14 rounded-full"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Audio Preview */}
          {audioUrl && !isRecording && (
            <div className="mt-6">
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {audioBlob && !isRecording && (
            <Button onClick={saveRecording} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Save & Transcribe
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
