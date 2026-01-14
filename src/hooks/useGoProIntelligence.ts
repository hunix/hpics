import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface GoProDevice {
  id: string;
  device_name: string;
  gopro_model: string;
  serial_number: string;
  firmware_version: string;
  is_online: boolean;
  capabilities: {
    supports_live_stream: boolean;
    supports_remote_control: boolean;
    max_resolution: string;
    has_gps: boolean;
    has_stabilization: boolean;
  };
}

export interface GoProMedia {
  filename: string;
  type: 'video' | 'photo';
  size_bytes: number;
  created_at: string;
  thumbnail_url?: string;
  download_url: string;
  gps_location?: { lat: number; lng: number };
  duration_seconds?: number;
}

export function useGoProIntelligence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Register a GoPro device
  const registerGoPro = useMutation({
    mutationFn: async (params: {
      device_name: string;
      gopro_model: string;
      serial_number?: string;
      firmware_version?: string;
    }) => {
      const response = await supabase.functions.invoke('gopro-intelligence', {
        body: { action: 'register_gopro', ...params }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'GoPro Registered',
        description: 'Device is now connected to the system'
      });
      queryClient.invalidateQueries({ queryKey: ['hardware-devices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Start recording
  const startRecording = useMutation({
    mutationFn: async (params: {
      device_id: string;
      mode: 'video' | 'photo' | 'timelapse' | 'burst';
      settings?: {
        resolution?: string;
        fps?: number;
        fov?: string;
        stabilization?: boolean;
      };
    }) => {
      const response = await supabase.functions.invoke('gopro-intelligence', {
        body: { action: 'start_recording', ...params }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setIsRecording(true);
      toast({
        title: 'Recording Started',
        description: data.message
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start recording',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Stop recording
  const stopRecording = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await supabase.functions.invoke('gopro-intelligence', {
        body: { action: 'stop_recording', device_id: deviceId }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      setIsRecording(false);
      toast({
        title: 'Recording Stopped',
        description: 'Capture complete'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to stop recording',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Capture photo
  const capturePhoto = useMutation({
    mutationFn: async (params: {
      device_id: string;
      settings?: {
        resolution?: string;
        mode?: string;
      };
    }) => {
      const response = await supabase.functions.invoke('gopro-intelligence', {
        body: { action: 'capture_photo', ...params }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Photo Captured',
        description: 'Image saved to device'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Capture failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Start livestream
  const startLivestream = useMutation({
    mutationFn: async (params: {
      device_id: string;
      stream_settings?: {
        resolution?: '720p' | '1080p';
        bitrate?: number;
      };
    }) => {
      const response = await supabase.functions.invoke('gopro-intelligence', {
        body: { action: 'start_livestream', ...params }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      setIsStreaming(true);
      toast({
        title: 'Livestream Active',
        description: 'Stream is now live'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Livestream failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Sync media from device
  const syncMedia = useMutation({
    mutationFn: async (params: {
      device_id: string;
      media_list: GoProMedia[];
    }) => {
      const response = await supabase.functions.invoke('gopro-intelligence', {
        body: { action: 'sync_media', ...params }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Media Synced',
        description: `${data.synced_count} files uploaded`
      });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Get device status
  const getStatus = async (deviceId: string) => {
    const response = await supabase.functions.invoke('gopro-intelligence', {
      body: { action: 'get_status', device_id: deviceId }
    });

    if (response.error) throw response.error;
    return response.data;
  };

  // Analyze footage
  const analyzeFootage = useMutation({
    mutationFn: async (params: {
      media_id: string;
      analysis_type: 'scene' | 'faces' | 'objects' | 'activity' | 'comprehensive';
    }) => {
      const response = await supabase.functions.invoke('gopro-intelligence', {
        body: { action: 'analyze_footage', ...params }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Analysis Complete',
        description: 'AI intelligence report generated'
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
    registerGoPro: registerGoPro.mutate,
    startRecording: startRecording.mutate,
    stopRecording: stopRecording.mutate,
    capturePhoto: capturePhoto.mutate,
    startLivestream: startLivestream.mutate,
    syncMedia: syncMedia.mutate,
    getStatus,
    analyzeFootage: analyzeFootage.mutate,
    isRecording,
    isStreaming,
    isRegistering: registerGoPro.isPending,
    isSyncing: syncMedia.isPending,
    isAnalyzing: analyzeFootage.isPending
  };
}
