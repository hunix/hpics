/**
 * Background Location Hook
 * Continuous location tracking with geofence monitoring and contact correlation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { nativeIntelligence, LocationData, GeofenceConfig } from '@/lib/mobile/nativeIntelligence';
import { toast } from 'sonner';

interface LocationCluster {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  visitCount: number;
  lastVisit: Date;
  averageDwellTime: number;
}

interface GeofenceEvent {
  geofenceId: string;
  geofenceName: string;
  eventType: 'enter' | 'exit';
  linkedProfileId?: string;
  timestamp: Date;
}

interface UseBackgroundLocationOptions {
  enableHighAccuracy?: boolean;
  trackingIntervalMs?: number;
  geofenceCheckEnabled?: boolean;
  clusteringEnabled?: boolean;
  minClusterDistance?: number;
}

interface UseBackgroundLocationReturn {
  currentLocation: LocationData | null;
  isTracking: boolean;
  locationHistory: LocationData[];
  geofences: GeofenceConfig[];
  nearbyContacts: Array<{ profileId: string; distance: number; name?: string }>;
  locationClusters: LocationCluster[];
  geofenceEvents: GeofenceEvent[];
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  addGeofence: (geofence: Omit<GeofenceConfig, 'id'>) => Promise<string | null>;
  removeGeofence: (id: string) => Promise<boolean>;
  getLocationName: (lat: number, lon: number) => Promise<string | null>;
  checkProximityToContacts: () => Promise<void>;
}

export function useBackgroundLocation(
  options: UseBackgroundLocationOptions = {}
): UseBackgroundLocationReturn {
  const { user } = useAuth();
  const {
    enableHighAccuracy = true,
    trackingIntervalMs = 30000,
    geofenceCheckEnabled = true,
    clusteringEnabled = true,
    minClusterDistance = 100
  } = options;

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [geofences, setGeofences] = useState<GeofenceConfig[]>([]);
  const [nearbyContacts, setNearbyContacts] = useState<Array<{ profileId: string; distance: number; name?: string }>>([]);
  const [locationClusters, setLocationClusters] = useState<LocationCluster[]>([]);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);

  const previousGeofenceState = useRef<Set<string>>(new Set());
  const locationBuffer = useRef<LocationData[]>([]);
  const syncInterval = useRef<ReturnType<typeof setInterval>>();

  // Load geofences from database
  useEffect(() => {
    if (!user) return;

    const loadGeofences = async () => {
      const { data } = await supabase
        .from('geofences')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (data) {
        setGeofences(data.map(g => ({
          id: g.id,
          name: g.name,
          latitude: g.latitude,
          longitude: g.longitude,
          radiusMeters: g.radius_meters,
          notifyOnEntry: g.trigger_on_enter,
          notifyOnExit: g.trigger_on_exit,
          linkedProfileId: g.profile_id || undefined
        })));
      }
    };

    loadGeofences();
  }, [user]);

  // Handle location update
  const handleLocationUpdate = useCallback(async (location: LocationData) => {
    setCurrentLocation(location);
    locationBuffer.current.push(location);

    // Keep only last 1000 locations in memory
    if (locationBuffer.current.length > 1000) {
      locationBuffer.current = locationBuffer.current.slice(-1000);
    }

    setLocationHistory(prev => {
      const updated = [...prev, location];
      return updated.slice(-100); // Keep last 100 in state
    });

    // Check geofences
    if (geofenceCheckEnabled && geofences.length > 0) {
      checkGeofences(location);
    }

    // Cluster detection
    if (clusteringEnabled) {
      updateClusters(location);
    }
  }, [geofences, geofenceCheckEnabled, clusteringEnabled]);

  // Check geofence entry/exit
  const checkGeofences = useCallback((location: LocationData) => {
    const currentlyInside = new Set<string>();

    geofences.forEach(geofence => {
      if (nativeIntelligence.isInsideGeofence(location, geofence)) {
        currentlyInside.add(geofence.id);

        // Check for entry
        if (!previousGeofenceState.current.has(geofence.id)) {
          if (geofence.notifyOnEntry) {
            const event: GeofenceEvent = {
              geofenceId: geofence.id,
              geofenceName: geofence.name,
              eventType: 'enter',
              linkedProfileId: geofence.linkedProfileId,
              timestamp: new Date()
            };
            setGeofenceEvents(prev => [...prev, event]);
            
            // Haptic feedback
            nativeIntelligence.vibrate('medium');
            
            // Toast notification
            toast.info(`Entered: ${geofence.name}`, {
              description: geofence.linkedProfileId 
                ? 'Contact location detected'
                : undefined
            });

            // Log to database
            logGeofenceEvent(geofence, 'enter', location);
          }
        }
      }
    });

    // Check for exits
    previousGeofenceState.current.forEach(geofenceId => {
      if (!currentlyInside.has(geofenceId)) {
        const geofence = geofences.find(g => g.id === geofenceId);
        if (geofence?.notifyOnExit) {
          const event: GeofenceEvent = {
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            eventType: 'exit',
            linkedProfileId: geofence.linkedProfileId,
            timestamp: new Date()
          };
          setGeofenceEvents(prev => [...prev, event]);
          
          logGeofenceEvent(geofence, 'exit', location);
        }
      }
    });

    previousGeofenceState.current = currentlyInside;
  }, [geofences]);

  // Log geofence event to database
  const logGeofenceEvent = async (
    geofence: GeofenceConfig,
    eventType: 'enter' | 'exit',
    location: LocationData
  ) => {
    if (!user) return;

    // Update geofence trigger count
    await supabase
      .from('geofences')
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: supabase.rpc('increment', { row_id: geofence.id })
      })
      .eq('id', geofence.id);

    // Log proximity event if linked to contact
    if (geofence.linkedProfileId) {
      await supabase.from('proximity_events').insert({
        user_id: user.id,
        detected_profile_id: geofence.linkedProfileId,
        detection_method: 'location',
        confidence: 0.9,
        latitude: location.latitude,
        longitude: location.longitude,
        location_accuracy: location.accuracy,
        location_name: geofence.name,
        interaction_type: 'passive',
        context_data: { geofence_event: eventType }
      });
    }
  };

  // Update location clusters
  const updateClusters = useCallback((location: LocationData) => {
    setLocationClusters(prev => {
      const nearbyCluster = prev.find(cluster => {
        const distance = nativeIntelligence.calculateDistance(
          location.latitude, location.longitude,
          cluster.latitude, cluster.longitude
        );
        return distance < minClusterDistance;
      });

      if (nearbyCluster) {
        return prev.map(cluster => {
          if (cluster.id === nearbyCluster.id) {
            return {
              ...cluster,
              visitCount: cluster.visitCount + 1,
              lastVisit: new Date(),
              // Rolling average for centroid
              latitude: (cluster.latitude * cluster.visitCount + location.latitude) / (cluster.visitCount + 1),
              longitude: (cluster.longitude * cluster.visitCount + location.longitude) / (cluster.visitCount + 1)
            };
          }
          return cluster;
        });
      } else {
        // Create new cluster
        return [...prev, {
          id: `cluster-${Date.now()}`,
          name: 'New Location',
          latitude: location.latitude,
          longitude: location.longitude,
          visitCount: 1,
          lastVisit: new Date(),
          averageDwellTime: 0
        }];
      }
    });
  }, [minClusterDistance]);

  // Start tracking
  const startTracking = useCallback(async (): Promise<boolean> => {
    const hasPermission = await nativeIntelligence.requestLocationPermission();
    if (!hasPermission) {
      toast.error('Location permission denied');
      return false;
    }

    const watchId = await nativeIntelligence.startLocationTracking(
      handleLocationUpdate,
      { enableHighAccuracy }
    );

    if (watchId) {
      setIsTracking(true);

      // Set up periodic sync to database
      syncInterval.current = setInterval(async () => {
        if (user && locationBuffer.current.length > 0) {
          const locationsToSync = locationBuffer.current.splice(0, 50);
          
          // Batch insert to location_history
          const records = locationsToSync.map(loc => ({
            user_id: user.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            altitude: loc.altitude,
            speed: loc.speed,
            heading: loc.heading,
            recorded_at: new Date(loc.timestamp).toISOString()
          }));

          await supabase.from('location_history').insert(records);
        }
      }, 60000); // Sync every minute

      return true;
    }

    return false;
  }, [user, enableHighAccuracy, handleLocationUpdate]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    nativeIntelligence.stopLocationTracking();
    setIsTracking(false);
    
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
    }
  }, []);

  // Add geofence
  const addGeofence = useCallback(async (
    geofence: Omit<GeofenceConfig, 'id'>
  ): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('geofences')
      .insert({
        user_id: user.id,
        name: geofence.name,
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        radius_meters: geofence.radiusMeters,
        trigger_on_enter: geofence.notifyOnEntry,
        trigger_on_exit: geofence.notifyOnExit,
        profile_id: geofence.linkedProfileId || null
      })
      .select()
      .single();

    if (data) {
      setGeofences(prev => [...prev, {
        id: data.id,
        ...geofence
      }]);
      return data.id;
    }

    if (error) {
      toast.error('Failed to create geofence');
    }
    return null;
  }, [user]);

  // Remove geofence
  const removeGeofence = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('id', id);

    if (!error) {
      setGeofences(prev => prev.filter(g => g.id !== id));
      return true;
    }
    return false;
  }, []);

  // Get location name via reverse geocoding
  const getLocationName = useCallback(async (
    lat: number, 
    lon: number
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      return data.display_name || null;
    } catch {
      return null;
    }
  }, []);

  // Check proximity to contacts
  const checkProximityToContacts = useCallback(async () => {
    if (!user || !currentLocation) return;

    // Get contacts with known locations
    const { data: contacts } = await supabase
      .from('profiles')
      .select('id, full_name, address')
      .eq('user_id', user.id)
      .not('address', 'is', null);

    if (!contacts) return;

    // Get geofences for contacts
    const { data: contactGeofences } = await supabase
      .from('geofences')
      .select('*')
      .eq('user_id', user.id)
      .not('profile_id', 'is', null);

    if (!contactGeofences) return;

    const nearby: Array<{ profileId: string; distance: number; name?: string }> = [];

    contactGeofences.forEach(gf => {
      const distance = nativeIntelligence.calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        gf.latitude, gf.longitude
      );

      if (distance < 1000) { // Within 1km
        const contact = contacts.find(c => c.id === gf.profile_id);
        nearby.push({
          profileId: gf.profile_id!,
          distance,
          name: contact?.full_name || undefined
        });
      }
    });

    nearby.sort((a, b) => a.distance - b.distance);
    setNearbyContacts(nearby);
  }, [user, currentLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    currentLocation,
    isTracking,
    locationHistory,
    geofences,
    nearbyContacts,
    locationClusters,
    geofenceEvents,
    startTracking,
    stopTracking,
    addGeofence,
    removeGeofence,
    getLocationName,
    checkProximityToContacts
  };
}
