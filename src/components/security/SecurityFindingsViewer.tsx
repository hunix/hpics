import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle, Info, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SecurityFinding {
  id: string;
  finding_type: string;
  severity: string;
  title: string;
  description: string;
  remediation: string | null;
  affected_resource: string | null;
  finding_status: string;
  created_at: string;
  resolved_at: string | null;
}

const SEVERITY_STYLES: Record<string, { badge: string; icon: React.ReactNode }> = {
  critical: { badge: 'bg-red-600 text-white', icon: <AlertTriangle className="h-4 w-4" /> },
  high: { badge: 'bg-orange-500 text-white', icon: <AlertTriangle className="h-4 w-4" /> },
  medium: { badge: 'bg-yellow-500 text-black', icon: <Info className="h-4 w-4" /> },
  low: { badge: 'bg-blue-500 text-white', icon: <Info className="h-4 w-4" /> },
  info: { badge: 'bg-gray-500 text-white', icon: <Info className="h-4 w-4" /> },
};

export function SecurityFindingsViewer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: findings, isLoading, refetch } = useQuery({
    queryKey: ['security-findings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_findings')
        .select('*')
        .eq('user_id', user!.id)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data as SecurityFinding[];
    },
    enabled: !!user,
  });

  const resolveMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const { error } = await supabase
        .from('security_findings')
        .update({ 
          finding_status: 'resolved', 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', findingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-findings'] });
      toast({ title: 'Finding marked as resolved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const openFindings = findings?.filter(f => f.finding_status === 'open') || [];
  const resolvedFindings = findings?.filter(f => f.finding_status === 'resolved') || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Findings
          </CardTitle>
          <CardDescription>
            {openFindings.length} open, {resolvedFindings.length} resolved
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {findings?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No security findings detected</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {openFindings.map((finding) => {
                const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info;
                return (
                  <div
                    key={finding.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {style.icon}
                        <h4 className="font-medium">{finding.title}</h4>
                      </div>
                      <Badge className={style.badge}>
                        {finding.severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{finding.description}</p>
                    
                    {finding.affected_resource && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Affected: </span>
                        <code className="bg-muted px-1 py-0.5 rounded">{finding.affected_resource}</code>
                      </div>
                    )}
                    
                    {finding.remediation && (
                      <div className="p-3 bg-muted/50 rounded text-sm">
                        <strong>Recommendation:</strong> {finding.remediation}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        Detected {format(new Date(finding.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveMutation.mutate(finding.id)}
                        disabled={resolveMutation.isPending}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                );
              })}

              {resolvedFindings.length > 0 && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Resolved ({resolvedFindings.length})
                    </h4>
                    {resolvedFindings.slice(0, 5).map((finding) => (
                      <div
                        key={finding.id}
                        className="p-3 border rounded-lg opacity-60 mb-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{finding.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {finding.resolved_at && format(new Date(finding.resolved_at), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
