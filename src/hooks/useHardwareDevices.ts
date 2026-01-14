import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HardwareDevice, DeviceType } from '@/types/hardware';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useHardwareDevices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, error } = useQuery({
    queryKey: ['hardware-devices', user?.id],
    queryFn: async (): Promise<HardwareDevice[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('hardware_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as HardwareDevice[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('hardware-devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hardware_devices',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hardware-devices', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const registerDevice = useMutation({
    mutationFn: async (device: {
      device_id: string;
      device_type: DeviceType;
      device_name?: string;
      device_model?: string;
      capabilities?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hardware_devices')
        .upsert({
          user_id: user.id,
          device_id: device.device_id,
          device_type: device.device_type,
          device_name: device.device_name || null,
          device_model: device.device_model || null,
          capabilities: device.capabilities ? JSON.parse(JSON.stringify(device.capabilities)) : {},
          is_online: false,
        } as any, {
          onConflict: 'user_id,device_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-devices', user?.id] });
      toast.success('Device registered successfully');
    },
    onError: (error) => {
      toast.error(`Failed to register device: ${error.message}`);
    },
  });

  const updateDevice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HardwareDevice> & { id: string }) => {
      const { data, error } = await supabase
        .from('hardware_devices')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-devices', user?.id] });
    },
  });

  const deleteDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase
        .from('hardware_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-devices', user?.id] });
      toast.success('Device removed');
    },
  });

  const onlineDevices = devices.filter(d => d.is_online);
  const offlineDevices = devices.filter(d => !d.is_online);
  const devicesByType = devices.reduce((acc, device) => {
    const type = device.device_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(device);
    return acc;
  }, {} as Record<DeviceType, HardwareDevice[]>);

  return {
    devices,
    onlineDevices,
    offlineDevices,
    devicesByType,
    isLoading,
    error,
    registerDevice,
    updateDevice,
    deleteDevice,
  };
}
