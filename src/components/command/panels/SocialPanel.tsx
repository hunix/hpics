/**
 * SocialPanel - Context panel for social mode
 * Shows: quick capture, face scanner, group tagging, social context
 */

import React from 'react';
import { 
  Camera, 
  Scan, 
  Users, 
  Tag, 
  Sparkles,
  Share2,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function SocialPanel() {
  const { user } = useAuth();

  // Fetch recent social interactions
  const { data: recentSocial } = useQuery({
    queryKey: ['social-recent', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('proximity_events')
        .select(`
          id, detection_method, created_at, metadata,
          profile:profiles!proximity_events_detected_profile_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch conversation starters for nearby contacts
  const { data: icebreakers } = useQuery({
    queryKey: ['social-icebreakers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Get recent profiles and their interests
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, interests, notes')
        .eq('user_id', user.id)
        .not('interests', 'is', null)
        .limit(3);
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="p-4 space-y-4">
      {/* Quick Capture */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-pink-500/10">
                <Camera className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="font-medium">Quick Capture</p>
                <p className="text-xs text-muted-foreground">
                  Photo or note from event
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Camera className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Face Scanner Quick Access */}
      <Card className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 border-violet-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scan className="h-6 w-6 text-violet-500" />
              <div>
                <p className="font-medium">Face Scanner</p>
                <p className="text-xs text-muted-foreground">
                  Identify contacts in view
                </p>
              </div>
            </div>
            <Button className="bg-violet-500 hover:bg-violet-600">
              <Scan className="h-4 w-4 mr-2" />
              Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Social Contacts */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Seen Recently</span>
          <Badge variant="secondary">{recentSocial?.length || 0}</Badge>
        </div>
        <ScrollArea className="h-32">
          <div className="flex flex-wrap gap-2">
            {recentSocial?.map((event: any) => {
              const profile = event.profile;
              const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
              return (
                <div 
                  key={event.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{name}</span>
                </div>
              );
            })}
            {!recentSocial?.length && (
              <p className="text-sm text-muted-foreground">No recent social contacts</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation Starters */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Conversation Starters</span>
        </div>
        <div className="space-y-2">
          {icebreakers?.slice(0, 2).map((profile: any) => {
            const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            const interests = profile.interests as string[] | null;
            return (
              <div 
                key={profile.id}
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-xs">{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                {interests?.length ? (
                  <p className="text-xs text-muted-foreground">
                    Ask about: {interests.slice(0, 3).join(', ')}
                  </p>
                ) : null}
              </div>
            );
          })}
          {!icebreakers?.length && (
            <p className="text-sm text-muted-foreground">Add interests to contacts for suggestions</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="justify-start">
          <Tag className="h-4 w-4 mr-2" />
          Tag Group
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <Share2 className="h-4 w-4 mr-2" />
          Share Contact
        </Button>
      </div>
    </div>
  );
}
