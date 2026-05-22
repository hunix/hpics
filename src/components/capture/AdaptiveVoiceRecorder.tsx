/**
 * AdaptiveVoiceRecorder - Mobile-native full-screen voice recorder for Samsung S25 Ultra
 * Full-screen on mobile, dialog on desktop
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Pause, Play, Square, Save, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { QuickVoiceRecorder } from './QuickVoiceRecorder';

interface AdaptiveVoiceRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (recordingUrl?: string) => void;
  profileId?: string;
}

export function AdaptiveVoiceRecorder(props: AdaptiveVoiceRecorderProps) {
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
    return <QuickVoiceRecorder {...props} />;
  }

  return <MobileVoiceRecorder {...props} />;
}

function MobileVoiceRecorder({ 
  open, 
  onOpenChange, 
  onComplete,
  profileId 
}: AdaptiveVoiceRecorderProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(32).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      cleanup();
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      cleanup();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      setAudioLevels(new Array(32).fill(0));
    }
  }, [open]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
    try {
      await Haptics.impact({ style });
    } catch {
      // Haptics might fail if unsupported by the platform/browser
    }
  };

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const levels: number[] = [];
    const step = Math.floor(dataArray.length / 32);
    for (let i = 0; i < 32; i++) {
      const value = dataArray[i * step] / 255;
      levels.push(value);
    }
    setAudioLevels(levels);

    animationRef.current = requestAnimationFrame(updateAudioLevels);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      await triggerHaptic(ImpactStyle.Heavy);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

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
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      requestAnimationFrame(updateAudioLevels);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Microphone access denied');
    }
  }, [updateAudioLevels]);

  const stopRecording = useCallback(async () => {
    await triggerHaptic();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(async () => {
    await triggerHaptic(ImpactStyle.Light);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const resumeRecording = useCallback(async () => {
    await triggerHaptic(ImpactStyle.Light);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      requestAnimationFrame(updateAudioLevels);
    }
  }, [updateAudioLevels]);

  const discardRecording = useCallback(async () => {
    await triggerHaptic();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setAudioLevels(new Array(32).fill(0));
  }, [audioUrl]);

  const saveRecording = useCallback(async (withTranscription: boolean = false) => {
    if (!audioBlob || !user) return;

    setIsProcessing(true);
    try {
      const fileName = `voice-${Date.now()}.webm`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(filePath);

      const { data: voiceNote, error: insertError } = await supabase
        .from('voice_notes')
        .insert({
          user_id: user.id,
          profile_id: profileId || null,
          file_url: publicUrl,
          duration_seconds: duration,
          transcription_status: withTranscription ? 'pending' : 'skipped'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (withTranscription && voiceNote) {
        toast.success('Saved! Transcription started...');
        supabase.functions.invoke('process-voice-recording', {
          body: { recordingId: voiceNote.id, audioUrl: publicUrl }
        }).catch(console.error);
      } else {
        toast.success('Voice note saved!');
      }
      
      await triggerHaptic(ImpactStyle.Heavy);
      onComplete?.(publicUrl);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save');
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, user, profileId, duration, onComplete, onOpenChange]);

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
        className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-12 w-12 rounded-full text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
          <span className="text-white/60 text-sm font-medium">Voice Recorder</span>
          <div className="w-12" />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          {/* Waveform Visualization */}
          <div className="flex items-end justify-center gap-1 h-40 w-full">
            {audioLevels.map((level, index) => (
              <motion.div
                key={index}
                className={cn(
                  "w-2 rounded-full transition-colors",
                  isRecording && !isPaused ? "bg-amber-400" : audioBlob ? "bg-emerald-400" : "bg-white/20"
                )}
                animate={{
                  height: isRecording && !isPaused ? `${Math.max(8, level * 160)}px` : audioBlob ? '24px' : '8px'
                }}
                transition={{ duration: 0.05 }}
              />
            ))}
          </div>

          {/* Duration Display */}
          <div className="text-6xl font-light text-white font-mono tracking-wider">
            {formatDuration(duration)}
          </div>

          {/* Status Text */}
          <div className="text-white/60 text-sm">
            {isRecording ? (isPaused ? 'Paused' : 'Recording...') : audioBlob ? 'Ready to save' : 'Tap to record'}
          </div>
        </div>

        {/* Controls */}
        <div className="p-8 pb-10">
          {!isRecording && !audioBlob && (
            <div className="flex justify-center">
              <button
                onClick={startRecording}
                className="h-24 w-24 rounded-full bg-red-500 flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-red-500/30"
              >
                <Mic className="h-10 w-10 text-white" />
              </button>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
              >
                {isPaused ? (
                  <Play className="h-7 w-7 text-white ml-1" />
                ) : (
                  <Pause className="h-7 w-7 text-white" />
                )}
              </button>
              <button
                onClick={stopRecording}
                className="h-24 w-24 rounded-full bg-red-500 flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-red-500/30"
              >
                <Square className="h-8 w-8 text-white" />
              </button>
              <div className="w-16" />
            </div>
          )}

          {audioBlob && !isRecording && (
            <div className="space-y-4">
              {/* Audio Preview */}
              <audio src={audioUrl!} controls className="w-full" />
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={discardRecording}
                  className="flex-1 h-14 rounded-xl border-white/20 text-white bg-white/10"
                >
                  <X className="h-5 w-5 mr-2" />
                  Discard
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => saveRecording(false)}
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
                  onClick={() => saveRecording(true)}
                  disabled={isProcessing}
                  className="flex-1 h-14 rounded-xl bg-amber-500 hover:bg-amber-600"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Transcribe
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
