/**
 * Proximity Intelligence Hook
 * Real-time proximity network mapping using Bluetooth/WiFi.
 *
 * Backed by useBluetoothProximity (Capacitor BLE plugin) when the
 * native app is available. On web, scanning is disabled and the
 * state stays empty — we never fabricate "nearby devices".
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBluetoothProximity, type BluetoothDevice } from './useBluetoothProximity';

export interface ProximityDevice {
  deviceHash: string;
  signalStrength: number;
  firstSeen: Date;
  lastSeen: Date;
  totalDuration: number;
  deviceType: 'phone' | 'laptop' | 'wearable' | 'iot' | 'unknown';
  encounters: number;
  averageProximity: 'close' | 'medium' | 'far';
  associatedProfile?: {
    id: string;
    name: string;
    relationship: string;
  };
}

export interface ProximityPattern {
  patternType: 'regular' | 'coincidental' | 'stalking' | 'avoidance';
  involvedDevices: string[];
  frequency: number;
  confidence: number;
  description: string;
}

export interface ProximityIntelligenceState {
  isScanning: boolean;
  devices: ProximityDevice[];
  patterns: ProximityPattern[];
  lastScan: Date | null;
  scanHistory: {
    timestamp: Date;
    deviceCount: number;
    location?: { lat: number; lng: number };
  }[];
}

function bluetoothToProximity(d: BluetoothDevice): ProximityDevice {
  const rssi = d.rssi ?? -100;
  const proximity: ProximityDevice['averageProximity'] =
    rssi > -50 ? 'close' : rssi > -70 ? 'medium' : 'far';
  return {
    deviceHash: d.deviceId,
    signalStrength: rssi,
    // The BLE plugin only gives us the most-recent sighting; until we
    // persist firstSeen on a device-presence table, use lastSeen for
    // both endpoints (totalDuration = 0).
    firstSeen: d.lastSeen,
    lastSeen: d.lastSeen,
    totalDuration: 0,
    deviceType: 'unknown',
    encounters: 1,
    averageProximity: proximity,
  };
}

export function useProximityIntelligence() {
  const ble = useBluetoothProximity({ autoScan: false });
  const [scanHistory, setScanHistory] = useState<ProximityIntelligenceState['scanHistory']>([]);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [associations, setAssociations] = useState<Record<string, ProximityDevice['associatedProfile']>>({});

  // Convert BLE devices into proximity-intelligence shape and merge
  // any stored profile associations.
  const devices: ProximityDevice[] = useMemo(() => {
    return ble.nearbyDevices.map((d) => {
      const base = bluetoothToProximity(d);
      const assoc = associations[base.deviceHash];
      return assoc ? { ...base, associatedProfile: assoc } : base;
    });
  }, [ble.nearbyDevices, associations]);

  const patterns = useMemo(() => analyzeProximityPatterns(devices, scanHistory), [devices, scanHistory]);

  const startScanning = useCallback(async () => {
    setError(null);
    if (!ble.isSupported) {
      setError('Bluetooth scanning requires the native app');
      return;
    }
    const started = await ble.startScanning();
    if (!started) {
      setError('Bluetooth scan failed to start');
      return;
    }
    setLastScan(new Date());
    setScanHistory((prev) => [
      ...prev.slice(-99),
      { timestamp: new Date(), deviceCount: ble.nearbyDevices.length },
    ]);
  }, [ble]);

  const stopScanning = useCallback(async () => {
    await ble.stopScanning();
  }, [ble]);

  const associateDevice = useCallback(async (
    deviceHash: string,
    profileId: string,
    profileName: string,
    relationship: string
  ) => {
    const association = { id: profileId, name: profileName, relationship };
    setAssociations((prev) => ({ ...prev, [deviceHash]: association }));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('app_settings').upsert(
        {
          user_id: user.id,
          setting_key: `device_association_${deviceHash}`,
          setting_value: JSON.stringify(association),
        },
        { onConflict: 'user_id,setting_key' }
      );
    }
  }, []);

  const getCoLocationAnalysis = useCallback((deviceHash: string) => {
    const device = devices.find((d) => d.deviceHash === deviceHash);
    if (!device) return null;

    return {
      totalEncounters: device.encounters,
      averageDuration: device.encounters > 0 ? device.totalDuration / device.encounters : 0,
      frequencyPerDay: device.encounters / Math.max(1, scanHistory.length / 24),
      peakTimes: identifyPeakTimes(scanHistory),
      suspiciousPatterns: device.encounters > 10 && device.averageProximity === 'close',
    };
  }, [devices, scanHistory]);

  const detectSurveillance = useCallback((): {
    threatLevel: 'none' | 'low' | 'medium' | 'high';
    indicators: string[];
    recommendedActions: string[];
  } => {
    const indicators: string[] = [];

    const persistentUnknown = devices.filter(
      (d) => !d.associatedProfile && d.encounters > 5 && d.averageProximity === 'close'
    );
    if (persistentUnknown.length > 0) {
      indicators.push(`${persistentUnknown.length} unidentified device(s) with repeated close proximity`);
    }

    const stalkingPatterns = patterns.filter((p) => p.patternType === 'stalking');
    if (stalkingPatterns.length > 0) {
      indicators.push('Potential following behavior detected');
    }

    const lateNightScans = scanHistory.filter((s) => {
      const hour = s.timestamp.getHours();
      return hour >= 0 && hour < 6;
    });
    if (lateNightScans.length > 3 && persistentUnknown.length > 0) {
      indicators.push('Unusual late-night proximity events');
    }

    const threatLevel: 'none' | 'low' | 'medium' | 'high' =
      indicators.length === 0 ? 'none'
        : indicators.length === 1 ? 'low'
        : indicators.length <= 3 ? 'medium'
        : 'high';

    const recommendedActions: string[] = [];
    if (threatLevel !== 'none') {
      recommendedActions.push('Vary your routine and routes');
      recommendedActions.push('Document any suspicious encounters');
    }
    if (threatLevel === 'high') {
      recommendedActions.push('Consider informing authorities');
      recommendedActions.push('Enable continuous location sharing with trusted contacts');
    }

    return { threatLevel, indicators, recommendedActions };
  }, [devices, patterns, scanHistory]);

  useEffect(() => {
    return () => {
      void ble.stopScanning();
    };
    // ble has a stable ref via the hook; we deliberately don't depend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isScanning: ble.isScanning,
    devices,
    patterns,
    lastScan,
    scanHistory,
    error,
    startScanning,
    stopScanning,
    associateDevice,
    getCoLocationAnalysis,
    detectSurveillance,
  };
}

function analyzeProximityPatterns(
  devices: ProximityDevice[],
  history: ProximityIntelligenceState['scanHistory']
): ProximityPattern[] {
  void history;
  const patterns: ProximityPattern[] = [];

  const regularDevices = devices.filter((d) => d.encounters > 5);
  if (regularDevices.length > 0) {
    patterns.push({
      patternType: 'regular',
      involvedDevices: regularDevices.map((d) => d.deviceHash),
      frequency: regularDevices.reduce((sum, d) => sum + d.encounters, 0) / regularDevices.length,
      confidence: 0.8,
      description: `${regularDevices.length} device(s) appear regularly in your vicinity`,
    });
  }

  const suspiciousDevices = devices.filter(
    (d) => !d.associatedProfile && d.encounters > 8 && d.averageProximity === 'close'
  );
  if (suspiciousDevices.length > 0) {
    patterns.push({
      patternType: 'stalking',
      involvedDevices: suspiciousDevices.map((d) => d.deviceHash),
      frequency: suspiciousDevices[0].encounters,
      confidence: 0.6,
      description: 'Unidentified device(s) with suspicious proximity pattern',
    });
  }

  return patterns;
}

function identifyPeakTimes(history: ProximityIntelligenceState['scanHistory']): string[] {
  const hourCounts: Record<number, number> = {};
  for (const scan of history) {
    const hour = scan.timestamp.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  const sorted = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return sorted.map(([hour]) => {
    const h = parseInt(hour);
    return `${h.toString().padStart(2, '0')}:00 - ${((h + 1) % 24).toString().padStart(2, '0')}:00`;
  });
}
