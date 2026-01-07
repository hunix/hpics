import { useState } from 'react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useClearance } from '@/hooks/useClearance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  Hash, 
  Clock, 
  User, 
  FileText,
  Download,
  RefreshCw,
  Link
} from 'lucide-react';
import { format } from 'date-fns';

export function ImmutableAuditViewer() {
  const { auditLogs, isLoading, verifyChain, getAuditSummary, canViewLogs } = useAuditLog();
  const { CLEARANCE_LABELS, CLEARANCE_COLORS } = useClearance();
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isVerifying, setIsVerifying] = useState(false);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const summary = getAuditSummary();

  const handleVerifyChain = async () => {
    if (!auditLogs) return;
    setIsVerifying(true);
    const result = await verifyChain(auditLogs);
    setChainValid(result.valid);
    setIsVerifying(false);
  };

  const handleExport = () => {
    if (!auditLogs) return;
    const csvContent = [
      ['Sequence', 'Timestamp', 'User', 'Action', 'Resource', 'Classification', 'Hash'].join(','),
      ...auditLogs.map((log) =>
        [
          log.sequence_number,
          log.created_at,
          log.user_id,
          log.action_type,
          `${log.resource_type}:${log.resource_id || 'N/A'}`,
          log.data_classification || 'N/A',
          log.current_hash.slice(0, 16),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredLogs = auditLogs?.filter((log) => {
    const matchesSearch =
      !filter ||
      log.action_type.toLowerCase().includes(filter.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_id.includes(filter);
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(auditLogs?.map((l) => l.action_type) || [])];

  if (!canViewLogs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Immutable Audit Trail
          </CardTitle>
          <CardDescription>
            You need SECRET clearance or higher to view audit logs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary?.last24h || 0}</div>
            <div className="text-sm text-muted-foreground">Last 24 Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary?.last7d || 0}</div>
            <div className="text-sm text-muted-foreground">Last 7 Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {chainValid === null ? (
                <Badge variant="secondary">Not Verified</Badge>
              ) : chainValid ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Chain Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Chain Broken
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Hash Chain Status</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Audit Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Immutable Audit Trail
              </CardTitle>
              <CardDescription>
                Cryptographically chained audit log. Each entry contains the hash of the previous entry.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyChain}
                disabled={isVerifying}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
                Verify Chain
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Log Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs?.map((log) => (
                    <Collapsible
                      key={log.id}
                      open={expandedLog === log.id}
                      onOpenChange={(open) => setExpandedLog(open ? log.id : null)}
                    >
                      <TableRow>
                        <TableCell className="font-mono text-xs">
                          {log.sequence_number}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            {log.resource_type}
                            {log.resource_id && (
                              <span className="text-muted-foreground">
                                :{log.resource_id.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.data_classification ? (
                            <Badge
                              className={
                                CLEARANCE_COLORS[log.data_classification as keyof typeof CLEARANCE_COLORS]
                              }
                            >
                              {CLEARANCE_LABELS[log.data_classification as keyof typeof CLEARANCE_LABELS]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            {log.current_hash.slice(0, 12)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedLog === log.id ? 'rotate-180' : ''
                                }`}
                              />
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/50">
                            <div className="p-4 space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-muted-foreground">User ID:</span>{' '}
                                  <span className="font-mono">{log.user_id}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">IP Address:</span>{' '}
                                  <span className="font-mono">{log.ip_address || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Clearance Used:</span>{' '}
                                  {log.clearance_used || 'N/A'}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Response:</span>{' '}
                                  {log.response_status || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Previous Hash:</span>{' '}
                                <span className="font-mono text-xs break-all">
                                  {log.previous_hash}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Current Hash:</span>{' '}
                                <span className="font-mono text-xs break-all">
                                  {log.current_hash}
                                </span>
                              </div>
                              {log.request_metadata && (
                                <div>
                                  <span className="text-muted-foreground">Metadata:</span>
                                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                                    {JSON.stringify(log.request_metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
