/**
 * Biometric Stream Hook
 * Real-time streaming of wearable biometric data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/lib/api';

export interface BiometricReading {
  type: 'heart_rate' | 'stress' | 'steps' | 'sleep' | 'activity';
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  confidence?: number;
}

export interface BiometricSummary {
  heartRate: {
    current: number | null;
    min: number | null;
    max: number | null;
    avg: number | null;
  };
  stress: {
    current: number | null;
    level: 'low' | 'medium' | 'high' | 'unknown';
  };
  steps: {
    today: number;
    goal: number;
    hourly: number[];
  };
  activity: {
    current: string;
    duration: number;
    calories: number;
  };
  sleep: {
    lastNight: number | null;
    quality: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';
  };
}

const DEFAULT_SUMMARY: BiometricSummary = {
  heartRate: { current: null, min: null, max: null, avg: null },
  stress: { current: null, level: 'unknown' },
  steps: { today: 0, goal: 10000, hourly: [] },
  activity: { current: 'unknown', duration: 0, calories: 0 },
  sleep: { lastNight: null, quality: 'unknown' },
};

export function useBiometricStream() {
  const [readings, setReadings] = useState<BiometricReading[]>([]);
  const [summary, setSummary] = useState<BiometricSummary>(DEFAULT_SUMMARY);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Process new biometric reading
  const processReading = useCallback((reading: BiometricReading) => {
    setReadings(prev => {
      const updated = [...prev, reading].slice(-100); // Keep last 100 readings
      return updated;
    });

    // Update summary based on reading type
    setSummary(prev => {
      const updated = { ...prev };

      switch (reading.type) {
        case 'heart_rate':
          updated.heartRate = {
            current: reading.value,
            min: prev.heartRate.min === null 
              ? reading.value 
              : Math.min(prev.heartRate.min, reading.value),
            max: prev.heartRate.max === null 
              ? reading.value 
              : Math.max(prev.heartRate.max, reading.value),
            avg: prev.heartRate.avg === null
              ? reading.value
              : Math.round((prev.heartRate.avg + reading.value) / 2),
          };
          break;

        case 'stress':
          updated.stress = {
            current: reading.value,
            level: reading.value < 30 ? 'low' 
              : reading.value < 60 ? 'medium' 
              : 'high',
          };
          break;

        case 'steps':
          updated.steps = {
            ...prev.steps,
            today: prev.steps.today + reading.value,
          };
          break;

        case 'activity':
          updated.activity = {
            current: String(reading.value),
            duration: prev.activity.duration + 1,
            calories: prev.activity.calories + Math.round(reading.value * 0.05),
          };
          break;

        case 'sleep':
          updated.sleep = {
            lastNight: reading.value,
            quality: reading.value >= 8 ? 'excellent'
              : reading.value >= 7 ? 'good'
              : reading.value >= 6 ? 'fair'
              : 'poor',
          };
          break;
      }

      return updated;
    });
  }, []);

  // Subscribe to realtime biometric updates
  const subscribe = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Subscribe to interaction_biometrics changes
    realtimeChannelRef.current = supabase
      .channel('biometric-stream')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interaction_biometrics',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          
          // Process heart rate
          if (data.heart_rate_bpm) {
            processReading({
              type: 'heart_rate',
              value: data.heart_rate_bpm as number,
              unit: 'bpm',
              timestamp: new Date(data.recorded_at as string),
              source: (data.device_type as string) || 'wearable',
            });
          }

          // Process stress
          if (data.stress_level) {
            processReading({
              type: 'stress',
              value: data.stress_level as number,
              unit: '%',
              timestamp: new Date(data.recorded_at as string),
              source: (data.device_type as string) || 'wearable',
            });
          }

          // Process steps
          if (data.step_count) {
            processReading({
              type: 'steps',
              value: data.step_count as number,
              unit: 'steps',
              timestamp: new Date(data.recorded_at as string),
              source: (data.device_type as string) || 'wearable',
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
  }, [processReading]);

  // Unsubscribe from realtime updates
  const unsubscribe = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Fetch recent biometric data
  const fetchRecent = useCallback(async (hours: number = 24) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const since = new Date();
    since.setHours(since.getHours() - hours);

    const { data, error } = await supabase
      .from('interaction_biometrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch biometrics:', error);
      return;
    }

    if (data) {
      // Process historical data - use available fields from interaction_biometrics
      let totalCalories = 0;
      const heartRates: number[] = [];

      for (const record of data) {
        if (record.avg_heart_rate) heartRates.push(record.avg_heart_rate);
        if (record.calories_burned) totalCalories += record.calories_burned;
      }

      setSummary(prev => ({
        ...prev,
        heartRate: heartRates.length > 0 ? {
          current: heartRates[0],
          min: Math.min(...heartRates),
          max: Math.max(...heartRates),
          avg: Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length),
        } : prev.heartRate,
        activity: {
          ...prev.activity,
          calories: totalCalories,
        },
      }));

      setLastSync(new Date());
    }
  }, []);

  // Sync wearable data via edge function
  const syncFromWearable = useCallback(async (deviceType: string) => {
    const { data, error } = await invokeFunction('sync-wearable-data', {
        deviceType,
        syncType: 'full',
      },);

    if (error) {
      console.error('Failed to sync wearable:', error);
      return { success: false, error: error.message };
    }

    setLastSync(new Date());
    return { success: true, data };
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchRecent();
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [fetchRecent, subscribe, unsubscribe]);

  return {
    readings,
    summary,
    isConnected,
    lastSync,
    subscribe,
    unsubscribe,
    fetchRecent,
    syncFromWearable,
    processReading,
  };
}
