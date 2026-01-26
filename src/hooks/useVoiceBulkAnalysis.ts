import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { localAudioAnalyzer, type BatchAnalysisProgress, type LanguageDetectionResult } from '@/lib/ml';
import { type WhisperModel, isLanguageSupported, getLanguageDisplay } from '@/lib/ml/localWhisperTranscriber';

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
  errorType: 'timeout' | 'empty' | 'network' | 'ml' | 'unknown';
  canRetry: boolean;
}

export interface SkippedRecording {
  recording: VoiceRecording;
  reason: 'unsupported_language' | 'detection_failed';
  detectedLanguage?: string;
  detectedLanguageName?: string;
  modelUsed: WhisperModel;
}

export interface VoiceBulkSession {
  id: string;
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
}

// Error classification for better user feedback
const classifyError = (error: Error): { type: 'timeout' | 'empty' | 'network' | 'ml' | 'unknown'; canRetry: boolean; message: string } => {
  const msg = error.message.toLowerCase();
  
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
        .select('id, caption, file_url, file_size, mime_type, profile_id, created_at, detected_language')
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

  // Process single recording locally (WebGPU Whisper)
  const processLocalRecording = useCallback(async (
    recording: VoiceRecording,
    userId: string
  ): Promise<{ success: boolean; processingTimeMs: number; detectedLanguage?: string }> => {
    const result = await localAudioAnalyzer.analyzeAudioFile(recording.audio_url, {
      transcribe: true,
      analyzeSentiment: true
    });

    if (!result.transcription?.text) {
      throw new Error('No transcription generated');
    }

    const detectedLang = result.detectedLanguage?.languageCode || result.transcription?.language || 'unknown';

    // Store results in voice_insights with language
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
      language_detected: detectedLang,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'source_id'
    });

    if (insertError) {
      console.error('[VoiceBulkAnalysis] Failed to save insights:', insertError);
    } else {
      // Sync status to media table for cross-system tracking + language
      await syncMediaAnalysisStatus(recording, ['voice_transcription'], detectedLang);
    }

    return { success: true, processingTimeMs: result.totalProcessingMs, detectedLanguage: detectedLang };
  }, [syncMediaAnalysisStatus]);

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

    const newSession: VoiceBulkSession = {
      id: crypto.randomUUID(),
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
      skippedRecordings: []
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
        console.log(`[VoiceBulkAnalysis] Loading Whisper model: ${whisperModel}`);
        
        // Track download timing for speed calculation
        let downloadStartTime = performance.now();
        let lastProgress = 0;
        let lastTime = downloadStartTime;
        
        // Model sizes in MB for speed calculation
        const modelSizes: Record<WhisperModel, number> = {
          tiny: 75, small: 250, distil: 750, turbo: 800
        };
        const totalSize = modelSizes[whisperModel] || 250;
        
        await localAudioAnalyzer.initialize({
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
        setSession(prev => prev ? { ...prev, modelStatus: 'ready', phase: 'processing' } : null);
      } catch (error) {
        console.error('[VoiceBulkAnalysis] Failed to load local model:', error);
        toast.error('Failed to load local ML model. Falling back to cloud.');
        // Fall back to cloud
        setSession(prev => prev ? { ...prev, processingMode: 'cloud' } : null);
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
        setSession(prev => prev ? { 
          ...prev, 
          status: 'paused', 
          failedRecordings: failedRecordingsTracker,
          skippedRecordings: skippedRecordingsTracker 
        } : null);
        toast.info('Analysis paused');
        return;
      }

      const recording = recordingsToProcess[i];
      setSession(prev => prev ? { 
        ...prev, 
        currentItemId: recording.id,
        currentFileName: recording.title || 'Audio file',
        processedItems: i 
      } : null);

      try {
        console.log(`[VoiceBulkAnalysis] Processing ${i + 1}/${recordingsToProcess.length}: ${recording.title} (${mode})`);

        if (mode === 'local') {
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

        } else if (mode === 'hybrid') {
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

        } else {
          // Pure cloud processing with timeout
          const cloudPromise = supabase.functions.invoke('analyze-voice-comprehensive', {
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
        }

      } catch (error) {
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
          
          if (mode === 'local' || mode === 'hybrid') {
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

    const successCount = recordingsToProcess.length - failedRecordingsTracker.length;
    const totalSkipped = skippedRecordingsTracker.length;
    
    if (failedRecordingsTracker.length === 0 && totalSkipped === 0) {
      toast.success(`Voice analysis complete! ${successCount} files processed.`);
    } else if (totalSkipped > 0 && failedRecordingsTracker.length === 0) {
      toast.success(`Analysis complete: ${successCount} processed, ${totalSkipped} skipped (incompatible language).`);
    } else {
      toast.warning(`Analysis complete: ${successCount} succeeded, ${failedRecordingsTracker.length} failed, ${totalSkipped} skipped.`);
    }

    // Refresh recordings to update status
    await fetchRecordings(profileId);
  }, [options, profileId, fetchRecordings, processingMode, processLocalRecording, syncMediaAnalysisStatus]);

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
  };
}
