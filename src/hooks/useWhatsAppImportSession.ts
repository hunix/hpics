import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  ImportSession,
  ImportStage,
  DuplicateAction,
  ParsedMessageState,
  MediaFileState,
  ProcessingMode,
  ServerSideProgress,
} from '@/components/import/whatsapp/types';

export function useWhatsAppImportSession(userId: string | undefined) {
  const [session, setSession] = useState<ImportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isPausedRef = useRef(false);

  const createSession = useCallback(async (
    profileId: string,
    fileName: string,
    fileSize: number
  ): Promise<ImportSession | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('whatsapp_import_sessions')
      .insert({
        user_id: userId,
        profile_id: profileId,
        file_name: fileName,
        file_size: fileSize,
        status: 'extracting',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create session:', error);
      return null;
    }

    const newSession: ImportSession = mapDbToSession(data);
    setSession(newSession);
    return newSession;
  }, [userId]);

  const updateSession = useCallback(async (
    updates: Partial<ImportSession>
  ): Promise<void> => {
    if (!session) return;

    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.totalMessages !== undefined) dbUpdates.total_messages = updates.totalMessages;
    if (updates.totalMediaFiles !== undefined) dbUpdates.total_media_files = updates.totalMediaFiles;
    if (updates.messagesImported !== undefined) dbUpdates.messages_imported = updates.messagesImported;
    if (updates.mediaUploaded !== undefined) dbUpdates.media_uploaded = updates.mediaUploaded;
    if (updates.skippedFiles !== undefined) dbUpdates.skipped_files = updates.skippedFiles;
    if (updates.failedFiles !== undefined) dbUpdates.failed_files = updates.failedFiles;
    if (updates.duplicateAction !== undefined) dbUpdates.duplicate_action = updates.duplicateAction;
    if (updates.existingConversationId !== undefined) dbUpdates.existing_conversation_id = updates.existingConversationId;
    if (updates.newConversationId !== undefined) dbUpdates.new_conversation_id = updates.newConversationId;
    if (updates.lastProcessedIndex !== undefined) dbUpdates.last_processed_index = updates.lastProcessedIndex;
    if (updates.parsedMessages !== undefined) dbUpdates.parsed_messages = updates.parsedMessages;
    if (updates.mediaFilesState !== undefined) dbUpdates.media_files_state = updates.mediaFilesState;
    if (updates.pausedAt !== undefined) dbUpdates.paused_at = updates.pausedAt;
    if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;

    await supabase
      .from('whatsapp_import_sessions')
      .update(dbUpdates)
      .eq('id', session.id);

    setSession(prev => prev ? { ...prev, ...updates } : null);
  }, [session]);

  const pauseSession = useCallback(async (): Promise<void> => {
    isPausedRef.current = true;
    await updateSession({
      status: 'paused',
      pausedAt: new Date().toISOString(),
    });
  }, [updateSession]);

  const resumeSession = useCallback(async (): Promise<void> => {
    isPausedRef.current = false;
    await updateSession({
      status: session?.status === 'paused' ? 'uploading_media' : session?.status,
      pausedAt: undefined,
    });
  }, [updateSession, session?.status]);

  const loadPendingSession = useCallback(async (): Promise<ImportSession | null> => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_import_sessions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['paused', 'uploading_media', 'importing_messages', 'resolving_duplicates'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const loadedSession = mapDbToSession(data);
      setSession(loadedSession);
      return loadedSession;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const discardSession = useCallback(async (): Promise<void> => {
    if (!session) return;

    await supabase
      .from('whatsapp_import_sessions')
      .delete()
      .eq('id', session.id);

    setSession(null);
    isPausedRef.current = false;
  }, [session]);

  const completeSession = useCallback(async (): Promise<void> => {
    await updateSession({ status: 'completed' });
    setSession(null);
  }, [updateSession]);

  const failSession = useCallback(async (errorMessage: string): Promise<void> => {
    await updateSession({ 
      status: 'failed',
      errorMessage,
    });
  }, [updateSession]);

  const shouldContinue = useCallback((): boolean => {
    return !isPausedRef.current;
  }, []);

  // Cleanup orphaned imports (empty conversations from failed imports)
  const cleanupOrphanedImports = useCallback(async (): Promise<{
    deletedConversations: number;
    deletedMedia: number;
  }> => {
    if (!userId) return { deletedConversations: 0, deletedMedia: 0 };

    // Find conversations with 0 messages
    const { data: emptyConversations } = await supabase
      .from('conversations')
      .select('id, profile_id')
      .eq('user_id', userId)
      .eq('platform', 'whatsapp')
      .or('message_count.eq.0,message_count.is.null');
    
    if (!emptyConversations || emptyConversations.length === 0) {
      return { deletedConversations: 0, deletedMedia: 0 };
    }

    let deletedMedia = 0;
    const conversationIds = emptyConversations.map(c => c.id);
    const profileIds = [...new Set(emptyConversations.map(c => c.profile_id))];
    
    // Find orphaned media for these profiles with whatsapp source
    for (const profileId of profileIds) {
      const { data: orphanedMedia } = await supabase
        .from('media')
        .select('id, storage_path')
        .match({ user_id: userId, profile_id: profileId, source: 'whatsapp' });
      
      if (orphanedMedia && orphanedMedia.length > 0) {
        const paths = orphanedMedia
          .map(m => m.storage_path)
          .filter((p): p is string => Boolean(p));
        
        if (paths.length > 0) {
          await supabase.storage.from('media').remove(paths);
        }
        
        const mediaIds = orphanedMedia.map(m => m.id);
        await supabase.from('media').delete().in('id', mediaIds);
        deletedMedia += orphanedMedia.length;
      }
    }

    // Delete empty conversations
    await supabase.from('conversations').delete().in('id', conversationIds);

    return { deletedConversations: conversationIds.length, deletedMedia };
  }, [userId]);

  // Check for orphaned imports
  const checkOrphanedImports = useCallback(async (): Promise<{
    hasOrphans: boolean;
    conversationCount: number;
  }> => {
    if (!userId) return { hasOrphans: false, conversationCount: 0 };

    const { data, count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('platform', 'whatsapp')
      .or('message_count.eq.0,message_count.is.null');

    return {
      hasOrphans: (count || 0) > 0,
      conversationCount: count || 0,
    };
  }, [userId]);

  return {
    session,
    isLoading,
    isPaused: isPausedRef.current,
    createSession,
    updateSession,
    pauseSession,
    resumeSession,
    loadPendingSession,
    discardSession,
    completeSession,
    failSession,
    shouldContinue,
    cleanupOrphanedImports,
    checkOrphanedImports,
  };
}

function mapDbToSession(data: Record<string, unknown>): ImportSession {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    profileId: data.profile_id as string,
    status: data.status as ImportStage,
    processingMode: (data.processing_mode as ProcessingMode) || 'client',
    fileName: data.file_name as string | undefined,
    fileSize: data.file_size as number | undefined,
    totalMessages: (data.total_messages as number) || 0,
    totalMediaFiles: (data.total_media_files as number) || 0,
    messagesImported: (data.messages_imported as number) || 0,
    mediaUploaded: (data.media_uploaded as number) || 0,
    skippedFiles: (data.skipped_files as Array<{ filename: string; reason: string }>) || [],
    failedFiles: (data.failed_files as Array<{ filename: string; error: string }>) || [],
    duplicateAction: (data.duplicate_action as DuplicateAction) || 'ask',
    existingConversationId: data.existing_conversation_id as string | undefined,
    newConversationId: data.new_conversation_id as string | undefined,
    lastProcessedIndex: (data.last_processed_index as number) || 0,
    parsedMessages: data.parsed_messages as ParsedMessageState[] | undefined,
    mediaFilesState: data.media_files_state as MediaFileState[] | undefined,
    pausedAt: data.paused_at as string | undefined,
    errorMessage: data.error_message as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    serverSessionId: data.server_session_id as string | undefined,
    serverProgress: data.server_progress as ServerSideProgress | undefined,
  };
}
