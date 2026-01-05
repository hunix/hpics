import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MessageCircle } from 'lucide-react';
import { ContactPicker } from '@/components/contacts/ContactPicker';
import type { Enums } from '@/integrations/supabase/types';

import { useWhatsAppImportSession } from '@/hooks/useWhatsAppImportSession';
import { WhatsAppImportDropzone } from './whatsapp/WhatsAppImportDropzone';
import { WhatsAppImportPreview } from './whatsapp/WhatsAppImportPreview';
import { WhatsAppImportProgress } from './whatsapp/WhatsAppImportProgress';
import { WhatsAppDuplicateResolver } from './whatsapp/WhatsAppDuplicateResolver';
import { WhatsAppResumeSession } from './whatsapp/WhatsAppResumeSession';

import { 
  extractMediaReference, 
  cleanMessageContent, 
  isSystemMessage, 
  isMediaOmitted,
  getMimeType,
  type MediaReference 
} from './whatsapp/whatsappMediaParser';
import { 
  processWhatsAppZip, 
  getMediaStats, 
  createMediaLookup,
  type ExtractedFile,
  type ZipContents,
} from './whatsapp/whatsappZipProcessor';
import {
  findExistingWhatsAppConversation,
  getExistingMessageHashes,
  createMessageHash,
  deleteConversationMessages,
} from './whatsapp/conversationDuplicates';
import {
  uploadMediaBatch,
  createInitialMediaState,
  updateMediaState,
} from './whatsapp/mediaUploadManager';
import type {
  ImportStage,
  DuplicateAction,
  MediaFileState,
  ImportStats,
  ExistingConversation,
} from './whatsapp/types';

interface ParsedMessage {
  date: Date;
  content: string;
  cleanContent: string;
  isFromContact: boolean;
  sender: string;
  mediaRef: MediaReference | null;
  mediaFile?: ExtractedFile;
}

export function WhatsAppImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Core state
  const [chatText, setChatText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [detectedNames, setDetectedNames] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [zipContents, setZipContents] = useState<ZipContents | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Parsed data
  const [allMessages, setAllMessages] = useState<ParsedMessage[]>([]);
  const [mediaFilesState, setMediaFilesState] = useState<MediaFileState[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  
  // Import state
  const [stage, setStage] = useState<ImportStage>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [messagesImported, setMessagesImported] = useState(0);
  const [mediaUploaded, setMediaUploaded] = useState(0);
  
  // Duplicate handling
  const [existingConversation, setExistingConversation] = useState<ExistingConversation | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('ask');
  const [showDuplicateResolver, setShowDuplicateResolver] = useState(false);
  
  // Session management
  const {
    session: pendingSession,
    loadPendingSession,
    createSession,
    updateSession,
    discardSession,
    completeSession,
    shouldContinue,
  } = useWhatsAppImportSession(user?.id);

  // Load ALL profiles with pagination
  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-for-whatsapp-import', user?.id],
    queryFn: async () => {
      let allProfiles: { id: string; first_name: string; last_name: string | null }[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('user_id', user!.id)
          .order('first_name', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allProfiles = [...allProfiles, ...data];
        if (data.length < pageSize) break;
        page++;
      }
      return allProfiles;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Auto-match contact when name is detected
  useEffect(() => {
    if (contactName && profiles?.length && !selectedProfile) {
      const nameLower = contactName.toLowerCase().trim();
      const match = profiles.find(p => {
        const fullName = `${p.first_name} ${p.last_name || ''}`.toLowerCase().trim();
        return fullName === nameLower || 
               fullName.includes(nameLower) || 
               nameLower.includes(fullName);
      });
      if (match) {
        setSelectedProfile(match.id);
        toast({
          title: 'Contact matched',
          description: `Auto-selected "${match.first_name} ${match.last_name || ''}".trim()`,
        });
      }
    }
  }, [contactName, profiles, selectedProfile, toast]);

  // Check for pending sessions on mount
  useEffect(() => {
    if (user?.id) {
      loadPendingSession();
    }
  }, [user?.id, loadPendingSession]);

  // Get contact name for pending session
  const pendingSessionContact = pendingSession 
    ? profiles?.find(p => p.id === pendingSession.profileId) 
    : null;

  // Parse chat messages
  const parseWhatsAppChat = useCallback((
    text: string, 
    contactNameToMatch: string, 
    mediaLookup?: Map<string, ExtractedFile>
  ): ParsedMessage[] => {
    const messages: ParsedMessage[] = [];
    
    const patterns = [
      /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.+)/gi,
      /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, dateStr, timeStr, sender, content] = match;
        
        if (isSystemMessage(content)) continue;
        
        try {
          const dateParts = dateStr.split('/').map(Number);
          let year = dateParts[2];
          if (year < 100) year += 2000;
          
          let date = new Date(year, dateParts[1] - 1, dateParts[0]);
          if (isNaN(date.getTime())) {
            date = new Date(year, dateParts[0] - 1, dateParts[1]);
          }
          
          const timeParts = timeStr.match(/(\d+):(\d+)(?::(\d+))?(?:\s*([AP]M))?/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const seconds = parseInt(timeParts[3] || '0');
            const ampm = timeParts[4]?.toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            date.setHours(hours, minutes, seconds);
          }

          const isFromContact = sender.toLowerCase().trim() === contactNameToMatch.toLowerCase().trim();
          const mediaRef = extractMediaReference(content);
          const cleanContent = mediaRef ? cleanMessageContent(content) : content.trim();
          
          let mediaFile: ExtractedFile | undefined;
          if (mediaRef && mediaLookup) {
            mediaFile = mediaLookup.get(mediaRef.filename.toLowerCase());
          }

          if (isMediaOmitted(content) && !mediaFile) continue;

          messages.push({
            date,
            content: content.trim(),
            cleanContent,
            isFromContact,
            sender: sender.trim(),
            mediaRef,
            mediaFile,
          });
        } catch {
          // Skip malformed messages
        }
      }
      if (messages.length > 0) break;
    }

    return messages.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, []);

  const detectNamesFromChat = (text: string): string[] => {
    const names = new Set<string>();
    const patterns = [
      /\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\]\s*([^:]+):/gi,
      /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\s*-\s*([^:]+):/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (name && !name.includes('Messages') && !name.includes('Encryption')) {
          names.add(name);
        }
      }
      if (names.size > 0) break;
    }

    return Array.from(names);
  };

  // File handling
  const handleFileSelected = useCallback(async (file: File) => {
    setUploadedFile(file);
    setZipContents(null);
    setAllMessages([]);
    setStats(null);
    setStage('extracting');
    
    try {
      if (file.name.endsWith('.zip')) {
        const contents = await processWhatsAppZip(file);
        setZipContents(contents);
        setChatText(contents.chatText);
        
        const mediaStats = getMediaStats(contents.mediaFiles);
        setStats({
          totalMessages: 0,
          totalMedia: mediaStats.total,
          images: mediaStats.images,
          videos: mediaStats.videos,
          audio: mediaStats.audio,
          documents: mediaStats.documents,
          stickers: mediaStats.stickers,
          dateRange: { start: null, end: null },
        });
        
        const names = detectNamesFromChat(contents.chatText);
        setDetectedNames(names);
        
        if (names.length === 1) {
          setContactName(names[0]);
        }
        
        toast({ 
          title: 'ZIP extracted', 
          description: `Found ${mediaStats.total} media files` 
        });
      } else {
        const text = await file.text();
        setChatText(text);
        
        const names = detectNamesFromChat(text);
        setDetectedNames(names);
        
        if (names.length === 1) {
          setContactName(names[0]);
        }
      }
      
      setStage('reviewing');
    } catch (error) {
      setStage('failed');
      toast({ 
        title: 'Failed to process file', 
        description: 'Make sure it\'s a valid WhatsApp export', 
        variant: 'destructive' 
      });
    }
  }, [toast]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.zip'))) {
      handleFileSelected(file);
    } else {
      toast({ 
        title: 'Invalid file', 
        description: 'Please upload a .txt or .zip file', 
        variant: 'destructive' 
      });
    }
  }, [handleFileSelected, toast]);

  // Preview handler
  const handlePreview = useCallback(() => {
    if (!chatText.trim() || !contactName.trim()) {
      toast({ 
        title: 'Missing info', 
        description: 'Please provide chat content and contact name', 
        variant: 'destructive' 
      });
      return;
    }
    
    const mediaLookup = zipContents ? createMediaLookup(zipContents.mediaFiles) : undefined;
    const messages = parseWhatsAppChat(chatText, contactName, mediaLookup);
    setAllMessages(messages);
    
    // Calculate stats
    const messagesWithMedia = messages.filter(m => m.mediaFile);
    const dates = messages.map(m => m.date);
    
    setStats(prev => ({
      totalMessages: messages.length,
      totalMedia: prev?.totalMedia || messagesWithMedia.length,
      images: prev?.images || messagesWithMedia.filter(m => m.mediaRef?.type === 'image').length,
      videos: prev?.videos || messagesWithMedia.filter(m => m.mediaRef?.type === 'video').length,
      audio: prev?.audio || messagesWithMedia.filter(m => m.mediaRef?.type === 'audio').length,
      documents: prev?.documents || messagesWithMedia.filter(m => m.mediaRef?.type === 'document').length,
      stickers: prev?.stickers || messagesWithMedia.filter(m => m.mediaRef?.type === 'sticker').length,
      dateRange: {
        start: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
        end: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
      },
    }));

    // Initialize media state
    if (zipContents) {
      const mediaWithMessages = zipContents.mediaFiles.filter(f => 
        messages.some(m => m.mediaFile?.name === f.name)
      );
      setMediaFilesState(createInitialMediaState(mediaWithMessages));
    }
    
    if (messages.length === 0) {
      toast({ 
        title: 'No messages found', 
        description: 'Check the format matches WhatsApp export', 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: `Found ${messages.length} messages`, 
        description: messagesWithMedia.length > 0 
          ? `${messagesWithMedia.length} with media attached` 
          : 'Ready to import'
      });
    }
  }, [chatText, contactName, zipContents, parseWhatsAppChat, toast]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedProfile || allMessages.length === 0) {
        throw new Error('Missing required data');
      }

      // Check for existing conversation
      setStage('resolving_duplicates');
      const existing = await findExistingWhatsAppConversation(selectedProfile, user.id);
      
      if (existing && duplicateAction === 'ask') {
        setExistingConversation(existing);
        setShowDuplicateResolver(true);
        return null; // Will resume after user choice
      }

      return await performImport(existing);
    },
    onSuccess: (result) => {
      if (result === null) return; // Waiting for duplicate resolution
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast({ 
        title: 'Import complete', 
        description: `Imported ${result.messageCount} messages${result.mediaCount > 0 ? ` and ${result.mediaCount} media files` : ''}` 
      });
      resetState();
    },
    onError: (error) => {
      setStage('failed');
      toast({ 
        title: 'Import failed', 
        description: error instanceof Error ? error.message : 'Unknown error', 
        variant: 'destructive' 
      });
    },
  });

  const performImport = async (existing: ExistingConversation | null) => {
    if (!user || !selectedProfile) throw new Error('Not authenticated');

    const messages = allMessages;
    const messagesWithMedia = messages.filter(m => m.mediaFile);
    let conversationId: string;
    let existingHashes = new Set<string>();

    // Handle duplicate action
    if (existing && duplicateAction === 'replace_all') {
      await deleteConversationMessages(existing.id);
      conversationId = existing.id;
    } else if (existing && duplicateAction === 'append_new') {
      conversationId = existing.id;
      existingHashes = await getExistingMessageHashes(existing.id);
    } else if (existing && duplicateAction === 'cancel') {
      resetState();
      return { messageCount: 0, mediaCount: 0 };
    } else {
      // Create new conversation (keep_both or no existing)
      setStage('importing_messages');
      
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          profile_id: selectedProfile,
          platform: 'whatsapp' as Enums<'message_platform'>,
          title: `WhatsApp with ${contactName}`,
          started_at: messages[0].date.toISOString(),
        })
        .select()
        .single();

      if (convError || !conversation) throw convError || new Error('Failed to create conversation');
      conversationId = conversation.id;
    }

    // Filter out duplicates if appending
    const messagesToImport = duplicateAction === 'append_new'
      ? messages.filter(m => {
          const hash = createMessageHash(
            m.date.toISOString(),
            m.cleanContent || m.content,
            m.isFromContact
          );
          return !existingHashes.has(hash);
        })
      : messages;

    if (messagesToImport.length === 0) {
      toast({ title: 'No new messages', description: 'All messages already exist' });
      setStage('completed');
      return { messageCount: 0, mediaCount: 0 };
    }

    // Upload media files
    const mediaIdMap = new Map<string, string>();
    const mediaToUpload = messagesWithMedia
      .filter(m => messagesToImport.includes(m))
      .map(m => m.mediaFile!)
      .filter((f, i, arr) => arr.findIndex(x => x.name === f.name) === i);

    if (mediaToUpload.length > 0) {
      setStage('uploading_media');
      setMediaUploaded(0);

      const resultMap = await uploadMediaBatch(
        mediaToUpload,
        user.id,
        conversationId,
        selectedProfile,
        (filename, progress) => {
          setMediaFilesState(prev => updateMediaState(prev, filename, { 
            status: 'uploading', 
            progress 
          }));
        },
        (result) => {
          if (result.success && result.mediaId) {
            mediaIdMap.set(result.filename.toLowerCase(), result.mediaId);
            setMediaFilesState(prev => updateMediaState(prev, result.filename, { 
              status: 'uploaded',
              mediaId: result.mediaId,
            }));
          } else {
            setMediaFilesState(prev => updateMediaState(prev, result.filename, { 
              status: 'failed',
              error: result.error,
            }));
          }
          setMediaUploaded(prev => prev + 1);
        },
        shouldContinue
      );

      // Merge results
      resultMap.forEach((id, filename) => mediaIdMap.set(filename, id));
    }

    // Check if paused
    if (!shouldContinue()) {
      return null;
    }

    // Insert messages in batches
    setStage('importing_messages');
    setMessagesImported(0);
    
    const batchSize = 100;
    for (let i = 0; i < messagesToImport.length; i += batchSize) {
      if (!shouldContinue()) {
        await updateSession?.({ lastProcessedIndex: i });
        return null;
      }

      const batch = messagesToImport.slice(i, i + batchSize).map((msg) => {
        const mediaId = msg.mediaFile 
          ? mediaIdMap.get(msg.mediaFile.name.toLowerCase()) 
          : null;
        return {
          user_id: user.id,
          conversation_id: conversationId,
          content: msg.cleanContent || msg.content,
          is_from_contact: msg.isFromContact,
          sent_at: msg.date.toISOString(),
          media_id: mediaId || null,
          media_type: msg.mediaRef?.type || null,
          media_filename: msg.mediaFile?.name || null,
        };
      });

      const { error } = await supabase.from('messages').insert(batch);
      if (error) throw error;
      
      setMessagesImported(prev => prev + batch.length);
    }

    // Update conversation counts
    const lastMessage = messagesToImport[messagesToImport.length - 1];
    
    if (duplicateAction === 'append_new' && existing) {
      await supabase
        .from('conversations')
        .update({
          message_count: (existing.messageCount || 0) + messagesToImport.length,
          last_message_at: lastMessage.date.toISOString(),
        })
        .eq('id', conversationId);
    } else {
      await supabase
        .from('conversations')
        .update({
          message_count: messagesToImport.length,
          last_message_at: lastMessage.date.toISOString(),
        })
        .eq('id', conversationId);
    }

    setStage('completed');
    await completeSession?.();
    
    return { 
      messageCount: messagesToImport.length, 
      mediaCount: mediaIdMap.size 
    };
  };

  // Handle duplicate resolution
  const handleDuplicateResolved = useCallback(async (
    action: DuplicateAction, 
    remember: boolean
  ) => {
    setDuplicateAction(action);
    setShowDuplicateResolver(false);
    
    if (action === 'cancel') {
      resetState();
      return;
    }

    // Continue import with selected action
    try {
      const result = await performImport(existingConversation);
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['media'] });
        toast({ 
          title: 'Import complete', 
          description: `Imported ${result.messageCount} messages${result.mediaCount > 0 ? ` and ${result.mediaCount} media files` : ''}` 
        });
        resetState();
      }
    } catch (error) {
      setStage('failed');
      toast({ 
        title: 'Import failed', 
        description: error instanceof Error ? error.message : 'Unknown error', 
        variant: 'destructive' 
      });
    }
  }, [existingConversation, queryClient, toast]);

  // Pause/Resume handlers
  const handlePause = useCallback(() => {
    setIsPaused(true);
    setStage('paused');
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    // Resume from where we left off
    if (stage === 'paused') {
      setStage('uploading_media');
    }
  }, [stage]);

  const handleCancel = useCallback(() => {
    resetState();
  }, []);

  // Retry/Skip handlers for media files
  const handleRetryFile = useCallback(async (filename: string) => {
    const file = mediaFilesState.find(f => f.filename === filename);
    if (!file || !file.blob || !user) return;

    setMediaFilesState(prev => updateMediaState(prev, filename, { 
      status: 'uploading',
      attempts: file.attempts + 1,
    }));

    // Re-attempt upload - would need conversation ID context
    toast({ title: 'Retry not implemented in this context' });
  }, [mediaFilesState, user, toast]);

  const handleSkipFile = useCallback((filename: string) => {
    setMediaFilesState(prev => updateMediaState(prev, filename, { 
      status: 'skipped' 
    }));
    setMediaUploaded(prev => prev + 1);
  }, []);

  // Resume pending session
  const handleResumeSession = useCallback(() => {
    if (pendingSession) {
      setSelectedProfile(pendingSession.profileId);
      setStage(pendingSession.status);
      // Would need to restore more state from session
      toast({ title: 'Session resumed' });
    }
  }, [pendingSession, toast]);

  const handleDiscardSession = useCallback(async () => {
    await discardSession?.();
    toast({ title: 'Session discarded' });
  }, [discardSession, toast]);

  // Reset all state
  const resetState = useCallback(() => {
    setChatText('');
    setSelectedProfile('');
    setContactName('');
    setDetectedNames([]);
    setUploadedFile(null);
    setZipContents(null);
    setAllMessages([]);
    setMediaFilesState([]);
    setStats(null);
    setStage('idle');
    setIsPaused(false);
    setMessagesImported(0);
    setMediaUploaded(0);
    setExistingConversation(null);
    setDuplicateAction('ask');
    setShowDuplicateResolver(false);
  }, []);

  // Determine what to show
  const isProcessing = ['extracting', 'uploading_media', 'importing_messages'].includes(stage);
  const showProgress = isProcessing || stage === 'paused';
  const showPreview = allMessages.length > 0 && !showProgress && !showDuplicateResolver;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          Import WhatsApp Chat
        </CardTitle>
        <CardDescription>
          Export a WhatsApp chat (with or without media) and upload the file to import the conversation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending session banner */}
        {pendingSession && stage === 'idle' && (
          <WhatsAppResumeSession
            session={pendingSession}
            contactName={pendingSessionContact 
              ? `${pendingSessionContact.first_name} ${pendingSessionContact.last_name}` 
              : undefined
            }
            onResume={handleResumeSession}
            onDiscard={handleDiscardSession}
          />
        )}

        {/* Duplicate resolver */}
        {showDuplicateResolver && existingConversation && (
          <WhatsAppDuplicateResolver
            contactName={contactName}
            existingConversation={existingConversation}
            newMessageCount={allMessages.length}
            newDateRange={stats?.dateRange || { start: null, end: null }}
            onResolve={handleDuplicateResolved}
            onCancel={handleCancel}
          />
        )}

        {/* Progress view */}
        {showProgress && (
          <WhatsAppImportProgress
            stage={stage}
            messagesImported={messagesImported}
            totalMessages={allMessages.length}
            mediaUploaded={mediaUploaded}
            totalMedia={mediaFilesState.length}
            mediaFiles={mediaFilesState}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancel}
            onRetryFile={handleRetryFile}
            onSkipFile={handleSkipFile}
          />
        )}

        {/* Normal import flow */}
        {!showProgress && !showDuplicateResolver && (
          <>
            <Alert>
              <AlertTitle>How to export from WhatsApp</AlertTitle>
              <AlertDescription className="text-sm space-y-1">
                <p>1. Open the chat in WhatsApp</p>
                <p>2. Tap the menu → More → Export chat</p>
                <p>3. Choose <strong>"Attach media"</strong> for full import with images/videos</p>
                <p>4. Upload the .zip file (with media) or .txt file (text only)</p>
              </AlertDescription>
            </Alert>

            {/* File upload */}
            <WhatsAppImportDropzone
              onFileSelected={handleFileSelected}
              isProcessing={stage === 'extracting'}
              dragActive={dragActive}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            {/* Contact selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Select Contact ({profiles?.length || 0} contacts)</Label>
                <ContactPicker
                  contacts={profiles || []}
                  selectedId={selectedProfile}
                  onSelect={setSelectedProfile}
                  placeholder="Search contacts..."
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Name in Chat</Label>
                {detectedNames.length > 1 ? (
                  <Select value={contactName} onValueChange={setContactName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact name" />
                    </SelectTrigger>
                    <SelectContent>
                      {detectedNames.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Name as shown in exported chat"
                  />
                )}
              </div>
            </div>

            {/* Paste area for text-only */}
            {!uploadedFile && (
              <div className="space-y-2">
                <Label>Or Paste Chat Export Content</Label>
                <Textarea
                  value={chatText}
                  onChange={(e) => {
                    setChatText(e.target.value);
                    const names = detectNamesFromChat(e.target.value);
                    setDetectedNames(names);
                  }}
                  placeholder="Paste your WhatsApp chat export here..."
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            )}

            {/* Preview */}
            {showPreview && stats && (
              <WhatsAppImportPreview
                messages={allMessages.slice(0, 20).map(m => ({
                  date: m.date,
                  content: m.cleanContent || m.content,
                  senderName: m.sender,
                  isFromContact: m.isFromContact,
                  mediaFilename: m.mediaFile?.name,
                  mediaType: m.mediaRef?.type,
                }))}
                stats={stats}
                contactName={contactName}
              />
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handlePreview} 
                disabled={!chatText.trim() || isProcessing}
              >
                Preview
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!selectedProfile || allMessages.length === 0 || importMutation.isPending}
                className="flex-1"
              >
                {importMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  <>Import {allMessages.length > 0 ? `${allMessages.length} Messages` : ''}</>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
