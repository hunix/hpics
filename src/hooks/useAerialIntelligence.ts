import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunction } from '@/lib/api';

export interface Waypoint {
  latitude: number;
  longitude: number;
  altitude_meters: number;
  speed_mps?: number;
  heading_degrees?: number;
  gimbal_pitch_degrees?: number;
  actions?: WaypointAction[];
  hover_time_seconds?: number;
}

export interface WaypointAction {
  type: 'photo' | 'video_start' | 'video_stop' | 'hover' | 'rotate' | 'gimbal';
  params?: Record<string, unknown>;
}

export interface MissionPlan {
  name: string;
  waypoints: Waypoint[];
  settings: {
    max_altitude_meters: number;
    max_speed_mps: number;
    return_to_home: boolean;
    obstacle_avoidance: boolean;
    camera_mode: 'photo' | 'video' | 'timelapse';
    photo_interval_seconds?: number;
    video_resolution?: '4k' | '2.7k' | '1080p';
  };
}

export interface AerialMission {
  id: string;
  user_id: string;
  drone_device_id: string | null;
  mission_id: string | null;
  waypoints: Waypoint[];
  flight_path: { lat: number; lng: number }[] | null;
  altitude_meters: number | null;
  speed_mps: number | null;
  flight_mode: string | null;
  camera_settings: Record<string, unknown> | null;
  telemetry_log: Record<string, unknown> | null;
  weather_conditions: Record<string, unknown> | null;
  total_distance_meters: number | null;
  flight_duration_seconds: number | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export interface AerialCapture {
  id: string;
  aerial_mission_id: string;
  user_id: string;
  capture_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  location: { lat: number; lng: number } | null;
  altitude_meters: number | null;
  heading_degrees: number | null;
  gimbal_pitch_degrees: number | null;
  detected_objects: Record<string, unknown> | null;
  analysis: Record<string, unknown> | null;
  captured_at: string | null;
}

export function useAerialIntelligence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch aerial missions
  const { data: missions = [], isLoading: missionsLoading, refetch: refetchMissions } = useQuery({
    queryKey: ['aerial-missions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await invokeFunction('aerial-intelligence', { action: 'get_missions', limit: 50 });

      if (response.error) throw response.error;
      return (response.data?.missions || []) as AerialMission[];
    }
  });

  // Fetch captures for a mission
  const fetchCaptures = async (missionId?: string): Promise<AerialCapture[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const response = await invokeFunction('aerial-intelligence', { action: 'get_captures', aerial_mission_id: missionId });

    if (response.error) throw response.error;
    return response.data?.captures || [];
  };

  // Create a new mission
  const createMission = useMutation({
    mutationFn: async (params: { 
      drone_device_id: string; 
      mission_id?: string; 
      plan: MissionPlan 
    }) => {
      setIsCreating(true);
      const response = await invokeFunction('aerial-intelligence', { action: 'create_mission', ...params });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Mission Created',
        description: `Estimated distance: ${Math.round(data.total_distance_meters)}m, Duration: ${Math.round(data.estimated_duration_seconds / 60)}min`
      });
      queryClient.invalidateQueries({ queryKey: ['aerial-missions'] });
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create mission',
        description: error.message,
        variant: 'destructive'
      });
      setIsCreating(false);
    }
  });

  // Start a mission
  const startMission = useMutation({
    mutationFn: async (aerialMissionId: string) => {
      const response = await invokeFunction('aerial-intelligence', { action: 'start_mission', aerial_mission_id: aerialMissionId });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Mission Started',
        description: 'Drone is now executing the flight plan'
      });
      queryClient.invalidateQueries({ queryKey: ['aerial-missions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start mission',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Complete a mission
  const completeMission = useMutation({
    mutationFn: async (params: { aerial_mission_id: string; telemetry_log?: Record<string, unknown> }) => {
      const response = await invokeFunction('aerial-intelligence', { action: 'complete_mission', ...params });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Mission Completed',
        description: 'Flight data has been logged'
      });
      queryClient.invalidateQueries({ queryKey: ['aerial-missions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to complete mission',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Upload a capture
  const uploadCapture = useMutation({
    mutationFn: async (params: {
      aerial_mission_id: string;
      capture: {
        capture_type: 'photo' | 'video' | 'thermal';
        media_url: string;
        thumbnail_url?: string;
        location: { lat: number; lng: number };
        altitude_meters: number;
        heading_degrees: number;
        gimbal_pitch_degrees: number;
        captured_at: string;
      };
    }) => {
      const response = await invokeFunction('aerial-intelligence', { action: 'upload_capture', ...params });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Capture Uploaded',
        description: 'Aerial capture has been stored'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to upload capture',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Analyze a capture
  const analyzeCapture = useMutation({
    mutationFn: async (params: {
      capture_id: string;
      analysis_types: ('crowd' | 'vehicle' | 'structure' | 'perimeter')[];
    }) => {
      const response = await invokeFunction('aerial-intelligence', { action: 'analyze_capture', ...params });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Analysis Complete',
        description: 'AI analysis has been generated'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    missions,
    missionsLoading,
    refetchMissions,
    fetchCaptures,
    createMission: createMission.mutate,
    startMission: startMission.mutate,
    completeMission: completeMission.mutate,
    uploadCapture: uploadCapture.mutate,
    analyzeCapture: analyzeCapture.mutate,
    isCreating,
    isStarting: startMission.isPending,
    isAnalyzing: analyzeCapture.isPending
  };
}
