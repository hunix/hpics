export type ImportStage = 
  | 'idle'
  | 'selecting_mode'
  | 'extracting'
  | 'parsing'
  | 'reviewing'
  | 'resolving_duplicates'
  | 'uploading_zip'
  | 'server_processing'
  | 'uploading_media'
  | 'importing_messages'
  | 'paused'
  | 'completed'
  | 'failed';

export type ProcessingMode = 'client' | 'server';

export type MediaFileStatus = 
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'skipped';

export type MessageStatus = 
  | 'pending'
  | 'imported'
  | 'failed'
  | 'skipped_duplicate';

export type DuplicateAction = 
  | 'ask'
  | 'append_new'
  | 'replace_all'
  | 'keep_both'
  | 'cancel';

export interface MediaFileState {
  filename: string;
  status: MediaFileStatus;
  attempts: number;
  error?: string;
  mediaId?: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker' | null;
  progress?: number;
  blob?: Blob;
}

export interface ParsedMessageState {
  index: number;
  date: string;
  content: string;
  senderName: string;
  isFromContact: boolean;
  status: MessageStatus;
  mediaFilename?: string;
  mediaType?: string;
  error?: string;
}

export interface ExistingConversation {
  id: string;
  messageCount: number;
  lastMessageAt: string | null;
  startedAt: string | null;
}

export interface ImportProgress {
  stage: ImportStage;
  currentStep: number;
  totalSteps: number;
  currentItem?: string;
  percentage: number;
}

export interface ImportSession {
  id: string;
  userId: string;
  profileId: string;
  status: ImportStage;
  processingMode: ProcessingMode;
  fileName?: string;
  fileSize?: number;
  totalMessages: number;
  totalMediaFiles: number;
  messagesImported: number;
  mediaUploaded: number;
  skippedFiles: Array<{ filename: string; reason: string }>;
  failedFiles: Array<{ filename: string; error: string }>;
  duplicateAction: DuplicateAction;
  existingConversationId?: string;
  newConversationId?: string;
  lastProcessedIndex: number;
  parsedMessages?: ParsedMessageState[];
  mediaFilesState?: MediaFileState[];
  pausedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  // Server-side processing fields
  serverSessionId?: string;
  serverProgress?: ServerSideProgress;
}

export interface ServerSideProgress {
  stage: 'uploading_zip' | 'extracting' | 'uploading_media' | 'importing_messages' | 'completed' | 'failed';
  currentFile?: string;
  filesProcessed: number;
  totalFiles: number;
  messagesProcessed: number;
  totalMessages: number;
  bytesProcessed: number;
  totalBytes: number;
  error?: string;
}

export interface ImportStats {
  totalMessages: number;
  totalMedia: number;
  images: number;
  videos: number;
  audio: number;
  documents: number;
  stickers: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}
