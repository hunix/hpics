import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ThermalCapture } from '@/types/hardware';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface ThermalSignature {
  type: 'person' | 'vehicle' | 'electronic_device' | 'animal' | 'heat_source' | 'unknown';
  temp_celsius: number;
  bounding_box: { x: number; y: number; width: number; height: number };
  confidence: number;
}

interface CaptureThermalParams {
  device_id?: string;
  mission_id?: string;
  detected_signatures: ThermalSignature[];
  ambient_temperature_celsius?: number;
  min_temperature_celsius?: number;
  max_temperature_celsius?: number;
  location?: { lat: number; lng: number };
  location_name?: string;
}

interface ThermalAnalysis {
  occupancy_count: number;
  heat_anomalies: Array<{
    type: string;
    location: { x: number; y: number };
    temperature_celsius: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  analysis: {
    room_assessment: string;
    potential_threats: string[];
    electronic_devices_detected: number;
    hidden_spaces_indicated: boolean;
    recent_activity_indicators: string[];
    recommendations: string[];
  };
  confidence: number;
}

interface OccupancyDataPoint {
  timestamp: string;
  occupancy: number;
  location?: string;
}

export function useThermalIntelligence() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  // Fetch thermal captures
  const {
    data: captures = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['thermal-captures', session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const { data, error } = await invokeFunction('thermal-intelligence', { action: 'get_captures', limit: 100 }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data.captures as ThermalCapture[];
    },
    enabled: !!session?.user?.id,
    staleTime: 30000,
  });

  // Fetch occupancy timeline
  const {
    data: occupancyTimeline = [],
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['occupancy-timeline', session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) return [];

      const { data, error } = await invokeFunction('thermal-intelligence', { action: 'get_occupancy_timeline', hours: 24 }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data.timeline as OccupancyDataPoint[];
    },
    enabled: !!session?.user?.id,
    staleTime: 60000,
  });

  // Capture thermal data mutation
  const captureThermalMutation = useMutation({
    mutationFn: async (params: CaptureThermalParams): Promise<{ capture_id: string; analysis: ThermalAnalysis }> => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('thermal-intelligence', { action: 'capture_thermal', capture: params }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['thermal-captures'] });
      queryClient.invalidateQueries({ queryKey: ['occupancy-timeline'] });
      
      if (data.analysis.heat_anomalies.some(a => a.severity === 'high')) {
        toast.error('⚠️ HIGH-RISK THERMAL ANOMALY', {
          description: 'Potential surveillance device or hidden electronics detected',
          duration: 10000,
        });
      } else if (data.analysis.heat_anomalies.length > 0) {
        toast.warning('Thermal anomalies detected', {
          description: `${data.analysis.heat_anomalies.length} anomaly(ies) found`,
        });
      } else {
        toast.success('Thermal capture complete', {
          description: `${data.analysis.occupancy_count} occupant(s) detected`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to capture thermal data', { description: error.message });
    },
  });

  // Analyze thermal without storing
  const analyzeThermal = useCallback(async (params: CaptureThermalParams): Promise<ThermalAnalysis | null> => {
    if (!session?.access_token) return null;

    try {
      const { data, error } = await invokeFunction('thermal-intelligence', { action: 'analyze_thermal', capture: params }, { headers: { Authorization: `Bearer ${session.access_token}` } });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Thermal analysis failed:', error);
      return null;
    }
  }, [session?.access_token]);

  // Start/stop scanning mode
  const startScanning = useCallback(() => {
    setIsScanning(true);
    toast.info('Thermal scanning activated');
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    toast.info('Thermal scanning deactivated');
  }, []);

  // Get captures with anomalies
  const capturesWithAnomalies = captures.filter(c => 
    c.heat_anomalies && c.heat_anomalies.length > 0
  );

  // Calculate current occupancy stats
  const totalOccupancy = captures.reduce((sum, c) => sum + (c.occupancy_count || 0), 0);
  const averageOccupancy = captures.length > 0 ? totalOccupancy / captures.length : 0;

  return {
    captures,
    isLoading,
    occupancyTimeline,
    capturesWithAnomalies,
    totalOccupancy,
    averageOccupancy,
    isScanning,
    captureThermal: captureThermalMutation.mutateAsync,
    isCapturingThermal: captureThermalMutation.isPending,
    analyzeThermal,
    startScanning,
    stopScanning,
    refetch,
    refetchTimeline,
  };
}
