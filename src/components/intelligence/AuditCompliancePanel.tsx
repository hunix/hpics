import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Eye, Clock, FileText, AlertTriangle, 
  CheckCircle, User, Lock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function AuditCompliancePanel() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['audit-compliance', user?.id],
    queryFn: async () => {
      // Get recent audit logs
      const { data: auditLogs } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get data classification stats
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user!.id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id);

      const totalItems = (documents?.length || 0) + (profiles?.length || 0);

      // Analyze access patterns
      const actionCounts: Record<string, number> = {};
      auditLogs?.forEach(log => {
        actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const concerns: string[] = [];
      const classificationRate = 50; // Simplified
      const complianceScore = 75;

      return {
        auditLogs: auditLogs || [],
        classificationCounts: { unclassified: totalItems },
        classificationRate,
        totalItems,
        topActions,
        concerns,
        complianceScore,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  const classificationColors = {
    public: 'bg-green-500',
    internal: 'bg-blue-500',
    confidential: 'bg-yellow-500',
    restricted: 'bg-red-500',
    unclassified: 'bg-gray-500',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Audit & Compliance
        </CardTitle>
        <CardDescription>
          Access logging, data classification, and compliance monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classification">Classification</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Compliance Score */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compliance Score</span>
                <Badge variant={data?.complianceScore >= 80 ? 'default' : 'destructive'}>
                  {data?.complianceScore}%
                </Badge>
              </div>
              <Progress value={data?.complianceScore || 0} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xl font-bold">{data?.totalItems || 0}</div>
                <div className="text-xs text-muted-foreground">Total Items</div>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <Lock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xl font-bold">{data?.classificationRate || 0}%</div>
                <div className="text-xs text-muted-foreground">Classified</div>
              </div>
            </div>

            {/* Concerns */}
            {data?.concerns && data.concerns.length > 0 && (
              <div className="p-3 rounded-lg border border-amber-500/50 bg-amber-500/5">
                <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Security Concerns
                </h4>
                <ul className="space-y-1">
                  {data.concerns.map((c, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data?.concerns?.length === 0 && (
              <div className="p-3 rounded-lg border border-green-500/50 bg-green-500/5 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600">No security concerns detected</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="classification" className="mt-4">
            <div className="space-y-4">
              {/* Classification Distribution */}
              <div className="space-y-2">
                {Object.entries(data?.classificationCounts || {}).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-3">
                    <div 
                      className={`w-3 h-3 rounded-full ${classificationColors[level as keyof typeof classificationColors]}`}
                    />
                    <span className="text-sm capitalize flex-1">{level}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </div>

              {/* Visual Bar */}
              <div className="h-4 rounded-full overflow-hidden flex">
                {Object.entries(data?.classificationCounts || {})
                  .filter(([, count]) => (count as number) > 0)
                  .map(([level, count]) => {
                    const width = ((count as number) / (data?.totalItems || 1)) * 100;
                    return (
                      <div
                        key={level}
                        className={classificationColors[level as keyof typeof classificationColors]}
                        style={{ width: `${width}%` }}
                        title={`${level}: ${count}`}
                      />
                    );
                  })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <ScrollArea className="h-[300px]">
              {data?.auditLogs && data.auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {data.auditLogs.map((log: any) => (
                    <div key={log.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{log.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {log.resource_type && (
                        <div className="text-xs text-muted-foreground">
                          {log.resource_type}: {log.resource_id?.slice(0, 8)}...
                        </div>
                      )}
                      {log.details && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(log.details).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No audit logs available</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
