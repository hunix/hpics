/**
 * Warfare Domain Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { WarfareService } from '../services/WarfareService';
import type { CampaignStatus, CampaignType } from '../entities/Campaign';
import type { ThreatStatus } from '../entities/Threat';

// Singleton service instance
let warfareService: WarfareService | null = null;

function getWarfareService(): WarfareService {
  if (!warfareService) {
    warfareService = new WarfareService();
  }
  return warfareService;
}

// Hook for campaigns
export function useCampaigns(status?: CampaignStatus) {
  const { user } = useAuth();
  const service = getWarfareService();

  return useQuery({
    queryKey: ['campaigns', user?.id, status],
    queryFn: () => service.getCampaigns(user!.id, status),
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

export function useCampaign(campaignId: string) {
  const { user } = useAuth();
  const service = getWarfareService();

  return useQuery({
    queryKey: ['campaign', user?.id, campaignId],
    queryFn: () => service.getCampaign(user!.id, campaignId),
    enabled: !!user?.id && !!campaignId,
  });
}

export function useCreateCampaign() {
  const { user } = useAuth();
  const service = getWarfareService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description: string; type: CampaignType; targetProfileIds?: string[] }) =>
      service.createCampaign({ userId: user!.id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useActivateCampaign() {
  const { user } = useAuth();
  const service = getWarfareService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => service.activateCampaign(user!.id, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

// Hook for threats
export function useThreats(status?: ThreatStatus) {
  const { user } = useAuth();
  const service = getWarfareService();

  return useQuery({
    queryKey: ['threats', user?.id, status],
    queryFn: () => service.getThreats(user!.id, status),
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

export function useThreatAssessment() {
  const { user } = useAuth();
  const service = getWarfareService();

  return useMutation({
    mutationFn: (profileId?: string) =>
      service.assessThreats({ userId: user!.id, profileId }),
  });
}

export function useReportThreat() {
  const { user } = useAuth();
  const service = getWarfareService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description: string; level: 'critical' | 'high' | 'medium' | 'low' | 'minimal' }) =>
      service.reportThreat(user!.id, data.name, data.description, data.level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threats'] });
    },
  });
}

// Hook for strategies
export function useStrategies() {
  const { user } = useAuth();
  const service = getWarfareService();

  return useQuery({
    queryKey: ['strategies', user?.id],
    queryFn: () => service.getStrategies(user!.id),
    enabled: !!user?.id,
    staleTime: 120000,
  });
}

// Hook for warfare summary
export function useWarfareSummary() {
  const { user } = useAuth();
  const service = getWarfareService();

  return useQuery({
    queryKey: ['warfare-summary', user?.id],
    queryFn: () => service.getWarfareSummary(user!.id),
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Aggregated hook
export function useWarfare() {
  const campaigns = useCampaigns();
  const threats = useThreats();
  const strategies = useStrategies();
  const summary = useWarfareSummary();
  const createCampaign = useCreateCampaign();
  const activateCampaign = useActivateCampaign();
  const reportThreat = useReportThreat();

  return {
    campaigns: campaigns.data,
    threats: threats.data,
    strategies: strategies.data,
    summary: summary.data,
    isLoading: campaigns.isLoading || threats.isLoading || summary.isLoading,
    createCampaign: createCampaign.mutateAsync,
    activateCampaign: activateCampaign.mutateAsync,
    reportThreat: reportThreat.mutateAsync,
    refetch: () => {
      campaigns.refetch();
      threats.refetch();
      strategies.refetch();
      summary.refetch();
    },
  };
}
