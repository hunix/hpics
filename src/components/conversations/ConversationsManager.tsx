import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, MessageCircle, Trash2, Send, User, 
  Smartphone, MessageSquare, Linkedin, MessagesSquare,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const platforms = ['sms', 'whatsapp', 'linkedin', 'telegram', 'messenger', 'imessage', 'slack', 'discord', 'email_thread', 'other'] as const;
type Platform = typeof platforms[number];

const platformIcons: Record<Platform, any> = {
  sms: Smartphone,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  telegram: MessagesSquare,
  messenger: MessageSquare,
  imessage: MessageCircle,
  slack: MessageSquare,
  discord: MessageSquare,
  email_thread: MessageSquare,
  other: MessageCircle,
};

const platformColors: Record<Platform, string> = {
  sms: 'bg-green-100 text-green-800',
  whatsapp: 'bg-emerald-100 text-emerald-800',
  linkedin: 'bg-blue-100 text-blue-800',
  telegram: 'bg-sky-100 text-sky-800',
  messenger: 'bg-indigo-100 text-indigo-800',
  imessage: 'bg-blue-100 text-blue-800',
  slack: 'bg-purple-100 text-purple-800',
  discord: 'bg-violet-100 text-violet-800',
  email_thread: 'bg-gray-100 text-gray-800',
  other: 'bg-gray-100 text-gray-800',
};

interface ConversationsManagerProps {
  profileId: string;
  profileName: string;
}

export function ConversationsManager({ profileId, profileName }: ConversationsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewConvoOpen, setIsNewConvoOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isFromContact, setIsFromContact] = useState(false);
  const [newConvoData, setNewConvoData] = useState({
    platform: 'whatsapp' as Platform,
    title: '',
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('profile_id', profileId)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('sent_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: typeof newConvoData) => {
      const { data: convo, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user!.id,
          profile_id: profileId,
          platform: data.platform,
          title: data.title || `${data.platform} conversation`,
        })
        .select()
        .single();
      if (error) throw error;
      return convo;
    },
    onSuccess: (convo) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', profileId] });
      setIsNewConvoOpen(false);
      setSelectedConversation(convo.id);
      setNewConvoData({ platform: 'whatsapp', title: '' });
      toast({ title: 'Conversation created' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const addMessageMutation = useMutation({
    mutationFn: async ({ content, isFromContact }: { content: string; isFromContact: boolean }) => {
      if (!selectedConversation) throw new Error('No conversation selected');
      
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        user_id: user!.id,
        content,
        is_from_contact: isFromContact,
        sent_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Update conversation stats
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          message_count: (conversations?.find(c => c.id === selectedConversation)?.message_count || 0) + 1
        })
        .eq('id', selectedConversation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', profileId] });
      setNewMessage('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', profileId] });
      setSelectedConversation(null);
      toast({ title: 'Conversation deleted' });
    },
  });

  const selectedConvo = conversations?.find(c => c.id === selectedConversation);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Conversations</Label>
        <Button variant="ghost" size="sm" onClick={() => setIsNewConvoOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Conversation List */}
      {conversations && conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((convo) => {
            const Icon = platformIcons[convo.platform as Platform];
            return (
              <div 
                key={convo.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation === convo.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => setSelectedConversation(convo.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${platformColors[convo.platform as Platform]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{convo.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs py-0">
                        {convo.message_count} messages
                      </Badge>
                      <span>{formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 hover:opacity-100 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      deleteConversationMutation.mutate(convo.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No conversations yet. Add message threads to include in AI analysis.
        </p>
      )}

      {/* Message View Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={(open) => !open && setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedConvo && (
                <>
                  <Badge className={platformColors[selectedConvo.platform as Platform]}>
                    {selectedConvo.platform}
                  </Badge>
                  {selectedConvo.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-4">
            {messages && messages.length > 0 ? (
              <div className="space-y-3 py-2">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.is_from_contact ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[75%] rounded-lg p-3 ${
                      msg.is_from_contact 
                        ? 'bg-muted text-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.is_from_contact ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                        {format(new Date(msg.sent_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No messages yet
              </div>
            )}
          </ScrollArea>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant={isFromContact ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFromContact(true)}
              >
                <User className="h-4 w-4 mr-1" />
                From {profileName.split(' ')[0]}
              </Button>
              <Button
                variant={!isFromContact ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFromContact(false)}
              >
                From Me
              </Button>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Paste or type message content..."
                className="min-h-[60px]"
              />
              <Button 
                onClick={() => addMessageMutation.mutate({ content: newMessage, isFromContact })}
                disabled={!newMessage.trim() || addMessageMutation.isPending}
                className="shrink-0"
              >
                {addMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Conversation Dialog */}
      <Dialog open={isNewConvoOpen} onOpenChange={setIsNewConvoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createConversationMutation.mutate(newConvoData); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={newConvoData.platform}
                onValueChange={(value: Platform) => setNewConvoData({ ...newConvoData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={newConvoData.title}
                onChange={(e) => setNewConvoData({ ...newConvoData, title: e.target.value })}
                placeholder="e.g., Project discussion, Catch-up..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNewConvoOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createConversationMutation.isPending}>
                {createConversationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
