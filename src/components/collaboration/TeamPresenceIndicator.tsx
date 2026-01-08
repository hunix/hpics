import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TeamMember {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  current_view: string | null;
  viewing_profile_id: string | null;
  last_seen: string;
}

interface TeamPresenceIndicatorProps {
  workspaceId?: string;
  profileId?: string;
  compact?: boolean;
}

export function TeamPresenceIndicator({ 
  workspaceId, 
  profileId,
  compact = false 
}: TeamPresenceIndicatorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch team presence
  const { data: presence = [] } = useQuery({
    queryKey: ['team-presence', workspaceId, profileId],
    queryFn: async () => {
      let query = supabase
        .from('team_presence')
        .select('*')
        .neq('user_id', user?.id || '')
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }
      if (profileId) {
        query = query.eq('viewing_profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Update own presence
  const updatePresence = useMutation({
    mutationFn: async (data: { status?: string; current_view?: string; viewing_profile_id?: string | null }) => {
      if (!user || !workspaceId) return;

      const { error } = await supabase
        .from('team_presence')
        .upsert({
          user_id: user.id,
          workspace_id: workspaceId,
          status: data.status || 'online',
          current_view: data.current_view,
          viewing_profile_id: data.viewing_profile_id,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id,workspace_id' });

      if (error) throw error;
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`presence-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_presence',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['team-presence', workspaceId] });
        }
      )
      .subscribe();

    // Update presence on mount
    updatePresence.mutate({ 
      status: 'online', 
      current_view: window.location.pathname,
      viewing_profile_id: profileId 
    });

    // Heartbeat every 2 minutes
    const heartbeat = setInterval(() => {
      updatePresence.mutate({ 
        status: 'online',
        current_view: window.location.pathname,
        viewing_profile_id: profileId
      });
    }, 120000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeat);
    };
  }, [workspaceId, profileId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (presence.length === 0) return null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex -space-x-2">
              {presence.slice(0, 3).map((member) => (
                <div key={member.user_id} className="relative">
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {member.user_id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background",
                    getStatusColor(member.status)
                  )} />
                </div>
              ))}
              {presence.length > 3 && (
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium border-2 border-background">
                  +{presence.length - 3}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{presence.length} team member{presence.length !== 1 ? 's' : ''} viewing</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Team online:</span>
      <div className="flex -space-x-2">
        {presence.map((member) => (
          <TooltipProvider key={member.user_id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarFallback>
                      {member.user_id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                    getStatusColor(member.status)
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="capitalize">{member.status}</p>
                {member.current_view && (
                  <p className="text-xs text-muted-foreground">Viewing: {member.current_view}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
