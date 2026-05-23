import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUpcomingMeetingsPrep, useCachedMeetingBriefings, type MeetingPrepRow } from '@/hooks/calendar/useUpcomingMeetingsPrep';
import { 
  Calendar, Clock, User, MessageSquare, AlertTriangle,
  Lightbulb, ChevronDown, RefreshCw, FileText, Target
} from 'lucide-react';
import { format, formatDistanceToNow, addDays, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

type MeetingPrep = MeetingPrepRow;

export function MeetingPrepWidget() {
  const queryClient = useQueryClient();
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  const { data: upcomingMeetings, isLoading } = useUpcomingMeetingsPrep(7, 10);

  // Generate meeting prep
  const generatePrep = useMutation({
    mutationFn: async (meeting: MeetingPrep) => {
      const { data, error } = await invokeFunction('generate-meeting-prep', { 
          profileId: meeting.profileId,
          eventId: meeting.eventId,
          eventTitle: meeting.eventTitle,
          eventDate: meeting.eventDate.toISOString()
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-meetings-prep'] });
      toast.success('Meeting briefing generated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate briefing: ${error.message}`);
    },
  });

  const { data: briefings } = useCachedMeetingBriefings();

  interface MeetingBriefing {
    relationshipHealth: number;
    lastContact?: string;
    riskAlerts: string[];
    talkingPoints: string[];
    keyTopics: string[];
    recentCommunications: unknown[];
  }
  const getMeetingBriefing = (profileId: string): MeetingBriefing | undefined => {
    const raw = (briefings as Record<string, Partial<MeetingBriefing>> | undefined)?.[profileId];
    if (!raw) return undefined;
    return {
      relationshipHealth: raw.relationshipHealth ?? 0,
      lastContact: raw.lastContact,
      riskAlerts: raw.riskAlerts ?? [],
      talkingPoints: raw.talkingPoints ?? [],
      keyTopics: raw.keyTopics ?? [],
      recentCommunications: raw.recentCommunications ?? [],
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = addDays(new Date(), 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Meeting Preparation
        </CardTitle>
        <CardDescription>
          AI-generated briefings for upcoming meetings with contacts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => {
                const briefing = getMeetingBriefing(meeting.profileId);
                const isExpanded = expandedMeeting === meeting.eventId;
                
                return (
                  <Collapsible 
                    key={meeting.eventId} 
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedMeeting(open ? meeting.eventId : null)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                              <span className="text-xs text-muted-foreground">
                                {format(meeting.eventDate, 'MMM')}
                              </span>
                              <span className="text-lg font-bold">
                                {format(meeting.eventDate, 'd')}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{meeting.eventTitle}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {meeting.profileName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isToday(meeting.eventDate) && (
                              <Badge variant="destructive">Today</Badge>
                            )}
                            {isTomorrow(meeting.eventDate) && (
                              <Badge variant="secondary">Tomorrow</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(meeting.eventDate, 'h:mm a')}
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t pt-4">
                          {briefing ? (
                            <div className="space-y-4">
                              {/* Relationship Health */}
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Relationship Health:</span>
                                <Badge variant={briefing.relationshipHealth >= 70 ? 'default' : 'secondary'}>
                                  {briefing.relationshipHealth}%
                                </Badge>
                                {briefing.lastContact && (
                                  <span className="text-xs text-muted-foreground">
                                    • Last contact {formatDistanceToNow(new Date(briefing.lastContact), { addSuffix: true })}
                                  </span>
                                )}
                              </div>

                              {/* Risk Alerts */}
                              {briefing.riskAlerts?.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium flex items-center gap-1 text-yellow-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    Risk Alerts
                                  </p>
                                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                                    {briefing.riskAlerts.map((alert: string, i: number) => (
                                      <li key={i}>{alert}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Talking Points */}
                              {briefing.talkingPoints?.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium flex items-center gap-1 text-green-600">
                                    <Lightbulb className="h-4 w-4" />
                                    Suggested Talking Points
                                  </p>
                                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                                    {briefing.talkingPoints.map((point: string, i: number) => (
                                      <li key={i}>{point}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Key Topics */}
                              {briefing.keyTopics?.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" />
                                    Recent Topics
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {briefing.keyTopics.map((topic: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">{topic}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => generatePrep.mutate(meeting)}
                                disabled={generatePrep.isPending}
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${generatePrep.isPending ? 'animate-spin' : ''}`} />
                                Refresh Briefing
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground mb-3">
                                No briefing generated yet
                              </p>
                              <Button 
                                size="sm"
                                onClick={() => generatePrep.mutate(meeting)}
                                disabled={generatePrep.isPending}
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${generatePrep.isPending ? 'animate-spin' : ''}`} />
                                Generate Briefing
                              </Button>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming meetings with contacts</p>
            <p className="text-sm">Events with associated contacts will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
