import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { localAudioAnalyzer, localWhisperTranscriber, type BatchAnalysisProgress, type LanguageDetectionResult } from '@/lib/ml';
import { type WhisperModel, isLanguageSupported, getLanguageDisplay } from '@/lib/ml/localWhisperTranscriber';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface VoiceRecording {
  id: string;
  title: string;
  audio_url: string;
  storage_path?: string; // For generating signed URLs to access private bucket files
  duration_seconds: number | null;
  recording_type: string;
  transcription_status: string;
  status: string;
  profile_id: string | null;
  created_at: string;
  hasVoiceInsights?: boolean;
  source: 'voice_recording_sessions' | 'media';
  // Language detection fields
  detectedLanguage?: string;
  detectedLanguageName?: string;
  languageFlag?: string;
  languageSource?: 'detected' | 'manual' | 'stored';
}

export interface VoiceBulkAnalysisOptions {
  transcription: boolean;
  speakerDiarization: boolean;
  vocalPsychology: boolean;
  contentIntelligence: boolean;
  voiceBiometrics: boolean;
}

export type ProcessingMode = 'local' | 'cloud' | 'hybrid';

export interface FailedRecording {
  recording: VoiceRecording;
  error: string;
  errorType: 'timeout' | 'empty' | 'network' | 'ml' | 'audio_format' | 'unknown';
  canRetry: boolean;
}

export interface SkippedRecording {
  recording: VoiceRecording;
  reason: 'unsupported_language' | 'detection_failed';
  detectedLanguage?: string;
  detectedLanguageName?: string;
  modelUsed: WhisperModel;
}

// Database session for persistence/recovery
export interface VoiceAnalysisDbSession {
  id: string;
  user_id: string;
  profile_id: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  processing_mode: string;
  whisper_model: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  skipped_items: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface VoiceBulkSession {
  id: string;
  dbSessionId?: string; // Link to database session for persistence
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  phase: 'initializing' | 'model_loading' | 'language_scanning' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  skippedItems: number;
  currentItemId: string | null;
  currentFileName?: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  totalCostCents: number;
  processingMode: ProcessingMode;
  modelStatus?: 'loading' | 'ready';
  modelProgress?: number;
  failedRecordings?: FailedRecording[];
  skippedRecordings?: SkippedRecording[];
  // Download progress tracking
  modelDownloadStartTime?: number;
  modelDownloadSpeedMBps?: number;
  // Backend processing indicator
  isBackendProcessing?: boolean;
}

// Error classification for better user feedback
const classifyError = (error: Error): { type: 'timeout' | 'empty' | 'network' | 'ml' | 'audio_format' | 'unknown'; canRetry: boolean; message: string } => {
  const msg = error.message.toLowerCase();
  
  // Audio decode/format errors (non-retryable)
  if (msg.includes('decodeaudiodata') || msg.includes('unable to decode') || 
      msg.includes('encoding error') || msg.includes('invalid audio')) {
    return { type: 'audio_format', canRetry: false, message: 'Audio format not supported or file corrupted' };
  }
  
  if (msg.includes('timeout')) {
    return { type: 'timeout', canRetry: true, message: 'File took too long to process' };
  }
  if (msg.includes('no transcription') || msg.includes('no speech')) {
    return { type: 'empty', canRetry: false, message: 'No speech detected in audio' };
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('not accessible')) {
    return { type: 'network', canRetry: true, message: 'Failed to download audio file' };
  }
  if (msg.includes('webgpu') || msg.includes('wasm') || msg.includes('ml engine')) {
    return { type: 'ml', canRetry: false, message: 'ML engine error' };
  }
  
  return { type: 'unknown', canRetry: true, message: error.message };
};

// Timeout wrapper to prevent hung files from blocking batch
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fileName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms processing "${fileName}"`));
    }, timeoutMs);
    
    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const DEFAULT_OPTIONS: VoiceBulkAnalysisOptions = {
  transcription: true,
  speakerDiarization: true,
  vocalPsychology: true,
  contentIntelligence: true,
  voiceBiometrics: false,
};

// Per-file timeout in milliseconds (60 seconds for local, 120 for cloud)
const LOCAL_TIMEOUT_MS = 60000;
const CLOUD_TIMEOUT_MS = 120000;
// Model initialization timeout (30 seconds)
const MODEL_INIT_TIMEOUT_MS = 30000;
// Stall detection threshold (2 minutes without progress)
const STALL_DETECTION_MS = 120000;
// Heartbeat interval for UI updates (5 seconds)
const HEARTBEAT_INTERVAL_MS = 5000;

export function useVoiceBulkAnalysis(profileId?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<VoiceBulkSession | null>(null);
  const [options, setOptions] = useState<VoiceBulkAnalysisOptions>(DEFAULT_OPTIONS);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('local');
  const [interruptedSession, setInterruptedSession] = useState<VoiceAnalysisDbSession | null>(null);
  const cancelRef = useRef(false);
  const lastProgressRef = useRef<{ items: number; time: number }>({ items: 0, time: Date.now() });
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileStartTimeRef = useRef<number>(0);

  // Check for interrupted sessions on mount
  useEffect(() => {
    if (!user?.id) return;

    const checkInterruptedSession = async () => {
      try {
        const { data: interrupted } = await supabase
          .from('voice_analysis_sessions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['running', 'paused'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (interrupted) {
          setInterruptedSession(interrupted as unknown as VoiceAnalysisDbSession);
        }
      } catch (error) {
        console.warn('[VoiceBulkAnalysis] Error checking for interrupted sessions:', error);
      }
    };

    checkInterruptedSession();
  }, [user?.id]);

  // Subscribe to realtime updates for backend processing
  useEffect(() => {
    if (!session?.dbSessionId) return;

    const channel = supabase
      .channel(`voice-session-${session.dbSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'voice_analysis_sessions',
          filter: `id=eq.${session.dbSessionId}`
        },
        (payload) => {
          const dbSession = payload.new as VoiceAnalysisDbSession;
          setSession(prev => prev ? {
            ...prev,
            processedItems: dbSession.completed_items,
            failedItems: dbSession.failed_items,
            skippedItems: dbSession.skipped_items,
            status: dbSession.status as VoiceBulkSession['status'],
            completedAt: dbSession.completed_at,
          } : null);

          if (dbSession.status === 'completed') {
            toast.success('Voice analysis completed in background!');
            fetchRecordings(profileId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.dbSessionId, profileId]);

  // Create database session for persistence
  const createDbSession = useCallback(async (
    selectedRecordings: VoiceRecording[],
    mode: ProcessingMode,
    whisperModel: WhisperModel
  ): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('voice_analysis_sessions')
        .insert({
          user_id: user.id,
          profile_id: profileId || null,
          status: 'running',
          processing_mode: mode,
          whisper_model: whisperModel,
          total_items: selectedRecordings.length,
          completed_items: 0,
          failed_items: 0,
          skipped_items: 0,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create items for each recording
      const items = selectedRecordings.map((rec, idx) => ({
        session_id: data.id,
        media_id: rec.source === 'media' ? rec.id : null,
        recording_id: rec.source === 'voice_recording_sessions' ? rec.id : null,
        source: rec.source,
        file_url: rec.audio_url,
        storage_path: rec.storage_path || null, // For signed URL generation in backend
        file_name: rec.title,
        status: 'pending',
        queue_position: idx,
      }));

      const { error: itemsError } = await supabase
        .from('voice_analysis_items')
        .insert(items);

      if (itemsError) {
        console.warn('[VoiceBulkAnalysis] Failed to create items:', itemsError);
      }

      return data.id;
    } catch (error) {
      console.error('[VoiceBulkAnalysis] Failed to create DB session:', error);
      toast.warning('Session persistence unavailable - processing will continue locally');
      return null;
    }
  }, [user?.id, profileId]);

  // Update item status in database
  const updateDbItemStatus = useCallback(async (
    dbSessionId: string,
    recordingId: string,
    status: 'completed' | 'failed' | 'skipped',
    result?: { transcription?: string; language?: string; error?: string }
  ) => {
    try {
      const updateData: Record<string, unknown> = {
        status,
        completed_at: new Date().toISOString(),
      };

      if (result?.transcription) updateData.transcription_text = result.transcription;
      if (result?.language) updateData.detected_language = result.language;
      if (result?.error) updateData.error_message = result.error;

      await supabase
        .from('voice_analysis_items')
        .update(updateData)
        .eq('session_id', dbSessionId)
        .or(`media_id.eq.${recordingId},recording_id.eq.${recordingId}`);

      // Increment session progress
      await supabase.rpc('increment_voice_session_progress', {
        p_session_id: dbSessionId,
        p_is_completed: status === 'completed',
        p_is_failed: status === 'failed',
        p_is_skipped: status === 'skipped',
      });
    } catch (error) {
      console.warn('[VoiceBulkAnalysis] Failed to update item status:', error);
    }
  }, []);

  // Finalize database session when processing completes
  const finalizeDbSession = useCallback(async (
    dbSessionId: string,
    status: 'completed' | 'failed' | 'cancelled' | 'paused'
  ) => {
    try {
      await supabase
        .from('voice_analysis_sessions')
        .update({ 
          status,
          completed_at: status !== 'paused' ? new Date().toISOString() : null,
          current_item_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbSessionId);
      
      console.log(`[VoiceBulkAnalysis] Database session ${dbSessionId} marked as ${status}`);
    } catch (error) {
      console.warn('[VoiceBulkAnalysis] Failed to finalize session:', error);
    }
  }, []);

  // Continue processing in backend
  const continueInBackground = useCallback(async () => {
    if (!session?.dbSessionId) {
      toast.error('No active session to continue');
      return;
    }

    try {
      // Mark session as backend processing
      setSession(prev => prev ? { ...prev, isBackendProcessing: true } : null);

      const { error } = await invokeFunction('process-voice-analysis-runner', { sessionId: session.dbSessionId, action: 'continue' });

      if (error) throw error;

      toast.success('Analysis continuing in background. You can close this tab.');
    } catch (error) {
      console.error('[VoiceBulkAnalysis] Failed to continue in background:', error);
      toast.error('Failed to start background processing');
      setSession(prev => prev ? { ...prev, isBackendProcessing: false } : null);
    }
  }, [session?.dbSessionId]);

  // Resume interrupted session
  const resumeInterruptedSession = useCallback(async () => {
    if (!interruptedSession) return;

    try {
      const { error } = await invokeFunction('process-voice-analysis-runner', { sessionId: interruptedSession.id, action: 'continue' });

      if (error) throw error;

      // Set up local session to track progress
      setSession({
        id: crypto.randomUUID(),
        dbSessionId: interruptedSession.id,
        status: 'running',
        phase: 'processing',
        totalItems: interruptedSession.total_items,
        processedItems: interruptedSession.completed_items,
        failedItems: interruptedSession.failed_items,
        skippedItems: interruptedSession.skipped_items,
        currentItemId: null,
        startedAt: interruptedSession.started_at,
        completedAt: null,
        error: null,
        totalCostCents: 0,
        processingMode: interruptedSession.processing_mode as ProcessingMode,
        isBackendProcessing: true,
      });

      setInterruptedSession(null);
      toast.success('Resuming interrupted session in background...');
    } catch (error) {
      console.error('[VoiceBulkAnalysis] Failed to resume session:', error);
      toast.error('Failed to resume session');
    }
  }, [interruptedSession]);

  // Discard interrupted session
  const discardInterruptedSession = useCallback(async () => {
    if (!interruptedSession) return;

    try {
      await supabase
        .from('voice_analysis_sessions')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', interruptedSession.id);

      setInterruptedSession(null);
      toast.info('Interrupted session discarded');
    } catch (error) {
      console.error('[VoiceBulkAnalysis] Failed to discard session:', error);
    }
  }, [interruptedSession]);

  // Stall detection - auto-recover if no progress for 2 minutes
  useEffect(() => {
    if (!session?.dbSessionId || session.status !== 'running' || session.isBackendProcessing) {
      return;
    }

    // Reset progress tracker when session starts
    lastProgressRef.current = { items: session.processedItems, time: Date.now() };

    const stallCheckInterval = setInterval(() => {
      const currentProcessed = session.processedItems;
      const timeSinceProgress = Date.now() - lastProgressRef.current.time;

      if (currentProcessed === lastProgressRef.current.items && timeSinceProgress > STALL_DETECTION_MS) {
        // Stalled for 2+ minutes - auto-trigger backend
        console.warn('[VoiceBulkAnalysis] Stall detected - transferring to backend...');
        toast.warning('Processing stalled - transferring to cloud backend...', { duration: 5000 });
        continueInBackground();
      } else if (currentProcessed > lastProgressRef.current.items) {
        // Progress was made - update tracker
        lastProgressRef.current = { items: currentProcessed, time: Date.now() };
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(stallCheckInterval);
  }, [session?.dbSessionId, session?.status, session?.isBackendProcessing, session?.processedItems, continueInBackground]);

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

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
        .select('id, caption, file_url, storage_path, file_size, mime_type, profile_id, created_at, detected_language')
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
      
      // Normalize media audio files with language data
      const mediaRecordings: VoiceRecording[] = (mediaResult.data || []).map(r => {
        const langDisplay = r.detected_language ? getLanguageDisplay(r.detected_language) : null;
        return {
          id: r.id,
          title: r.caption || r.file_url?.split('/').pop() || 'Audio File',
          audio_url: r.file_url || '',
          storage_path: r.storage_path || undefined, // For signed URL generation
          duration_seconds: null,
          recording_type: r.mime_type?.includes('opus') ? 'voice_note' : 'audio',
          transcription_status: 'pending',
          status: 'ready',
          profile_id: r.profile_id,
          created_at: r.created_at,
          source: 'media' as const,
          detectedLanguage: r.detected_language || undefined,
          detectedLanguageName: langDisplay?.name,
          languageFlag: langDisplay?.flag,
          languageSource: r.detected_language ? 'stored' as const : undefined,
        };
      });
      
      // Merge all recordings
      const allRecordings = [...sessionRecordings, ...mediaRecordings];
      
      // Check which already have voice insights
      // Use profile_id query instead of .in() with 800+ IDs to avoid URL length limits
      const recordingIds = allRecordings.map(r => r.id);
      const recordingIdSet = new Set(recordingIds);
      
      let insightSourceIds = new Set<string>();
      
      try {
        // Query by profile_id to get a short URL, then filter locally
        const { data: existingInsights, error: insightsError } = await supabase
          .from('voice_insights')
          .select('source_id')
          .eq('profile_id', profileId!);
        
        if (insightsError) {
          console.error('[VoiceBulkAnalysis] Failed to check voice_insights:', insightsError);
          // Continue with empty set - users can still analyze, just won't see "Analyzed" badges
        } else {
          // Filter to only include source_ids that match our recordings
          insightSourceIds = new Set(
            (existingInsights || [])
              .map(i => i.source_id)
              .filter((id): id is string => id !== null && recordingIdSet.has(id))
          );
        }
      } catch (queryError) {
        console.error('[VoiceBulkAnalysis] Exception checking voice_insights:', queryError);
      }
      
      console.log(`[VoiceBulkAnalysis] Found ${insightSourceIds.size} existing insights for ${recordingIds.length} recordings`);
      
      const recordingsWithStatus: VoiceRecording[] = allRecordings.map(r => ({
        ...r,
        hasVoiceInsights: insightSourceIds.has(r.id),
      }));
      
      // Force new array reference to ensure React re-render
      setRecordings([...recordingsWithStatus]);
      return recordingsWithStatus;
    } catch (error) {
      console.error('[VoiceBulkAnalysis] Error fetching recordings:', error);
      toast.error('Failed to load voice recordings');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  // Sync analysis status to media table for cross-system tracking
  const syncMediaAnalysisStatus = useCallback(async (
    recording: VoiceRecording,
    analysisModes: string[],
    detectedLanguage?: string
  ): Promise<void> => {
    // Only sync if source is 'media' table (not voice_recording_sessions)
    if (recording.source !== 'media') return;

    try {
      // Fetch existing completed modes
      const { data: existing } = await supabase
        .from('media')
        .select('completed_analysis_modes')
        .eq('id', recording.id)
        .single();

      const existingModes = (existing?.completed_analysis_modes as string[]) || [];
      const allModes = [...new Set([...existingModes, ...analysisModes])];

      // Build update object
      const updateData: Record<string, unknown> = {
        completed_analysis_modes: allModes,
        last_analysis_at: new Date().toISOString(),
        ai_generation_status: 'completed',
      };

      // Add language if detected
      if (detectedLanguage) {
        updateData.detected_language = detectedLanguage;
      }

      // Update media record
      await supabase
        .from('media')
        .update(updateData)
        .eq('id', recording.id);

      console.log(`[VoiceBulkAnalysis] Synced media ${recording.id} with modes: ${allModes.join(', ')}${detectedLanguage ? `, lang: ${detectedLanguage}` : ''}`);
    } catch (error) {
      console.warn('[VoiceBulkAnalysis] Failed to sync media status:', error);
      // Non-fatal - continue processing
    }
  }, []);

  // Get accessible URL - prefer signed URL for private bucket access
  const getAccessibleUrl = useCallback(async (recording: VoiceRecording): Promise<string> => {
    // If we have storage_path, generate a fresh signed URL for private bucket access
    if (recording.storage_path) {
      try {
        const { data, error } = await supabase.storage
          .from('media')
          .createSignedUrl(recording.storage_path, 3600); // 1 hour expiry
        
        if (!error && data?.signedUrl) {
          console.log(`[VoiceBulkAnalysis] Generated signed URL for ${recording.title}`);
          return data.signedUrl;
        }
        console.warn('[VoiceBulkAnalysis] Signed URL failed, falling back to public URL:', error);
      } catch (err) {
        console.warn('[VoiceBulkAnalysis] Error generating signed URL:', err);
      }
    }
    
    // Fallback to original URL (for public buckets or missing storage_path)
    return recording.audio_url;
  }, []);

  // Process single recording locally (WebGPU Whisper)
  const processLocalRecording = useCallback(async (
    recording: VoiceRecording,
    userId: string
  ): Promise<{ success: boolean; processingTimeMs: number; detectedLanguage?: string }> => {
    // Get accessible URL (signed for private bucket)
    const accessibleUrl = await getAccessibleUrl(recording);
    
    const result = await localAudioAnalyzer.analyzeAudioFile(accessibleUrl, {
      transcribe: true,
      analyzeSentiment: true
    });

    if (!result.transcription?.text) {
      throw new Error('No transcription generated');
    }

    const detectedLang = result.detectedLanguage?.languageCode || result.transcription?.language || 'unknown';

    // Map source to valid constraint value
    const sourceType = recording.source === 'voice_recording_sessions' ? 'voice_recording_session' : 'media';

    // Store results in voice_insights with language - using correct column names
    const insightData = {
      source_type: sourceType,
      source_id: recording.id,
      profile_id: recording.profile_id,
      user_id: userId,
      full_transcription: result.transcription.text,
      transcription_with_timestamps: result.transcription.chunks as unknown as Record<string, unknown>[],
      confidence_score: result.sentiment?.confidence || 0.5,
      ai_model_used: 'local_whisper_turbo',
      processing_time_ms: result.totalProcessingMs,
      language_detected: detectedLang,
      created_at: new Date().toISOString()
    };
    
    // Use type assertion to bypass strict type checking for correct column names
    // The main types.ts is auto-generated and may lag behind actual schema
    const { error: insertError } = await (supabase
      .from('voice_insights') as unknown as { upsert: (data: typeof insightData, options?: { onConflict: string }) => Promise<{ error: Error | null }> })
      .upsert(insightData, {
        onConflict: 'source_id'
      });

    if (insertError) {
      console.error('[VoiceBulkAnalysis] Failed to save insights:', insertError);
      throw new Error(`Failed to save transcription: ${insertError.message}`);
    }
    
    // Sync status to media table for cross-system tracking + language
    await syncMediaAnalysisStatus(recording, ['voice_transcription'], detectedLang);

    return { success: true, processingTimeMs: result.totalProcessingMs, detectedLanguage: detectedLang };
  }, [syncMediaAnalysisStatus, getAccessibleUrl]);

  // Start bulk analysis with mode selection
  const startBulkAnalysis = useCallback(async (
    selectedRecordings: VoiceRecording[],
    analysisOptions: VoiceBulkAnalysisOptions = options,
    mode: ProcessingMode = processingMode,
    whisperModel: WhisperModel = 'small'
  ) => {
    if (selectedRecordings.length === 0) {
      toast.error('No recordings selected');
      return;
    }

    cancelRef.current = false;

    // Create database session for persistence
    const dbSessionId = await createDbSession(selectedRecordings, mode, whisperModel);
    
    const newSession: VoiceBulkSession = {
      id: crypto.randomUUID(),
      dbSessionId: dbSessionId || undefined,
      status: 'running',
      phase: mode === 'local' || mode === 'hybrid' ? 'model_loading' : 'processing',
      totalItems: selectedRecordings.length,
      processedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      currentItemId: null,
      currentFileName: undefined,
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      totalCostCents: 0,
      processingMode: mode,
      modelStatus: mode === 'local' || mode === 'hybrid' ? 'loading' : 'ready',
      modelProgress: 0,
      skippedRecordings: [],
      isBackendProcessing: false,
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

    // Initialize local model if needed (with timeout for recovery)
    let actualMode = mode; // Track if we fall back
    if (mode === 'local' || mode === 'hybrid') {
      try {
        console.log(`[VoiceBulkAnalysis] Loading Whisper model: ${whisperModel}`);
        
        // Track download timing for speed calculation
        const downloadStartTime = performance.now();
        let lastProgress = 0;
        let lastTime = downloadStartTime;
        
        // Model sizes in MB for speed calculation
        const modelSizes: Record<WhisperModel, number> = {
          tiny: 75, small: 250, distil: 750, turbo: 800
        };
        const totalSize = modelSizes[whisperModel] || 250;
        
        // Wrap initialization with timeout for fast failure
        const initPromise = localAudioAnalyzer.initialize({
          whisperModel: whisperModel,
          onProgress: (progress) => {
            if (progress.status === 'progress') {
              const now = performance.now();
              const progressDelta = (progress.progress || 0) - lastProgress;
              const timeDelta = (now - lastTime) / 1000; // seconds
              
              // Calculate speed (MB/s) based on progress percentage and model size
              const speedMBps = timeDelta > 0.1 ? (progressDelta / 100 * totalSize) / timeDelta : 0;
              
              setSession(prev => prev ? {
                ...prev,
                modelProgress: progress.progress,
                modelDownloadStartTime: downloadStartTime,
                modelDownloadSpeedMBps: speedMBps > 0.1 ? speedMBps : prev.modelDownloadSpeedMBps
              } : null);
              
              lastProgress = progress.progress || 0;
              lastTime = now;
            }
          }
        });

        // Add timeout for model initialization
        await withTimeout(initPromise, MODEL_INIT_TIMEOUT_MS, 'Model initialization');
        setSession(prev => prev ? { ...prev, modelStatus: 'ready', phase: 'processing' } : null);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const isTimeout = errorMsg.includes('Timeout');
        
        console.error('[VoiceBulkAnalysis] Failed to load local model:', errorMsg);
        toast.warning(
          isTimeout 
            ? 'Model loading timed out. Switching to cloud processing.' 
            : 'Failed to load local ML model. Falling back to cloud.'
        );
        // Fall back to cloud
        actualMode = 'cloud';
        setSession(prev => prev ? { ...prev, processingMode: 'cloud', phase: 'processing' } : null);
      }
    }

    // ============ CAPABILITY PROBE ============
    // Test if we can decode the first file before committing to processing all
    // This prevents wasting time on unsupported formats (e.g., WhatsApp .opus in some browsers)
    if ((actualMode === 'local' || actualMode === 'hybrid') && selectedRecordings.length > 0) {
      const firstRecording = selectedRecordings[0];
      console.log(`[VoiceBulkAnalysis] Running capability probe on first file: ${firstRecording.title}`);
      setSession(prev => prev ? { ...prev, phase: 'initializing', currentFileName: 'Testing audio format...' } : null);
      
      try {
        // Get signed URL for private bucket
        const testUrl = await getAccessibleUrl(firstRecording);
        const canDecode = await localWhisperTranscriber.testDecode(testUrl);
        
        if (!canDecode) {
          throw new Error('Audio format not decodable locally');
        }
        console.log('[VoiceBulkAnalysis] Capability probe passed - format is supported');
      } catch (probeError) {
        const errMsg = probeError instanceof Error ? probeError.message : 'Unknown error';
        console.warn('[VoiceBulkAnalysis] Capability probe failed:', errMsg);
        
        // Check if it's an audio format issue
        const isFormatError = errMsg.toLowerCase().includes('audio') || 
                              errMsg.toLowerCase().includes('decode') ||
                              errMsg.toLowerCase().includes('opus');
        
        if (isFormatError) {
          toast.warning(
            'Local decoding for this audio format is not fully supported on your browser. Switching to Cloud processing.',
            { duration: 6000 }
          );
          actualMode = 'cloud';
          setSession(prev => prev ? { ...prev, processingMode: 'cloud', phase: 'processing' } : null);
        } else {
          // Other error - might still work, proceed with local
          console.log('[VoiceBulkAnalysis] Non-format error in probe, continuing with local...');
        }
      }
    }

    const failedRecordingsTracker: FailedRecording[] = [];
    const skippedRecordingsTracker: SkippedRecording[] = [];

    // Pre-scan for language compatibility if using english-only model
    let recordingsToProcess = [...selectedRecordings];
    if (whisperModel === 'tiny' && (mode === 'local' || mode === 'hybrid')) {
      console.log('[VoiceBulkAnalysis] Pre-scanning for language compatibility (tiny model is English-only)...');
      setSession(prev => prev ? { ...prev, phase: 'language_scanning', currentFileName: 'Detecting languages...' } : null);
      
      const compatibleRecordings: VoiceRecording[] = [];
      
      for (const recording of selectedRecordings) {
        try {
          // Use stored language if available, otherwise detect
          let langCode = recording.detectedLanguage;
          let langName = recording.detectedLanguageName;
          
          if (!langCode) {
            const langResult = await localAudioAnalyzer.detectLanguage(recording.audio_url, whisperModel);
            langCode = langResult.languageCode;
            langName = langResult.languageName;
          }
          
          if (langCode && langCode !== 'en' && langCode !== 'unknown') {
            // Non-English file - skip it
            skippedRecordingsTracker.push({
              recording,
              reason: 'unsupported_language',
              detectedLanguage: langCode,
              detectedLanguageName: langName || langCode,
              modelUsed: whisperModel
            });
            console.log(`[VoiceBulkAnalysis] Skipping "${recording.title}" - detected as ${langName || langCode} (not supported by Tiny model)`);
          } else {
            compatibleRecordings.push(recording);
          }
        } catch (error) {
          // Detection failed - still try to process
          compatibleRecordings.push(recording);
        }
      }
      
      recordingsToProcess = compatibleRecordings;
      
      if (skippedRecordingsTracker.length > 0) {
        const skippedLangs = new Set(skippedRecordingsTracker.map(s => s.detectedLanguageName || s.detectedLanguage));
        toast.warning(
          `${skippedRecordingsTracker.length} files skipped - ${Array.from(skippedLangs).join(', ')} not supported by Tiny model`,
          { duration: 5000 }
        );
        
        setSession(prev => prev ? {
          ...prev,
          skippedItems: skippedRecordingsTracker.length,
          skippedRecordings: [...skippedRecordingsTracker],
          totalItems: compatibleRecordings.length
        } : null);
      }
      
      if (recordingsToProcess.length === 0) {
        setSession(prev => prev ? {
          ...prev,
          status: 'completed',
          phase: 'completed',
          completedAt: new Date().toISOString()
        } : null);
        toast.info('No compatible files to process. Try a multilingual model (Small, Distil, or Turbo).');
        return;
      }
    }

    setSession(prev => prev ? { ...prev, phase: 'processing' } : null);
    // Main processing loop (using filtered recordingsToProcess)
    for (let i = 0; i < recordingsToProcess.length; i++) {
      if (cancelRef.current) {
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        setSession(prev => prev ? { 
          ...prev, 
          status: 'paused', 
          failedRecordings: failedRecordingsTracker,
          skippedRecordings: skippedRecordingsTracker 
        } : null);
        
        // Update database session to paused status
        if (dbSessionId) {
          await finalizeDbSession(dbSessionId, 'paused');
        }
        
        toast.info('Analysis paused');
        return;
      }

      const recording = recordingsToProcess[i];
      fileStartTimeRef.current = Date.now();
      
      setSession(prev => prev ? { 
        ...prev, 
        currentItemId: recording.id,
        currentFileName: recording.title || 'Audio file',
        processedItems: i 
      } : null);

      // Start heartbeat for UI feedback
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - fileStartTimeRef.current) / 1000);
        setSession(prev => prev ? {
          ...prev,
          currentFileName: `${recording.title || 'Audio file'} (${elapsed}s elapsed...)`
        } : null);
      }, HEARTBEAT_INTERVAL_MS);

      try {
        console.log(`[VoiceBulkAnalysis] Processing ${i + 1}/${recordingsToProcess.length}: ${recording.title} (${actualMode})`);

        if (actualMode === 'local') {
          // Pure local processing with timeout
          await withTimeout(
            processLocalRecording(recording, user.id),
            LOCAL_TIMEOUT_MS,
            recording.title || 'Audio file'
          );
          setSession(prev => prev ? {
            ...prev,
            processedItems: i + 1,
          } : null);
          
          // Update DB status if session exists
          if (dbSessionId) {
            await updateDbItemStatus(dbSessionId, recording.id, 'completed');
          }

        } else if (actualMode === 'hybrid') {
          // Local transcription first with timeout, then cloud for advanced analysis
          await withTimeout(
            processLocalRecording(recording, user.id),
            LOCAL_TIMEOUT_MS,
            recording.title || 'Audio file'
          );
          
          // Build modes list for sync
          const completedModes = ['voice_transcription'];
          
          // Optional: send to cloud for deep psychological analysis
          if (analysisOptions.vocalPsychology || analysisOptions.contentIntelligence) {
            const { data, error } = await invokeFunction('analyze-voice-comprehensive', {
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
              });
            
            if (error) {
              console.warn('[VoiceBulkAnalysis] Cloud enhancement failed:', error);
            } else {
              // Add cloud analysis modes
              if (analysisOptions.vocalPsychology) completedModes.push('voice_psychology');
              if (analysisOptions.contentIntelligence) completedModes.push('voice_content_intelligence');
            }
            
            // Sync all completed modes to media table
            await syncMediaAnalysisStatus(recording, completedModes);
            
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
          
          // Update DB status if session exists
          if (dbSessionId) {
            await updateDbItemStatus(dbSessionId, recording.id, 'completed');
          }

        } else {
          // Pure cloud processing with timeout
          // Fix: Use correct sourceType based on recording source
          const sourceType = recording.source === 'media' ? 'media' : 'voice_recording';
          console.log(`[VoiceBulkAnalysis] Cloud processing ${recording.id} with sourceType: ${sourceType}`);
          
          const cloudPromise = invokeFunction('analyze-voice-comprehensive', {
              audioUrl: recording.audio_url,
              sourceType,
              sourceId: recording.id,
              profileId: recording.profile_id,
              options: {
                transcription: analysisOptions.transcription,
                speakerDiarization: analysisOptions.speakerDiarization,
                vocalPsychology: analysisOptions.vocalPsychology,
                contentIntelligence: analysisOptions.contentIntelligence,
                voiceBiometrics: analysisOptions.voiceBiometrics,
              },
            });

          const { data, error } = await withTimeout(cloudPromise, CLOUD_TIMEOUT_MS, recording.title || 'Audio file');

          if (error) throw error;

          // Sync to media table (edge function also syncs, but ensure client-side backup)
          const cloudModes = ['voice_transcription'];
          if (analysisOptions.vocalPsychology) cloudModes.push('voice_psychology');
          if (analysisOptions.contentIntelligence) cloudModes.push('voice_content_intelligence');
          await syncMediaAnalysisStatus(recording, cloudModes);

          setSession(prev => prev ? {
            ...prev,
            processedItems: i + 1,
            totalCostCents: prev.totalCostCents + (data?.costCents || 0),
          } : null);
          
          // Update DB status if session exists
          if (dbSessionId) {
            await updateDbItemStatus(dbSessionId, recording.id, 'completed');
          }
        }

        // Clear heartbeat on success
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

      } catch (error) {
        // Clear heartbeat on error
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        const err = error instanceof Error ? error : new Error('Unknown error');
        const classified = classifyError(err);
        
        console.error(`[VoiceBulkAnalysis] Failed to analyze recording ${recording.id}:`, err.message, `(${classified.type})`);
        
        failedRecordingsTracker.push({
          recording,
          error: classified.message,
          errorType: classified.type,
          canRetry: classified.canRetry,
        });
        
        setSession(prev => prev ? {
          ...prev,
          failedItems: prev.failedItems + 1,
          processedItems: i + 1,
          failedRecordings: [...failedRecordingsTracker],
        } : null);
        
        // Update DB status if session exists
        if (dbSessionId) {
          await updateDbItemStatus(dbSessionId, recording.id, 'failed', { error: classified.message });
        }
      }
    }

    // Automatic retry for recoverable failures (once)
    const retryableFailures = failedRecordingsTracker.filter(f => f.canRetry);
    if (retryableFailures.length > 0 && retryableFailures.length < failedRecordingsTracker.length * 0.5) {
      console.log(`[VoiceBulkAnalysis] Auto-retrying ${retryableFailures.length} recoverable failures...`);
      
      for (const { recording } of retryableFailures) {
        try {
          setSession(prev => prev ? { 
            ...prev, 
            currentItemId: recording.id,
            currentFileName: `[Retry] ${recording.title || 'Audio file'}`,
          } : null);
          
          if (actualMode === 'local' || actualMode === 'hybrid') {
            await withTimeout(
              processLocalRecording(recording, user.id),
              LOCAL_TIMEOUT_MS * 1.5, // Extra time for retry
              recording.title || 'Audio file'
            );
          }
          
          // Remove from failed list on success
          const idx = failedRecordingsTracker.findIndex(f => f.recording.id === recording.id);
          if (idx >= 0) {
            failedRecordingsTracker.splice(idx, 1);
            setSession(prev => prev ? {
              ...prev,
              failedItems: prev.failedItems - 1,
              failedRecordings: [...failedRecordingsTracker],
            } : null);
          }
        } catch (retryError) {
          console.warn(`[VoiceBulkAnalysis] Retry failed for ${recording.id}`);
        }
      }
    }

    setSession(prev => prev ? {
      ...prev,
      status: 'completed',
      phase: 'completed',
      completedAt: new Date().toISOString(),
      currentItemId: null,
      currentFileName: undefined,
      failedRecordings: failedRecordingsTracker,
      skippedRecordings: skippedRecordingsTracker,
    } : null);

    // Finalize database session to prevent "interrupted session" on refresh
    if (dbSessionId) {
      await finalizeDbSession(dbSessionId, 'completed');
    }

    const successCount = recordingsToProcess.length - failedRecordingsTracker.length;
    const totalSkipped = skippedRecordingsTracker.length;
    
    if (failedRecordingsTracker.length === 0 && totalSkipped === 0) {
      toast.success(`Voice analysis complete! ${successCount} files processed.`);
    } else if (totalSkipped > 0 && failedRecordingsTracker.length === 0) {
      toast.success(`Analysis complete: ${successCount} processed, ${totalSkipped} skipped (incompatible language).`);
    } else {
      toast.warning(`Analysis complete: ${successCount} succeeded, ${failedRecordingsTracker.length} failed, ${totalSkipped} skipped.`);
    }

    // Wait for database transaction to fully commit before refreshing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Refresh recordings to update hasVoiceInsights status
    console.log('[VoiceBulkAnalysis] Refetching recordings after completion...');
    const updatedRecordings = await fetchRecordings(profileId);
    
    // Return analyzed IDs so the component can clear them from selection
    const analyzedIds = updatedRecordings
      .filter(r => r.hasVoiceInsights)
      .map(r => r.id);
    console.log(`[VoiceBulkAnalysis] ${analyzedIds.length} recordings now marked as analyzed`);
  }, [options, profileId, fetchRecordings, processingMode, processLocalRecording, syncMediaAnalysisStatus, finalizeDbSession, updateDbItemStatus, createDbSession, user?.id]);

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

  // Retry failed files from current session
  const retryFailedFiles = useCallback(async () => {
    if (!session?.failedRecordings || session.failedRecordings.length === 0) {
      toast.info('No failed files to retry');
      return;
    }

    const retryable = session.failedRecordings.filter(f => f.canRetry);
    if (retryable.length === 0) {
      toast.info('No recoverable failures to retry');
      return;
    }

    const recordingsToRetry = retryable.map(f => f.recording);
    await startBulkAnalysis(recordingsToRetry, options, processingMode);
  }, [session, options, processingMode, startBulkAnalysis]);

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
    retryFailedFiles,
    unanalyzedCount,
    processingMode,
    setProcessingMode,
    unloadModels,
    localModelStatus,
    // New persistence/recovery features
    interruptedSession,
    resumeInterruptedSession,
    discardInterruptedSession,
    continueInBackground,
  };
}
