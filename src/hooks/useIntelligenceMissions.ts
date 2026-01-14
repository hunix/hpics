import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { IntelligenceMission, MissionEvent, MissionType, MissionStatus } from '@/types/hardware';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useIntelligenceMissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: missions = [], isLoading, error } = useQuery({
    queryKey: ['intelligence-missions', user?.id],
    queryFn: async (): Promise<IntelligenceMission[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('intelligence_missions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as IntelligenceMission[];
    },
    enabled: !!user?.id,
  });

  // Subscribe to mission events
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('mission-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mission_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const event = payload.new as MissionEvent;
          if (event.severity === 'critical' || event.severity === 'alert') {
            toast.warning(`Mission Alert: ${event.event_type}`, {
              description: JSON.stringify(event.event_data).slice(0, 100),
            });
          }
          queryClient.invalidateQueries({ queryKey: ['mission-events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const createMission = useMutation({
    mutationFn: async (mission: {
      mission_name: string;
      mission_type: MissionType;
      target_profile_id?: string;
      target_location?: { lat: number; lng: number };
      target_location_name?: string;
      target_radius_meters?: number;
      devices_assigned?: string[];
      parameters?: Record<string, unknown>;
      scheduled_start?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('intelligence_missions')
        .insert({
          user_id: user.id,
          mission_name: mission.mission_name,
          mission_type: mission.mission_type,
          target_profile_id: mission.target_profile_id || null,
          target_location: mission.target_location || null,
          target_location_name: mission.target_location_name || null,
          target_radius_meters: mission.target_radius_meters || null,
          devices_assigned: mission.devices_assigned || [],
          parameters: mission.parameters || {},
          scheduled_start: mission.scheduled_start || null,
          priority: mission.priority || 'normal',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-missions', user?.id] });
      toast.success('Mission created');
    },
    onError: (error) => {
      toast.error(`Failed to create mission: ${error.message}`);
    },
  });

  const updateMissionStatus = useMutation({
    mutationFn: async ({ missionId, status }: { missionId: string; status: MissionStatus }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'active') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'aborted') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('intelligence_missions')
        .update(updates)
        .eq('id', missionId)
        .select()
        .single();

      if (error) throw error;

      // Create mission event
      await supabase.from('mission_events').insert({
        mission_id: missionId,
        user_id: user?.id,
        event_type: status === 'active' ? 'started' : status === 'paused' ? 'paused' : 'completed',
        event_data: { new_status: status },
        severity: 'info',
      });

      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-missions', user?.id] });
      toast.success(`Mission ${status}`);
    },
  });

  const addMissionEvent = useMutation({
    mutationFn: async (event: {
      mission_id: string;
      event_type: MissionEvent['event_type'];
      event_data?: Record<string, unknown>;
      location?: { lat: number; lng: number };
      severity?: MissionEvent['severity'];
      device_id?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mission_events')
        .insert({
          user_id: user.id,
          mission_id: event.mission_id,
          event_type: event.event_type,
          event_data: event.event_data || {},
          location: event.location || null,
          severity: event.severity || 'info',
          device_id: event.device_id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  const activeMissions = missions.filter(m => m.status === 'active');
  const plannedMissions = missions.filter(m => m.status === 'planned');
  const completedMissions = missions.filter(m => m.status === 'completed' || m.status === 'aborted');

  return {
    missions,
    activeMissions,
    plannedMissions,
    completedMissions,
    isLoading,
    error,
    createMission,
    updateMissionStatus,
    addMissionEvent,
  };
}

export function useMissionEvents(missionId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mission-events', missionId],
    queryFn: async (): Promise<MissionEvent[]> => {
      if (!missionId) return [];
      
      const { data, error } = await supabase
        .from('mission_events')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as MissionEvent[];
    },
    enabled: !!missionId && !!user?.id,
  });
}
