import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Mail, ChevronDown, ChevronRight, Paperclip, 
  ExternalLink, Clock, User, Users, Inbox
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ContactEmailThreadsProps {
  profileId: string;
  contactName: string;
}

interface EmailThread {
  id: string;
  conversation_id: string;
  subject: string;
  last_message_at: string;
  message_count: number;
  is_read: boolean;
  folder: string;
}

interface EmailMessage {
  id: string;
  thread_id: string;
  sender_email: string;
  sender_name: string | null;
  recipients: string[];
  cc_recipients: string[];
  subject: string;
  body_preview: string;
  sent_at: string;
  is_from_contact: boolean;
  has_attachments: boolean;
  importance: string;
}

export function ContactEmailThreads({ profileId, contactName }: ContactEmailThreadsProps) {
  const { user } = useAuth();
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Fetch email threads for this contact
  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ['email-threads', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_threads')
        .select('*')
        .eq('user_id', user!.id)
        .eq('profile_id', profileId)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data as EmailThread[];
    },
    enabled: !!user && !!profileId,
  });

  // Fetch messages for expanded threads
  const expandedThreadIds = Array.from(expandedThreads);
  const { data: messagesMap } = useQuery({
    queryKey: ['email-messages', expandedThreadIds],
    queryFn: async () => {
      if (expandedThreadIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('email_messages')
        .select('*')
        .in('thread_id', expandedThreadIds)
        .order('sent_at', { ascending: false });
      
      if (error) throw error;

      // Group by thread_id
      const map: Record<string, EmailMessage[]> = {};
      (data as EmailMessage[]).forEach((msg) => {
        if (!map[msg.thread_id]) map[msg.thread_id] = [];
        map[msg.thread_id].push(msg);
      });
      return map;
    },
    enabled: expandedThreadIds.length > 0,
  });

  const toggleThread = (threadId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  if (threadsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Threads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Threads
          </CardTitle>
          <CardDescription>
            Email conversations with {contactName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No email threads found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect your Outlook account in Settings → Integrations to sync email conversations with {contactName}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Threads
          <Badge variant="secondary" className="ml-2">{threads.length}</Badge>
        </CardTitle>
        <CardDescription>
          Email conversations with {contactName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {threads.map((thread) => {
              const isExpanded = expandedThreads.has(thread.id);
              const messages = messagesMap?.[thread.id] || [];

              return (
                <Collapsible
                  key={thread.id}
                  open={isExpanded}
                  onOpenChange={() => toggleThread(thread.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        !thread.is_read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mt-1 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mt-1 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-sm font-medium truncate ${!thread.is_read ? 'font-semibold' : ''}`}>
                              {thread.subject || '(No subject)'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                              </span>
                              <span>•</span>
                              <span>{thread.message_count} message{thread.message_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        {!thread.is_read && (
                          <Badge variant="default" className="shrink-0">New</Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-7 mt-2 space-y-2 pb-2">
                      {messages.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Loading messages...
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg border ${
                              msg.is_from_contact ? 'bg-muted/30' : 'bg-background'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                                  msg.is_from_contact ? 'bg-primary/10 text-primary' : 'bg-muted'
                                }`}>
                                  <User className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {msg.sender_name || msg.sender_email}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {msg.sender_email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {msg.has_attachments && (
                                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                                )}
                                {msg.importance === 'high' && (
                                  <Badge variant="destructive" className="text-xs">!</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(msg.sent_at), 'MMM d, h:mm a')}
                                </span>
                              </div>
                            </div>

                            {msg.recipients.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                <Users className="h-3 w-3" />
                                <span>To: {msg.recipients.slice(0, 2).join(', ')}</span>
                                {msg.recipients.length > 2 && (
                                  <span>+{msg.recipients.length - 2} more</span>
                                )}
                              </div>
                            )}

                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {msg.body_preview}
                            </p>
                          </div>
                        ))
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open in Outlook web
                          window.open(
                            `https://outlook.office.com/mail/search?q=${encodeURIComponent(thread.subject || '')}`,
                            '_blank'
                          );
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open in Outlook
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
