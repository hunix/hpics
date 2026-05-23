/**
 * useChoiceArchitecture Hook
 * AGIS Phase 2 - Choice Architecture & Nudge Optimization
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface NudgeTechnique {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  implementation: string;
}

export interface ChoiceArchitectureResult {
  id: string;
  profileId: string;
  targetBehavior: string;
  context: string;
  selectedNudges: string[];
  recommendations: {
    techniques: NudgeTechnique[];
    optimalSequence: string[];
    expectedConversionLift: number;
    implementationPlan: string;
  };
  status: 'draft' | 'active' | 'completed' | 'paused';
  conversionRate?: number;
  createdAt: string;
}

export interface NudgeCampaign {
  id: string;
  profileId: string;
  name: string;
  targetBehavior: string;
  nudgeSequence: NudgeTechnique[];
  status: 'draft' | 'active' | 'completed' | 'paused';
  startDate?: string;
  endDate?: string;
  metrics: {
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
}

export function useChoiceArchitecture() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Map<string, ChoiceArchitectureResult[]>>(new Map());
  const [campaigns, setCampaigns] = useState<NudgeCampaign[]>([]);

  const optimizeChoiceArchitecture = async (
    profileId: string,
    targetBehavior: string,
    context: string,
    selectedNudges: string[]
  ): Promise<ChoiceArchitectureResult | null> => {
    setIsProcessing(true);
    try {
      const { data, error } = await invokeFunction('choice-architecture-optimizer', { profileId, targetBehavior, context, selectedNudges });

      if (error) throw error;

      const result: ChoiceArchitectureResult = {
        id: crypto.randomUUID(),
        profileId,
        targetBehavior,
        context,
        selectedNudges,
        recommendations: {
          techniques: data.techniques || [],
          optimalSequence: data.optimalSequence || [],
          expectedConversionLift: data.expectedConversionLift || 0,
          implementationPlan: data.implementationPlan || ''
        },
        status: 'draft',
        createdAt: new Date().toISOString()
      };

      // Save to database using actual column names
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const insertData = {
          user_id: user.id,
          campaign_name: `${targetBehavior} Campaign`,
          nudge_type: selectedNudges[0] || 'default_option',
          target_behavior: targetBehavior,
          nudge_config: { techniques: result.recommendations.techniques, context },
          success_metrics: { impressions: 0, conversions: 0, conversionRate: 0 },
          is_active: false,
          conversion_rate: 0
        };
        await (supabase.from('nudge_campaigns').insert as any)(insertData);
      }

      // Update local state
      const existing = results.get(profileId) || [];
      setResults(new Map(results.set(profileId, [...existing, result])));

      toast.success('Choice architecture optimized');
      return result;
    } catch (err) {
      console.error('Choice architecture optimization error:', err);
      toast.error('Failed to optimize choice architecture');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const loadCampaigns = async (profileId?: string): Promise<NudgeCampaign[]> => {
    try {
      const query = supabase.from('nudge_campaigns').select('*').order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;

      const mapped: NudgeCampaign[] = (data || []).map((row: any) => ({
        id: row.id,
        profileId: row.profile_id || '',
        name: row.campaign_name,
        targetBehavior: row.target_behavior || '',
        nudgeSequence: row.nudge_config?.techniques || [],
        status: row.is_active ? 'active' : 'draft',
        startDate: row.created_at,
        endDate: row.updated_at,
        metrics: row.success_metrics || { impressions: 0, conversions: 0, conversionRate: 0 }
      }));

      setCampaigns(mapped);
      return mapped;
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      return [];
    }
  };

  const updateCampaignStatus = async (
    campaignId: string,
    status: NudgeCampaign['status']
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('nudge_campaigns')
        .update({ 
          is_active: status === 'active'
        })
        .eq('id', campaignId);

      if (error) throw error;
      
      await loadCampaigns();
      toast.success(`Campaign ${status}`);
      return true;
    } catch (err) {
      console.error('Failed to update campaign:', err);
      toast.error('Failed to update campaign status');
      return false;
    }
  };

  return {
    isProcessing,
    results,
    campaigns,
    optimizeChoiceArchitecture,
    loadCampaigns,
    updateCampaignStatus,
    getResults: (profileId: string) => results.get(profileId) || []
  };
}
