/**
 * Speech Recognition Hook
 * Continuous speech-to-text with speaker identification
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranscriptSegment {
  id: string;
  text: string;
  speakerLabel?: string;
  matchedProfileId?: string;
  matchedProfileName?: string;
  confidence: number;
  startTime: number;
  endTime?: number;
  isQuestion?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface SpeechSession {
  id: string;
  startedAt: Date;
  segments: TranscriptSegment[];
  isActive: boolean;
}

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (segment: TranscriptSegment) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  segments: TranscriptSegment[];
  currentSession: SpeechSession | null;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  clearTranscript: () => void;
  saveSession: (profileId?: string) => Promise<string | null>;
  identifySpeakers: () => Promise<void>;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { user } = useAuth();
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    onResult,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [currentSession, setCurrentSession] = useState<SpeechSession | null>(null);

  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const segmentCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  // Check for browser support
  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 
    'webkitSpeechRecognition' in window
  );

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setIsListening(true);
      startTimeRef.current = Date.now();
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if continuous mode
      if (continuous && currentSession?.isActive) {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText;

          // Create segment for final result
          const segment: TranscriptSegment = {
            id: `seg-${sessionIdRef.current}-${segmentCountRef.current++}`,
            text: transcriptText.trim(),
            confidence: result[0].confidence || 0.9,
            startTime: Date.now() - startTimeRef.current,
            isQuestion: transcriptText.trim().endsWith('?'),
            sentiment: detectSentiment(transcriptText)
          };

          setSegments(prev => [...prev, segment]);
          onResult?.(segment);
        } else {
          interimTranscript += transcriptText;
        }
      }

      setTranscript(prev => prev + finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event.error);
      
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language, continuous, interimResults, maxAlternatives, onResult, onError, isSupported]);

  // Simple sentiment detection
  const detectSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['great', 'good', 'excellent', 'amazing', 'love', 'happy', 'thanks', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'problem', 'issue'];
    
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  // Start listening
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Speech recognition not supported');
      return false;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create new session
      sessionIdRef.current = crypto.randomUUID();
      segmentCountRef.current = 0;
      
      setCurrentSession({
        id: sessionIdRef.current,
        startedAt: new Date(),
        segments: [],
        isActive: true
      });

      setTranscript('');
      setSegments([]);

      recognitionRef.current?.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error('Microphone access denied');
      return false;
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => prev ? { ...prev, isActive: false } : null);
    }
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [currentSession]);

  // Pause listening
  const pauseListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Resume listening
  const resumeListening = useCallback(() => {
    if (currentSession?.isActive === false) {
      setCurrentSession(prev => prev ? { ...prev, isActive: true } : null);
    }
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Already running
    }
  }, [currentSession]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setSegments([]);
    segmentCountRef.current = 0;
  }, []);

  // Save session to database
  const saveSession = useCallback(async (profileId?: string): Promise<string | null> => {
    if (!user || segments.length === 0) return null;

    try {
      // Save segments as live transcriptions
      const transcriptionRecords = segments.map(seg => ({
        user_id: user.id,
        session_id: sessionIdRef.current,
        text: seg.text,
        speaker_label: seg.speakerLabel,
        matched_profile_id: seg.matchedProfileId,
        match_confidence: seg.matchedProfileId ? 0.8 : null,
        timestamp_start: seg.startTime / 1000,
        timestamp_end: seg.endTime ? seg.endTime / 1000 : null,
        is_question: seg.isQuestion || false,
        sentiment_score: seg.sentiment === 'positive' ? 0.8 : 
                         seg.sentiment === 'negative' ? 0.2 : 0.5,
        word_count: seg.text.split(/\s+/).length
      }));

      const { error } = await supabase
        .from('live_transcriptions')
        .insert(transcriptionRecords);

      if (error) throw error;

      toast.success('Transcription saved');
      return sessionIdRef.current;
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save transcription');
      return null;
    }
  }, [user, segments]);

  // Identify speakers using voice matching
  const identifySpeakers = useCallback(async () => {
    if (!user || segments.length === 0) return;

    try {
      // Call edge function for speaker diarization
      const { data, error } = await supabase.functions.invoke('identify-speakers', {
        body: {
          sessionId: sessionIdRef.current,
          segments: segments.map(s => ({
            id: s.id,
            text: s.text,
            startTime: s.startTime,
            endTime: s.endTime
          })),
          userId: user.id
        }
      });

      if (error) throw error;

      if (data?.identifiedSegments) {
        setSegments(prev => prev.map(seg => {
          const identified = data.identifiedSegments.find((s: any) => s.id === seg.id);
          if (identified) {
            return {
              ...seg,
              speakerLabel: identified.speakerLabel,
              matchedProfileId: identified.profileId,
              matchedProfileName: identified.profileName
            };
          }
          return seg;
        }));

        toast.success(`Identified ${data.speakerCount} speakers`);
      }
    } catch (error) {
      console.error('Error identifying speakers:', error);
    }
  }, [user, segments]);

  return {
    isListening,
    isSupported,
    transcript,
    segments,
    currentSession,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    clearTranscript,
    saveSession,
    identifySpeakers
  };
}
