/**
 * useUnifiedIntelligence - Aggregates ALL intelligence sources into a prioritized feed
 * Combines: decay alerts, anomalies, proximity events, calendar, insights, action items
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type IntelligenceCategory = 
  | 'decay_alert' 
  | 'anomaly' 
  | 'proximity' 
  | 'calendar' 
  | 'insight' 
  | 'action_item'
  | 'follow_up'
  | 'biometric_match'
  | 'security_alert';

export interface UnifiedIntelligenceItem {
  id: string;
  category: IntelligenceCategory;
  priority: PriorityLevel;
  title: string;
  description: string;
  profileId?: string;
  profileName?: string;
  profileAvatar?: string;
  timestamp: Date;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  isRead?: boolean;
}

interface UseUnifiedIntelligenceOptions {
  limit?: number;
  categories?: IntelligenceCategory[];
  minPriority?: PriorityLevel;
}

const PRIORITY_SCORES: Record<PriorityLevel, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

const CATEGORY_BASE_PRIORITY: Record<IntelligenceCategory, PriorityLevel> = {
  security_alert: 'critical',
  anomaly: 'high',
  decay_alert: 'high',
  proximity: 'medium',
  biometric_match: 'medium',
  follow_up: 'medium',
  calendar: 'medium',
  insight: 'low',
  action_item: 'low',
};

export function useUnifiedIntelligence(options: UseUnifiedIntelligenceOptions = {}) {
  const { user } = useAuth();
  const { limit = 50, categories, minPriority = 'low' } = options;
  const [items, setItems] = useState<UnifiedIntelligenceItem[]>([]);

  // Fetch decay alerts
  const { data: decayAlerts } = useQuery({
    queryKey: ['unified-decay-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('relationship_scores')
        .select(`
          id, health_score, decay_risk, last_interaction_at,
          profile:profiles!relationship_scores_profile_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .gt('decay_risk', 0.5)
        .order('decay_risk', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch anomalies
  const { data: anomalies } = useQuery({
    queryKey: ['unified-anomalies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('behavioral_anomalies')
        .select(`
          id, anomaly_type, severity, description, detected_at,
          profile:profiles!behavioral_anomalies_profile_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch proximity events
  const { data: proximityEvents } = useQuery({
    queryKey: ['unified-proximity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('proximity_events')
        .select(`
          id, detected_profile_id, detection_method, created_at, metadata,
          profile:profiles!proximity_events_detected_profile_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Fetch follow-ups
  const { data: followUps } = useQuery({
    queryKey: ['unified-followups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('follow_up_suggestions')
        .select(`
          id, suggestion_type, priority, suggested_action, due_date,
          profile:profiles!follow_up_suggestions_profile_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch calendar events
  const { data: calendarEvents } = useQuery({
    queryKey: ['unified-calendar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('calendar_events')
        .select('id, title, description, start_time, end_time, event_type')
        .eq('user_id', user.id)
        .gte('start_time', now.toISOString())
        .lte('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch biometric matches
  const { data: biometricMatches } = useQuery({
    queryKey: ['unified-biometric', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('biometric_matches')
        .select(`
          id, match_type, confidence_score, created_at,
          profile:profiles!biometric_matches_matched_profile_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('user_confirmed', false)
        .gte('confidence_score', 0.7)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Transform and aggregate all sources
  const unifiedItems = useMemo(() => {
    const allItems: UnifiedIntelligenceItem[] = [];

    // Transform decay alerts
    decayAlerts?.forEach((alert: any) => {
      const profile = alert.profile;
      const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
      allItems.push({
        id: `decay-${alert.id}`,
        category: 'decay_alert',
        priority: alert.decay_risk > 0.8 ? 'critical' : 'high',
        title: `Relationship Decay Alert`,
        description: `${profileName} - Health: ${Math.round(alert.health_score * 100)}%`,
        profileId: profile?.id,
        profileName,
        profileAvatar: profile?.avatar_url,
        timestamp: new Date(alert.last_interaction_at || Date.now()),
        actionLabel: 'Reach Out',
        actionUrl: profile?.id ? `/contacts/${profile.id}` : undefined,
        metadata: { decayRisk: alert.decay_risk, healthScore: alert.health_score },
      });
    });

    // Transform anomalies
    anomalies?.forEach((anomaly: any) => {
      const profile = anomaly.profile;
      const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
      allItems.push({
        id: `anomaly-${anomaly.id}`,
        category: 'anomaly',
        priority: anomaly.severity === 'critical' ? 'critical' : anomaly.severity === 'high' ? 'high' : 'medium',
        title: `Behavioral Anomaly: ${anomaly.anomaly_type}`,
        description: anomaly.description || `Unusual pattern detected for ${profileName}`,
        profileId: profile?.id,
        profileName,
        profileAvatar: profile?.avatar_url,
        timestamp: new Date(anomaly.detected_at),
        actionLabel: 'Investigate',
        actionUrl: profile?.id ? `/contacts/${profile.id}` : undefined,
        metadata: { anomalyType: anomaly.anomaly_type, severity: anomaly.severity },
      });
    });

    // Transform proximity events
    proximityEvents?.forEach((event: any) => {
      const profile = event.profile;
      const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
      allItems.push({
        id: `proximity-${event.id}`,
        category: 'proximity',
        priority: 'medium',
        title: `${profileName} Nearby`,
        description: `Detected via ${event.detection_method || 'unknown'}`,
        profileId: profile?.id,
        profileName,
        profileAvatar: profile?.avatar_url,
        timestamp: new Date(event.created_at),
        actionLabel: 'View',
        actionUrl: profile?.id ? `/contacts/${profile.id}` : undefined,
        metadata: event.metadata,
      });
    });

    // Transform follow-ups
    followUps?.forEach((followUp: any) => {
      const profile = followUp.profile;
      const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
      const isOverdue = followUp.due_date && new Date(followUp.due_date) < new Date();
      allItems.push({
        id: `followup-${followUp.id}`,
        category: 'follow_up',
        priority: isOverdue ? 'high' : followUp.priority === 'high' ? 'high' : 'medium',
        title: `Follow-up: ${profileName}`,
        description: followUp.suggested_action || 'Pending follow-up',
        profileId: profile?.id,
        profileName,
        profileAvatar: profile?.avatar_url,
        timestamp: new Date(followUp.due_date || Date.now()),
        actionLabel: 'Complete',
        actionUrl: profile?.id ? `/contacts/${profile.id}` : undefined,
        metadata: { type: followUp.suggestion_type, isOverdue },
      });
    });

    // Transform calendar events
    calendarEvents?.forEach((event: any) => {
      const startTime = new Date(event.start_time);
      const isWithinHour = startTime.getTime() - Date.now() < 60 * 60 * 1000;
      allItems.push({
        id: `calendar-${event.id}`,
        category: 'calendar',
        priority: isWithinHour ? 'high' : 'medium',
        title: event.title,
        description: event.description || `${event.event_type || 'Event'} at ${startTime.toLocaleTimeString()}`,
        timestamp: startTime,
        actionLabel: 'View',
        actionUrl: '/calendar',
        metadata: { eventType: event.event_type },
      });
    });

    // Transform biometric matches
    biometricMatches?.forEach((match: any) => {
      const profile = match.profile;
      const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
      allItems.push({
        id: `biometric-${match.id}`,
        category: 'biometric_match',
        priority: match.confidence_score > 0.9 ? 'high' : 'medium',
        title: `${match.match_type} Match: ${profileName}`,
        description: `${Math.round(match.confidence_score * 100)}% confidence`,
        profileId: profile?.id,
        profileName,
        profileAvatar: profile?.avatar_url,
        timestamp: new Date(match.created_at),
        actionLabel: 'Confirm',
        actionUrl: profile?.id ? `/contacts/${profile.id}` : undefined,
        metadata: { matchType: match.match_type, confidence: match.confidence_score },
      });
    });

    // Sort by priority and recency
    const sorted = allItems.sort((a, b) => {
      const priorityDiff = PRIORITY_SCORES[b.priority] - PRIORITY_SCORES[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Filter by categories if specified
    const filtered = categories 
      ? sorted.filter(item => categories.includes(item.category))
      : sorted;

    // Filter by minimum priority
    const minScore = PRIORITY_SCORES[minPriority];
    const priorityFiltered = filtered.filter(item => PRIORITY_SCORES[item.priority] >= minScore);

    return priorityFiltered.slice(0, limit);
  }, [decayAlerts, anomalies, proximityEvents, followUps, calendarEvents, biometricMatches, categories, minPriority, limit]);

  useEffect(() => {
    setItems(unifiedItems);
  }, [unifiedItems]);

  // Group by priority tier
  const groupedByPriority = useMemo(() => {
    const groups: Record<PriorityLevel, UnifiedIntelligenceItem[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    items.forEach(item => {
      groups[item.priority].push(item);
    });
    return groups;
  }, [items]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<IntelligenceCategory, UnifiedIntelligenceItem[]>> = {};
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category]!.push(item);
    });
    return groups;
  }, [items]);

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    critical: groupedByPriority.critical.length,
    high: groupedByPriority.high.length,
    medium: groupedByPriority.medium.length,
    low: groupedByPriority.low.length,
    categories: Object.keys(groupedByCategory).length,
  }), [items, groupedByPriority, groupedByCategory]);

  return {
    items,
    groupedByPriority,
    groupedByCategory,
    stats,
    isLoading: false,
  };
}
