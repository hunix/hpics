import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageCircle, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WhatsAppChatProps {
  profileId: string;
  profileName: string;
}

export function WhatsAppChat({ profileId, profileName }: WhatsAppChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if WhatsApp is configured
  const { data: whatsappConfig } = useQuery({
    queryKey: ['whatsapp-config', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get or create WhatsApp conversation
  const { data: conversation, isLoading: convLoading } = useQuery({
    queryKey: ['whatsapp-conversation', profileId],
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('platform', 'whatsapp')
        .maybeSingle();
      
      if (existing) return existing;

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user!.id,
          profile_id: profileId,
          platform: 'whatsapp',
          title: `WhatsApp with ${profileName}`,
        })
        .select()
        .single();

      if (error) throw error;
      return newConv;
    },
    enabled: !!user && !!profileId,
  });

  // Fetch messages
  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ['whatsapp-messages', conversation?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation!.id)
        .order('sent_at', { ascending: true });
      return data ?? [];
    },
    enabled: !!conversation?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`whatsapp-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversation.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !conversation) return;

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          userId: user!.id,
          profileId,
          conversationId: conversation.id,
          message: newMessage.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversation?.id] });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to send', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (!whatsappConfig?.is_connected) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            WhatsApp Business API not configured.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Set up WhatsApp in Settings to send and receive messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (convLoading || msgLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-500" />
          WhatsApp Chat
          {messages && messages.length > 0 && (
            <Badge variant="secondary">{messages.length} messages</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Start a conversation!
              </p>
            )}
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.is_from_contact ? 'justify-start' : 'justify-end'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    msg.is_from_contact
                      ? 'bg-muted'
                      : 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs opacity-70">
                      {format(new Date(msg.sent_at), 'HH:mm')}
                    </span>
                    {!msg.is_from_contact && getStatusIcon(msg.whatsapp_status)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="border-t p-3 flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMutation.mutate();
              }
            }}
            disabled={sendMutation.isPending}
          />
          <Button 
            onClick={() => sendMutation.mutate()}
            disabled={!newMessage.trim() || sendMutation.isPending}
            size="icon"
            className="bg-green-600 hover:bg-green-700"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
