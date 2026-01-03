import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, Calendar, Phone, Mail, Video, 
  Users, MessagesSquare, Clock, ArrowDownLeft, ArrowUpRight 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineEvent {
  id: string;
  type: 'communication' | 'event' | 'message';
  title: string;
  description?: string;
  date: Date;
  metadata?: Record<string, unknown>;
}

interface ContactTimelineProps {
  profileId: string;
}

export function ContactTimeline({ profileId }: ContactTimelineProps) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['contact-timeline', profileId],
    queryFn: async () => {
      const [commsRes, eventsRes, messagesRes] = await Promise.all([
        supabase
          .from('communications')
          .select('*')
          .eq('profile_id', profileId)
          .order('occurred_at', { ascending: false }),
        supabase
          .from('events')
          .select('*')
          .eq('profile_id', profileId)
          .order('event_date', { ascending: false }),
        supabase
          .from('messages')
          .select('*, conversations!inner(profile_id, platform)')
          .eq('conversations.profile_id', profileId)
          .order('sent_at', { ascending: false })
          .limit(50),
      ]);

      const events: TimelineEvent[] = [];

      // Add communications
      commsRes.data?.forEach((comm) => {
        events.push({
          id: `comm-${comm.id}`,
          type: 'communication',
          title: comm.subject || `${comm.channel.replace('_', ' ')} ${comm.direction}`,
          description: comm.content?.slice(0, 100),
          date: new Date(comm.occurred_at),
          metadata: { channel: comm.channel, direction: comm.direction },
        });
      });

      // Add events
      eventsRes.data?.forEach((event) => {
        events.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          description: event.description,
          date: new Date(event.event_date),
          metadata: { eventType: event.event_type },
        });
      });

      // Add messages
      messagesRes.data?.forEach((msg) => {
        events.push({
          id: `msg-${msg.id}`,
          type: 'message',
          title: msg.is_from_contact ? 'Received message' : 'Sent message',
          description: msg.content?.slice(0, 100),
          date: new Date(msg.sent_at),
          metadata: { 
            platform: (msg.conversations as any)?.platform, 
            isFromContact: msg.is_from_contact 
          },
        });
      });

      // Sort by date descending
      events.sort((a, b) => b.date.getTime() - a.date.getTime());

      return events;
    },
  });

  const getIcon = (event: TimelineEvent) => {
    if (event.type === 'event') {
      return <Calendar className="h-4 w-4" />;
    }
    if (event.type === 'message') {
      return event.metadata?.isFromContact ? 
        <ArrowDownLeft className="h-4 w-4" /> : 
        <ArrowUpRight className="h-4 w-4" />;
    }
    // Communication icons based on channel
    const channel = event.metadata?.channel as string;
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'video_call': return <Video className="h-4 w-4" />;
      case 'in_person': return <Users className="h-4 w-4" />;
      case 'message': return <MessagesSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'communication': return 'bg-blue-500';
      case 'event': return 'bg-green-500';
      case 'message': return 'bg-purple-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>No interactions recorded yet.</p>
        <p className="text-sm">Log communications, events, or messages to see the timeline.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {timeline.map((event) => (
            <div key={event.id} className="relative flex gap-4 pl-2">
              {/* Timeline dot */}
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getTypeColor(event.type)} text-white`}>
                {getIcon(event)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{event.title}</p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {event.type}
                  </Badge>
                  {event.metadata?.platform && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {String(event.metadata.platform).replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(event.date, 'PPp')} · {formatDistanceToNow(event.date, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
