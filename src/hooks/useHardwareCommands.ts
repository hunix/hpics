import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HardwareCommand } from '@/types/hardware';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useHardwareCommands(deviceId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: commands = [], isLoading } = useQuery({
    queryKey: ['hardware-commands', user?.id, deviceId],
    queryFn: async (): Promise<HardwareCommand[]> => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('hardware_commands')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as HardwareCommand[];
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Subscribe to command updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('hardware-commands-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hardware_commands',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const command = payload.new as HardwareCommand;
            if (command.status === 'completed') {
              toast.success('Command completed');
            } else if (command.status === 'failed') {
              toast.error(`Command failed: ${command.error_message}`);
            }
          }
          queryClient.invalidateQueries({ queryKey: ['hardware-commands', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const sendCommand = useMutation({
    mutationFn: async (command: {
      device_id: string;
      command_type: string;
      command_data: Record<string, unknown>;
      mission_id?: string;
      priority?: number;
      expires_at?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hardware_commands')
        .insert({
          user_id: user.id,
          device_id: command.device_id,
          command_type: command.command_type,
          command_data: command.command_data as any,
          mission_id: command.mission_id || null,
          priority: command.priority || 5,
          expires_at: command.expires_at || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-commands', user?.id] });
      toast.info('Command queued');
    },
    onError: (error) => {
      toast.error(`Failed to send command: ${error.message}`);
    },
  });

  const cancelCommand = useMutation({
    mutationFn: async (commandId: string) => {
      const { error } = await supabase
        .from('hardware_commands')
        .delete()
        .eq('id', commandId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-commands', user?.id] });
      toast.success('Command cancelled');
    },
  });

  const pendingCommands = commands.filter(c => c.status === 'pending' || c.status === 'sent');
  const completedCommands = commands.filter(c => c.status === 'completed');
  const failedCommands = commands.filter(c => c.status === 'failed' || c.status === 'timeout');

  return {
    commands,
    pendingCommands,
    completedCommands,
    failedCommands,
    isLoading,
    sendCommand,
    cancelCommand,
  };
}

// Pre-defined command templates for different device types
export const COMMAND_TEMPLATES = {
  flipper_zero: [
    { type: 'sub_ghz_scan', label: 'Start Sub-GHz Scan', data: { frequency_range: [300, 928] } },
    { type: 'nfc_read', label: 'Read NFC Tag', data: {} },
    { type: 'rfid_read', label: 'Read RFID', data: {} },
    { type: 'ir_capture', label: 'Capture IR Signal', data: {} },
    { type: 'gpio_read', label: 'Read GPIO', data: { pins: [1, 2, 3] } },
  ],
  raspberry_pi: [
    { type: 'system_status', label: 'Get System Status', data: {} },
    { type: 'capture_photo', label: 'Capture Photo', data: { resolution: '1920x1080' } },
    { type: 'start_stream', label: 'Start Video Stream', data: { quality: 'high' } },
    { type: 'run_script', label: 'Run Script', data: { script: '' } },
    { type: 'reboot', label: 'Reboot Device', data: {} },
  ],
  arduino: [
    { type: 'read_sensors', label: 'Read All Sensors', data: {} },
    { type: 'set_gpio', label: 'Set GPIO State', data: { pin: 0, state: false } },
    { type: 'calibrate', label: 'Calibrate Sensors', data: {} },
    { type: 'sleep', label: 'Enter Sleep Mode', data: { duration_seconds: 60 } },
  ],
  drone: [
    { type: 'takeoff', label: 'Takeoff', data: { altitude: 10 } },
    { type: 'land', label: 'Land', data: {} },
    { type: 'return_home', label: 'Return to Home', data: {} },
    { type: 'goto_waypoint', label: 'Go to Waypoint', data: { lat: 0, lng: 0, alt: 10 } },
    { type: 'capture_photo', label: 'Capture Photo', data: {} },
    { type: 'start_recording', label: 'Start Recording', data: {} },
    { type: 'stop_recording', label: 'Stop Recording', data: {} },
    { type: 'gimbal_control', label: 'Control Gimbal', data: { pitch: 0, yaw: 0 } },
  ],
  thermal_camera: [
    { type: 'capture', label: 'Capture Thermal Image', data: {} },
    { type: 'set_palette', label: 'Set Color Palette', data: { palette: 'iron' } },
    { type: 'set_range', label: 'Set Temperature Range', data: { min: -20, max: 150 } },
    { type: 'start_recording', label: 'Start Recording', data: {} },
  ],
  spectrum_analyzer: [
    { type: 'scan_range', label: 'Scan Frequency Range', data: { start_hz: 1e6, end_hz: 6e9 } },
    { type: 'monitor_frequency', label: 'Monitor Frequency', data: { center_hz: 0, span_hz: 1e6 } },
    { type: 'detect_signals', label: 'Detect Active Signals', data: { threshold_dbm: -80 } },
  ],
  gopro: [
    { type: 'start_recording', label: 'Start Recording', data: { resolution: '4k', fps: 60 } },
    { type: 'stop_recording', label: 'Stop Recording', data: {} },
    { type: 'capture_photo', label: 'Capture Photo', data: {} },
    { type: 'start_livestream', label: 'Start Livestream', data: {} },
    { type: 'set_mode', label: 'Set Mode', data: { mode: 'video' } },
  ],
  metal_detector: [
    { type: 'start_sweep', label: 'Start Sweep', data: {} },
    { type: 'set_sensitivity', label: 'Set Sensitivity', data: { level: 5 } },
    { type: 'set_discrimination', label: 'Set Discrimination', data: { mode: 'all_metal' } },
    { type: 'mark_find', label: 'Mark Current Location', data: {} },
  ],
  sensor_node: [
    { type: 'read_all', label: 'Read All Sensors', data: {} },
    { type: 'set_interval', label: 'Set Reporting Interval', data: { seconds: 60 } },
    { type: 'enter_low_power', label: 'Enter Low Power Mode', data: {} },
    { type: 'wake', label: 'Wake Up', data: {} },
  ],
  sdr: [
    { type: 'tune', label: 'Tune to Frequency', data: { frequency_hz: 100e6 } },
    { type: 'start_capture', label: 'Start IQ Capture', data: { sample_rate: 2.4e6 } },
    { type: 'stop_capture', label: 'Stop Capture', data: {} },
    { type: 'decode', label: 'Decode Signal', data: { protocol: 'fm' } },
  ],
  dji_mic: [
    { type: 'start_recording', label: 'Start Recording', data: {} },
    { type: 'stop_recording', label: 'Stop Recording', data: {} },
    { type: 'set_gain', label: 'Set Gain', data: { level: 0 } },
    { type: 'sync_files', label: 'Sync Recorded Files', data: {} },
  ],
};
