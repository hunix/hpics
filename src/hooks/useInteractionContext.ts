/**
 * useInteractionContext Hook
 * Gathers sensor data during voice/video recordings for context-rich intelligence
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface InteractionContext {
  // Location
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  
  // Motion/Activity
  isMoving: boolean;
  activityType: 'stationary' | 'walking' | 'driving' | 'unknown';
  
  // Environment
  ambientLight?: number;
  
  // Device State
  batteryLevel?: number;
  isCharging?: boolean;
  
  // Network
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  
  // Timing
  startTime: Date;
  duration: number;
}

interface UseInteractionContextOptions {
  enableLocation?: boolean;
  enableMotion?: boolean;
  enableEnvironment?: boolean;
}

export function useInteractionContext(options: UseInteractionContextOptions = {}) {
  const { 
    enableLocation = true, 
    enableMotion = true,
    enableEnvironment = true,
  } = options;

  const [context, setContext] = useState<InteractionContext>({
    isMoving: false,
    activityType: 'unknown',
    startTime: new Date(),
    duration: 0,
  });

  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef<Date>(new Date());
  const motionSamplesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect activity from motion samples
  const detectActivity = useCallback((samples: number[]): 'stationary' | 'walking' | 'driving' | 'unknown' => {
    if (samples.length < 10) return 'unknown';
    
    const avgMotion = samples.reduce((a, b) => a + b, 0) / samples.length;
    const maxMotion = Math.max(...samples);
    
    if (avgMotion < 0.5 && maxMotion < 1) return 'stationary';
    if (avgMotion < 3 && maxMotion < 6) return 'walking';
    if (avgMotion >= 3) return 'driving';
    
    return 'unknown';
  }, []);

  // Start gathering context
  const startContextGathering = useCallback(async () => {
    startTimeRef.current = new Date();
    motionSamplesRef.current = [];
    setIsRecording(true);

    // Initial context
    const initialContext: InteractionContext = {
      isMoving: false,
      activityType: 'unknown',
      startTime: startTimeRef.current,
      duration: 0,
    };

    // Get battery status
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        initialContext.batteryLevel = Math.round(battery.level * 100);
        initialContext.isCharging = battery.charging;
      } catch (e) {
        console.log('Battery API not available');
      }
    }

    // Get network info
    const connection = (navigator as any).connection;
    if (connection) {
      initialContext.connectionType = connection.type;
      initialContext.effectiveType = connection.effectiveType;
      initialContext.downlink = connection.downlink;
    }

    // Get location if enabled
    if (enableLocation && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setContext(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationAccuracy: position.coords.accuracy,
          }));
        },
        () => console.log('Location unavailable'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    setContext(initialContext);

    // Start motion monitoring
    if (enableMotion && 'DeviceMotionEvent' in window) {
      const handleMotion = (event: DeviceMotionEvent) => {
        const { x, y, z } = event.acceleration || { x: 0, y: 0, z: 0 };
        const magnitude = Math.sqrt((x || 0) ** 2 + (y || 0) ** 2 + (z || 0) ** 2);
        motionSamplesRef.current.push(magnitude);
        
        // Keep last 100 samples
        if (motionSamplesRef.current.length > 100) {
          motionSamplesRef.current.shift();
        }
      };
      window.addEventListener('devicemotion', handleMotion);
    }

    // Start ambient light monitoring
    if (enableEnvironment && 'AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          setContext(prev => ({
            ...prev,
            ambientLight: sensor.illuminance,
          }));
        });
        sensor.start();
      } catch (e) {
        console.log('Ambient light sensor not available');
      }
    }

    // Update duration every second
    timerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      const activity = detectActivity(motionSamplesRef.current);
      const avgMotion = motionSamplesRef.current.length > 0
        ? motionSamplesRef.current.reduce((a, b) => a + b, 0) / motionSamplesRef.current.length
        : 0;

      setContext(prev => ({
        ...prev,
        duration,
        activityType: activity,
        isMoving: avgMotion > 0.5,
      }));
    }, 1000);

  }, [enableLocation, enableMotion, enableEnvironment, detectActivity]);

  // Stop gathering context
  const stopContextGathering = useCallback((): InteractionContext => {
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalDuration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
    const finalActivity = detectActivity(motionSamplesRef.current);
    
    const finalContext: InteractionContext = {
      ...context,
      duration: finalDuration,
      activityType: finalActivity,
    };

    return finalContext;
  }, [context, detectActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    context,
    isRecording,
    startContextGathering,
    stopContextGathering,
  };
}
