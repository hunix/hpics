import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  MessageSquare, 
  Gift, 
  Calendar, 
  Clock, 
  UserPlus,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  ChevronRight,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, addDays } from 'date-fns';

interface ProactiveAction {
  id: string;
  type: 'followup' | 'birthday' | 'decay' | 'promise' | 'introduction' | 'timing';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  profileId?: string;
  profileName?: string;
  dueDate?: string;
  suggestedChannel?: string;
  actionLabel: string;
}

export function ProactiveActionsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: actions, isLoading, refetch } = useQuery({
    queryKey: ['proactive-actions', user?.id],
    queryFn: async (): Promise<ProactiveAction[]> => {
      if (!user?.id) return [];

      const actions: ProactiveAction[] = [];
      const today = new Date();
      const sevenDaysFromNow = addDays(today, 7);
      const thirtyDaysFromNow = addDays(today, 30);

      // Fetch data in parallel
      const [
        { data: profiles },
        { data: communications },
        { data: events },
        { data: interactionNotes },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('user_id', user.id),
        supabase
          .from('communications')
          .select('profile_id, occurred_at, channel')
          .eq('user_id', user.id)
          .order('occurred_at', { ascending: false }),
        supabase
          .from('events')
          .select('id, title, event_date, profile_id, event_type, profiles(first_name, last_name)')
          .eq('user_id', user.id)
          .gte('event_date', today.toISOString())
          .lte('event_date', thirtyDaysFromNow.toISOString())
          .order('event_date', { ascending: true }),
        supabase
          .from('contact_interaction_notes')
          .select('id, profile_id, follow_up_date, follow_up_reason, follow_up_needed, promises_made, profiles(first_name, last_name)')
          .eq('user_id', user.id)
          .eq('follow_up_needed', true)
          .lte('follow_up_date', sevenDaysFromNow.toISOString()),
      ]);
      // Build last contact map
      const lastContactMap = new Map<string, { date: string; channel: string }>();
      communications?.forEach(c => {
        if (!lastContactMap.has(c.profile_id)) {
          lastContactMap.set(c.profile_id, { date: c.occurred_at, channel: c.channel });
        }
      });

      // 1. Follow-up reminders from interaction notes
      interactionNotes?.forEach(note => {
        const profile = note.profiles as { first_name: string; last_name: string } | null;
        const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Contact';
        const daysUntil = note.follow_up_date ? differenceInDays(new Date(note.follow_up_date), today) : 0;
        
        actions.push({
          id: `followup-${note.id}`,
          type: 'followup',
          priority: daysUntil <= 0 ? 'urgent' : daysUntil <= 2 ? 'high' : 'medium',
          title: `Follow up with ${name}`,
          description: note.follow_up_reason || 'Scheduled follow-up',
          profileId: note.profile_id,
          profileName: name,
          dueDate: note.follow_up_date || undefined,
          actionLabel: 'View Contact',
        });
      });

      // 2. Stale contacts (no communication in 60+ days but were active)
      profiles?.forEach(profile => {
        const lastContact = lastContactMap.get(profile.id);
        if (lastContact) {
          const daysSinceContact = differenceInDays(today, new Date(lastContact.date));
          const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          
          if (daysSinceContact >= 30) {
            actions.push({
              id: `stale-${profile.id}`,
              type: daysSinceContact >= 60 ? 'decay' : 'followup',
              priority: daysSinceContact >= 90 ? 'urgent' : daysSinceContact >= 60 ? 'high' : 'medium',
              title: `Check in with ${name}`,
              description: `It's been ${daysSinceContact} days since your last contact`,
              profileId: profile.id,
              profileName: name,
              suggestedChannel: lastContact.channel,
              actionLabel: 'Reach Out',
            });
          }
        }
      });

      // Sort by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return actions.slice(0, 10);
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'followup':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'birthday':
        return <Gift className="h-4 w-4 text-pink-500" />;
      case 'decay':
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'promise':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'introduction':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'timing':
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const priorityColors = {
    urgent: 'bg-destructive text-destructive-foreground',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-yellow-950',
    low: 'bg-muted text-muted-foreground',
  };

  const handleAction = (action: ProactiveAction) => {
    if (action.profileId) {
      navigate(`/contacts/${action.profileId}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Proactive Actions
            </CardTitle>
            <CardDescription>AI-suggested actions for today</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            Analyzing your network...
          </div>
        ) : !actions || actions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">All caught up!</p>
            <p className="text-xs">No urgent actions needed right now</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => handleAction(action)}
                >
                  <div className="flex items-start gap-3">
                    {getTypeIcon(action.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{action.title}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[action.priority]}`}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                      {(action.dueDate || action.suggestedChannel) && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {action.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(action.dueDate), 'MMM d')}
                            </span>
                          )}
                          {action.suggestedChannel && (
                            <span className="flex items-center gap-1">
                              {getChannelIcon(action.suggestedChannel)}
                              via {action.suggestedChannel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
