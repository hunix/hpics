import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  Brain,
  DollarSign,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { formatCentsToUSD, getProviderColor, AI_MODEL_PRICING } from '@/lib/aiPricing';

interface AIUsageLog {
  id: string;
  created_at: string;
  function_name: string;
  model_name: string;
  provider: string;
  prompt_summary: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_cents: number;
  actual_cost_cents: number | null;
  status: string;
  error_message: string | null;
  response_time_ms: number | null;
  request_metadata: Record<string, unknown>;
  response_metadata: Record<string, unknown>;
}

export function AIUsageLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AIUsageLog | null>(null);

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as AIUsageLog[]) || []);
    } catch (error) {
      console.error('Failed to fetch AI usage logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user, filter]);

  const totalSpent = logs.reduce((sum, log) => sum + (log.actual_cost_cents || log.estimated_cost_cents), 0);
  const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
  const completedCount = logs.filter((l) => l.status === 'completed').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCentsToUSD(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Across {logs.length} requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Input + Output</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0 ? Math.round((completedCount / logs.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount} completed, {failedCount} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0
                ? Math.round(
                    logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) /
                      logs.filter((l) => l.response_time_ms).length || 1
                  )
                : 0}
              ms
            </div>
            <p className="text-xs text-muted-foreground">Average processing time</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Usage Logs
              </CardTitle>
              <CardDescription>Track all AI API calls and their costs</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No AI usage logs yet</p>
              <p className="text-sm">Run an AI analysis to see usage tracked here</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Function</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const pricing = AI_MODEL_PRICING[log.model_name];
                    const providerColor = getProviderColor(log.provider);

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.function_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${providerColor}`} />
                            <span className="text-sm">
                              {pricing?.displayName || log.model_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {log.total_tokens?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-600">
                          {formatCentsToUSD(log.actual_cost_cents || log.estimated_cost_cents)}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Request Details</DialogTitle>
                                <DialogDescription>
                                  Full details for this AI request
                                </DialogDescription>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Function</label>
                                      <p className="text-sm text-muted-foreground font-mono">
                                        {selectedLog.function_name}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Model</label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedLog.model_name}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Input Tokens</label>
                                      <p className="text-sm text-muted-foreground font-mono">
                                        {selectedLog.input_tokens?.toLocaleString() || '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Output Tokens</label>
                                      <p className="text-sm text-muted-foreground font-mono">
                                        {selectedLog.output_tokens?.toLocaleString() || '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Estimated Cost</label>
                                      <p className="text-sm text-muted-foreground font-mono">
                                        {formatCentsToUSD(selectedLog.estimated_cost_cents)}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Actual Cost</label>
                                      <p className="text-sm text-green-600 font-mono">
                                        {selectedLog.actual_cost_cents
                                          ? formatCentsToUSD(selectedLog.actual_cost_cents)
                                          : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Response Time</label>
                                      <p className="text-sm text-muted-foreground font-mono">
                                        {selectedLog.response_time_ms
                                          ? `${selectedLog.response_time_ms}ms`
                                          : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <div className="mt-1">
                                        {getStatusBadge(selectedLog.status)}
                                      </div>
                                    </div>
                                  </div>

                                  {selectedLog.prompt_summary && (
                                    <div>
                                      <label className="text-sm font-medium">Prompt Summary</label>
                                      <ScrollArea className="h-32 mt-1 rounded border bg-muted/50 p-2">
                                        <pre className="text-xs whitespace-pre-wrap">
                                          {selectedLog.prompt_summary}
                                        </pre>
                                      </ScrollArea>
                                    </div>
                                  )}

                                  {selectedLog.error_message && (
                                    <div>
                                      <label className="text-sm font-medium text-destructive">
                                        Error
                                      </label>
                                      <p className="text-sm text-destructive mt-1">
                                        {selectedLog.error_message}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
