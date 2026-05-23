import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar, Phone, Mail, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface BestDay {
  day: string;
  dayIndex: number;
  score: number;
  count: number;
  avgSentiment: number;
}

interface BestHour {
  hour: number;
  hourFormatted: string;
  score: number;
  count: number;
  avgSentiment: number;
}

interface BestChannel {
  channel: string;
  score: number;
  count: number;
  avgSentiment: number;
}

interface OutreachTiming {
  profileId: string;
  profileName: string;
  totalInteractions: number;
  bestDays: BestDay[];
  bestHours: BestHour[];
  bestChannels: BestChannel[];
  aiRecommendation: string;
}

interface OutreachSchedulerWidgetProps {
  profileId?: string;
  profileName?: string;
}

const channelIcons: Record<string, React.ElementType> = {
  phone: Phone,
  email: Mail,
  message: MessageSquare,
  sms: MessageSquare,
  video_call: Phone,
  in_person: Calendar,
};

export function OutreachSchedulerWidget({ profileId, profileName }: OutreachSchedulerWidgetProps) {
  const [timing, setTiming] = useState<OutreachTiming | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await invokeFunction('suggest-outreach-timing', { profileId }, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

      if (response.error) throw response.error;
      return response.data as OutreachTiming;
    },
    onSuccess: (data) => {
      setTiming(data);
      toast.success('Timing analysis complete');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to analyze timing');
    },
  });

  const getChannelIcon = (channel: string) => {
    const Icon = channelIcons[channel.toLowerCase()] || MessageSquare;
    return Icon;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Optimal Outreach Timing
        </CardTitle>
        <CardDescription>
          Best times to reach{profileName ? ` ${profileName}` : ' this contact'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="w-full"
          size="sm"
        >
          {analyzeMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Analyze Best Times
        </Button>

        {analyzeMutation.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {timing && (
          <div className="space-y-4">
            {/* AI Recommendation */}
            {timing.aiRecommendation && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <h5 className="text-xs font-medium text-primary mb-1">AI Recommendation</h5>
                    <p className="text-sm">{timing.aiRecommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Best Days */}
            {timing.bestDays.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Best Days
                </h5>
                <div className="space-y-2">
                  {timing.bestDays.map((day, index) => (
                    <div key={day.day} className="flex items-center gap-3">
                      <span className="text-sm w-24">{day.day}</span>
                      <div className="flex-1">
                        <Progress 
                          value={(day.score / (timing.bestDays[0]?.score || 1)) * 100} 
                          className="h-2"
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {day.count} chats
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Hours */}
            {timing.bestHours.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Best Times
                </h5>
                <div className="flex flex-wrap gap-2">
                  {timing.bestHours.map((hour, index) => (
                    <Badge
                      key={hour.hour}
                      variant={index === 0 ? 'default' : 'secondary'}
                    >
                      {hour.hourFormatted}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Best Channels */}
            {timing.bestChannels.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Preferred Channels</h5>
                <div className="grid grid-cols-3 gap-2">
                  {timing.bestChannels.map((channel, index) => {
                    const Icon = getChannelIcon(channel.channel);
                    return (
                      <div
                        key={channel.channel}
                        className={`p-2 rounded-lg text-center ${
                          index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1" />
                        <div className="text-xs font-medium capitalize">
                          {channel.channel.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {channel.count} uses
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="text-xs text-muted-foreground text-center">
              Based on {timing.totalInteractions} past interactions
            </div>
          </div>
        )}

        {!timing && !analyzeMutation.isPending && (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Analyze communication patterns to find optimal timing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
