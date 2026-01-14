import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SensorNode } from '@/types/hardware';

interface SensorReading {
  id: string;
  node_id: string;
  sensor_type: string;
  value: number;
  unit: string;
  recorded_at: string;
}

interface AlertRule {
  sensor_type: string;
  condition: 'above' | 'below' | 'equals' | 'between';
  threshold: number;
  threshold_high?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface ZoneStatus {
  nodes: number;
  active: number;
  last_reading: string | null;
}

export function useSensorNetwork() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeReadings, setRealtimeReadings] = useState<SensorReading[]>([]);

  // Fetch all sensor nodes
  const { data: nodes = [], isLoading: nodesLoading, refetch: refetchNodes } = useQuery<SensorNode[]>({
    queryKey: ['sensor-nodes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('sensor_network_nodes')
        .select('*')
        .eq('user_id', user.id)
        .order('zone_name', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as SensorNode[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch zone status summary
  const { data: zoneStatus = {} } = useQuery<Record<string, ZoneStatus>>({
    queryKey: ['sensor-zone-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sensor-network/zone-status');
      if (error) throw error;
      return data.zones || {};
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  // Fetch recent readings
  const { data: readings = [], isLoading: readingsLoading } = useQuery<SensorReading[]>({
    queryKey: ['sensor-readings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sensor-network/readings', {
        body: {},
      });
      if (error) throw error;
      return data.readings || [];
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Subscribe to realtime sensor readings
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('sensor-readings-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newReading = payload.new as SensorReading;
          setRealtimeReadings(prev => [newReading, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Register new sensor node
  const registerNode = useMutation({
    mutationFn: async (nodeData: Partial<SensorNode>) => {
      const { data, error } = await supabase.functions.invoke('sensor-network/register-node', {
        body: nodeData,
      });
      if (error) throw error;
      return data.node;
    },
    onSuccess: () => {
      toast.success('Sensor node registered');
      queryClient.invalidateQueries({ queryKey: ['sensor-nodes', user?.id] });
    },
    onError: (error) => {
      toast.error(`Registration failed: ${error.message}`);
    },
  });

  // Set alert rules for a node
  const setAlertRules = useMutation({
    mutationFn: async ({ nodeId, rules }: { nodeId: string; rules: AlertRule[] }) => {
      const { error } = await supabase.functions.invoke('sensor-network/set-alerts', {
        body: { node_id: nodeId, rules },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alert rules updated');
      queryClient.invalidateQueries({ queryKey: ['sensor-nodes', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to update alerts: ${error.message}`);
    },
  });

  // Get aggregated readings
  const getAggregates = useCallback(async (nodeId?: string, sensorType?: string, hours = 24) => {
    try {
      const params = new URLSearchParams();
      if (nodeId) params.set('node_id', nodeId);
      if (sensorType) params.set('sensor_type', sensorType);
      params.set('hours', hours.toString());

      const { data, error } = await supabase.functions.invoke(`sensor-network/aggregate?${params}`);
      if (error) throw error;
      return data.aggregates;
    } catch (error) {
      toast.error('Failed to fetch aggregates');
      return null;
    }
  }, []);

  // Calculate node health
  const activeNodes = nodes.filter(n => {
    if (!n.last_reading_at) return false;
    const lastReading = new Date(n.last_reading_at);
    return Date.now() - lastReading.getTime() < 5 * 60 * 1000; // 5 minutes
  });

  const inactiveNodes = nodes.filter(n => {
    if (!n.last_reading_at) return true;
    const lastReading = new Date(n.last_reading_at);
    return Date.now() - lastReading.getTime() >= 5 * 60 * 1000;
  });

  const nodesByZone = nodes.reduce((acc, node) => {
    const zone = node.zone_name || 'Unassigned';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(node);
    return acc;
  }, {} as Record<string, SensorNode[]>);

  return {
    nodes,
    activeNodes,
    inactiveNodes,
    nodesByZone,
    zoneStatus,
    readings,
    realtimeReadings,
    isLoading: nodesLoading || readingsLoading,
    registerNode: registerNode.mutate,
    isRegistering: registerNode.isPending,
    setAlertRules: setAlertRules.mutate,
    getAggregates,
    refetchNodes,
  };
}
