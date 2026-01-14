/**
 * Proximity Intelligence Hook
 * Real-time proximity network mapping using Bluetooth/WiFi
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function useProximityIntelligence() {
  const [state, setState] = useState<ProximityIntelligenceState>({
    isScanning: false,
    devices: [],
    patterns: [],
    lastScan: null,
    scanHistory: [],
  });

  const [error, setError] = useState<string | null>(null);

  /**
   * Start proximity scanning
   */
  const startScanning = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isScanning: true }));
      setError(null);

      // In production, this would use:
      // - @capacitor-community/bluetooth-le for BLE scanning
      // - Native WiFi scanning APIs
      // - Background location for context

      // Simulate scan results for demonstration
      const mockDevices = generateMockDevices();
      
      setState(prev => ({
        ...prev,
        devices: mockDevices,
        lastScan: new Date(),
        scanHistory: [
          ...prev.scanHistory.slice(-99),
          {
            timestamp: new Date(),
            deviceCount: mockDevices.length,
          },
        ],
      }));

      // Analyze patterns
      const patterns = analyzeProximityPatterns(mockDevices, state.scanHistory);
      setState(prev => ({ ...prev, patterns }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setState(prev => ({ ...prev, isScanning: false }));
    }
  }, [state.scanHistory]);

  /**
   * Stop proximity scanning
   */
  const stopScanning = useCallback(() => {
    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  /**
   * Associate a device with a profile
   */
  const associateDevice = useCallback(async (
    deviceHash: string,
    profileId: string,
    profileName: string,
    relationship: string
  ) => {
    setState(prev => ({
      ...prev,
      devices: prev.devices.map(d =>
        d.deviceHash === deviceHash
          ? { ...d, associatedProfile: { id: profileId, name: profileName, relationship } }
          : d
      ),
    }));

    // Store association
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('app_settings').upsert({
        user_id: user.id,
        setting_key: `device_association_${deviceHash}`,
        setting_value: JSON.stringify({ profileId, profileName, relationship }),
      }, {
        onConflict: 'user_id,setting_key',
      });
    }
  }, []);

  /**
   * Get co-location analysis for a specific device
   */
  const getCoLocationAnalysis = useCallback((deviceHash: string) => {
    const device = state.devices.find(d => d.deviceHash === deviceHash);
    if (!device) return null;

    const history = state.scanHistory.filter(s => {
      // In production, we'd track which devices were seen in each scan
      return true;
    });

    return {
      totalEncounters: device.encounters,
      averageDuration: device.totalDuration / device.encounters,
      frequencyPerDay: device.encounters / Math.max(1, history.length / 24),
      peakTimes: identifyPeakTimes(history),
      suspiciousPatterns: device.encounters > 10 && device.averageProximity === 'close',
    };
  }, [state.devices, state.scanHistory]);

  /**
   * Detect surveillance indicators
   */
  const detectSurveillance = useCallback((): {
    threatLevel: 'none' | 'low' | 'medium' | 'high';
    indicators: string[];
    recommendedActions: string[];
  } => {
    const indicators: string[] = [];
    
    // Check for persistent unknown devices
    const persistentUnknown = state.devices.filter(
      d => !d.associatedProfile && d.encounters > 5 && d.averageProximity === 'close'
    );
    
    if (persistentUnknown.length > 0) {
      indicators.push(`${persistentUnknown.length} unidentified device(s) with repeated close proximity`);
    }

    // Check for pattern matches
    const stalkingPatterns = state.patterns.filter(p => p.patternType === 'stalking');
    if (stalkingPatterns.length > 0) {
      indicators.push('Potential following behavior detected');
    }

    // Check for unusual timing
    const lateNightScans = state.scanHistory.filter(s => {
      const hour = s.timestamp.getHours();
      return hour >= 0 && hour < 6;
    });

    if (lateNightScans.length > 3 && persistentUnknown.length > 0) {
      indicators.push('Unusual late-night proximity events');
    }

    const threatLevel = indicators.length === 0 ? 'none' :
      indicators.length === 1 ? 'low' :
      indicators.length <= 3 ? 'medium' : 'high';

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
  }, [state.devices, state.patterns, state.scanHistory]);

  // Auto-scan on mount (in production, this would be permission-gated)
  useEffect(() => {
    // Don't auto-start in development
    // startScanning();
    
    return () => {
      stopScanning();
    };
  }, []);

  return {
    ...state,
    error,
    startScanning,
    stopScanning,
    associateDevice,
    getCoLocationAnalysis,
    detectSurveillance,
  };
}

// Helper functions

function generateMockDevices(): ProximityDevice[] {
  const count = Math.floor(Math.random() * 8) + 3;
  const devices: ProximityDevice[] = [];

  for (let i = 0; i < count; i++) {
    const signalStrength = -1 * (30 + Math.floor(Math.random() * 70));
    const proximity: 'close' | 'medium' | 'far' = 
      signalStrength > -50 ? 'close' : signalStrength > -70 ? 'medium' : 'far';

    devices.push({
      deviceHash: `dev_${Math.random().toString(36).substr(2, 8)}`,
      signalStrength,
      firstSeen: new Date(Date.now() - Math.random() * 86400000 * 7),
      lastSeen: new Date(),
      totalDuration: Math.floor(Math.random() * 7200),
      deviceType: ['phone', 'laptop', 'wearable', 'iot', 'unknown'][
        Math.floor(Math.random() * 5)
      ] as any,
      encounters: Math.floor(Math.random() * 15) + 1,
      averageProximity: proximity,
    });
  }

  return devices;
}

function analyzeProximityPatterns(
  devices: ProximityDevice[],
  history: ProximityIntelligenceState['scanHistory']
): ProximityPattern[] {
  const patterns: ProximityPattern[] = [];

  // Find regularly appearing devices
  const regularDevices = devices.filter(d => d.encounters > 5);
  if (regularDevices.length > 0) {
    patterns.push({
      patternType: 'regular',
      involvedDevices: regularDevices.map(d => d.deviceHash),
      frequency: regularDevices.reduce((sum, d) => sum + d.encounters, 0) / regularDevices.length,
      confidence: 0.8,
      description: `${regularDevices.length} device(s) appear regularly in your vicinity`,
    });
  }

  // Detect potential surveillance (high encounters, close proximity, unknown)
  const suspiciousDevices = devices.filter(
    d => !d.associatedProfile && d.encounters > 8 && d.averageProximity === 'close'
  );
  if (suspiciousDevices.length > 0) {
    patterns.push({
      patternType: 'stalking',
      involvedDevices: suspiciousDevices.map(d => d.deviceHash),
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
