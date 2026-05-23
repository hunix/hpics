import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface ContactCost {
  profileId: string;
  name: string;
  avatarUrl?: string;
  totalCost: number;
  callCount: number;
  avgCost: number;
  lastAnalysis: string;
  analysisTypes: string[];
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.3)',
];

export function ContactCostAnalysis() {
  const { user } = useAuth();

  const { data: contactCosts, isLoading } = useQuery({
    queryKey: ['contact-cost-analysis', user?.id],
    queryFn: async () => {
      // Get AI usage by profile
      const { data: usageLogs, error: usageError } = await supabase
        .from('ai_usage_logs')
        .select('profile_id, function_name, actual_cost_cents, created_at')
        .not('profile_id', 'is', null)
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;

      // Get profile details
      const profileIds = [...new Set(usageLogs?.map(l => l.profile_id).filter((v): v is string => v !== null))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', profileIds);

      if (profileError) throw profileError;

      // Aggregate costs by profile
      const costMap: Record<string, {
        totalCost: number;
        callCount: number;
        lastAnalysis: string;
        analysisTypes: Set<string>;
      }> = {};

      usageLogs?.forEach(log => {
        if (!log.profile_id) return;
        if (!costMap[log.profile_id]) {
          costMap[log.profile_id] = {
            totalCost: 0,
            callCount: 0,
            lastAnalysis: log.created_at,
            analysisTypes: new Set(),
          };
        }
        costMap[log.profile_id].totalCost += log.actual_cost_cents || 0;
        costMap[log.profile_id].callCount++;
        costMap[log.profile_id].analysisTypes.add(log.function_name);
        if (log.created_at > costMap[log.profile_id].lastAnalysis) {
          costMap[log.profile_id].lastAnalysis = log.created_at;
        }
      });

      // Build contact cost list
      const contactCosts: ContactCost[] = profiles?.map(profile => {
        const costs = costMap[profile.id] || { totalCost: 0, callCount: 0, lastAnalysis: '', analysisTypes: new Set() };
        return {
          profileId: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          avatarUrl: profile.avatar_url || undefined,
          totalCost: costs.totalCost / 100,
          callCount: costs.callCount,
          avgCost: costs.callCount > 0 ? costs.totalCost / costs.callCount / 100 : 0,
          lastAnalysis: costs.lastAnalysis,
          analysisTypes: Array.from(costs.analysisTypes),
        };
      }).sort((a, b) => b.totalCost - a.totalCost) || [];

      return contactCosts;
    },
    enabled: !!user,
  });

  const topContacts = contactCosts?.slice(0, 5) || [];
  const totalSpend = contactCosts?.reduce((sum, c) => sum + c.totalCost, 0) || 0;

  const chartData = topContacts.map(c => ({
    name: c.name.split(' ')[0],
    cost: c.totalCost,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-[150px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          AI Cost by Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div>
            <div className="text-sm text-muted-foreground">Total Contact AI Spend</div>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Contacts Analyzed</div>
            <div className="text-2xl font-bold">{contactCosts?.length || 0}</div>
          </div>
        </div>

        {/* Top 5 Chart */}
        {chartData.length > 0 && (
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={10} />
                <YAxis type="category" dataKey="name" width={60} fontSize={10} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']} />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Contact List */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {contactCosts?.slice(0, 10).map((contact, idx) => (
              <div 
                key={contact.profileId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contact.avatarUrl} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {contact.callCount} analyses • avg ${contact.avgCost.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${contact.totalCost.toFixed(2)}</div>
                  {contact.totalCost > 1 && (
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      High
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {(!contactCosts || contactCosts.length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No contact-specific AI usage yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
