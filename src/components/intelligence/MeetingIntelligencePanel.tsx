import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Video, FileText, Send, Clock, CheckSquare, 
  Calendar, Sparkles, Copy, ChevronRight 
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, addDays } from "date-fns";

interface MeetingIntel {
  id: string;
  eventId: string;
  eventTitle: string;
  profileName: string;
  startTime: Date;
  hasBriefing: boolean;
  hasFollowUp: boolean;
  actionItems: Array<{ task: string; owner: string; done: boolean }>;
  followUpDraft: { subject: string; body: string } | null;
}

export function MeetingIntelligencePanel() {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingIntel | null>(null);

  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ['meeting-intelligence'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { upcoming: [], past: [] };

      const now = new Date();
      const weekAhead = addDays(now, 7);
      const weekAgo = addDays(now, -7);

      const [upcomingRes, pastRes] = await Promise.all([
        supabase
          .from('events')
          .select(`
            id, title, start_time, end_time,
            profiles(first_name, last_name),
            meeting_intelligence(*)
          `)
          .eq('user_id', user.id)
          .gte('start_time', now.toISOString())
          .lte('start_time', weekAhead.toISOString())
          .order('start_time', { ascending: true })
          .limit(10),
        supabase
          .from('events')
          .select(`
            id, title, start_time, end_time,
            profiles(first_name, last_name),
            meeting_intelligence(*)
          `)
          .eq('user_id', user.id)
          .lt('start_time', now.toISOString())
          .gte('start_time', weekAgo.toISOString())
          .order('start_time', { ascending: false })
          .limit(10)
      ]);

      const mapEvent = (e: any): MeetingIntel => {
        const intel = e.meeting_intelligence?.[0];
        const profile = e.profiles?.[0];
        return {
          id: intel?.id || e.id,
          eventId: e.id,
          eventTitle: e.title,
          profileName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
          startTime: new Date(e.start_time),
          hasBriefing: !!intel?.pre_briefing,
          hasFollowUp: !!intel?.follow_up_draft,
          actionItems: intel?.action_items || [],
          followUpDraft: intel?.follow_up_draft || null
        };
      };

      return {
        upcoming: (upcomingRes.data || []).map(mapEvent),
        past: (pastRes.data || []).map(mapEvent)
      };
    }
  });

  const generateBriefing = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.functions.invoke('generate-meeting-prep', {
        body: { eventId }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Briefing generated');
    },
    onError: () => {
      toast.error('Failed to generate briefing');
    }
  });

  const generateFollowUp = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.functions.invoke('generate-meeting-followup', {
        body: { eventId }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Follow-up generated');
    },
    onError: () => {
      toast.error('Failed to generate follow-up');
    }
  });

  const copyFollowUp = (draft: { subject: string; body: string }) => {
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    toast.success('Copied to clipboard');
  };

  const MeetingCard = ({ meeting, showFollowUp = false }: { meeting: MeetingIntel; showFollowUp?: boolean }) => (
    <div
      className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => setSelectedMeeting(meeting)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{meeting.eventTitle}</div>
          <div className="text-xs text-muted-foreground">
            with {meeting.profileName}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(meeting.startTime, 'MMM d, h:mm a')}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {meeting.hasBriefing && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Brief
            </Badge>
          )}
          {meeting.hasFollowUp && (
            <Badge variant="outline" className="text-xs">
              <Send className="h-3 w-3 mr-1" />
              Follow-up
            </Badge>
          )}
        </div>
      </div>
      
      {!showFollowUp && !meeting.hasBriefing && (
        <Button
          size="sm"
          variant="ghost"
          className="mt-2 w-full"
          onClick={(e) => {
            e.stopPropagation();
            generateBriefing.mutate(meeting.eventId);
          }}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Generate Briefing
        </Button>
      )}
      
      {showFollowUp && !meeting.hasFollowUp && (
        <Button
          size="sm"
          variant="ghost"
          className="mt-2 w-full"
          onClick={(e) => {
            e.stopPropagation();
            generateFollowUp.mutate(meeting.eventId);
          }}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Generate Follow-up
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { upcoming, past } = meetingsData || { upcoming: [], past: [] };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Video className="h-5 w-5" />
          Meeting Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upcoming" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs">
              <CheckSquare className="h-3 w-3 mr-1" />
              Past ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {upcoming.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming meetings</p>
                  </div>
                ) : (
                  upcoming.map(meeting => (
                    <MeetingCard key={meeting.eventId} meeting={meeting} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="past">
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {past.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent meetings</p>
                  </div>
                ) : (
                  past.map(meeting => (
                    <MeetingCard key={meeting.eventId} meeting={meeting} showFollowUp />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Selected Meeting Details */}
        {selectedMeeting?.followUpDraft && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Follow-up Draft</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyFollowUp(selectedMeeting.followUpDraft!)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs font-medium">Subject: {selectedMeeting.followUpDraft.subject}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
              {selectedMeeting.followUpDraft.body}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
