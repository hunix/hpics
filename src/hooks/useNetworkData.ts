/**
 * @fileoverview Network Data Hook
 * 
 * Custom hook for fetching and processing network visualization data.
 * Handles profile fetching, decay calculation, and network metric computation.
 * 
 * @deprecated Use useNetworkGraph from @/domains/network/hooks/useNetworkService instead.
 * This hook is maintained for backward compatibility during migration.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';
import { calculateNetworkMetrics, type NetworkMetrics } from '@/lib/network';
import type { VisualizationNode, VisualizationLink, NetworkVisualizationData } from '@/lib/network/types/visualization';

/**
 * Hook for fetching network visualization data
 * 
 * Fetches profiles, communications, messages, and events to build
 * a complete network visualization with:
 * - Node importance scores
 * - Relationship decay levels
 * - Network centrality metrics (PageRank, closeness, betweenness)
 * - Community clusters
 * 
 * @returns Query result with nodes, links, and network metrics
 * 
 * @example
 * const { data, isLoading } = useNetworkData();
 * // data.nodes - Visualization nodes with metrics
 * // data.links - Connections between nodes
 * // data.metrics - Aggregate network analytics
 */
export function useNetworkData() {
  const { user } = useAuth();

  return useQuery<NetworkVisualizationData>({
    queryKey: ['network-data', user?.id],
    queryFn: async () => {
      // Fetch profiles with last contact date
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, is_favorite, last_contact_date')
        .eq('user_id', user!.id);

      if (!profiles || profiles.length === 0) return { nodes: [], links: [] };

      // Fetch communications with dates
      const { data: commData } = await supabase
        .from('communications')
        .select('profile_id, occurred_at')
        .eq('user_id', user!.id)
        .order('occurred_at', { ascending: false });

      // Fetch message counts per profile
      const { data: msgCounts } = await supabase
        .from('messages')
        .select('conversation_id, sent_at, conversations!inner(profile_id)')
        .eq('user_id', user!.id);

      // Fetch event counts per profile
      const { data: eventCounts } = await supabase
        .from('events')
        .select('profile_id')
        .eq('user_id', user!.id);

      // Count occurrences and find last contact
      const commByProfile = new Map<string, { count: number; lastDate: Date | null }>();
      commData?.forEach((c) => {
        const existing = commByProfile.get(c.profile_id);
        const date = new Date(c.occurred_at);
        if (existing) {
          existing.count++;
          if (!existing.lastDate || date > existing.lastDate) {
            existing.lastDate = date;
          }
        } else {
          commByProfile.set(c.profile_id, { count: 1, lastDate: date });
        }
      });

      const msgByProfile = new Map<string, { count: number; lastDate: Date | null }>();
      msgCounts?.forEach((m) => {
        const profileId = (m.conversations as any)?.profile_id;
        if (profileId) {
          const existing = msgByProfile.get(profileId);
          const date = new Date(m.sent_at);
          if (existing) {
            existing.count++;
            if (!existing.lastDate || date > existing.lastDate) {
              existing.lastDate = date;
            }
          } else {
            msgByProfile.set(profileId, { count: 1, lastDate: date });
          }
        }
      });

      const eventByProfile = new Map<string, number>();
      eventCounts?.forEach((e) => {
        if (e.profile_id) {
          eventByProfile.set(e.profile_id, (eventByProfile.get(e.profile_id) || 0) + 1);
        }
      });

      // Build nodes with decay calculation
      const now = new Date();
      const nodes: VisualizationNode[] = profiles.map((p) => {
        const commInfo = commByProfile.get(p.id) || { count: 0, lastDate: null };
        const msgInfo = msgByProfile.get(p.id) || { count: 0, lastDate: null };
        const eventCount = eventByProfile.get(p.id) || 0;
        
        // Calculate last contact date
        const dates = [commInfo.lastDate, msgInfo.lastDate, p.last_contact_date ? new Date(p.last_contact_date) : null]
          .filter(Boolean) as Date[];
        const lastContactDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

        // Calculate decay level (0-100, higher = more decay)
        let decayLevel = 0;
        if (lastContactDate) {
          const daysSinceContact = differenceInDays(now, lastContactDate);
          decayLevel = Math.min(100, Math.round((daysSinceContact / 90) * 100));
        } else {
          decayLevel = 100;
        }

        // Calculate importance score (0-100)
        const importance = Math.min(100, Math.round(
          (commInfo.count * 5) + (msgInfo.count * 0.5) + (eventCount * 10) + (p.is_favorite ? 20 : 0)
        ));

        return {
          id: p.id,
          name: `${p.first_name} ${p.last_name || ''}`.trim(),
          type: p.relationship_type || 'other',
          isFavorite: p.is_favorite || false,
          communicationCount: commInfo.count,
          messageCount: msgInfo.count,
          eventCount: eventCount,
          importance,
          lastContactDate,
          decayLevel,
        };
      });

      // Build links
      const links: VisualizationLink[] = [];
      const typeGroups = new Map<string, VisualizationNode[]>();
      
      nodes.forEach((node) => {
        const group = typeGroups.get(node.type) || [];
        group.push(node);
        typeGroups.set(node.type, group);
      });

      // Create connections within same relationship types
      typeGroups.forEach((group, type) => {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const weight = (group[i].importance + group[j].importance) / 200;
            if (weight > 0.1) {
              links.push({
                source: group[i].id,
                target: group[j].id,
                weight,
                type,
              });
            }
          }
        }
      });

      // Connect favorites
      const favorites = nodes.filter((n) => n.isFavorite);
      for (let i = 0; i < favorites.length; i++) {
        for (let j = i + 1; j < favorites.length; j++) {
          links.push({
            source: favorites[i].id,
            target: favorites[j].id,
            weight: 0.8,
            type: 'favorite',
          });
        }
      }

      // Calculate network metrics
      const metrics = calculateNetworkMetrics(
        nodes.map(n => ({ id: n.id })),
        links.map(l => ({ 
          source: typeof l.source === 'string' ? l.source : l.source.id,
          target: typeof l.target === 'string' ? l.target : l.target.id,
          weight: l.weight 
        }))
      );

      // Enhance nodes with metrics
      nodes.forEach(node => {
        node.pageRank = metrics.pageRank.get(node.id) || 0;
        node.closeness = metrics.closenessCentrality.get(node.id) || 0;
        node.betweenness = metrics.betweennessCentrality.get(node.id) || 0;
        node.clusterId = metrics.clusters.get(node.id) || 0;
      });

      return { nodes, links, metrics };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache for navigation
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in memory
  });
}
