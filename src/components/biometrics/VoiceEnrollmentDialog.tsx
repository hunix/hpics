/**
 * Voice Enrollment Dialog
 * 
 * Multi-sample voice enrollment with:
 * - Guided recording prompts
 * - Real-time audio visualization
 * - Quality analysis
 * - Progress tracking
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Square, 
  Check, 
  X, 
  Trash2, 
  User, 
  Loader2,
  Play,
  Pause,
  Volume2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  extractVoiceFeatures,
  createVoiceFingerprint,
  averageFingerprints,
  serializeFingerprint,
  type VoiceFingerprint,
} from '@/lib/voiceBiometrics';

interface VoiceEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName?: string;
  onComplete?: () => void;
}

interface RecordedSample {
  id: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  fingerprint: VoiceFingerprint;
  prompt: string;
  timestamp: Date;
}

const REQUIRED_SAMPLES = 3;
const MIN_DURATION = 5; // seconds
const MAX_DURATION = 15; // seconds

const RECORDING_PROMPTS = [
  "Please count slowly from one to twenty",
  "Describe what you had for breakfast today",
  "Tell me about your favorite hobby or activity",
  "Read this: The quick brown fox jumps over the lazy dog",
  "Describe the weather outside right now",
];

export function VoiceEnrollmentDialog({
  open,
  onOpenChange,
  profileId,
  profileName,
  onComplete,
}: VoiceEnrollmentDialogProps) {
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [samples, setSamples] = useState<RecordedSample[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const currentPrompt = RECORDING_PROMPTS[currentPromptIndex % RECORDING_PROMPTS.length];

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopRecording();
      cleanupAudio();
    };
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      stopRecording();
      cleanupAudio();
      setSamples([]);
      setCurrentPromptIndex(0);
      setError(null);
    }
  }, [open]);

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      
      streamRef.current = stream;

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      // Start visualization
      const updateLevels = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const levels = Array.from(dataArray.slice(0, 20)).map(v => v / 255);
        setAudioLevels(levels);
        
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        await processRecording();
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      
      setIsRecording(true);
      setRecordingDuration(0);
      
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      
      // Duration timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRecordingDuration(elapsed);
        
        if (elapsed >= MAX_DURATION) {
          stopRecording();
          clearInterval(timer);
        }
      }, 100);
      
      // Store timer for cleanup
      (mediaRecorderRef.current as any)._timer = timer;
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not access microphone');
      toast.error('Microphone access denied');
    }
  }, [isMobile]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Clear timer
      if ((mediaRecorderRef.current as any)._timer) {
        clearInterval((mediaRecorderRef.current as any)._timer);
      }
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsRecording(false);
    setAudioLevels(new Array(20).fill(0));
  }, []);

  // Process recorded audio
  const processRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Check duration
      const duration = recordingDuration;
      if (duration < MIN_DURATION) {
        toast.warning(`Recording too short (${duration.toFixed(1)}s). Minimum is ${MIN_DURATION}s`);
        URL.revokeObjectURL(audioUrl);
        return;
      }

      // Decode audio for analysis
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Extract voice features
      const features = await extractVoiceFeatures(audioBuffer);
      const fingerprint = createVoiceFingerprint(features, audioBuffer);
      
      // Check quality
      if (fingerprint.features.signalToNoiseRatio < 10) {
        toast.warning('Recording quality too low - try in a quieter environment');
        URL.revokeObjectURL(audioUrl);
        return;
      }

      const sample: RecordedSample = {
        id: crypto.randomUUID(),
        audioBlob,
        audioUrl,
        duration,
        fingerprint,
        prompt: currentPrompt,
        timestamp: new Date(),
      };

      setSamples(prev => [...prev, sample]);
      setCurrentPromptIndex(prev => prev + 1);

      toast.success(`Sample recorded (${samples.length + 1}/${REQUIRED_SAMPLES})`);
      
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (err) {
      console.error('Failed to process recording:', err);
      toast.error('Failed to process audio');
    } finally {
      setIsProcessing(false);
      cleanupAudio();
    }
  }, [recordingDuration, currentPrompt, samples.length, isMobile, cleanupAudio]);

  // Remove sample
  const removeSample = useCallback((sampleId: string) => {
    setSamples(prev => {
      const sample = prev.find(s => s.id === sampleId);
      if (sample) {
        URL.revokeObjectURL(sample.audioUrl);
      }
      return prev.filter(s => s.id !== sampleId);
    });
  }, []);

  // Play sample
  const playSample = useCallback((sample: RecordedSample) => {
    if (playingSampleId === sample.id) {
      setPlayingSampleId(null);
      return;
    }
    
    const audio = new Audio(sample.audioUrl);
    audio.onended = () => setPlayingSampleId(null);
    audio.play();
    setPlayingSampleId(sample.id);
  }, [playingSampleId]);

  // Save enrollment
  const saveEnrollment = useCallback(async () => {
    if (!user?.id || samples.length < REQUIRED_SAMPLES) return;

    setIsSaving(true);
    
    try {
      // Average fingerprints for robust enrollment
      const fingerprints = samples.map(s => s.fingerprint);
      const averagedFingerprint = averageFingerprints(fingerprints);
      
      // Update or insert biometrics record
      const { error: upsertError } = await supabase
        .from('contact_biometrics')
        .update({
          voice_embedding: serializeFingerprint(averagedFingerprint),
          voice_sample_count: samples.length,
          voice_speaker_profile: {
            samples: samples.map(s => ({
              duration: s.duration,
              prompt: s.prompt,
              features: s.fingerprint.features,
              capturedAt: s.timestamp.toISOString(),
            })),
            averagedFeatures: averagedFingerprint.features,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId)
        .eq('user_id', user.id);

      if (upsertError) throw upsertError;

      toast.success('Voice enrolled successfully!');
      
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      
      onComplete?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save enrollment:', err);
      toast.error('Failed to save enrollment');
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, samples, profileId, onComplete, onOpenChange, isMobile]);

  const progress = (samples.length / REQUIRED_SAMPLES) * 100;
  const canSave = samples.length >= REQUIRED_SAMPLES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Enroll Voice {profileName && `- ${profileName}`}
          </DialogTitle>
          <DialogDescription>
            Record {REQUIRED_SAMPLES} voice samples for speaker identification
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Recording prompt */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground mb-1">
              Sample {Math.min(samples.length + 1, REQUIRED_SAMPLES)} of {REQUIRED_SAMPLES}
            </p>
            <p className="font-medium">{currentPrompt}</p>
          </div>

          {/* Audio visualization */}
          <div className="h-24 flex items-center justify-center gap-1 bg-black/5 rounded-lg p-4">
            {audioLevels.map((level, i) => (
              <motion.div
                key={i}
                className={cn(
                  'w-2 rounded-full',
                  isRecording ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                animate={{
                  height: isRecording ? `${Math.max(8, level * 80)}px` : '8px',
                }}
                transition={{ duration: 0.05 }}
              />
            ))}
          </div>

          {/* Recording controls */}
          <div className="flex flex-col items-center gap-4">
            {/* Duration */}
            <div className="text-2xl font-mono">
              {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
              {Math.floor(recordingDuration % 60).toString().padStart(2, '0')}
              <span className="text-muted-foreground text-sm ml-2">
                / {MAX_DURATION}s max
              </span>
            </div>

            {/* Record button */}
            <Button
              size="lg"
              variant={isRecording ? 'destructive' : 'default'}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || samples.length >= REQUIRED_SAMPLES}
              className="w-20 h-20 rounded-full"
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isRecording ? (
                <Square className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>

            <p className="text-sm text-muted-foreground">
              {isRecording 
                ? `Recording... (min ${MIN_DURATION}s)` 
                : isProcessing 
                  ? 'Processing...'
                  : 'Tap to start recording'
              }
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Enrollment Progress</span>
              <span className="text-muted-foreground">
                {samples.length}/{REQUIRED_SAMPLES} samples
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Recorded samples */}
          {samples.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recorded Samples</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {samples.map((sample, index) => (
                  <div
                    key={sample.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => playSample(sample)}
                      >
                        {playingSampleId === sample.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Sample {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sample.duration.toFixed(1)}s • SNR: {sample.fingerprint.features.signalToNoiseRatio.toFixed(0)}dB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Good
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => removeSample(sample.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveEnrollment}
            disabled={!canSave || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Complete Enrollment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
