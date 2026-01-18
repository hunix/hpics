import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export interface VoiceBulkAnalysisOptions {
  transcription: boolean;
  speakerDiarization: boolean;
  vocalPsychology: boolean;
  contentIntelligence: boolean;
  voiceBiometrics: boolean;
}

export interface VoiceBulkSession {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  currentItemId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  totalCostCents: number;
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
  const cancelRef = useRef(false);

  // Fetch voice recordings for a profile
  const fetchRecordings = useCallback(async (targetProfileId?: string) => {
    setIsLoading(true);
    try {
      const pid = targetProfileId || profileId;
      
      let query = supabase
        .from('voice_recording_sessions')
        .select('id, title, file_url, duration_seconds, recording_type, transcription_status, status, profile_id, created_at')
        .order('created_at', { ascending: false });
      
      if (pid) {
        query = query.eq('profile_id', pid);
      }

      const { data: recordingsData, error } = await query;
      if (error) throw error;

      // Check which recordings already have voice insights
      const recordingIds = (recordingsData || []).map(r => r.id);
      const { data: existingInsights } = await supabase
        .from('voice_insights')
        .select('source_id')
        .in('source_id', recordingIds.length > 0 ? recordingIds : ['__none__']);

      const insightSourceIds = new Set(existingInsights?.map(i => i.source_id) || []);

      const recordingsWithStatus: VoiceRecording[] = (recordingsData || []).map(r => ({
        id: r.id,
        title: r.title || 'Untitled',
        audio_url: r.file_url || '',
        duration_seconds: r.duration_seconds,
        recording_type: r.recording_type || 'unknown',
        transcription_status: r.transcription_status || 'pending',
        status: r.status || 'pending',
        profile_id: r.profile_id,
        created_at: r.created_at,
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

  // Start bulk analysis
  const startBulkAnalysis = useCallback(async (
    selectedRecordings: VoiceRecording[],
    analysisOptions: VoiceBulkAnalysisOptions = options
  ) => {
    if (selectedRecordings.length === 0) {
      toast.error('No recordings selected');
      return;
    }

    cancelRef.current = false;

    const newSession: VoiceBulkSession = {
      id: crypto.randomUUID(),
      status: 'running',
      totalItems: selectedRecordings.length,
      processedItems: 0,
      failedItems: 0,
      currentItemId: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      totalCostCents: 0,
    };

    setSession(newSession);
    toast.info(`Starting voice analysis for ${selectedRecordings.length} recordings...`);

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
        processedItems: i 
      } : null);

      try {
        console.log(`[VoiceBulkAnalysis] Processing ${i + 1}/${selectedRecordings.length}: ${recording.title}`);

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
      completedAt: new Date().toISOString(),
      currentItemId: null,
    } : null);

    toast.success('Voice analysis complete!');

    // Refresh recordings to update status
    await fetchRecordings(profileId);
  }, [options, profileId, fetchRecordings]);

  // Pause/cancel analysis
  const pauseAnalysis = useCallback(() => {
    cancelRef.current = true;
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    setSession(null);
    cancelRef.current = false;
  }, []);

  // Get unanalyzed recordings count
  const unanalyzedCount = recordings.filter(r => !r.hasVoiceInsights).length;

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
  };
}
