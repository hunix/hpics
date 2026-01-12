/**
 * Context Engine Hook
 * Multi-sensor fusion for intelligent context awareness
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { nativeIntelligence, ContextSnapshot, ActivityState, LocationData } from '@/lib/mobile/nativeIntelligence';
import { useBackgroundLocation } from './useBackgroundLocation';
import { useSmartTriggers } from './useSmartTriggers';
import { toast } from 'sonner';

// Context types
type ContextType = 
  | 'meeting'
  | 'commute'
  | 'work'
  | 'social'
  | 'exercise'
  | 'rest'
  | 'travel'
  | 'shopping'
  | 'dining'
  | 'unknown';

interface ContextPrediction {
  context: ContextType;
  confidence: number;
  factors: string[];
  suggestedActions: string[];
}

interface ContextHistory {
  id: string;
  context: ContextType;
  confidence: number;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  location?: { name: string; type: string };
  nearbyContacts: string[];
}

interface ContextualRecommendation {
  id: string;
  type: 'contact' | 'action' | 'capture' | 'reminder';
  title: string;
  description: string;
  profileId?: string;
  profileName?: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface UseContextEngineReturn {
  currentContext: ContextPrediction | null;
  isMonitoring: boolean;
  contextHistory: ContextHistory[];
  recommendations: ContextualRecommendation[];
  lastSnapshot: ContextSnapshot | null;
  startMonitoring: () => Promise<boolean>;
  stopMonitoring: () => void;
  captureSnapshot: () => Promise<ContextSnapshot | null>;
  getContextPrediction: () => ContextPrediction;
  getRecommendations: () => Promise<ContextualRecommendation[]>;
  getOptimalContactTime: (profileId: string) => Promise<{ time: string; reason: string } | null>;
}

export function useContextEngine(): UseContextEngineReturn {
  const { user } = useAuth();
  const [currentContext, setCurrentContext] = useState<ContextPrediction | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [contextHistory, setContextHistory] = useState<ContextHistory[]>([]);
  const [recommendations, setRecommendations] = useState<ContextualRecommendation[]>([]);
  const [lastSnapshot, setLastSnapshot] = useState<ContextSnapshot | null>(null);

  const { currentLocation, nearbyContacts, geofences } = useBackgroundLocation();
  const { evaluateTrigger } = useSmartTriggers();

  const monitoringInterval = useRef<ReturnType<typeof setInterval>>();
  const lastContextRef = useRef<ContextType>('unknown');
  const contextStartRef = useRef<Date>(new Date());

  // Classify context based on multiple signals
  const classifyContext = useCallback((snapshot: ContextSnapshot): ContextPrediction => {
    const factors: string[] = [];
    let context: ContextType = 'unknown';
    let confidence = 0.5;

    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isBusinessHours = hour >= 9 && hour <= 17;

    // Activity-based classification
    if (snapshot.activity) {
      switch (snapshot.activity.type) {
        case 'running':
        case 'cycling':
          context = 'exercise';
          confidence = 0.85;
          factors.push('high physical activity detected');
          break;
        case 'driving':
          context = 'commute';
          confidence = 0.75;
          factors.push('vehicle movement detected');
          break;
        case 'walking':
          // Could be commute, social, or shopping
          if (isBusinessHours && !isWeekend) {
            context = 'work';
            factors.push('walking during business hours');
          } else {
            context = 'social';
            factors.push('walking during leisure time');
          }
          confidence = 0.6;
          break;
        case 'stationary':
          // Need more signals
          factors.push('stationary');
          break;
      }
    }

    // Location-based refinement
    if (snapshot.location) {
      // Check geofences
      const matchingGeofences = geofences.filter(gf => 
        nativeIntelligence.isInsideGeofence(snapshot.location!, {
          id: gf.id,
          name: gf.name,
          latitude: gf.latitude,
          longitude: gf.longitude,
          radiusMeters: gf.radiusMeters,
          notifyOnEntry: true,
          notifyOnExit: true
        })
      );

      if (matchingGeofences.length > 0) {
        const primaryGeofence = matchingGeofences[0];
        factors.push(`at ${primaryGeofence.name}`);
        
        // Infer context from geofence type
        const name = primaryGeofence.name.toLowerCase();
        if (name.includes('office') || name.includes('work')) {
          context = 'work';
          confidence = 0.9;
        } else if (name.includes('home')) {
          context = snapshot.activity?.type === 'stationary' ? 'rest' : 'unknown';
          confidence = 0.8;
        } else if (name.includes('gym') || name.includes('fitness')) {
          context = 'exercise';
          confidence = 0.9;
        }
      }
    }

    // Time-based refinement
    if (context === 'unknown') {
      if (hour >= 6 && hour <= 9) {
        context = isWeekend ? 'rest' : 'commute';
        factors.push('morning time');
        confidence = 0.5;
      } else if (hour >= 17 && hour <= 19) {
        context = 'commute';
        factors.push('evening commute time');
        confidence = 0.5;
      } else if (hour >= 22 || hour <= 6) {
        context = 'rest';
        factors.push('night time');
        confidence = 0.7;
      }
    }

    // Social context from nearby contacts
    if (nearbyContacts.length > 0) {
      factors.push(`${nearbyContacts.length} contacts nearby`);
      if (context === 'unknown' || context === 'rest') {
        context = 'social';
        confidence = Math.min(confidence + 0.2, 0.9);
      }
    }

    // Battery and network context
    if (snapshot.batteryLevel !== undefined && snapshot.batteryLevel < 20) {
      factors.push('low battery');
    }
    if (snapshot.networkType === 'wifi') {
      factors.push('on WiFi');
      // WiFi suggests indoor/stable location
    }

    // Generate suggested actions based on context
    const suggestedActions: string[] = [];
    switch (context) {
      case 'meeting':
        suggestedActions.push('Start recording', 'Take notes', 'Identify participants');
        break;
      case 'commute':
        suggestedActions.push('Call a contact', 'Listen to voicemails', 'Review daily agenda');
        break;
      case 'work':
        suggestedActions.push('Check pending follow-ups', 'Schedule meetings');
        break;
      case 'social':
        suggestedActions.push('Capture moment', 'Tag contacts', 'Log interaction');
        break;
      case 'exercise':
        suggestedActions.push('Track activity', 'Pause notifications');
        break;
    }

    return {
      context,
      confidence,
      factors,
      suggestedActions
    };
  }, [geofences, nearbyContacts]);

  // Capture context snapshot
  const captureSnapshot = useCallback(async (): Promise<ContextSnapshot | null> => {
    try {
      const snapshot = await nativeIntelligence.captureContextSnapshot();
      setLastSnapshot(snapshot);

      // Classify context
      const prediction = classifyContext(snapshot);
      setCurrentContext(prediction);

      // Detect context change
      if (prediction.context !== lastContextRef.current && prediction.confidence > 0.6) {
        // End previous context
        if (lastContextRef.current !== 'unknown') {
          const historyEntry: ContextHistory = {
            id: crypto.randomUUID(),
            context: lastContextRef.current,
            confidence: currentContext?.confidence || 0.5,
            startedAt: contextStartRef.current,
            endedAt: new Date(),
            duration: Math.floor((Date.now() - contextStartRef.current.getTime()) / 1000),
            nearbyContacts: nearbyContacts.map(c => c.profileId)
          };
          setContextHistory(prev => [historyEntry, ...prev].slice(0, 100));

          // Trigger context change event
          evaluateTrigger('activity_change', {
            previousContext: lastContextRef.current,
            newContext: prediction.context,
            confidence: prediction.confidence
          });
        }

        lastContextRef.current = prediction.context;
        contextStartRef.current = new Date();
      }

      // Save to database
      if (user) {
        await supabase.from('context_snapshots').insert({
          user_id: user.id,
          snapshot_type: 'automatic',
          latitude: snapshot.location?.latitude,
          longitude: snapshot.location?.longitude,
          location_accuracy: snapshot.location?.accuracy,
          activity_type: snapshot.activity?.type,
          activity_confidence: snapshot.activity?.confidence,
          battery_level: snapshot.batteryLevel,
          network_type: snapshot.networkType,
          inferred_context: prediction.context,
          context_confidence: prediction.confidence,
          nearby_contacts: nearbyContacts.map(c => c.profileId),
          ai_insights: { factors: prediction.factors }
        });
      }

      return snapshot;
    } catch (error) {
      console.error('Error capturing snapshot:', error);
      return null;
    }
  }, [user, classifyContext, currentContext, nearbyContacts, evaluateTrigger]);

  // Start monitoring
  const startMonitoring = useCallback(async (): Promise<boolean> => {
    // Start motion tracking
    const motionStarted = await nativeIntelligence.startMotionTracking(() => {
      // Motion updates are processed internally
    });

    if (!motionStarted) {
      toast.error('Failed to start sensors');
      return false;
    }

    setIsMonitoring(true);

    // Periodic context capture
    monitoringInterval.current = setInterval(() => {
      captureSnapshot();
    }, 60000); // Every minute

    // Initial capture
    captureSnapshot();

    toast.success('Context monitoring started');
    return true;
  }, [captureSnapshot]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    nativeIntelligence.stopMotionTracking();
    
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }

    setIsMonitoring(false);
  }, []);

  // Get current context prediction
  const getContextPrediction = useCallback((): ContextPrediction => {
    return currentContext || {
      context: 'unknown',
      confidence: 0,
      factors: [],
      suggestedActions: []
    };
  }, [currentContext]);

  // Get contextual recommendations
  const getRecommendations = useCallback(async (): Promise<ContextualRecommendation[]> => {
    if (!user || !currentContext) return [];

    const recs: ContextualRecommendation[] = [];

    // Get contacts that haven't been contacted recently
    const { data: staleContacts } = await supabase
      .from('profiles')
      .select('id, full_name, last_contact_date')
      .eq('user_id', user.id)
      .order('last_contact_date', { ascending: true, nullsFirst: true })
      .limit(5);

    if (staleContacts) {
      for (const contact of staleContacts) {
        const daysSinceContact = contact.last_contact_date
          ? Math.floor((Date.now() - new Date(contact.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceContact > 30) {
          recs.push({
            id: `reconnect-${contact.id}`,
            type: 'contact',
            title: `Reconnect with ${contact.full_name}`,
            description: `${daysSinceContact} days since last contact`,
            profileId: contact.id,
            profileName: contact.full_name,
            priority: daysSinceContact > 90 ? 'high' : 'medium',
            reason: currentContext.context === 'commute' 
              ? 'Good time to make a call during commute'
              : 'Relationship maintenance'
          });
        }
      }
    }

    // Context-specific recommendations
    switch (currentContext.context) {
      case 'commute':
        recs.push({
          id: 'commute-capture',
          type: 'action',
          title: 'Review pending voice notes',
          description: 'Make use of commute time',
          priority: 'low',
          reason: 'Commute detected'
        });
        break;

      case 'meeting':
        recs.push({
          id: 'meeting-record',
          type: 'capture',
          title: 'Start meeting recording',
          description: 'Capture meeting intelligence',
          priority: 'high',
          reason: 'Meeting context detected'
        });
        break;

      case 'social':
        if (nearbyContacts.length > 0) {
          recs.push({
            id: 'social-capture',
            type: 'capture',
            title: 'Capture the moment',
            description: `${nearbyContacts.length} contacts nearby`,
            priority: 'medium',
            reason: 'Social gathering detected'
          });
        }
        break;
    }

    setRecommendations(recs);
    return recs;
  }, [user, currentContext, nearbyContacts]);

  // Get optimal contact time for a profile
  const getOptimalContactTime = useCallback(async (
    profileId: string
  ): Promise<{ time: string; reason: string } | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('predict-context', {
        body: { 
          userId: user.id, 
          profileId,
          action: 'optimal_contact_time'
        }
      });

      if (error) throw error;
      return data?.optimalTime || null;
    } catch (error) {
      console.error('Error getting optimal contact time:', error);
      return null;
    }
  }, [user]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Auto-refresh recommendations when context changes
  useEffect(() => {
    if (currentContext) {
      getRecommendations();
    }
  }, [currentContext, getRecommendations]);

  return {
    currentContext,
    isMonitoring,
    contextHistory,
    recommendations,
    lastSnapshot,
    startMonitoring,
    stopMonitoring,
    captureSnapshot,
    getContextPrediction,
    getRecommendations,
    getOptimalContactTime
  };
}
