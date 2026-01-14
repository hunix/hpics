import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';

export type CorrelationType = 'spatial' | 'temporal' | 'signal' | 'behavioral' | 'threat';
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SourceEvent {
  device_id: string;
  device_type: string;
  event_type: string;
  timestamp: string;
  data_ref: string;
  location?: { lat: number; lng: number };
}

export interface CrossDeviceCorrelation {
  id: string;
  user_id: string;
  correlation_type: CorrelationType;
  source_events: SourceEvent[];
  correlation_strength: number;
  findings: {
    summary?: string;
    linked_patterns?: string[];
    threat_assessment?: string;
    recommendations?: string[];
  };
  location_overlap?: { lat: number; lng: number; radius_meters: number };
  time_overlap_seconds?: number;
  threat_level?: ThreatLevel;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  mission_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CorrelationRule {
  id: string;
  user_id: string;
  rule_name: string;
  source_device_types: string[];
  correlation_logic: {
    time_window_seconds?: number;
    distance_meters?: number;
    signal_overlap_threshold?: number;
    min_events?: number;
  };
  auto_generate_alert: boolean;
  alert_severity: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCrossDeviceCorrelation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch correlations
  const { data: correlations, isLoading, error } = useQuery({
    queryKey: ['cross-device-correlations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('cross_device_correlations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        source_events: (c.source_events || []) as unknown as SourceEvent[],
        findings: (c.findings || {}) as unknown as CrossDeviceCorrelation['findings'],
        location_overlap: c.location_overlap as unknown as CrossDeviceCorrelation['location_overlap'],
      })) as CrossDeviceCorrelation[];
    },
    enabled: !!user?.id,
  });

  // Fetch correlation rules
  const { data: correlationRules } = useQuery({
    queryKey: ['correlation-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('correlation_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        correlation_logic: r.correlation_logic as CorrelationRule['correlation_logic'],
      })) as CorrelationRule[];
    },
    enabled: !!user?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('correlation-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cross_device_correlations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['cross-device-correlations'] });
          const correlation = payload.new as CrossDeviceCorrelation;
          
          if (correlation.threat_level === 'critical' || correlation.threat_level === 'high') {
            toast.warning(`${correlation.threat_level.toUpperCase()} threat correlation detected`, {
              description: `${correlation.source_events?.length || 0} events correlated`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Auto-correlate mutation
  const autoCorrelate = useMutation({
    mutationFn: async ({ timeframeMinutes = 60 }: { timeframeMinutes?: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const since = new Date(Date.now() - timeframeMinutes * 60 * 1000).toISOString();

      // Fetch recent events from multiple sources
      const [alertsResult, fusionResult] = await Promise.all([
        supabase
          .from('hardware_alerts')
          .select('id, device_id, alert_type, created_at')
          .eq('user_id', user.id)
          .gte('created_at', since),
        supabase
          .from('intelligence_fusion_events')
          .select('id, event_type, created_at, location')
          .eq('user_id', user.id)
          .gte('created_at', since),
      ]);

      const alerts = (alertsResult.data || []) as any[];
      const fusionEvents = (fusionResult.data || []) as any[];

      // Simple temporal correlation - events within 5 minutes of each other
      const correlatedGroups: SourceEvent[][] = [];
      const allEvents: SourceEvent[] = [
        ...alerts.map((a: any) => ({
          device_id: a.device_id || 'unknown',
          device_type: 'alert_source',
          event_type: a.alert_type || 'alert',
          timestamp: a.created_at,
          data_ref: a.id,
        })),
        ...fusionEvents.map((f: any) => ({
          device_id: 'fusion',
          device_type: 'fusion_event',
          event_type: f.event_type || 'fusion',
          timestamp: f.created_at,
          data_ref: f.id,
          location: f.location as { lat: number; lng: number } | undefined,
        })),
      ];

      // Sort by timestamp
      allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Group events within 5 minute windows
      let currentGroup: SourceEvent[] = [];
      let lastTime: Date | null = null;

      for (const event of allEvents) {
        const eventTime = new Date(event.timestamp);
        if (!lastTime || (eventTime.getTime() - lastTime.getTime()) <= 5 * 60 * 1000) {
          currentGroup.push(event);
        } else {
          if (currentGroup.length >= 2) {
            correlatedGroups.push([...currentGroup]);
          }
          currentGroup = [event];
        }
        lastTime = eventTime;
      }
      if (currentGroup.length >= 2) {
        correlatedGroups.push(currentGroup);
      }

      // Create correlation records for significant groups
      const createdCorrelations: any[] = [];
      
      for (const group of correlatedGroups) {
        if (group.length < 2) continue;

        const uniqueDeviceTypes = new Set(group.map(e => e.device_type));

        const timestamps = group.map(e => new Date(e.timestamp).getTime());
        const timeOverlapSeconds = Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000);
        
        const correlationStrength = Math.min(1, (group.length * 0.15) + (uniqueDeviceTypes.size * 0.2));
        const threatLevel = correlationStrength > 0.7 ? 'high' : correlationStrength > 0.4 ? 'medium' : 'low';

        const { data: correlation, error } = await supabase
          .from('cross_device_correlations')
          .insert({
            user_id: user.id,
            correlation_type: 'temporal',
            source_events: group as any,
            correlation_strength: correlationStrength,
            time_overlap_seconds: timeOverlapSeconds,
            threat_level: threatLevel,
            findings: {
              summary: `${group.length} events from ${uniqueDeviceTypes.size} device types correlated within ${timeOverlapSeconds}s`,
              linked_patterns: Array.from(uniqueDeviceTypes),
              recommendations: threatLevel === 'high' ? ['Review correlated events for potential threat'] : [],
            } as any,
          })
          .select()
          .single();

        if (!error && correlation) {
          createdCorrelations.push(correlation);
        }
      }

      return {
        correlations_created: createdCorrelations.length,
        events_analyzed: allEvents.length,
        groups_found: correlatedGroups.length,
        correlations: createdCorrelations,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cross-device-correlations'] });
      toast.success('Auto-correlation completed', {
        description: `${data.correlations_created} correlations found from ${data.events_analyzed} events`,
      });
    },
    onError: (error) => {
      toast.error('Auto-correlation failed', { description: error.message });
    },
  });

  // Manually correlate events
  const correlateEvents = useMutation({
    mutationFn: async ({ 
      sourceEvents, 
      correlationType = 'manual',
      findings,
    }: { 
      sourceEvents: SourceEvent[];
      correlationType?: string;
      findings?: CrossDeviceCorrelation['findings'];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cross_device_correlations')
        .insert({
          user_id: user.id,
          correlation_type: correlationType,
          source_events: sourceEvents as any,
          correlation_strength: 1.0,
          findings: (findings || {
            summary: `Manually correlated ${sourceEvents.length} events`,
          }) as any,
          is_verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-device-correlations'] });
      toast.success('Events correlated successfully');
    },
    onError: (error) => {
      toast.error('Failed to correlate events', { description: error.message });
    },
  });

  // Verify correlation
  const verifyCorrelation = useMutation({
    mutationFn: async (correlationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cross_device_correlations')
        .update({
          is_verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', correlationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-device-correlations'] });
      toast.success('Correlation verified');
    },
  });

  // Delete correlation
  const deleteCorrelation = useMutation({
    mutationFn: async (correlationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cross_device_correlations')
        .delete()
        .eq('id', correlationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-device-correlations'] });
      toast.success('Correlation deleted');
    },
  });

  // Create/update correlation rule
  const saveCorrelationRule = useMutation({
    mutationFn: async (rule: Partial<CorrelationRule> & { rule_name: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (rule.id) {
        const { data, error } = await supabase
          .from('correlation_rules')
          .update({
            rule_name: rule.rule_name,
            source_device_types: rule.source_device_types,
            correlation_logic: rule.correlation_logic,
            auto_generate_alert: rule.auto_generate_alert,
            alert_severity: rule.alert_severity,
            is_active: rule.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rule.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('correlation_rules')
          .insert({
            user_id: user.id,
            rule_name: rule.rule_name,
            source_device_types: rule.source_device_types || [],
            correlation_logic: rule.correlation_logic || {},
            auto_generate_alert: rule.auto_generate_alert ?? false,
            alert_severity: rule.alert_severity || 'medium',
            is_active: rule.is_active ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correlation-rules'] });
      toast.success('Correlation rule saved');
    },
  });

  // Get correlations by type
  const getCorrelationsByType = useCallback((type: CorrelationType) => {
    return (correlations || []).filter(c => c.correlation_type === type);
  }, [correlations]);

  // Get high-threat correlations
  const highThreatCorrelations = (correlations || []).filter(
    c => c.threat_level === 'critical' || c.threat_level === 'high'
  );

  const unverifiedCorrelations = (correlations || []).filter(c => !c.is_verified);

  // Stats
  const stats = {
    totalCorrelations: correlations?.length || 0,
    verifiedCorrelations: correlations?.filter(c => c.is_verified).length || 0,
    unverifiedCorrelations: unverifiedCorrelations.length,
    highThreatCount: highThreatCorrelations.length,
    averageStrength: correlations?.length 
      ? (correlations.reduce((sum, c) => sum + c.correlation_strength, 0) / correlations.length).toFixed(2)
      : '0.00',
    activeRules: correlationRules?.filter(r => r.is_active).length || 0,
  };

  return {
    correlations,
    correlationRules,
    highThreatCorrelations,
    unverifiedCorrelations,
    stats,
    isLoading,
    error,
    autoCorrelate: autoCorrelate.mutate,
    isAutoCorrelating: autoCorrelate.isPending,
    correlateEvents: correlateEvents.mutate,
    verifyCorrelation: verifyCorrelation.mutate,
    deleteCorrelation: deleteCorrelation.mutate,
    saveCorrelationRule: saveCorrelationRule.mutate,
    getCorrelationsByType,
  };
}
