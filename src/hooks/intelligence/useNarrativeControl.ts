/**
 * Narrative Control Engine Hook
 * Mass influence and perception warfare operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface NarrativeCampaign {
  id: string;
  campaignName: string;
  campaignType: string;
  targetNarrative?: string;
  counterNarratives: string[];
  deploymentChannels: Array<{ channel: string; priority: number; status: string }>;
  contentStrategy: Record<string, unknown>;
  amplificationConfig: Record<string, unknown>;
  successMetrics: Record<string, unknown>;
  currentReach: number;
  sentimentShift: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string | null;
}

export interface NarrativeNode {
  id: string;
  campaignId: string;
  nodeType: string;
  content?: string;
  personaConfig: Record<string, unknown>;
  platform?: string;
  engagementMetrics: Record<string, number>;
  amplificationScore: number;
  authenticityRating: number;
  connections: Array<{ nodeId: string; strength: number; type: string }>;
  isActive: boolean;
  createdAt: string | null;
}

export interface PerceptionTracking {
  id: string;
  profileId?: string;
  campaignId?: string;
  perceptionDimension: string;
  baselineValue: number;
  currentValue: number;
  targetValue: number;
  measurementMethod?: string;
  dataSources: string[];
  trendAnalysis: Record<string, unknown>;
  influencingFactors: Array<{ factor: string; impact: number }>;
  measuredAt: string;
}

export interface SyntheticRelationship {
  id: string;
  profileId?: string;
  personaName: string;
  personaConfig: Record<string, unknown>;
  relationshipType?: string;
  relationshipDepth: string;
  interactionHistory: Array<{ timestamp: string; type: string; outcome: string }>;
  trustLevel: number;
  influenceAchieved: Record<string, unknown>;
  objectives: Array<{ objective: string; progress: number; status: string }>;
  isActive: boolean;
  createdAt: string | null;
}

export function useNarrativeControl(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['narrative-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('narrative_campaigns')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((c): NarrativeCampaign => ({
        id: c.id,
        campaignName: c.campaign_name ?? '',
        campaignType: c.campaign_type ?? '',
        targetNarrative: c.target_narrative ?? '',
        counterNarratives: (c.counter_narratives as NarrativeCampaign['counterNarratives']) || [],
        deploymentChannels: (c.deployment_channels as NarrativeCampaign['deploymentChannels']) || [],
        contentStrategy: (c.content_strategy as Record<string, unknown>) || {},
        amplificationConfig: (c.amplification_config as Record<string, unknown>) || {},
        successMetrics: (c.success_metrics as Record<string, unknown>) || {},
        currentReach: c.current_reach || 0,
        sentimentShift: Number(c.sentiment_shift) || 0,
        status: c.status || 'planning',
        startedAt: c.started_at ?? undefined,
        completedAt: c.completed_at ?? undefined,
        createdAt: c.created_at ?? '',
      }));
    },
    enabled: !!user?.id,
  });

  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: ['narrative-nodes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('narrative_nodes')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('amplification_score', { ascending: false });

      if (error) throw error;

      return (data || []).map((n): NarrativeNode => ({
        id: n.id,
        campaignId: n.campaign_id ?? '',
        nodeType: n.node_type ?? '',
        content: n.content ?? '',
        personaConfig: (n.persona_config as Record<string, unknown>) || {},
        platform: n.platform ?? undefined,
        engagementMetrics: (n.engagement_metrics as Record<string, number>) || {},
        amplificationScore: Number(n.amplification_score) || 0,
        authenticityRating: Number(n.authenticity_rating) || 0,
        connections: (n.connections as NarrativeNode['connections']) || [],
        isActive: n.is_active ?? true,
        createdAt: n.created_at ?? '',
      }));
    },
    enabled: !!user?.id,
  });

  const { data: perceptionData, isLoading: perceptionLoading } = useQuery({
    queryKey: ['perception-tracking', profileId],
    queryFn: async () => {
      let query = supabase
        .from('perception_tracking')
        .select('*')
        .eq('user_id', user!.id)
        .order('measured_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p): PerceptionTracking => ({
        id: p.id,
        profileId: p.profile_id ?? undefined,
        campaignId: p.campaign_id ?? undefined,
        perceptionDimension: p.perception_dimension ?? '',
        baselineValue: Number(p.baseline_value) || 0,
        currentValue: Number(p.current_value) || 0,
        targetValue: Number(p.target_value) || 0,
        measurementMethod: p.measurement_method ?? undefined,
        dataSources: (p.data_sources as string[]) || [],
        trendAnalysis: (p.trend_analysis as Record<string, unknown>) || {},
        influencingFactors: (p.influencing_factors as PerceptionTracking['influencingFactors']) || [],
        measuredAt: p.measured_at ?? '',
      }));
    },
    enabled: !!user?.id,
  });

  const { data: syntheticRelationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['synthetic-relationships', profileId],
    queryFn: async () => {
      let query = supabase
        .from('synthetic_relationships')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('trust_level', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((r): SyntheticRelationship => ({
        id: r.id,
        profileId: r.profile_id ?? undefined,
        personaName: r.persona_name ?? '',
        personaConfig: (r.persona_config as Record<string, unknown>) || {},
        relationshipType: r.relationship_type ?? '',
        relationshipDepth: r.relationship_depth || 'acquaintance',
        interactionHistory: (r.interaction_history as SyntheticRelationship['interactionHistory']) || [],
        trustLevel: Number(r.trust_level) || 0,
        influenceAchieved: (r.influence_achieved as Record<string, unknown>) || {},
        objectives: (r.objectives as SyntheticRelationship['objectives']) || [],
        isActive: r.is_active ?? true,
        createdAt: r.created_at ?? '',
      }));
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (params: {
      campaignName: string;
      campaignType: string;
      targetNarrative: string;
      deploymentChannels: Array<{ channel: string; priority: number }>;
    }) => {
      const { data, error } = await supabase
        .from('narrative_campaigns')
        .insert({
          user_id: user!.id,
          campaign_name: params.campaignName,
          campaign_type: params.campaignType,
          target_narrative: params.targetNarrative,
          deployment_channels: params.deploymentChannels,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narrative-campaigns'] });
      toast.success('Narrative campaign created');
    },
  });

  const deployCampaign = useMutation({
    mutationFn: async (params: { campaignId: string }) => {
      const { data, error } = await invokeFunction('narrative-control-engine', { 
          campaignId: params.campaignId,
          action: 'deploy',
        },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narrative-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['narrative-nodes'] });
      toast.success('Campaign deployed');
    },
    onError: (error) => {
      toast.error(`Deployment failed: ${error.message}`);
    },
  });

  const createSyntheticRelationship = useMutation({
    mutationFn: async (params: {
      profileId: string;
      personaName: string;
      personaConfig: Record<string, unknown>;
      relationshipType: string;
      objectives: Array<{ objective: string; progress: number }>;
    }) => {
      const { data, error } = await (supabase
        .from('synthetic_relationships') as any)
        .insert({
          user_id: user!.id,
          profile_id: params.profileId,
          persona_name: params.personaName,
          persona_config: params.personaConfig,
          relationship_type: params.relationshipType,
          objectives: params.objectives,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synthetic-relationships'] });
      toast.success('Synthetic relationship created');
    },
  });

  const measurePerception = useMutation({
    mutationFn: async (params: { profileId?: string; campaignId?: string }) => {
      const { data, error } = await invokeFunction('narrative-control-engine', { 
          profileId: params.profileId,
          campaignId: params.campaignId,
          action: 'measure_perception',
        },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perception-tracking'] });
    },
  });

  // Computed metrics
  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || [];
  const totalReach = campaigns?.reduce((sum, c) => sum + c.currentReach, 0) || 0;
  const avgSentimentShift = campaigns?.filter(c => c.status === 'completed').length
    ? campaigns.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.sentimentShift, 0) / campaigns.filter(c => c.status === 'completed').length
    : 0;
  const activeNodes = nodes?.length || 0;
  const highTrustRelationships = syntheticRelationships?.filter(r => r.trustLevel >= 0.7) || [];

  return {
    campaigns,
    nodes,
    perceptionData,
    syntheticRelationships,
    isLoading: campaignsLoading || nodesLoading || perceptionLoading || relationshipsLoading,
    createCampaign: createCampaign.mutate,
    deployCampaign: deployCampaign.mutate,
    createSyntheticRelationship: createSyntheticRelationship.mutate,
    measurePerception: measurePerception.mutate,
    isDeploying: deployCampaign.isPending,
    activeCampaigns,
    totalReach,
    avgSentimentShift,
    activeNodes,
    highTrustRelationships,
    totalCampaigns: campaigns?.length || 0,
  };
}
