import { useState, useCallback } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, MessageCircle, FileText, X, Image, Video, Mic, FileIcon, Archive } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';
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
  formatFileSize, 
  createMediaLookup,
  type ExtractedFile,
  type ZipContents,
  type MediaStats
} from './whatsapp/whatsappZipProcessor';

interface ParsedMessage {
  date: Date;
  content: string;
  cleanContent: string;
  isFromContact: boolean;
  sender: string;
  mediaRef: MediaReference | null;
  mediaFile?: ExtractedFile;
}

interface ImportProgress {
  stage: 'extracting' | 'parsing' | 'uploading' | 'importing' | 'done';
  current: number;
  total: number;
  message: string;
}

export function WhatsAppImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [chatText, setChatText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [preview, setPreview] = useState<ParsedMessage[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectedNames, setDetectedNames] = useState<string[]>([]);
  const [zipContents, setZipContents] = useState<ZipContents | null>(null);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [allMessages, setAllMessages] = useState<ParsedMessage[]>([]);

  const { data: profiles } = useQuery({
    queryKey: ['profiles', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_id', user!.id)
        .order('first_name');
      return data ?? [];
    },
    enabled: !!user,
  });

  const parseWhatsAppChat = useCallback((text: string, contactNameToMatch: string, mediaLookup?: Map<string, ExtractedFile>): ParsedMessage[] => {
    const messages: ParsedMessage[] = [];
    
    const patterns = [
      /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.+)/gi,
      /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, dateStr, timeStr, sender, content] = match;
        
        // Skip system messages
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
          
          // Try to find matching media file
          let mediaFile: ExtractedFile | undefined;
          if (mediaRef && mediaLookup) {
            mediaFile = mediaLookup.get(mediaRef.filename.toLowerCase());
          }

          // Skip "Media omitted" messages if we don't have the media
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
        } catch (e) {
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

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setZipContents(null);
    setMediaStats(null);
    setAllMessages([]);
    setPreview([]);
    
    if (file.name.endsWith('.zip')) {
      setProgress({ stage: 'extracting', current: 0, total: 100, message: 'Extracting ZIP file...' });
      
      try {
        const contents = await processWhatsAppZip(file);
        setZipContents(contents);
        setChatText(contents.chatText);
        
        const stats = getMediaStats(contents.mediaFiles);
        setMediaStats(stats);
        
        const names = detectNamesFromChat(contents.chatText);
        setDetectedNames(names);
        
        setProgress(null);
        
        if (names.length === 1) {
          setContactName(names[0]);
          toast({ title: `Detected contact: ${names[0]}`, description: `Found ${stats.total} media files` });
        } else if (names.length > 1) {
          toast({ title: `Found ${names.length} participants`, description: `With ${stats.total} media files` });
        }
      } catch (error) {
        setProgress(null);
        toast({ title: 'Failed to process ZIP', description: 'Make sure it\'s a valid WhatsApp export', variant: 'destructive' });
      }
    } else {
      const text = await file.text();
      setChatText(text);
      
      const names = detectNamesFromChat(text);
      setDetectedNames(names);
      
      if (names.length === 1) {
        setContactName(names[0]);
        toast({ title: `Detected contact: ${names[0]}` });
      } else if (names.length > 1) {
        toast({ title: `Found ${names.length} participants`, description: 'Select the contact name below' });
      }
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.zip'))) {
      handleFileUpload(file);
    } else {
      toast({ title: 'Invalid file', description: 'Please upload a .txt or .zip file', variant: 'destructive' });
    }
  }, [handleFileUpload, toast]);

  const handlePreview = () => {
    if (!chatText.trim() || !contactName.trim()) {
      toast({ title: 'Missing info', description: 'Please provide chat content and contact name', variant: 'destructive' });
      return;
    }
    
    const mediaLookup = zipContents ? createMediaLookup(zipContents.mediaFiles) : undefined;
    const messages = parseWhatsAppChat(chatText, contactName, mediaLookup);
    setAllMessages(messages);
    setPreview(messages.slice(0, 15));
    
    if (messages.length === 0) {
      toast({ title: 'No messages found', description: 'Check the format matches WhatsApp export', variant: 'destructive' });
    } else {
      const withMedia = messages.filter(m => m.mediaFile).length;
      toast({ 
        title: `Found ${messages.length} messages`, 
        description: withMedia > 0 ? `${withMedia} with media attached` : 'Review preview and click Import'
      });
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedProfile || allMessages.length === 0) throw new Error('Missing data');

      const messages = allMessages;
      const messagesWithMedia = messages.filter(m => m.mediaFile);
      
      // Create conversation
      setProgress({ stage: 'importing', current: 0, total: 1, message: 'Creating conversation...' });
      
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          profile_id: selectedProfile,
          platform: 'whatsapp' as Enums<'message_platform'>,
          title: `WhatsApp with ${contactName}`,
          started_at: messages[0].date.toISOString(),
          last_message_at: messages[messages.length - 1].date.toISOString(),
          message_count: messages.length,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Upload media files if present
      const mediaIdMap = new Map<string, string>(); // filename -> media record id
      
      if (messagesWithMedia.length > 0) {
        setProgress({ stage: 'uploading', current: 0, total: messagesWithMedia.length, message: 'Uploading media...' });
        
        const batchSize = 5;
        for (let i = 0; i < messagesWithMedia.length; i += batchSize) {
          const batch = messagesWithMedia.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (msg) => {
            if (!msg.mediaFile) return;
            
            const storagePath = `${user.id}/whatsapp/${conversation.id}/${msg.mediaFile.name}`;
            
            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(storagePath, msg.mediaFile.blob, {
                contentType: getMimeType(msg.mediaFile.name),
                upsert: true,
              });
            
            if (uploadError) {
              console.error('Upload error:', uploadError);
              return;
            }
            
            // Get public URL for file_url (required field)
            const { data: urlData } = supabase.storage
              .from('media')
              .getPublicUrl(storagePath);
            
            // Create media record
            const { data: mediaRecord, error: mediaError } = await supabase
              .from('media')
              .insert({
                user_id: user.id,
                profile_id: selectedProfile,
                caption: msg.mediaFile.name,
                storage_path: storagePath,
                file_size: msg.mediaFile.size,
                mime_type: getMimeType(msg.mediaFile.name),
                file_url: urlData.publicUrl,
              })
              .select('id')
              .single();
            
            if (!mediaError && mediaRecord) {
              mediaIdMap.set(msg.mediaFile.name.toLowerCase(), mediaRecord.id);
            }
          }));
          
          setProgress({ 
            stage: 'uploading', 
            current: Math.min(i + batchSize, messagesWithMedia.length), 
            total: messagesWithMedia.length, 
            message: `Uploading media... ${Math.min(i + batchSize, messagesWithMedia.length)}/${messagesWithMedia.length}` 
          });
        }
      }

      // Insert messages in batches
      setProgress({ stage: 'importing', current: 0, total: messages.length, message: 'Importing messages...' });
      
      const batchSize = 100;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize).map((msg) => {
          const mediaId = msg.mediaFile ? mediaIdMap.get(msg.mediaFile.name.toLowerCase()) : null;
          return {
            user_id: user.id,
            conversation_id: conversation.id,
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
        
        setProgress({ 
          stage: 'importing', 
          current: Math.min(i + batchSize, messages.length), 
          total: messages.length, 
          message: `Importing messages... ${Math.min(i + batchSize, messages.length)}/${messages.length}` 
        });
      }

      setProgress({ stage: 'done', current: 1, total: 1, message: 'Complete!' });
      return { messageCount: messages.length, mediaCount: mediaIdMap.size };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast({ 
        title: 'Import complete', 
        description: `Imported ${result.messageCount} messages${result.mediaCount > 0 ? ` and ${result.mediaCount} media files` : ''}` 
      });
      resetState();
    },
    onError: (error) => {
      setProgress(null);
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    },
  });

  const resetState = () => {
    setChatText('');
    setPreview([]);
    setContactName('');
    setUploadedFile(null);
    setDetectedNames([]);
    setZipContents(null);
    setMediaStats(null);
    setProgress(null);
    setAllMessages([]);
  };

  const getMediaIcon = (type: string | null) => {
    switch (type) {
      case 'image': return <Image className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      case 'audio': return <Mic className="h-3 w-3" />;
      default: return <FileIcon className="h-3 w-3" />;
    }
  };

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
        <Alert>
          <AlertTitle>How to export from WhatsApp</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>1. Open the chat in WhatsApp</p>
            <p>2. Tap the menu → More → Export chat</p>
            <p>3. Choose <strong>"Attach media"</strong> for full import with images/videos</p>
            <p>4. Upload the .zip file (with media) or .txt file (text only)</p>
          </AlertDescription>
        </Alert>

        {/* File Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.zip';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}
        >
          {uploadedFile ? (
            <div className="flex items-center justify-center gap-2">
              {uploadedFile.name.endsWith('.zip') ? (
                <Archive className="h-5 w-5 text-orange-500" />
              ) : (
                <FileText className="h-5 w-5 text-green-500" />
              )}
              <span className="text-sm font-medium">{uploadedFile.name}</span>
              <Badge variant="secondary" className="text-xs">
                {formatFileSize(uploadedFile.size)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drop a .zip (with media) or .txt file here
              </p>
            </>
          )}
        </div>

        {/* Media Stats */}
        {mediaStats && mediaStats.total > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            {mediaStats.images > 0 && (
              <Badge variant="outline" className="gap-1">
                <Image className="h-3 w-3" /> {mediaStats.images} images
              </Badge>
            )}
            {mediaStats.videos > 0 && (
              <Badge variant="outline" className="gap-1">
                <Video className="h-3 w-3" /> {mediaStats.videos} videos
              </Badge>
            )}
            {mediaStats.audio > 0 && (
              <Badge variant="outline" className="gap-1">
                <Mic className="h-3 w-3" /> {mediaStats.audio} voice notes
              </Badge>
            )}
            {mediaStats.documents > 0 && (
              <Badge variant="outline" className="gap-1">
                <FileIcon className="h-3 w-3" /> {mediaStats.documents} documents
              </Badge>
            )}
            <Badge variant="secondary" className="ml-auto">
              {formatFileSize(mediaStats.totalSize)} total
            </Badge>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.message}</span>
              <span className="font-medium">{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Select Contact</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a contact" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.first_name} {profile.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {preview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preview ({allMessages.length} messages total)</Label>
              {allMessages.filter(m => m.mediaFile).length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {allMessages.filter(m => m.mediaFile).length} with media
                </Badge>
              )}
            </div>
            <div className="rounded-lg border max-h-48 overflow-auto">
              {preview.map((msg, i) => (
                <div key={i} className={`p-2 text-xs border-b last:border-b-0 ${msg.isFromContact ? 'bg-muted/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    {msg.mediaFile && (
                      <Badge variant="outline" className="gap-1 shrink-0">
                        {getMediaIcon(msg.mediaRef?.type || null)}
                        {msg.mediaRef?.type}
                      </Badge>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{msg.sender}: </span>
                      <span className="text-muted-foreground">{msg.cleanContent || '(media)'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!chatText.trim() || !!progress}>
            Preview
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!selectedProfile || allMessages.length === 0 || importMutation.isPending || !!progress}
            className="flex-1"
          >
            {importMutation.isPending || progress ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Import {allMessages.length > 0 ? `${allMessages.length} Messages` : ''}</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
