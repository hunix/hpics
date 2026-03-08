import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Alert {
  id: string;
  profile_id: string;
  news_item_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  predicted_impact: any;
  recommended_actions: any[];
  conversation_starters: string[];
  is_read: boolean;
  is_actioned: boolean;
  created_at: string;
  profiles?: { first_name: string; last_name: string; organization: string };
  news_intelligence_items?: { title: string; source: string };
}

interface Prediction {
  id: string;
  profile_id: string;
  prediction_type: string;
  prediction_value: any;
  confidence_score: number;
  evidence: any[];
  time_horizon: string;
  created_at: string;
  profiles?: { first_name: string; last_name: string; organization: string };
}

interface TrackedIndustry {
  id: string;
  industry_name: string;
  contacts_count: number;
  current_sentiment: number;
  sentiment_trend: string;
  risk_level: string;
  opportunity_score: number;
}

export function useContactNewsCorrelation(profileId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCorrelating, setIsCorrelating] = useState(false);

  // Fetch alerts
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['contact-news-alerts', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('contact-news-correlator', {
        body: { action: 'get_alerts', profileId },
      });
      if (error) throw error;
      return data as { alerts: Alert[]; unreadCount: number };
    },
  });

  // Fetch predictions
  const { data: predictionsData, isLoading: predictionsLoading, refetch: refetchPredictions } = useQuery({
    queryKey: ['contact-behavior-predictions', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('contact-news-correlator', {
        body: { action: 'get_predictions', profileId },
      });
      if (error) throw error;
      return data as { predictions: Prediction[] };
    },
  });

  // Fetch tracked industries
  const { data: industriesData, isLoading: industriesLoading } = useQuery({
    queryKey: ['tracked-industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracked_industries')
        .select('*')
        .order('contacts_count', { ascending: false });
      if (error) throw error;
      return data as TrackedIndustry[];
    },
  });

  // Correlate all contacts with news
  const correlateAllMutation = useMutation({
    mutationFn: async (days: number = 7) => {
      setIsCorrelating(true);
      const { data, error } = await supabase.functions.invoke('contact-news-correlator', {
        body: { action: 'correlate_all', days },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Correlation Complete',
        description: `Found ${data.correlationsFound} correlations, generated ${data.alertsGenerated} alerts`,
      });
      queryClient.invalidateQueries({ queryKey: ['contact-news-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-behavior-predictions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Correlation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCorrelating(false);
    },
  });

  // Correlate specific contact
  const correlateContactMutation = useMutation({
    mutationFn: async ({ profileId, days = 7 }: { profileId: string; days?: number }) => {
      const { data, error } = await supabase.functions.invoke('contact-news-correlator', {
        body: { action: 'correlate_contact', profileId, days },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Contact Analysis Complete',
        description: 'News correlations analyzed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Predict contact behavior
  const predictBehaviorMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke('contact-news-correlator', {
        body: { action: 'predict_behavior', profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Predictions Generated',
        description: 'Behavioral predictions created based on news analysis',
      });
      queryClient.invalidateQueries({ queryKey: ['contact-behavior-predictions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Prediction Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update industry tracking
  const updateIndustriesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('contact-news-correlator', {
        body: { action: 'update_industries' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Industries Updated',
        description: 'Industry sentiment tracking refreshed',
      });
      queryClient.invalidateQueries({ queryKey: ['tracked-industries'] });
    },
  });

  // Mark alert as read
  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase.functions.invoke('contact-news-correlator', {
        body: { action: 'mark_alert_read', newsItemId: alertId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-news-alerts'] });
    },
  });

  return {
    // Data
    alerts: alertsData?.alerts || [],
    unreadAlertCount: alertsData?.unreadCount || 0,
    predictions: predictionsData?.predictions || [],
    trackedIndustries: industriesData || [],
    
    // Loading states
    isLoading: alertsLoading || predictionsLoading || industriesLoading,
    isCorrelating,
    
    // Actions
    correlateAll: correlateAllMutation.mutate,
    correlateContact: correlateContactMutation.mutate,
    predictBehavior: predictBehaviorMutation.mutate,
    updateIndustries: updateIndustriesMutation.mutate,
    markAlertRead: markAlertReadMutation.mutate,
    
    // Refetch
    refetchAlerts,
    refetchPredictions,
  };
}
