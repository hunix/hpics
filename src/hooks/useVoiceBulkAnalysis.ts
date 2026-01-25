import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { localAudioAnalyzer, type BatchAnalysisProgress } from '@/lib/ml';

export interface VoiceRecording {
  id: string;
  title: string;
  audio_url: string;
  duration_seconds: number | null;
  recording_type: string;
  transcription_status: string;
  status: string;
  profile_id: string | null;
  created_at: string;
  hasVoiceInsights?: boolean;
  source: 'voice_recording_sessions' | 'media';
}

export interface VoiceBulkAnalysisOptions {
  transcription: boolean;
  speakerDiarization: boolean;
  vocalPsychology: boolean;
  contentIntelligence: boolean;
  voiceBiometrics: boolean;
}

export type ProcessingMode = 'local' | 'cloud' | 'hybrid';

export interface VoiceBulkSession {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  phase: 'initializing' | 'model_loading' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  currentItemId: string | null;
  currentFileName?: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  totalCostCents: number;
  processingMode: ProcessingMode;
  modelStatus?: 'loading' | 'ready';
  modelProgress?: number;
}

const DEFAULT_OPTIONS: VoiceBulkAnalysisOptions = {
  transcription: true,
  speakerDiarization: true,
  vocalPsychology: true,
  contentIntelligence: true,
  voiceBiometrics: false,
};

export function useVoiceBulkAnalysis(profileId?: string) {
  const [session, setSession] = useState<VoiceBulkSession | null>(null);
  const [options, setOptions] = useState<VoiceBulkAnalysisOptions>(DEFAULT_OPTIONS);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('local');
  const cancelRef = useRef(false);

  // Fetch voice recordings for a profile
  const fetchRecordings = useCallback(async (targetProfileId?: string) => {
    setIsLoading(true);
    try {
      const pid = targetProfileId || profileId;
      
      // Source 1: Voice Recording Sessions (in-app recordings)
      let sessionQuery = supabase
        .from('voice_recording_sessions')
        .select('id, title, file_url, duration_seconds, recording_type, transcription_status, status, profile_id, created_at')
        .order('created_at', { ascending: false });
      
      if (pid) {
        sessionQuery = sessionQuery.eq('profile_id', pid);
      }
      
      // Source 2: Media table (imported audio files like WhatsApp voice notes)
      let mediaQuery = supabase
        .from('media')
        .select('id, caption, file_url, file_size, mime_type, profile_id, created_at')
        .like('mime_type', 'audio/%')
        .order('created_at', { ascending: false });
      
      if (pid) {
        mediaQuery = mediaQuery.eq('profile_id', pid);
      }
      
      // Execute both queries in parallel
      const [sessionsResult, mediaResult] = await Promise.all([
        sessionQuery,
        mediaQuery
      ]);
      
      if (sessionsResult.error) throw sessionsResult.error;
      if (mediaResult.error) throw mediaResult.error;
      
      // Normalize session recordings
      const sessionRecordings: VoiceRecording[] = (sessionsResult.data || []).map(r => ({
        id: r.id,
        title: r.title || 'Untitled',
        audio_url: r.file_url || '',
        duration_seconds: r.duration_seconds,
        recording_type: r.recording_type || 'session',
        transcription_status: r.transcription_status || 'pending',
        status: r.status || 'pending',
        profile_id: r.profile_id,
        created_at: r.created_at,
        source: 'voice_recording_sessions' as const,
      }));
      
      // Normalize media audio files
      const mediaRecordings: VoiceRecording[] = (mediaResult.data || []).map(r => ({
        id: r.id,
        title: r.caption || r.file_url?.split('/').pop() || 'Audio File',
        audio_url: r.file_url || '',
        duration_seconds: null,
        recording_type: r.mime_type?.includes('opus') ? 'voice_note' : 'audio',
        transcription_status: 'pending',
        status: 'ready',
        profile_id: r.profile_id,
        created_at: r.created_at,
        source: 'media' as const,
      }));
      
      // Merge all recordings
      const allRecordings = [...sessionRecordings, ...mediaRecordings];
      
      // Check which already have voice insights
      const recordingIds = allRecordings.map(r => r.id);
      const { data: existingInsights } = await supabase
        .from('voice_insights')
        .select('source_id')
        .in('source_id', recordingIds.length > 0 ? recordingIds : ['__none__']);
      
      const insightSourceIds = new Set(existingInsights?.map(i => i.source_id) || []);
      
      const recordingsWithStatus: VoiceRecording[] = allRecordings.map(r => ({
        ...r,
        hasVoiceInsights: insightSourceIds.has(r.id),
      }));
      
      setRecordings(recordingsWithStatus);
      return recordingsWithStatus;
    } catch (error) {
      console.error('[VoiceBulkAnalysis] Error fetching recordings:', error);
      toast.error('Failed to load voice recordings');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  // Process single recording locally (WebGPU Whisper)
  const processLocalRecording = useCallback(async (
    recording: VoiceRecording,
    userId: string
  ): Promise<{ success: boolean; processingTimeMs: number }> => {
    const result = await localAudioAnalyzer.analyzeAudioFile(recording.audio_url, {
      transcribe: true,
      analyzeSentiment: true
    });

    if (!result.transcription?.text) {
      throw new Error('No transcription generated');
    }

    // Store results in voice_insights
    const { error: insertError } = await supabase.from('voice_insights').upsert({
      source_type: 'voice_recording_session',
      source_id: recording.id,
      profile_id: recording.profile_id,
      user_id: userId,
      transcription_text: result.transcription.text,
      transcription_chunks: result.transcription.chunks as unknown as Record<string, unknown>[],
      overall_sentiment: result.sentiment?.label || 'neutral',
      confidence_score: result.sentiment?.confidence || 0.5,
      processing_method: 'local_whisper_turbo',
      processing_time_ms: result.totalProcessingMs,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'source_id'
    });

    if (insertError) {
      console.error('[VoiceBulkAnalysis] Failed to save insights:', insertError);
    }

    return { success: true, processingTimeMs: result.totalProcessingMs };
  }, []);

  // Start bulk analysis with mode selection
  const startBulkAnalysis = useCallback(async (
    selectedRecordings: VoiceRecording[],
    analysisOptions: VoiceBulkAnalysisOptions = options,
    mode: ProcessingMode = processingMode
  ) => {
    if (selectedRecordings.length === 0) {
      toast.error('No recordings selected');
      return;
    }

    cancelRef.current = false;

    const newSession: VoiceBulkSession = {
      id: crypto.randomUUID(),
      status: 'running',
      phase: mode === 'local' || mode === 'hybrid' ? 'model_loading' : 'processing',
      totalItems: selectedRecordings.length,
      processedItems: 0,
      failedItems: 0,
      currentItemId: null,
      currentFileName: undefined,
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      totalCostCents: 0,
      processingMode: mode,
      modelStatus: mode === 'local' || mode === 'hybrid' ? 'loading' : 'ready',
      modelProgress: 0
    };

    setSession(newSession);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const modeLabel = mode === 'local' ? '⚡ Local (WebGPU)' : mode === 'cloud' ? '☁️ Cloud' : '🔄 Hybrid';
    toast.info(`Starting ${modeLabel} analysis for ${selectedRecordings.length} recordings...`);

    // Initialize local model if needed
    if (mode === 'local' || mode === 'hybrid') {
      try {
        await localAudioAnalyzer.initialize({
          whisperModel: 'turbo',
          onProgress: (progress) => {
            if (progress.status === 'progress') {
              setSession(prev => prev ? {
                ...prev,
                modelProgress: progress.progress
              } : null);
            }
          }
        });
        setSession(prev => prev ? { ...prev, modelStatus: 'ready', phase: 'processing' } : null);
      } catch (error) {
        console.error('[VoiceBulkAnalysis] Failed to load local model:', error);
        toast.error('Failed to load local ML model. Falling back to cloud.');
        // Fall back to cloud
        setSession(prev => prev ? { ...prev, processingMode: 'cloud' } : null);
      }
    }

    for (let i = 0; i < selectedRecordings.length; i++) {
      if (cancelRef.current) {
        setSession(prev => prev ? { ...prev, status: 'paused' } : null);
        toast.info('Analysis paused');
        return;
      }

      const recording = selectedRecordings[i];
      setSession(prev => prev ? { 
        ...prev, 
        currentItemId: recording.id,
        currentFileName: recording.title || 'Audio file',
        processedItems: i 
      } : null);

      try {
        console.log(`[VoiceBulkAnalysis] Processing ${i + 1}/${selectedRecordings.length}: ${recording.title} (${mode})`);

        if (mode === 'local') {
          // Pure local processing - no cloud calls
          await processLocalRecording(recording, user.id);
          setSession(prev => prev ? {
            ...prev,
            processedItems: i + 1,
            // Local = $0 cost
          } : null);

        } else if (mode === 'hybrid') {
          // Local transcription first, then cloud for advanced analysis
          const localResult = await processLocalRecording(recording, user.id);
          
          // Optional: send to cloud for deep psychological analysis
          if (analysisOptions.vocalPsychology || analysisOptions.contentIntelligence) {
            const { data, error } = await supabase.functions.invoke('analyze-voice-comprehensive', {
              body: {
                audioUrl: recording.audio_url,
                sourceType: 'voice_recording',
                sourceId: recording.id,
                profileId: recording.profile_id,
                options: {
                  transcribe: false, // Already done locally
                  diarize: analysisOptions.speakerDiarization,
                  analyzeVocalPsychology: analysisOptions.vocalPsychology,
                  extractContentIntelligence: analysisOptions.contentIntelligence,
                  extractBiometrics: analysisOptions.voiceBiometrics,
                },
              },
            });
            
            if (error) console.warn('[VoiceBulkAnalysis] Cloud enhancement failed:', error);
            
            setSession(prev => prev ? {
              ...prev,
              processedItems: i + 1,
              totalCostCents: prev.totalCostCents + (data?.costCents || 0),
            } : null);
          } else {
            setSession(prev => prev ? {
              ...prev,
              processedItems: i + 1,
            } : null);
          }

        } else {
          // Pure cloud processing (original behavior)
          const { data, error } = await supabase.functions.invoke('analyze-voice-comprehensive', {
            body: {
              audioUrl: recording.audio_url,
              sourceType: 'voice_recording',
              sourceId: recording.id,
              profileId: recording.profile_id,
              options: {
                transcribe: analysisOptions.transcription,
                diarize: analysisOptions.speakerDiarization,
                analyzeVocalPsychology: analysisOptions.vocalPsychology,
                extractContentIntelligence: analysisOptions.contentIntelligence,
                extractBiometrics: analysisOptions.voiceBiometrics,
              },
            },
          });

          if (error) throw error;

          setSession(prev => prev ? {
            ...prev,
            processedItems: i + 1,
            totalCostCents: prev.totalCostCents + (data?.costCents || 0),
          } : null);
        }

      } catch (error) {
        console.error(`[VoiceBulkAnalysis] Failed to analyze recording ${recording.id}:`, error);
        setSession(prev => prev ? {
          ...prev,
          failedItems: prev.failedItems + 1,
          processedItems: i + 1,
        } : null);
      }
    }

    setSession(prev => prev ? {
      ...prev,
      status: 'completed',
      phase: 'completed',
      completedAt: new Date().toISOString(),
      currentItemId: null,
      currentFileName: undefined,
    } : null);

    toast.success('Voice analysis complete!');

    // Refresh recordings to update status
    await fetchRecordings(profileId);
  }, [options, profileId, fetchRecordings, processingMode, processLocalRecording]);

  // Pause/cancel analysis
  const pauseAnalysis = useCallback(() => {
    cancelRef.current = true;
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    setSession(null);
    cancelRef.current = false;
  }, []);

  // Unload local models to free memory
  const unloadModels = useCallback(() => {
    localAudioAnalyzer.unload();
  }, []);

  // Get unanalyzed recordings count
  const unanalyzedCount = recordings.filter(r => !r.hasVoiceInsights).length;

  // Get local model status
  const localModelStatus = localAudioAnalyzer.getStatus();

  return {
    session,
    options,
    setOptions,
    recordings,
    isLoading,
    fetchRecordings,
    startBulkAnalysis,
    pauseAnalysis,
    resetSession,
    unanalyzedCount,
    processingMode,
    setProcessingMode,
    unloadModels,
    localModelStatus,
  };
}
