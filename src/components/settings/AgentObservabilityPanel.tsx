/**
 * Agent Observability Panel
 * 
 * OpenTelemetry-compatible tracing visualization for AI agents.
 * Displays trace sessions, spans, performance metrics, and cost tracking.
 */

import { useState } from 'react';
import { useTraceSessions, useSessionSpans, useTraceStats } from '@/hooks/intelligence/useAgentTracing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, Clock, DollarSign, AlertTriangle, CheckCircle2,
  XCircle, ChevronRight, Zap, BarChart3, RefreshCw, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface TraceSession {
  id: string;
  trace_id: string;
  session_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_spans: number;
  error_count: number;
  total_cost_cents: number;
  metadata: Record<string, unknown>;
}

interface TraceSpan {
  id: string;
  span_id: string;
  span_name: string;
  span_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  cost_cents: number | null;
  error_message: string | null;
  agent_type: string | null;
  parent_span_id: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { icon: React.ReactNode; className: string }> = {
    completed: { icon: <CheckCircle2 className="h-3 w-3" />, className: 'text-emerald-600 border-emerald-600/30' },
    running: { icon: <Activity className="h-3 w-3 animate-pulse" />, className: 'text-blue-600 border-blue-600/30' },
    failed: { icon: <XCircle className="h-3 w-3" />, className: 'text-rose-600 border-rose-600/30' },
    pending: { icon: <Clock className="h-3 w-3" />, className: 'text-amber-600 border-amber-600/30' },
  };
  
  const config = variants[status] || variants.pending;
  
  return (
    <Badge variant="outline" className={cn('gap-1', config.className)}>
      {config.icon}
      {status}
    </Badge>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className={cn(
            "text-xs mt-2",
            trend.value > 0 ? "text-emerald-600" : trend.value < 0 ? "text-rose-600" : "text-muted-foreground"
          )}>
            {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SpanTreeItem({ span, allSpans, depth = 0 }: { span: TraceSpan; allSpans: TraceSpan[]; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const children = allSpans.filter(s => s.parent_span_id === span.span_id);
  const hasChildren = children.length > 0;
  
  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer",
          span.status === 'failed' && "bg-rose-500/5"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
        ) : (
          <div className="w-4" />
        )}
        
        <StatusBadge status={span.status || 'pending'} />
        
        <span className="font-mono text-sm flex-1 truncate">{span.span_name}</span>
        
        {span.agent_type && (
          <Badge variant="secondary" className="text-xs">{span.agent_type}</Badge>
        )}
        
        {span.duration_ms !== null && (
          <span className="text-xs text-muted-foreground font-mono">
            {span.duration_ms.toFixed(0)}ms
          </span>
        )}
        
        {span.cost_cents !== null && span.cost_cents > 0 && (
          <span className="text-xs text-muted-foreground font-mono">
            ${(span.cost_cents / 100).toFixed(3)}
          </span>
        )}
        
        {span.error_message && (
          <AlertTriangle className="h-4 w-4 text-rose-500" />
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="space-y-1">
          {children.map(child => (
            <SpanTreeItem key={child.id} span={child} allSpans={allSpans} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TraceSessionCard({ session, onViewDetails }: { session: TraceSession; onViewDetails: (id: string) => void }) {
  const successRate = session.total_spans > 0 
    ? ((session.total_spans - session.error_count) / session.total_spans) * 100 
    : 100;
    
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{session.session_type}</span>
              <StatusBadge status={session.status || 'pending'} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {session.trace_id.slice(0, 16)}...
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(session.id)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold">{session.total_spans || 0}</p>
            <p className="text-xs text-muted-foreground">Spans</p>
          </div>
          <div>
            <p className={cn(
              "text-lg font-bold",
              session.error_count > 0 ? "text-rose-500" : "text-emerald-500"
            )}>
              {session.error_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
          <div>
            <p className="text-lg font-bold">${((session.total_cost_cents || 0) / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Cost</p>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Success Rate</span>
            <span className={successRate >= 90 ? "text-emerald-500" : successRate >= 70 ? "text-amber-500" : "text-rose-500"}>
              {successRate.toFixed(0)}%
            </span>
          </div>
          <Progress value={successRate} className="h-1" />
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">
          {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

export function AgentObservabilityPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'spans'>('overview');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const { data: sessions, isLoading: loadingSessions, refetch: refetchSessions } = useTraceSessions();
  const { data: spans, isLoading: loadingSpans } = useSessionSpans(selectedSessionId || undefined);
  const { data: metrics, isLoading: loadingMetrics } = useTraceStats();
  
  const rootSpans = spans?.filter(s => !s.parent_span_id) || [];
  
  if (loadingMetrics && loadingSessions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Agent Observability</CardTitle>
              <CardDescription>OpenTelemetry-compatible tracing for AI agents</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Zap className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="spans" className="gap-2">
              <Activity className="h-4 w-4" />
              Span Tree
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Traces"
                value={metrics?.totalTraces || 0}
                subtitle="Last 7 days"
                icon={Zap}
              />
              <MetricCard
                title="Avg Duration"
                value={`${(metrics?.avgDurationMs || 0).toFixed(0)}ms`}
                subtitle="Per session"
                icon={Clock}
              />
              <MetricCard
                title="Error Rate"
                value={`${((metrics?.errorRate || 0) * 100).toFixed(1)}%`}
                subtitle="Of total traces"
                icon={CheckCircle2}
              />
              <MetricCard
                title="Total Cost"
                value={`$${((metrics?.totalCostCents || 0) / 100).toFixed(2)}`}
                subtitle="This period"
                icon={DollarSign}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions && sessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.slice(0, 6).map(session => (
                      <TraceSessionCard 
                        key={session.id} 
                        session={session as unknown as TraceSession}
                        onViewDetails={(id) => {
                          setSelectedSessionId(id);
                          setActiveTab('spans');
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No trace sessions recorded yet</p>
                    <p className="text-sm">Run intelligence operations to generate traces</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sessions">
            <ScrollArea className="h-[500px]">
              {sessions && sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                  {sessions.map(session => (
                    <TraceSessionCard 
                      key={session.id} 
                      session={session as unknown as TraceSession}
                      onViewDetails={(id) => {
                        setSelectedSessionId(id);
                        setActiveTab('spans');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No sessions found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="spans">
            {selectedSessionId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedSessionId(null)}
                  >
                    ← Back to sessions
                  </Button>
                  <span className="text-sm text-muted-foreground font-mono">
                    Session: {selectedSessionId.slice(0, 8)}...
                  </span>
                </div>
                
                <ScrollArea className="h-[450px] border rounded-lg p-2">
                  {loadingSpans ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : rootSpans.length > 0 ? (
                    <div className="space-y-1">
                      {rootSpans.map(span => (
                        <SpanTreeItem 
                          key={span.id} 
                          span={span as unknown as TraceSpan} 
                          allSpans={spans as unknown as TraceSpan[]} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No spans found for this session</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a session to view its span tree</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
