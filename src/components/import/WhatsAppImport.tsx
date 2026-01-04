import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Upload, Loader2, MessageCircle, FileText, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Tables, Enums } from '@/integrations/supabase/types';

interface ParsedMessage {
  date: Date;
  content: string;
  isFromContact: boolean;
  sender: string;
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

  const parseWhatsAppChat = (text: string, contactNameToMatch: string): ParsedMessage[] => {
    const messages: ParsedMessage[] = [];
    
    // WhatsApp export formats:
    // [DD/MM/YYYY, HH:MM:SS] Name: Message (iOS)
    // DD/MM/YYYY, HH:MM - Name: Message (Android)
    // [DD/MM/YY, HH:MM:SS] Name: Message
    // MM/DD/YY, HH:MM AM/PM - Name: Message (US format)
    
    const patterns = [
      /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.+)/gi,
      /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [, dateStr, timeStr, sender, content] = match;
        
        try {
          // Parse date (handle various formats)
          const dateParts = dateStr.split('/').map(Number);
          let year = dateParts[2];
          if (year < 100) year += 2000;
          
          // Try DD/MM/YYYY first, then MM/DD/YYYY for US format
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

          messages.push({
            date,
            content: content.trim(),
            isFromContact,
            sender: sender.trim(),
          });
        } catch (e) {
          // Skip malformed messages
        }
      }
      if (messages.length > 0) break;
    }

    return messages.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

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
    const text = await file.text();
    setChatText(text);
    
    // Auto-detect names
    const names = detectNamesFromChat(text);
    setDetectedNames(names);
    
    if (names.length === 1) {
      setContactName(names[0]);
      toast({ title: `Detected contact: ${names[0]}` });
    } else if (names.length > 1) {
      toast({ title: `Found ${names.length} participants`, description: 'Select the contact name below' });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
      handleFileUpload(file);
    } else {
      toast({ title: 'Invalid file', description: 'Please upload a .txt file', variant: 'destructive' });
    }
  }, [handleFileUpload, toast]);

  const handlePreview = () => {
    if (!chatText.trim() || !contactName.trim()) {
      toast({ title: 'Missing info', description: 'Please paste the chat and enter the contact name', variant: 'destructive' });
      return;
    }
    const messages = parseWhatsAppChat(chatText, contactName);
    setPreview(messages.slice(0, 10));
    if (messages.length === 0) {
      toast({ title: 'No messages found', description: 'Check the format matches WhatsApp export', variant: 'destructive' });
    } else {
      toast({ title: `Found ${messages.length} messages`, description: 'Review preview and click Import' });
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedProfile || !chatText.trim()) throw new Error('Missing data');

      const messages = parseWhatsAppChat(chatText, contactName);
      if (messages.length === 0) throw new Error('No messages to import');

      // Create conversation
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

      // Insert messages in batches
      const batchSize = 100;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize).map((msg) => ({
          user_id: user.id,
          conversation_id: conversation.id,
          content: msg.content,
          is_from_contact: msg.isFromContact,
          sent_at: msg.date.toISOString(),
        }));

        const { error } = await supabase.from('messages').insert(batch);
        if (error) throw error;
      }

      return messages.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: 'Import complete', description: `Imported ${count} messages` });
      setChatText('');
      setPreview([]);
      setContactName('');
      setUploadedFile(null);
      setDetectedNames([]);
    },
    onError: (error) => {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          Import WhatsApp Chat
        </CardTitle>
        <CardDescription>
          Export a WhatsApp chat and upload or paste the content here to import the conversation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>How to export from WhatsApp</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>1. Open the chat in WhatsApp</p>
            <p>2. Tap the menu → More → Export chat</p>
            <p>3. Choose "Without media"</p>
            <p>4. Upload the .txt file or paste content below</p>
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
            input.accept = '.txt';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}
        >
          {uploadedFile ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">{uploadedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setChatText('');
                  setDetectedNames([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drop a .txt file here or click to upload
              </p>
            </>
          )}
        </div>

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
            <Label>Preview (first 10 messages)</Label>
            <div className="rounded-lg border max-h-48 overflow-auto">
              {preview.map((msg, i) => (
                <div key={i} className={`p-2 text-xs border-b last:border-b-0 ${msg.isFromContact ? 'bg-muted/50' : ''}`}>
                  <span className="font-medium">{msg.sender}: </span>
                  <span className="text-muted-foreground">{msg.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!chatText.trim()}>
            Preview
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!selectedProfile || preview.length === 0 || importMutation.isPending}
            className="flex-1"
          >
            {importMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Import Messages</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
