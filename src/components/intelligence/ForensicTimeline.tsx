import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, MessageSquare, FileText, Image, Video, Phone, 
  Mail, MapPin, User, Filter, Download, Search, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isWithinInterval } from "date-fns";

interface TimelineEvent {
  id: string;
  type: 'communication' | 'message' | 'event' | 'media' | 'document' | 'audit' | 'analysis';
  title: string;
  description: string;
  timestamp: string;
  profileId?: string;
  profileName?: string;
  metadata?: any;
  source: string;
  verified: boolean;
}

export function ForensicTimeline({ profileId }: { profileId?: string }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [eventType, setEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ['forensic-timeline', profileId, dateFrom, dateTo, eventType],
    queryFn: async () => {
      const allEvents: TimelineEvent[] = [];

      // Fetch communications
      const commQuery = supabase
        .from('communications')
        .select('id, channel, subject, content, occurred_at, profile_id, profiles(first_name, last_name)')
        .order('occurred_at', { ascending: false })
        .limit(200);
      
      if (profileId) commQuery.eq('profile_id', profileId);
      
      const { data: comms } = await commQuery;
      comms?.forEach(c => {
        const profile = c.profiles as any;
        allEvents.push({
          id: `comm-${c.id}`,
          type: 'communication',
          title: c.subject || `${c.channel} Communication`,
          description: c.content?.substring(0, 100) || '',
          timestamp: c.occurred_at,
          profileId: c.profile_id,
          profileName: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
          source: 'communications',
          verified: true
        });
      });

      // Fetch messages from conversations
      const msgQuery = supabase
        .from('messages')
        .select('id, content, sent_at, is_from_contact, conversations(profile_id, profiles(first_name, last_name))')
        .order('sent_at', { ascending: false })
        .limit(200);
      
      const { data: messages } = await msgQuery;
      messages?.forEach(m => {
        const conv = m.conversations as any;
        const profile = conv?.profiles;
        if (profileId && conv?.profile_id !== profileId) return;
        
        allEvents.push({
          id: `msg-${m.id}`,
          type: 'message',
          title: m.is_from_contact ? 'Incoming Message' : 'Outgoing Message',
          description: m.content?.substring(0, 100) || '',
          timestamp: m.sent_at,
          profileId: conv?.profile_id,
          profileName: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
          source: 'messages',
          verified: true
        });
      });

      // Fetch events
      const evtQuery = supabase
        .from('events')
        .select('id, title, event_type, event_date, profile_id, profiles(first_name, last_name)')
        .order('event_date', { ascending: false })
        .limit(100);
      
      if (profileId) evtQuery.eq('profile_id', profileId);
      
      const { data: evts } = await evtQuery;
      evts?.forEach(e => {
        const profile = e.profiles as any;
        allEvents.push({
          id: `evt-${e.id}`,
          type: 'event',
          title: e.title,
          description: e.event_type,
          timestamp: e.event_date,
          profileId: e.profile_id ?? undefined,
          profileName: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
          source: 'events',
          verified: true
        });
      });

      // Fetch audit logs - skip if table columns don't exist
      try {
        const auditQuery = supabase
          .from('immutable_audit_logs')
          .select('id, event_type, resource_type, resource_id, details, created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        
        const { data: audits } = await auditQuery;
        audits?.forEach((a: any) => {
          allEvents.push({
            id: `audit-${a.id}`,
            type: 'audit',
            title: `${a.event_type} on ${a.resource_type}`,
            description: a.details?.reason || '',
            timestamp: a.created_at,
            metadata: a.details,
            source: 'audit_logs',
            verified: true
          });
        });
      } catch (e) {
        console.log('Audit logs not available:', e);
      }

      // Sort by timestamp descending
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply filters
      let filtered = allEvents;
      
      if (eventType !== 'all') {
        filtered = filtered.filter(e => e.type === eventType);
      }
      
      if (dateFrom && dateTo) {
        filtered = filtered.filter(e => 
          isWithinInterval(parseISO(e.timestamp), {
            start: parseISO(dateFrom),
            end: parseISO(dateTo)
          })
        );
      }

      return filtered;
    }
  });

  const filteredEvents = events?.filter(e => 
    !searchQuery || 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.profileName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'message': return <Mail className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'media': return <Image className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'audit': return <Eye className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'communication': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'message': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'event': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'media': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'document': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'audit': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const handleExport = () => {
    if (!filteredEvents) return;
    
    const exportData = filteredEvents.map(e => ({
      timestamp: e.timestamp,
      type: e.type,
      title: e.title,
      description: e.description,
      profile: e.profileName,
      source: e.source,
      verified: e.verified
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forensic-timeline-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Forensic Timeline
          </h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive chronological view of all activities for investigations
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
              />
            </div>
            <div>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="communication">Communications</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="audit">Audit Logs</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            {filteredEvents?.length || 0} events found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
          ) : filteredEvents?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No events found for the selected criteria</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {filteredEvents?.map((event) => (
                    <div key={event.id} className="relative pl-12">
                      <div className={`absolute left-4 w-4 h-4 rounded-full border-2 ${getEventColor(event.type)}`} />
                      <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                              {getEventIcon(event.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{event.title}</span>
                                <Badge variant="outline" className={getEventColor(event.type)}>
                                  {event.type}
                                </Badge>
                                {event.verified && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(event.timestamp), 'PPpp')}
                                </span>
                                {event.profileName && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {event.profileName}
                                  </span>
                                )}
                                <span>Source: {event.source}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}