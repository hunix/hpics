import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContextEngine } from './useContextEngine';

export type PriorityTier = 'critical' | 'important' | 'informational';
export type IntelligenceItemType = 'decay_alert' | 'anomaly' | 'proximity' | 'action_item' | 'recommendation';

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
}

export function useUnifiedIntelligence() {
  const { user } = useAuth();
  const { recommendations } = useContextEngine();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const items = useMemo((): IntelligenceItem[] => {
    const allItems: IntelligenceItem[] = [];
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
        actions: [{ label: 'Act', action: rec.type, primary: true }, { label: 'Dismiss', action: 'dismiss' }]
      });
    });
    return allItems.filter(item => !dismissedIds.has(item.id));
  }, [recommendations, dismissedIds]);

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
    refresh: async () => {},
    dismissItem,
    executeAction
  };
}
