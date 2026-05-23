import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EmailInsight {
  threadId: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
  topics: string[];
  actionItems: string[];
  keyPoints: string[];
  relationshipImpact: string;
}

export interface EmailInsightWithContext extends EmailInsight {
  profileId: string;
  contactName: string;
}

export interface EmailDashboardData {
  insights: EmailInsightWithContext[];
  stats: {
    totalInsights: number;
    uniqueContacts: number;
    sentimentCounts: { positive: number; neutral: number; negative: number };
    urgencyCounts: { high: number; medium: number; low: number };
    topTopics: Array<[string, number]>;
    actionItems: string[];
    highUrgencyInsights: EmailInsightWithContext[];
  } | null;
}

interface AnalysisRow {
  id: string;
  profile_id: string | null;
  result: EmailInsight | EmailInsight[] | null;
  generated_at: string | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

export function useEmailIntelligenceDashboard() {
  const { user } = useAuth();
  return useQuery<EmailDashboardData>({
    queryKey: ['email-intelligence-dashboard', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select(`
          id,
          profile_id,
          result,
          generated_at,
          profiles (first_name, last_name)
        `)
        .eq('user_id', user!.id)
        .eq('analysis_type', 'email_insight')
        .order('generated_at', { ascending: false });
      if (error) throw error;

      const rows = ((data ?? []) as unknown) as AnalysisRow[];
      const allInsights: EmailInsightWithContext[] = [];
      const profileCounts = new Map<string, number>();

      for (const analysis of rows) {
        const result = analysis.result;
        const contactName = `${analysis.profiles?.first_name ?? ''} ${analysis.profiles?.last_name ?? ''}`.trim() || 'Unknown';
        const insights = Array.isArray(result) ? result : result ? [result] : [];

        for (const insight of insights) {
          allInsights.push({ ...insight, profileId: analysis.profile_id ?? '', contactName });
        }
        if (analysis.profile_id) {
          profileCounts.set(analysis.profile_id, (profileCounts.get(analysis.profile_id) || 0) + 1);
        }
      }

      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      const urgencyCounts = { high: 0, medium: 0, low: 0 };
      const topicCounts = new Map<string, number>();
      const actionItems: string[] = [];

      for (const insight of allInsights) {
        if (insight.sentiment) sentimentCounts[insight.sentiment]++;
        if (insight.urgency) urgencyCounts[insight.urgency]++;
        for (const topic of insight.topics || []) {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
        for (const item of insight.actionItems || []) {
          actionItems.push(item);
        }
      }

      const topTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        insights: allInsights,
        stats: {
          totalInsights: allInsights.length,
          uniqueContacts: profileCounts.size,
          sentimentCounts,
          urgencyCounts,
          topTopics,
          actionItems: actionItems.slice(0, 10),
          highUrgencyInsights: allInsights.filter((i) => i.urgency === 'high'),
        },
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
