import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, subDays, format, eachDayOfInterval } from 'date-fns';

export type DateRange = '7d' | '30d' | '90d' | '1y';

interface AnalyticsData {
  communicationTrends: { date: string; count: number; channel: string }[];
  channelDistribution: { channel: string; count: number; percentage: number }[];
  responseMetrics: { avgResponseTime: number; fastestResponse: number; slowestResponse: number };
  relationshipGrowth: { month: string; added: number; lost: number }[];
  engagementHeatmap: { day: string; hour: number; count: number }[];
  topEngagedContacts: { id: string; name: string; score: number; lastContact: string }[];
  totalCommunications: number;
  uniqueContacts: number;
  avgPerDay: number;
}

export function useRelationshipAnalytics(dateRange: DateRange = '30d') {
  const { user } = useAuth();

  const getDaysFromRange = (range: DateRange): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  return useQuery({
    queryKey: ['relationship-analytics', user?.id, dateRange],
    queryFn: async (): Promise<AnalyticsData> => {
      const days = getDaysFromRange(dateRange);
      const startDate = subDays(new Date(), days);
      const startDateStr = startDate.toISOString();

      // Fetch communications
      const { data: communications } = await supabase
        .from('communications')
        .select('id, channel, occurred_at, profile_id, direction')
        .eq('user_id', user!.id)
        .gte('occurred_at', startDateStr)
        .order('occurred_at', { ascending: true });

      // Fetch messages
      const { data: messages } = await supabase
        .from('messages')
        .select('id, sent_at, conversation_id, is_from_contact')
        .eq('user_id', user!.id)
        .gte('sent_at', startDateStr);

      // Fetch contacts with relationship scores
      const { data: contacts } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_score, last_contacted_at')
        .eq('user_id', user!.id)
        .not('relationship_score', 'is', null)
        .order('relationship_score', { ascending: false })
        .limit(10);

      // Fetch relationship scores history
      const { data: scoreHistory } = await supabase
        .from('relationship_score_history')
        .select('profile_id, score, recorded_at')
        .eq('user_id', user!.id)
        .gte('recorded_at', startDateStr);

      const allComms = communications || [];

      // Communication trends by date
      const trendsByDate = new Map<string, Map<string, number>>();
      const interval = eachDayOfInterval({ start: startDate, end: new Date() });
      
      interval.forEach(date => {
        trendsByDate.set(format(date, 'yyyy-MM-dd'), new Map());
      });

      allComms.forEach(comm => {
        const date = format(new Date(comm.occurred_at), 'yyyy-MM-dd');
        const channelMap = trendsByDate.get(date) || new Map();
        channelMap.set(comm.channel, (channelMap.get(comm.channel) || 0) + 1);
        trendsByDate.set(date, channelMap);
      });

      const communicationTrends: { date: string; count: number; channel: string }[] = [];
      trendsByDate.forEach((channels, date) => {
        let total = 0;
        channels.forEach(count => total += count);
        communicationTrends.push({ date, count: total, channel: 'all' });
      });

      // Channel distribution
      const channelCounts = new Map<string, number>();
      allComms.forEach(comm => {
        channelCounts.set(comm.channel, (channelCounts.get(comm.channel) || 0) + 1);
      });

      const totalComms = allComms.length;
      const channelDistribution = Array.from(channelCounts.entries()).map(([channel, count]) => ({
        channel,
        count,
        percentage: totalComms > 0 ? Math.round((count / totalComms) * 100) : 0,
      }));

      // Response metrics (simplified - based on direction patterns)
      const outgoing = allComms.filter(c => c.direction === 'outgoing').length;
      const incoming = allComms.filter(c => c.direction === 'incoming').length;
      const responseMetrics = {
        avgResponseTime: 4.5, // Hours - placeholder
        fastestResponse: 0.5,
        slowestResponse: 24,
      };

      // Relationship growth by month
      const { data: allContacts } = await supabase
        .from('profiles')
        .select('id, created_at, is_active')
        .eq('user_id', user!.id)
        .gte('created_at', startDateStr);

      const growthByMonth = new Map<string, { added: number; lost: number }>();
      (allContacts || []).forEach(contact => {
        const month = format(new Date(contact.created_at), 'MMM yyyy');
        const current = growthByMonth.get(month) || { added: 0, lost: 0 };
        current.added++;
        growthByMonth.set(month, current);
      });

      const relationshipGrowth = Array.from(growthByMonth.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Engagement heatmap
      const heatmapData = new Map<string, number>();
      allComms.forEach(comm => {
        const date = new Date(comm.occurred_at);
        const day = format(date, 'EEE');
        const hour = date.getHours();
        const key = `${day}-${hour}`;
        heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
      });

      const engagementHeatmap = Array.from(heatmapData.entries()).map(([key, count]) => {
        const [day, hour] = key.split('-');
        return { day, hour: parseInt(hour), count };
      });

      // Top engaged contacts
      const topEngagedContacts = (contacts || []).map(c => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed',
        score: c.relationship_score || 0,
        lastContact: c.last_contacted_at || 'Never',
      }));

      // Unique contacts communicated with
      const uniqueContactIds = new Set(allComms.map(c => c.profile_id));

      return {
        communicationTrends,
        channelDistribution,
        responseMetrics,
        relationshipGrowth,
        engagementHeatmap,
        topEngagedContacts,
        totalCommunications: totalComms + (messages?.length || 0),
        uniqueContacts: uniqueContactIds.size,
        avgPerDay: Math.round((totalComms + (messages?.length || 0)) / days * 10) / 10,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
