import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  source_name: string;
  source_url?: string;
  published_at?: string;
  sentiment_score: number;
  sentiment_label: string;
  sectors: string[];
  regions: string[];
  topics: string[];
  tickers: string[];
  impact_score: number;
  urgency_level: string;
  source_credibility_score: number;
}

export interface NewsSignal {
  id: string;
  signal_type: 'buy' | 'sell' | 'hold' | 'watch' | 'avoid';
  asset_class: string;
  asset_identifier?: string;
  sector?: string;
  signal_strength: number;
  confidence_score: number;
  expected_direction: string;
  expected_magnitude: string;
  time_horizon: string;
  expected_roi_low?: number;
  expected_roi_high?: number;
  risk_level: string;
  risk_factors: any[];
  status: string;
  valid_until?: string;
}

export interface GeopoliticalEvent {
  id: string;
  event_name: string;
  event_type: string;
  status: string;
  severity_level: string;
  regions: string[];
  countries: string[];
  summary?: string;
  opportunity_score?: number;
  risk_score?: number;
  investment_implications: any[];
}

export interface InvestmentOpportunity {
  id: string;
  title: string;
  description?: string;
  opportunity_type: string;
  asset_class: string;
  asset_identifier?: string;
  sector?: string;
  action: string;
  urgency: string;
  conviction_level: string;
  entry_price_suggestion?: number;
  target_price?: number;
  stop_loss?: number;
  expected_roi_pct?: number;
  time_horizon_days?: number;
  risk_level: string;
  risk_factors: any[];
  thesis?: string;
  confidence_score: number;
  status: string;
  valid_until?: string;
}

export interface DashboardData {
  stats: {
    totalOpportunities: number;
    highConviction: number;
    urgentOpportunities: number;
    activeSignals: number;
    buySignals: number;
    sellSignals: number;
    ongoingEvents: number;
    criticalEvents: number;
    overallSentiment: number;
    fearGreedIndex: number;
  };
  opportunities: InvestmentOpportunity[];
  signals: NewsSignal[];
  events: GeopoliticalEvent[];
  sentiment: any;
  assetBreakdown: Record<string, number>;
  sectorHeat: Record<string, { opportunities: number; avgConfidence: number }>;
}

export function useEconomicIntelligence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['economic-intelligence-dashboard', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('investment-opportunity-predictor', {
        body: { action: 'get_dashboard_data' },
      });
      if (error) throw error;
      return data as DashboardData;
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Fetch active opportunities
  const { data: opportunities, isLoading: isOpportunitiesLoading } = useQuery({
    queryKey: ['investment-opportunities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('investment-opportunity-predictor', {
        body: { action: 'get_active_opportunities' },
      });
      if (error) throw error;
      return data.opportunities as InvestmentOpportunity[];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch recent news
  const { data: recentNews, isLoading: isNewsLoading } = useQuery({
    queryKey: ['news-intelligence', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_intelligence_items')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as NewsItem[];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch active signals
  const { data: signals, isLoading: isSignalsLoading } = useQuery({
    queryKey: ['news-signals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_signals')
        .select('*')
        .eq('status', 'active')
        .order('signal_strength', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as NewsSignal[];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch geopolitical events
  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ['geopolitical-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geopolitical_events')
        .select('*')
        .in('status', ['ongoing', 'escalating', 'developing'])
        .order('opportunity_score', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as GeopoliticalEvent[];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Run full intelligence pipeline
  const runPipeline = useCallback(async (options?: { query?: string; topics?: string[]; sectors?: string[]; regions?: string[] }) => {
    if (!user?.id) return;
    setIsRunningPipeline(true);
    
    try {
      toast.info('Starting intelligence pipeline...');
      
      // Step 1: Fetch news
      const { error: fetchError } = await supabase.functions.invoke('economic-intelligence-engine', {
        body: { 
          action: 'fetch_news',
          ...options,
        },
      });
      if (fetchError) throw fetchError;
      toast.success('News fetched successfully');

      // Step 2: Correlate news
      const { error: correlateError } = await supabase.functions.invoke('economic-intelligence-engine', {
        body: { action: 'correlate_news' },
      });
      if (correlateError) console.warn('Correlation warning:', correlateError);

      // Step 3: Generate signals
      const { error: signalError } = await supabase.functions.invoke('economic-intelligence-engine', {
        body: { action: 'generate_signals' },
      });
      if (signalError) console.warn('Signal generation warning:', signalError);

      // Step 4: Track geopolitical events
      const { error: geoError } = await supabase.functions.invoke('economic-intelligence-engine', {
        body: { action: 'track_geopolitical' },
      });
      if (geoError) console.warn('Geo tracking warning:', geoError);

      // Step 5: Snapshot sentiment
      const { error: sentimentError } = await supabase.functions.invoke('economic-intelligence-engine', {
        body: { action: 'snapshot_sentiment' },
      });
      if (sentimentError) console.warn('Sentiment snapshot warning:', sentimentError);

      toast.success('Intelligence pipeline completed!');
      
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: ['economic-intelligence-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['investment-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['news-intelligence'] });
      queryClient.invalidateQueries({ queryKey: ['news-signals'] });
      queryClient.invalidateQueries({ queryKey: ['geopolitical-events'] });
      
    } catch (error) {
      console.error('Pipeline error:', error);
      toast.error('Failed to run intelligence pipeline');
    } finally {
      setIsRunningPipeline(false);
    }
  }, [user?.id, queryClient]);

  // Generate opportunities mutation
  const generateOpportunitiesMutation = useMutation({
    mutationFn: async (options: { assetClass?: string; sector?: string; riskTolerance?: string; timeHorizon?: string }) => {
      const { data, error } = await supabase.functions.invoke('investment-opportunity-predictor', {
        body: { action: 'generate_opportunities', ...options },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Generated ${data.count} investment opportunities`);
      queryClient.invalidateQueries({ queryKey: ['investment-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['economic-intelligence-dashboard'] });
    },
    onError: (error) => {
      toast.error('Failed to generate opportunities');
      console.error('Generate opportunities error:', error);
    },
  });

  // Correlate with contacts mutation
  const correlateContactsMutation = useMutation({
    mutationFn: async (profileId?: string) => {
      const { data, error } = await supabase.functions.invoke('economic-intelligence-engine', {
        body: { action: 'correlate_contacts', profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Found ${data.count} contact-news correlations`);
    },
    onError: (error) => {
      toast.error('Failed to correlate contacts with news');
      console.error('Correlate contacts error:', error);
    },
  });

  // Record outcome mutation
  const recordOutcomeMutation = useMutation({
    mutationFn: async ({ opportunityId, outcome }: { opportunityId: string; outcome: any }) => {
      const { data, error } = await supabase.functions.invoke('investment-opportunity-predictor', {
        body: { action: 'record_outcome', opportunityId, outcome },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Outcome recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['investment-opportunities'] });
    },
    onError: (error) => {
      toast.error('Failed to record outcome');
      console.error('Record outcome error:', error);
    },
  });

  return {
    // Data
    dashboardData,
    opportunities,
    recentNews,
    signals,
    events,
    
    // Loading states
    isDashboardLoading,
    isOpportunitiesLoading,
    isNewsLoading,
    isSignalsLoading,
    isEventsLoading,
    isRunningPipeline,
    
    // Actions
    runPipeline,
    generateOpportunities: generateOpportunitiesMutation.mutate,
    correlateContacts: correlateContactsMutation.mutate,
    recordOutcome: recordOutcomeMutation.mutate,
    refetchDashboard,
    
    // Mutation states
    isGeneratingOpportunities: generateOpportunitiesMutation.isPending,
    isCorrelatingContacts: correlateContactsMutation.isPending,
  };
}
