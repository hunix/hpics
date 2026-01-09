import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, DollarSign, Brain, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ContactSpend {
  profile_id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  total_cost_cents: number;
  total_calls: number;
  total_tokens: number;
  analyses: string[];
}

export function PerContactSpendAnalysis() {
  const { user } = useAuth();

  const { data: contactSpends, isLoading } = useQuery({
    queryKey: ['per-contact-ai-spend', user?.id],
    queryFn: async (): Promise<ContactSpend[]> => {
      // Get AI usage logs with profile info
      const { data: logs, error } = await supabase
        .from('ai_usage_logs')
        .select(`
          profile_id,
          actual_cost_cents,
          total_tokens,
          function_name,
          profiles!ai_usage_logs_profile_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .not('profile_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Aggregate by profile
      const spendMap = new Map<string, ContactSpend>();
      
      for (const log of logs || []) {
        if (!log.profile_id) continue;
        
        const existing = spendMap.get(log.profile_id);
        const profile = log.profiles as any;
        
        if (existing) {
          existing.total_cost_cents += log.actual_cost_cents || 0;
          existing.total_calls += 1;
          existing.total_tokens += log.total_tokens || 0;
          if (log.function_name && !existing.analyses.includes(log.function_name)) {
            existing.analyses.push(log.function_name);
          }
        } else {
          spendMap.set(log.profile_id, {
            profile_id: log.profile_id,
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name,
            avatar_url: profile?.avatar_url,
            total_cost_cents: log.actual_cost_cents || 0,
            total_calls: 1,
            total_tokens: log.total_tokens || 0,
            analyses: log.function_name ? [log.function_name] : [],
          });
        }
      }

      // Sort by cost and return top 20
      return Array.from(spendMap.values())
        .sort((a, b) => b.total_cost_cents - a.total_cost_cents)
        .slice(0, 20);
    },
    enabled: !!user,
  });

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const getInitials = (first: string, last?: string | null) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  const chartData = (contactSpends || []).slice(0, 10).map(c => ({
    name: `${c.first_name} ${c.last_name?.[0] || ''}`.trim(),
    cost: c.total_cost_cents,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            AI Spend by Contact
          </CardTitle>
          <CardDescription>Top 10 contacts by AI cost</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => formatCost(v)}
                  className="text-xs"
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => [formatCost(value), 'Cost']}
                />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>All contacts with AI spend</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {(contactSpends || []).map((contact, index) => (
                <div 
                  key={contact.profile_id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-sm text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(contact.first_name, contact.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{contact.total_calls} calls</span>
                      <span>•</span>
                      <span>{contact.total_tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCost(contact.total_cost_cents)}</p>
                    <div className="flex gap-1 flex-wrap justify-end mt-1">
                      {contact.analyses.slice(0, 3).map((analysis) => (
                        <Badge key={analysis} variant="secondary" className="text-xs">
                          {analysis.replace(/-/g, ' ').replace(/^analyze /, '')}
                        </Badge>
                      ))}
                      {contact.analyses.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{contact.analyses.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!contactSpends || contactSpends.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No per-contact AI usage yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
