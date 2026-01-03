import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Loader2, Send } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

interface ParsedMessage {
  date: Date;
  content: string;
  isFromContact: boolean;
  sender: string;
}

export function TelegramImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [chatJson, setChatJson] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [preview, setPreview] = useState<ParsedMessage[]>([]);

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

  const parseTelegramExport = (jsonText: string, contactNameToMatch: string): ParsedMessage[] => {
    const messages: ParsedMessage[] = [];

    try {
      const data = JSON.parse(jsonText);
      const chatMessages = data.messages || [];

      for (const msg of chatMessages) {
        if (msg.type !== 'message' || !msg.text) continue;

        const content = typeof msg.text === 'string' ? msg.text : 
          Array.isArray(msg.text) ? msg.text.map((t: any) => typeof t === 'string' ? t : t.text || '').join('') : '';

        if (!content.trim()) continue;

        const date = new Date(msg.date);
        const sender = msg.from || msg.from_id || 'Unknown';
        const isFromContact = sender.toLowerCase().includes(contactNameToMatch.toLowerCase());

        messages.push({
          date,
          content,
          isFromContact,
          sender,
        });
      }
    } catch (e) {
      // Try parsing as text format (from Telegram Desktop)
      const lines = jsonText.split('\n');
      let currentDate: Date | null = null;
      let currentSender = '';
      let currentMessage = '';

      for (const line of lines) {
        // Date header format: "DD.MM.YYYY" or similar
        const dateMatch = line.match(/^(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
        if (dateMatch) {
          const parts = dateMatch[1].split(/[./]/).map(Number);
          let year = parts[2];
          if (year < 100) year += 2000;
          currentDate = new Date(year, parts[1] - 1, parts[0]);
        }

        // Message line: "HH:MM Name: Message"
        const msgMatch = line.match(/^(\d{1,2}:\d{2})\s+([^:]+):\s*(.+)/);
        if (msgMatch && currentDate) {
          const [, time, sender, content] = msgMatch;
          const [hours, minutes] = time.split(':').map(Number);
          const date = new Date(currentDate);
          date.setHours(hours, minutes);

          messages.push({
            date,
            content: content.trim(),
            isFromContact: sender.toLowerCase().includes(contactNameToMatch.toLowerCase()),
            sender: sender.trim(),
          });
        }
      }
    }

    return messages.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handlePreview = () => {
    if (!chatJson.trim() || !contactName.trim()) {
      toast({ title: 'Missing info', description: 'Please paste the export and enter the contact name', variant: 'destructive' });
      return;
    }
    const messages = parseTelegramExport(chatJson, contactName);
    setPreview(messages.slice(0, 10));
    if (messages.length === 0) {
      toast({ title: 'No messages found', description: 'Check the format - use JSON export from Telegram Desktop', variant: 'destructive' });
    } else {
      toast({ title: `Found ${messages.length} messages`, description: 'Review preview and click Import' });
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedProfile || !chatJson.trim()) throw new Error('Missing data');

      const messages = parseTelegramExport(chatJson, contactName);
      if (messages.length === 0) throw new Error('No messages to import');

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          profile_id: selectedProfile,
          platform: 'telegram' as Enums<'message_platform'>,
          title: `Telegram with ${contactName}`,
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
      setChatJson('');
      setPreview([]);
      setContactName('');
    },
    onError: (error) => {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          Import Telegram Chat
        </CardTitle>
        <CardDescription>
          Export a Telegram chat from Desktop and paste the JSON content here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>How to export from Telegram</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>1. Open Telegram Desktop</p>
            <p>2. Open the chat → Click menu → Export chat history</p>
            <p>3. Uncheck all media, select JSON format</p>
            <p>4. Open result.json and paste the content below</p>
          </AlertDescription>
        </Alert>

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
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Name as shown in exported chat"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Chat Export (JSON)</Label>
          <Textarea
            value={chatJson}
            onChange={(e) => setChatJson(e.target.value)}
            placeholder="Paste your Telegram JSON export here..."
            rows={8}
            className="font-mono text-xs"
          />
        </div>

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
          <Button variant="outline" onClick={handlePreview} disabled={!chatJson.trim()}>
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
