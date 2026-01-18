import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContextEngine } from './useContextEngine';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PriorityTier = 'critical' | 'important' | 'informational';
export type IntelligenceItemType = 'decay_alert' | 'anomaly' | 'proximity' | 'action_item' | 'recommendation' | 'voice_insight' | 'media_analysis';

export interface IntelligenceItem {
  id: string;
  type: IntelligenceItemType;
  priority: PriorityTier;
  title: string;
  description: string;
  timestamp: Date;
  profileId?: string;
  profileName?: string;
  actionable: boolean;
  actions?: Array<{ label: string; action: string; primary?: boolean }>;
  source?: 'media' | 'voice' | 'behavioral' | 'system';
}

export function useUnifiedIntelligence(profileId?: string) {
  const { user } = useAuth();
  const { recommendations } = useContextEngine();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Fetch voice insights for the profile
  const { data: voiceInsights } = useQuery({
    queryKey: ['voice-insights-unified', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('voice_insights')
        .select('id, source_type, full_transcription, topics_discussed, sentiment_timeline, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });

  // Fetch recent media analyses
  const { data: mediaAnalyses } = useQuery({
    queryKey: ['media-analyses-unified', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('id, analysis_type, result, generated_at')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });

  const items = useMemo((): IntelligenceItem[] => {
    const allItems: IntelligenceItem[] = [];
    
    // Add recommendations
    recommendations?.forEach((rec) => {
      allItems.push({
        id: `rec-${rec.id}`,
        type: 'recommendation',
        priority: rec.priority === 'high' ? 'important' : 'informational',
        title: rec.title,
        description: rec.description,
        timestamp: new Date(),
        profileId: rec.profileId,
        profileName: rec.profileName,
        actionable: true,
        actions: [{ label: 'Act', action: rec.type, primary: true }, { label: 'Dismiss', action: 'dismiss' }],
        source: 'system'
      });
    });

    // Add voice insights
    voiceInsights?.forEach((insight) => {
      const topics = insight.topics_discussed as string[] || [];
      const topicSummary = topics.length > 0 ? topics.slice(0, 3).join(', ') : 'Voice recording analyzed';
      allItems.push({
        id: `voice-${insight.id}`,
        type: 'voice_insight',
        priority: 'informational',
        title: `Voice: ${insight.source_type || 'Recording'}`,
        description: topicSummary,
        timestamp: new Date(insight.created_at),
        profileId,
        actionable: false,
        source: 'voice'
      });
    });

    // Add media analyses (high-confidence only)
    mediaAnalyses?.forEach((analysis) => {
      const result = analysis.result as Record<string, unknown> || {};
      if (result.key_findings || result.summary) {
        allItems.push({
          id: `media-${analysis.id}`,
          type: 'media_analysis',
          priority: 'informational',
          title: `Media: ${analysis.analysis_type?.replace(/_/g, ' ') || 'Analysis'}`,
          description: (result.summary as string) || (Array.isArray(result.key_findings) ? (result.key_findings as string[]).join(', ') : ''),
          timestamp: new Date(analysis.generated_at),
          profileId,
          actionable: false,
          source: 'media'
        });
      }
    });

    // Sort by timestamp descending and filter dismissed
    return allItems
      .filter(item => !dismissedIds.has(item.id))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [recommendations, voiceInsights, mediaAnalyses, dismissedIds, profileId]);

  const dismissItem = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  const executeAction = useCallback(async (itemId: string, action: string) => {
    if (action === 'dismiss') dismissItem(itemId);
  }, [dismissItem]);

  return {
    items,
    isLoading: false,
    criticalCount: items.filter(i => i.priority === 'critical').length,
    importantCount: items.filter(i => i.priority === 'important').length,
    voiceCount: items.filter(i => i.source === 'voice').length,
    mediaCount: items.filter(i => i.source === 'media').length,
    refresh: async () => {},
    dismissItem,
    executeAction
  };
}
