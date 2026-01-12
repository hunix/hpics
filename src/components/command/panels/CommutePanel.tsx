/**
 * CommutePanel - Context panel for commute mode
 * Shows: voice notes, call queue, nearby contacts, route contacts
 */

import React from 'react';
import { 
  Mic, 
  Phone, 
  Users, 
  MapPin, 
  Clock,
  PlayCircle,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function CommutePanel() {
  const { user } = useAuth();

  // Fetch suggested call queue based on relationship health
  const { data: callQueue } = useQuery({
    queryKey: ['commute-call-queue', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('follow_up_suggestions')
        .select(`
          id, suggested_action, priority,
          profile:profiles!follow_up_suggestions_profile_id_fkey(
            id, first_name, last_name, avatar_url, phone
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('suggestion_type', 'call')
        .order('priority', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch nearby contacts
  const { data: nearbyContacts } = useQuery({
    queryKey: ['commute-nearby', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('proximity_events')
        .select(`
          id, detection_method, created_at,
          profile:profiles!proximity_events_detected_profile_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="p-4 space-y-4">
      {/* Voice Notes */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Voice Note</p>
                <p className="text-xs text-muted-foreground">
                  Quick capture while driving
                </p>
              </div>
            </div>
            <Button>
              <Mic className="h-4 w-4 mr-2" />
              Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Call Queue */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Suggested Calls</span>
          <Badge variant="secondary">{callQueue?.length || 0}</Badge>
        </div>
        <ScrollArea className="h-40">
          <div className="space-y-2">
            {callQueue?.map((item: any) => {
              const profile = item.profile;
              const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
              return (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{item.suggested_action}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {!callQueue?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No calls suggested right now
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Nearby Contacts */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Recently Nearby</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {nearbyContacts?.map((event: any) => {
            const profile = event.profile;
            const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
            return (
              <div 
                key={event.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{name}</span>
              </div>
            );
          })}
          {!nearbyContacts?.length && (
            <p className="text-sm text-muted-foreground">No nearby contacts detected</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="justify-start">
          <PlayCircle className="h-4 w-4 mr-2" />
          Play Briefing
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <Navigation className="h-4 w-4 mr-2" />
          Route Contacts
        </Button>
      </div>
    </div>
  );
}
