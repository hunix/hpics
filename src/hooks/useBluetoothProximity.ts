/**
 * Bluetooth Proximity Hook
 * Detect nearby contacts via Bluetooth Low Energy devices
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BluetoothDevice {
  deviceId: string;
  name?: string;
  rssi: number;
  txPower?: number;
  distance?: number;
  lastSeen: Date;
  linkedProfileId?: string;
  linkedProfileName?: string;
}

interface RegisteredDevice {
  deviceId: string;
  profileId: string;
  profileName: string;
  deviceName?: string;
}

interface ProximityAlert {
  id: string;
  profileId: string;
  profileName: string;
  distance: number;
  timestamp: Date;
  wasNotified: boolean;
}

interface UseBluetoothProximityOptions {
  scanDurationMs?: number;
  scanIntervalMs?: number;
  maxDistance?: number; // meters
  autoScan?: boolean;
  onDeviceFound?: (device: BluetoothDevice) => void;
  onContactNearby?: (alert: ProximityAlert) => void;
}

interface UseBluetoothProximityReturn {
  isScanning: boolean;
  isSupported: boolean;
  nearbyDevices: BluetoothDevice[];
  registeredDevices: RegisteredDevice[];
  proximityAlerts: ProximityAlert[];
  startScanning: () => Promise<boolean>;
  stopScanning: () => void;
  registerDevice: (deviceId: string, profileId: string, deviceName?: string) => Promise<boolean>;
  unregisterDevice: (deviceId: string) => Promise<boolean>;
  getDeviceDistance: (rssi: number, txPower?: number) => number;
  clearAlerts: () => void;
}

export function useBluetoothProximity(
  options: UseBluetoothProximityOptions = {}
): UseBluetoothProximityReturn {
  const { user } = useAuth();
  const {
    scanDurationMs = 5000,
    scanIntervalMs = 30000,
    maxDistance = 10, // 10 meters
    autoScan = false,
    onDeviceFound,
    onContactNearby
  } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState<BluetoothDevice[]>([]);
  const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
  const [proximityAlerts, setProximityAlerts] = useState<ProximityAlert[]>([]);

  const scanIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const bleRef = useRef<any>(null);
  const notifiedDevicesRef = useRef<Set<string>>(new Set());

  const isSupported = Capacitor.isNativePlatform();

  // Load registered devices from database
  useEffect(() => {
    if (!user) return;

    const loadRegisteredDevices = async () => {
      const { data } = await supabase
        .from('bluetooth_devices')
        .select(`
          device_id,
          device_name,
          profile_id,
          profiles!bluetooth_devices_profile_id_fkey (first_name, last_name)
        `)
        .eq('user_id', user.id);

      if (data) {
        setRegisteredDevices(data.map((d: any) => ({
          deviceId: d.device_id,
          profileId: d.profile_id,
          profileName: d.profiles ? `${d.profiles.first_name || ''} ${d.profiles.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
          deviceName: d.device_name
        })));
      }
    };

    loadRegisteredDevices();
  }, [user]);

  // Calculate distance from RSSI
  const getDeviceDistance = useCallback((rssi: number, txPower: number = -59): number => {
    // Using the Log-distance path loss model
    // Distance = 10 ^ ((TxPower - RSSI) / (10 * n))
    // n = path loss exponent (2-4, using 2 for free space)
    const n = 2;
    const distance = Math.pow(10, (txPower - rssi) / (10 * n));
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }, []);

  // Process discovered device
  const processDevice = useCallback((device: any) => {
    const rssi = device.rssi || -70;
    const txPower = device.txPower || -59;
    const distance = getDeviceDistance(rssi, txPower);

    // Check if this is a registered device
    const registered = registeredDevices.find(rd => rd.deviceId === device.deviceId);

    const bluetoothDevice: BluetoothDevice = {
      deviceId: device.deviceId,
      name: device.name || device.localName,
      rssi,
      txPower,
      distance,
      lastSeen: new Date(),
      linkedProfileId: registered?.profileId,
      linkedProfileName: registered?.profileName
    };

    // Update nearby devices
    setNearbyDevices(prev => {
      const existing = prev.findIndex(d => d.deviceId === device.deviceId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = bluetoothDevice;
        return updated;
      }
      return [...prev, bluetoothDevice];
    });

    onDeviceFound?.(bluetoothDevice);

    // Generate proximity alert for registered devices
    if (registered && distance <= maxDistance) {
      const alertKey = `${registered.profileId}-${new Date().toISOString().slice(0, 13)}`;
      
      if (!notifiedDevicesRef.current.has(alertKey)) {
        notifiedDevicesRef.current.add(alertKey);
        
        const alert: ProximityAlert = {
          id: alertKey,
          profileId: registered.profileId,
          profileName: registered.profileName,
          distance,
          timestamp: new Date(),
          wasNotified: true
        };

        setProximityAlerts(prev => [...prev, alert]);
        onContactNearby?.(alert);

        // Show toast notification
        toast.info(`${registered.profileName} is nearby`, {
          description: `Approximately ${distance.toFixed(1)}m away`
        });

        // Log proximity event
        if (user) {
          supabase.from('proximity_events').insert({
            user_id: user.id,
            detected_profile_id: registered.profileId,
            detection_method: 'bluetooth',
            confidence: Math.max(0.5, 1 - distance / maxDistance),
            device_info: { 
              deviceId: device.deviceId, 
              rssi, 
              distance,
              deviceName: registered.deviceName 
            },
            interaction_type: 'passive'
          });
        }
      }
    }
  }, [registeredDevices, maxDistance, getDeviceDistance, onDeviceFound, onContactNearby, user]);

  // Start scanning
  const startScanning = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      // Use Web Bluetooth API as fallback
      if ('bluetooth' in navigator) {
        try {
          // Web Bluetooth requires user interaction and specific service UUIDs
          toast.info('Web Bluetooth has limited scanning capability');
          return false;
        } catch (e) {
          console.log('Web Bluetooth not available');
        }
      }
      toast.error('Bluetooth scanning requires native app');
      return false;
    }

    try {
      // Dynamic import for native plugin
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      bleRef.current = BleClient;

      // Initialize BLE
      await BleClient.initialize();

      // Check if Bluetooth is enabled
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        toast.error('Please enable Bluetooth');
        return false;
      }

      setIsScanning(true);
      notifiedDevicesRef.current.clear();

      // Start scanning
      await BleClient.requestLEScan(
        { services: [] }, // Scan all services
        (result) => {
          processDevice(result.device);
        }
      );

      // Stop after duration
      setTimeout(async () => {
        await BleClient.stopLEScan();
        setIsScanning(false);
      }, scanDurationMs);

      // Set up periodic scanning if autoScan enabled
      if (autoScan) {
        scanIntervalRef.current = setInterval(async () => {
          if (!isScanning) {
            setIsScanning(true);
            await BleClient.requestLEScan(
              { services: [] },
              (result) => processDevice(result.device)
            );
            setTimeout(async () => {
              await BleClient.stopLEScan();
              setIsScanning(false);
            }, scanDurationMs);
          }
        }, scanIntervalMs);
      }

      return true;
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      toast.error('Failed to start Bluetooth scan');
      setIsScanning(false);
      return false;
    }
  }, [isSupported, scanDurationMs, scanIntervalMs, autoScan, processDevice, isScanning]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (bleRef.current) {
      try {
        await bleRef.current.stopLEScan();
      } catch (e) {
        // Already stopped
      }
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    setIsScanning(false);
  }, []);

  // Register device to a profile
  const registerDevice = useCallback(async (
    deviceId: string,
    profileId: string,
    deviceName?: string
  ): Promise<boolean> => {
    if (!user) return false;

    // Get profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', profileId)
      .single();

    const { error } = await supabase
      .from('bluetooth_devices')
      .upsert({
        user_id: user.id,
        device_id: deviceId,
        profile_id: profileId,
        device_name: deviceName
      }, { onConflict: 'user_id,device_id' });

    if (!error) {
      setRegisteredDevices(prev => {
        const existing = prev.findIndex(d => d.deviceId === deviceId);
        const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
        const newDevice = {
          deviceId,
          profileId,
          profileName,
          deviceName
        };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newDevice;
          return updated;
        }
        return [...prev, newDevice];
      });
      
      toast.success('Device registered');
      return true;
    }

    toast.error('Failed to register device');
    return false;
  }, [user]);

  // Unregister device
  const unregisterDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('bluetooth_devices')
      .delete()
      .eq('user_id', user.id)
      .eq('device_id', deviceId);

    if (!error) {
      setRegisteredDevices(prev => prev.filter(d => d.deviceId !== deviceId));
      toast.success('Device unregistered');
      return true;
    }

    toast.error('Failed to unregister device');
    return false;
  }, [user]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setProximityAlerts([]);
    notifiedDevicesRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Clean up stale devices (not seen in 5 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      setNearbyDevices(prev => 
        prev.filter(d => d.lastSeen > fiveMinutesAgo)
      );
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    isScanning,
    isSupported,
    nearbyDevices,
    registeredDevices,
    proximityAlerts,
    startScanning,
    stopScanning,
    registerDevice,
    unregisterDevice,
    getDeviceDistance,
    clearAlerts
  };
}
