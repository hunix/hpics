/**
 * AmbientListener - Continuous background speech capture UI
 *
 * Uses the Web Audio API for a real RMS level meter and the Web Speech
 * API (where available) for transcription. Wake-word detection /
 * speaker ID are gated behind a "configured" check — they're not
 * implemented client-side, so they stay off unless an external service
 * is wired up later.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AmbientListenerProps {
  className?: string;
  onTranscript?: (text: string, speakerId?: string) => void;
}

interface MinimalSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionCtorType {
  new (): MinimalSpeechRecognition;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionCtorType;
  webkitSpeechRecognition?: SpeechRecognitionCtorType;
}

export function AmbientListener({ className, onTranscript }: AmbientListenerProps) {
  const [isListening, setIsListening] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [speakerIdEnabled, setSpeakerIdEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? (window as WindowWithSpeech).SpeechRecognition ??
        (window as WindowWithSpeech).webkitSpeechRecognition
      : undefined;
  const speechSupported = !!SpeechRecognitionCtor;

  const stopListening = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buffer);
        // RMS of the centred waveform → 0..100 scale.
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        setAudioLevel(Math.min(100, rms * 200));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      if (SpeechRecognitionCtor) {
        const rec = new SpeechRecognitionCtor();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';
        rec.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              const text = result[0].transcript.trim();
              if (text) {
                setLastTranscript(text);
                onTranscript?.(text);
                // Lightweight keyword spotting: surface the three
                // longest words as candidate keywords.
                const keywords = text
                  .toLowerCase()
                  .split(/\s+/)
                  .filter((w: string) => w.length > 4)
                  .slice(0, 3);
                if (keywords.length) setDetectedKeywords(keywords);
              }
            }
          }
        };
        rec.onerror = () => {
          // Speech recognition often errors on long silence — just stop.
        };
        recognitionRef.current = rec;
        rec.start();
      }

      setIsListening(true);
    } catch (err) {
      setPermissionError(
        err instanceof Error ? err.message : 'Microphone permission denied'
      );
      stopListening();
    }
  }, [SpeechRecognitionCtor, onTranscript, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else void startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            Ambient Listener
          </CardTitle>
          <Badge variant={isListening ? 'default' : 'secondary'}>
            {isListening ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isListening ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                "p-3 rounded-full",
                isListening ? "bg-red-500/20" : "bg-muted"
              )}
            >
              {isListening ? (
                <Mic className="h-6 w-6 text-red-400" />
              ) : (
                <MicOff className="h-6 w-6 text-muted-foreground" />
              )}
            </motion.div>
            <div>
              <p className="font-medium">
                {isListening ? 'Listening...' : 'Tap to start'}
              </p>
              <p className="text-xs text-muted-foreground">
                {wakeWordEnabled ? 'Wake: "Hey Intel"' : 'Always on'}
              </p>
            </div>
          </div>
          <Button
            variant={isListening ? 'destructive' : 'default'}
            size="sm"
            onClick={toggleListening}
          >
            {isListening ? 'Stop' : 'Start'}
          </Button>
        </div>

        {/* Audio Level */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Audio Level</span>
              </div>
              <Progress value={audioLevel} className="h-1" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permission / capability errors */}
        {permissionError && (
          <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-xs text-destructive">
            {permissionError}
          </div>
        )}
        {!speechSupported && (
          <div className="text-xs text-muted-foreground">
            This browser doesn't support Web Speech API — audio levels work, but transcription is unavailable.
          </div>
        )}

        {/* Settings — wake word and speaker ID require external services
            we haven't wired up; toggles are disabled with a note. */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Wake Word Detection</span>
              <Badge variant="outline" className="text-[10px]">not configured</Badge>
            </div>
            <Switch checked={wakeWordEnabled} onCheckedChange={setWakeWordEnabled} disabled />
          </div>
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Speaker Identification</span>
              <Badge variant="outline" className="text-[10px]">not configured</Badge>
            </div>
            <Switch checked={speakerIdEnabled} onCheckedChange={setSpeakerIdEnabled} disabled />
          </div>
        </div>

        {/* Last Transcript */}
        {lastTranscript && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Last heard:</p>
            <p className="text-sm">{lastTranscript}</p>
          </div>
        )}

        {/* Detected Keywords */}
        {detectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {detectedKeywords.map((keyword, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
