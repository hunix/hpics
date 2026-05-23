/**
 * @deprecated Use useFusionService from @/domains/fusion/hooks/useFusionService instead.
 * This hook is maintained for backward compatibility during migration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export type FusionEventType = 
  | 'multi_source_correlation'
  | 'temporal_pattern'
  | 'spatial_anomaly'
  | 'behavioral_fusion'
  | 'threat_synthesis'
  | 'signal_convergence';

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface FusionSource {
  type: 'rf' | 'thermal' | 'aerial' | 'sensor' | 'tscm' | 'sdr';
  device_id?: string;
  data_id?: string;
  timestamp: string;
  confidence: number;
  data_summary: Record<string, unknown>;
}

export interface FusionEvent {
  id: string;
  user_id: string;
  event_type: FusionEventType;
  correlation_id: string | null;
  sources: FusionSource[];
  fusion_result: Record<string, unknown>;
  confidence_score: number;
  threat_level: ThreatLevel | null;
  priority: Priority;
  location_data: {
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
    location_name?: string;
  } | null;
  temporal_data: {
    start_time?: string;
    end_time?: string;
    duration_seconds?: number;
    pattern_type?: string;
  } | null;
  recommendations: Array<{
    action: string;
    priority: Priority;
    rationale: string;
  }>;
  is_processed: boolean;
  processed_at: string | null;
  created_at: string;
}

export interface FusionAnalysisRequest {
  sources: Array<{
    type: FusionSource['type'];
    device_id?: string;
    data: Record<string, unknown>;
  }>;
  analysis_type?: 'threat' | 'pattern' | 'correlation' | 'comprehensive';
  location_context?: { latitude: number; longitude: number };
}

export function useIntelligenceFusion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch recent fusion events
  const { data: fusionEvents = [], isLoading, error } = useQuery({
    queryKey: ['fusion-events', user?.id],
    queryFn: async (): Promise<FusionEvent[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('intelligence_fusion_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as FusionEvent[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Real-time subscription for new fusion events
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('fusion-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intelligence_fusion_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const event = payload.new as FusionEvent;
          queryClient.invalidateQueries({ queryKey: ['fusion-events', user.id] });
          
          if (event.threat_level === 'critical' || event.threat_level === 'high') {
            toast.warning(`🔗 Fusion Alert: ${event.event_type}`, {
              description: `Threat level: ${event.threat_level?.toUpperCase()}`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Trigger multi-modal fusion analysis
  const triggerFusion = useMutation({
    mutationFn: async (request: FusionAnalysisRequest) => {
      const { data, error } = await invokeFunction('hardware-intelligence-fusion', request as unknown as Record<string, unknown>);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fusion-events', user?.id] });
      const threatLevel = data?.threat_level;
      if (threatLevel === 'critical' || threatLevel === 'high') {
        toast.error(`Fusion complete - ${threatLevel.toUpperCase()} threat detected!`);
      } else {
        toast.success('Intelligence fusion complete');
      }
    },
    onError: (error) => {
      toast.error(`Fusion analysis failed: ${error.message}`);
    },
  });

  // Create manual fusion event
  const createFusionEvent = useMutation({
    mutationFn: async (event: Omit<FusionEvent, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('intelligence_fusion_events')
        .insert({
          user_id: user.id,
          ...event,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fusion-events', user?.id] });
    },
  });

  // Mark event as processed
  const markProcessed = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('intelligence_fusion_events')
        .update({
          is_processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fusion-events', user?.id] });
    },
  });

  // Get correlated events by correlation ID
  const getCorrelatedEvents = useCallback((correlationId: string) => {
    return fusionEvents.filter(e => e.correlation_id === correlationId);
  }, [fusionEvents]);

  // Analyze cross-source patterns
  const analyzePatterns = useCallback(async () => {
    try {
      const { data, error } = await invokeFunction('hardware-intelligence-fusion/analyze-patterns', { timeframe_hours: 24 },);
      if (error) throw error;
      return data?.patterns || [];
    } catch (error) {
      console.error('Pattern analysis failed:', error);
      return [];
    }
  }, []);

  // Get threat assessment
  const getThreatAssessment = useCallback(async () => {
    try {
      const { data, error } = await invokeFunction('hardware-intelligence-fusion/threat-assessment', {},);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Threat assessment failed:', error);
      return null;
    }
  }, []);

  // Categorize events
  const unprocessedEvents = fusionEvents.filter(e => !e.is_processed);
  const criticalEvents = fusionEvents.filter(e => e.threat_level === 'critical');
  const highThreatEvents = fusionEvents.filter(e => e.threat_level === 'high');
  const recentEvents = fusionEvents.slice(0, 10);

  // Group by event type
  const eventsByType = fusionEvents.reduce((acc, event) => {
    const type = event.event_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(event);
    return acc;
  }, {} as Record<FusionEventType, FusionEvent[]>);

  // Calculate fusion statistics
  const fusionStats = {
    totalEvents: fusionEvents.length,
    unprocessedCount: unprocessedEvents.length,
    criticalCount: criticalEvents.length,
    avgConfidence: fusionEvents.length > 0 
      ? fusionEvents.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / fusionEvents.length 
      : 0,
    sourceTypes: [...new Set(fusionEvents.flatMap(e => e.sources?.map(s => s.type) || []))],
  };

  return {
    fusionEvents,
    isLoading,
    error,
    // Categorized
    unprocessedEvents,
    criticalEvents,
    highThreatEvents,
    recentEvents,
    eventsByType,
    // Stats
    fusionStats,
    // Actions
    triggerFusion: triggerFusion.mutate,
    triggerFusionAsync: triggerFusion.mutateAsync,
    createFusionEvent: createFusionEvent.mutate,
    markProcessed: markProcessed.mutate,
    getCorrelatedEvents,
    analyzePatterns,
    getThreatAssessment,
    isFusing: triggerFusion.isPending,
  };
}
