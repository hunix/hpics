/**
 * Email Intelligence Dashboard (v3.9.33)
 * Aggregate stats and insights from all imported email intelligence
 */

import { useEmailIntelligenceDashboard } from '@/hooks/email/useEmailIntelligenceDashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const SENTIMENT_COLORS = {
  positive: 'hsl(var(--chart-2))',
  neutral: 'hsl(var(--chart-3))',
  negative: 'hsl(var(--destructive))',
};

const URGENCY_COLORS = {
  high: 'hsl(var(--destructive))',
  medium: 'hsl(var(--chart-4))',
  low: 'hsl(var(--chart-2))',
};

export function EmailIntelligenceDashboard() {
  const { data: analyses, isLoading } = useEmailIntelligenceDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  const stats = analyses?.stats;
  
  if (!stats || stats.totalInsights === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Email Intelligence Dashboard
          </CardTitle>
          <CardDescription>
            Aggregate insights from analyzed email threads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No email intelligence data yet</p>
            <p className="text-sm">Run analysis on your imported emails to see insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: stats.sentimentCounts.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: stats.sentimentCounts.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: stats.sentimentCounts.negative, color: SENTIMENT_COLORS.negative },
  ].filter(d => d.value > 0);

  const urgencyData = [
    { name: 'High', value: stats.urgencyCounts.high, color: URGENCY_COLORS.high },
    { name: 'Medium', value: stats.urgencyCounts.medium, color: URGENCY_COLORS.medium },
    { name: 'Low', value: stats.urgencyCounts.low, color: URGENCY_COLORS.low },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Email Intelligence Dashboard
        </CardTitle>
        <CardDescription>
          Aggregate insights from {stats.totalInsights} analyzed threads across {stats.uniqueContacts} contacts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            icon={MessageSquare}
            label="Threads Analyzed"
            value={stats.totalInsights}
            color="text-primary"
          />
          <MetricCard
            icon={Users}
            label="Contacts"
            value={stats.uniqueContacts}
            color="text-blue-500"
          />
          <MetricCard
            icon={AlertTriangle}
            label="High Urgency"
            value={stats.urgencyCounts.high}
            color="text-red-500"
          />
          <MetricCard
            icon={Target}
            label="Action Items"
            value={stats.actionItems.length}
            color="text-green-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Sentiment Distribution */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sentiment Distribution
            </h4>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {sentimentData.map((d) => (
                <div key={d.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency Distribution */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Urgency Distribution
            </h4>
            <div className="space-y-2 mt-4">
              {urgencyData.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{d.name}</span>
                    <span>{d.value} ({Math.round((d.value / stats.totalInsights) * 100)}%)</span>
                  </div>
                  <Progress 
                    value={(d.value / stats.totalInsights) * 100} 
                    className="h-2"
                    style={{ '--progress-color': d.color } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Topics */}
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="text-sm font-medium mb-3">Top Discussion Topics</h4>
          <div className="flex flex-wrap gap-2">
            {stats.topTopics.map(([topic, count]) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic} ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Items */}
        {stats.actionItems.length > 0 && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Pending Action Items
            </h4>
            <ScrollArea className="h-[150px]">
              <ul className="space-y-2">
                {stats.actionItems.map((item, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        {/* High Urgency Alerts */}
        {stats.highUrgencyInsights.length > 0 && (
          <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              High Urgency Threads ({stats.highUrgencyInsights.length})
            </h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {stats.highUrgencyInsights.slice(0, 5).map((insight, idx) => (
                  <div key={idx} className="p-2 rounded bg-background border text-sm">
                    <div className="font-medium text-xs text-muted-foreground mb-1">
                      {insight.contactName}
                    </div>
                    <p className="line-clamp-2">{insight.summary}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  icon: typeof Mail;
  label: string;
  value: number;
  color: string;
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card text-center">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
      <div className="text-xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
