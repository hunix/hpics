import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Plus, MessageCircle, Trash2, ExternalLink,
  Smartphone, MessageSquare, Linkedin, MessagesSquare,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  sms: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  whatsapp: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  linkedin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  telegram: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  messenger: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  imessage: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  slack: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  discord: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  email_thread: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

interface ConversationsManagerProps {
  profileId: string;
  profileName: string;
}

export function ConversationsManager({ profileId, profileName }: ConversationsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isNewConvoOpen, setIsNewConvoOpen] = useState(false);
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
      navigate(`/contacts/${profileId}/conversations/${convo.id}`);
      setNewConvoData({ platform: 'whatsapp', title: '' });
      toast({ title: 'Conversation created' });
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
      toast({ title: 'Conversation deleted' });
    },
  });

  const handleConversationClick = (convoId: string) => {
    navigate(`/contacts/${profileId}/conversations/${convoId}`);
  };

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
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors bg-muted/50 hover:bg-muted group"
                onClick={() => handleConversationClick(convo.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${platformColors[convo.platform as Platform]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{convo.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs py-0">
                        {convo.message_count?.toLocaleString()} messages
                      </Badge>
                      <span>{formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No conversations yet. Add message threads to include in AI analysis.
        </p>
      )}

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
