import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause, Loader2, Clock, Users, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';

interface VoiceRecorderProps {
  profileId?: string;
  onComplete?: (recordingId: string, data: any) => void;
}

type RecordingType = 'meeting' | 'quick_signature' | 'voice_note';

const RECORDING_TYPES: { value: RecordingType; label: string; description: string; maxDuration: number }[] = [
  { value: 'meeting', label: 'Meeting', description: 'Full conversation with transcription', maxDuration: 3600 },
  { value: 'quick_signature', label: 'Voice Signature', description: '30-second sample for biometrics', maxDuration: 30 },
  { value: 'voice_note', label: 'Quick Note', description: 'Short voice memo', maxDuration: 300 },
];

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export function VoiceRecorder({ profileId, onComplete }: VoiceRecorderProps) {
  const [recordingType, setRecordingType] = useState<RecordingType>('voice_note');
  const [extractSignature, setExtractSignature] = useState(false);
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const selectedType = RECORDING_TYPES.find(t => t.value === recordingType)!;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setState(prev => ({ ...prev, audioBlob, audioUrl, isRecording: false }));
      };

      mediaRecorder.start(1000); // Collect data every second

      // Start timer
      timerRef.current = setInterval(() => {
        setState(prev => {
          const newDuration = prev.duration + 1;
          // Auto-stop at max duration
          if (newDuration >= selectedType.maxDuration) {
            stopRecording();
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);

      setState(prev => ({ ...prev, isRecording: true, duration: 0 }));

      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      toast({
        title: 'Recording Started',
        description: `${selectedType.label} mode - Max ${formatDuration(selectedType.maxDuration)}`,
      });

    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to record.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = useCallback(() => {
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

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  }, []);

  const pauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (state.isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setState(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    }
  };

  const resetRecording = () => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    });
    setResult(null);
  };

  const processRecording = async () => {
    if (!state.audioBlob) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Upload audio file
      const fileName = `voice-recordings/${userData.user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, state.audioBlob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);

      // Create recording session
      const { data: sessionData, error: sessionError } = await supabase
        .from('voice_recording_sessions')
        .insert({
          user_id: userData.user.id,
          profile_id: profileId || null,
          recording_type: recordingType,
          duration_seconds: state.duration,
          file_url: urlData.publicUrl,
          storage_path: fileName,
          file_size_bytes: state.audioBlob.size,
          audio_format: 'webm',
          device_source: detectDevice(),
          status: 'completed',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Process the recording
      const { data, error } = await invokeFunction('process-voice-recording', {
          recordingId: sessionData.id,
          recordingType,
          extractSignature,
          deviceSource: detectDevice(),
        },);

      if (error) throw error;

      setResult(data);
      toast({
        title: 'Recording Processed',
        description: `Found ${data.speakers?.length || 0} speakers, ${data.topics?.length || 0} topics`,
      });

      onComplete?.(sessionData.id, data);

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process recording',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = (state.duration / selectedType.maxDuration) * 100;

  return (
    <div className="space-y-4">
      {/* Recording Type */}
      <div className="space-y-2">
        <Label>Recording Type</Label>
        <Select 
          value={recordingType} 
          onValueChange={(v) => setRecordingType(v as RecordingType)}
          disabled={state.isRecording}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECORDING_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex flex-col">
                  <span>{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Extract Signature Toggle */}
      {recordingType !== 'quick_signature' && (
        <div className="flex items-center justify-between">
          <div>
            <Label>Extract Voice Signature</Label>
            <p className="text-xs text-muted-foreground">
              Create biometric sample for contact identification
            </p>
          </div>
          <Switch 
            checked={extractSignature} 
            onCheckedChange={setExtractSignature}
            disabled={state.isRecording}
          />
        </div>
      )}

      {/* Recording UI */}
      <div className={cn(
        "border rounded-lg p-6 text-center transition-all",
        state.isRecording && "border-red-500 bg-red-500/5"
      )}>
        {/* Waveform Visualization Placeholder */}
        <div className={cn(
          "h-16 flex items-center justify-center mb-4",
          state.isRecording && "animate-pulse"
        )}>
          {state.isRecording ? (
            <div className="flex items-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 10}px`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          ) : state.audioUrl ? (
            <audio src={state.audioUrl} controls className="w-full max-w-xs" />
          ) : (
            <Mic className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-2xl">
            {formatDuration(state.duration)}
          </span>
          <span className="text-muted-foreground">
            / {formatDuration(selectedType.maxDuration)}
          </span>
        </div>

        {/* Progress */}
        {state.isRecording && (
          <Progress value={progress} className="mb-4" />
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!state.isRecording && !state.audioBlob && (
            <Button onClick={startRecording} size="lg" className="gap-2">
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
          )}

          {state.isRecording && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={pauseRecording}
              >
                {state.isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </Button>
              <Button 
                variant="destructive" 
                size="lg" 
                onClick={stopRecording}
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Stop
              </Button>
            </>
          )}

          {state.audioBlob && !state.isRecording && (
            <>
              <Button variant="outline" onClick={resetRecording}>
                Record Again
              </Button>
              <Button 
                onClick={processRecording}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <AudioLines className="h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Analysis Results</h4>
            {result.speakers && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {result.speakers.length} speakers
              </Badge>
            )}
          </div>

          {/* Summary */}
          {result.summary && (
            <div>
              <Label className="text-xs">Summary</Label>
              <p className="text-sm mt-1">{result.summary}</p>
            </div>
          )}

          {/* Topics */}
          {result.topics && result.topics.length > 0 && (
            <div>
              <Label className="text-xs">Topics</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.topics.map((topic: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {result.actionItems && result.actionItems.length > 0 && (
            <div>
              <Label className="text-xs">Action Items</Label>
              <ul className="text-sm mt-1 space-y-1">
                {result.actionItems.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcription Preview */}
          {result.transcription && (
            <div>
              <Label className="text-xs">Transcription</Label>
              <ScrollArea className="h-24 mt-1">
                <p className="text-sm text-muted-foreground">
                  {result.transcription.substring(0, 500)}
                  {result.transcription.length > 500 && '...'}
                </p>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/samsung/i.test(ua)) return 's25_ultra';
  if (/iphone/i.test(ua)) return 'iphone';
  if (/ipad/i.test(ua)) return 'ipad_pro';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

export default VoiceRecorder;
