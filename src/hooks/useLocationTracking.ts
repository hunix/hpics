/**
 * Location Tracking Hook
 * Background GPS tracking with route detection and activity inference
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createLocationFingerprint } from '@/lib/sync/hashUtils';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
}

export interface TrackingConfig {
  enableHighAccuracy: boolean;
  updateIntervalMs: number;
  minimumDistanceMeters: number;
  enableActivityDetection: boolean;
  profileId?: string;
}

const DEFAULT_CONFIG: TrackingConfig = {
  enableHighAccuracy: true,
  updateIntervalMs: 30000, // 30 seconds
  minimumDistanceMeters: 10,
  enableActivityDetection: true,
};

export function useLocationTracking(config: Partial<TrackingConfig> = {}) {
  const { toast } = useToast();
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [activityType, setActivityType] = useState<string>('unknown');
  const [stepCount, setStepCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationPoint | null>(null);
  const locationBufferRef = useRef<LocationPoint[]>([]);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Infer activity type from speed
  const inferActivityType = useCallback((speed: number | null): string => {
    if (speed === null) return 'unknown';
    if (speed < 0.5) return 'stationary';
    if (speed < 2) return 'walking';
    if (speed < 8) return 'running';
    if (speed < 30) return 'cycling';
    return 'driving';
  }, []);

  // Sync buffered locations to database
  const syncLocations = useCallback(async () => {
    if (locationBufferRef.current.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const locationsToSync = [...locationBufferRef.current];
    locationBufferRef.current = [];

    // Deduplicate by fingerprint
    const uniqueLocations: typeof locationsToSync = [];
    const seenFingerprints = new Set<string>();

    for (const loc of locationsToSync) {
      const fp = createLocationFingerprint(
        loc.latitude,
        loc.longitude,
        loc.timestamp
      );
      if (!seenFingerprints.has(fp)) {
        seenFingerprints.add(fp);
        uniqueLocations.push(loc);
      }
    }

    if (uniqueLocations.length === 0) return;

    const { error } = await supabase
      .from('location_history')
      .insert(
        uniqueLocations.map(loc => ({
          user_id: user.id,
          profile_id: fullConfig.profileId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          altitude: loc.altitude,
          accuracy: loc.accuracy,
          speed: loc.speed,
          heading: loc.heading,
          recorded_at: loc.timestamp.toISOString(),
          activity_type: inferActivityType(loc.speed),
          source: 'mobile',
        }))
      );

    if (error) {
      console.error('Failed to sync locations:', error);
      // Put failed locations back in buffer
      locationBufferRef.current = [...uniqueLocations, ...locationBufferRef.current];
    }
  }, [fullConfig.profileId, inferActivityType]);

  // Handle position update
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const newLocation: LocationPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: new Date(position.timestamp),
    };

    // Check minimum distance
    if (lastLocationRef.current) {
      const distance = calculateDistance(
        lastLocationRef.current.latitude,
        lastLocationRef.current.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      if (distance < fullConfig.minimumDistanceMeters) {
        return; // Skip if hasn't moved enough
      }
    }

    lastLocationRef.current = newLocation;
    setCurrentLocation(newLocation);

    // Update activity type
    if (fullConfig.enableActivityDetection) {
      setActivityType(inferActivityType(newLocation.speed));
    }

    // Add to buffer for batch sync
    locationBufferRef.current.push(newLocation);
  }, [calculateDistance, fullConfig.minimumDistanceMeters, fullConfig.enableActivityDetection, inferActivityType]);

  // Handle position error
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error('Location error:', error);
    toast({
      title: 'Location Error',
      description: error.message,
      variant: 'destructive',
    });
  }, [toast]);

  // Track permission listener for cleanup
  const permissionListenerRef = useRef<{ result: PermissionStatus; handler: () => void } | null>(null);

  // Check permission status
  const checkPermission = useCallback(async () => {
    if (!('permissions' in navigator)) {
      setPermissionStatus('granted'); // Assume granted if API not available
      return true;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(result.state);
      
      // Clean up previous listener if exists
      if (permissionListenerRef.current) {
        permissionListenerRef.current.result.removeEventListener(
          'change',
          permissionListenerRef.current.handler
        );
      }
      
      // Create new handler and store reference for cleanup
      const handler = () => {
        setPermissionStatus(result.state);
      };
      result.addEventListener('change', handler);
      permissionListenerRef.current = { result, handler };

      return result.state === 'granted';
    } catch {
      return true; // Assume granted on error
    }
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: 'Not Supported',
        description: 'Geolocation is not supported on this device',
        variant: 'destructive',
      });
      return false;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission && permissionStatus === 'denied') {
      toast({
        title: 'Permission Denied',
        description: 'Location permission is required for tracking',
        variant: 'destructive',
      });
      return false;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: fullConfig.enableHighAccuracy,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    // Start sync interval
    syncIntervalRef.current = setInterval(
      syncLocations,
      fullConfig.updateIntervalMs
    );

    setIsTracking(true);
    return true;
  }, [
    checkPermission,
    permissionStatus,
    handlePositionUpdate,
    handlePositionError,
    fullConfig.enableHighAccuracy,
    fullConfig.updateIntervalMs,
    syncLocations,
    toast,
  ]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (syncIntervalRef.current !== null) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Sync any remaining locations
    syncLocations();

    setIsTracking(false);
  }, [syncLocations]);

  // Get current position once
  const getCurrentPosition = useCallback(async (): Promise<LocationPoint | null> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date(position.timestamp),
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Failed to get current position:', error);
          resolve(null);
        },
        { enableHighAccuracy: fullConfig.enableHighAccuracy }
      );
    });
  }, [fullConfig.enableHighAccuracy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
      }
      // Clean up permission listener
      if (permissionListenerRef.current) {
        permissionListenerRef.current.result.removeEventListener(
          'change',
          permissionListenerRef.current.handler
        );
      }
    };
  }, []);

  return {
    isTracking,
    currentLocation,
    activityType,
    stepCount,
    permissionStatus,
    startTracking,
    stopTracking,
    getCurrentPosition,
    checkPermission,
  };
}
