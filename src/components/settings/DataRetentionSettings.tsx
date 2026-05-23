import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Clock, 
  Trash2, 
  Eye, 
  Database, 
  AlertTriangle,
  Loader2,
  Play,
  History,
  MessageSquare,
  Fingerprint,
  DollarSign,
  BarChart3,
  FileText,
  Users,
  Check,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { invokeFunction } from '@/lib/api';

// Data category definitions with metadata
const DATA_CATEGORIES = [
  {
    id: 'messages',
    name: 'Messages & Communications',
    icon: MessageSquare,
    description: 'Chat messages, emails, communication history',
    defaultDays: 730,
    tables: ['chat_messages', 'email_messages', 'communication_history', 'message_drafts'],
    gdprNote: 'GDPR allows up to 2 years for legitimate business purposes',
  },
  {
    id: 'biometrics',
    name: 'Biometric Data',
    icon: Fingerprint,
    description: 'Voice samples, facial data, behavioral patterns',
    defaultDays: 90,
    tables: ['contact_biometrics', 'biometric_enrollment_sessions', 'voice_samples', 'facial_samples'],
    gdprNote: 'Sensitive data - recommend 90 days or less per GDPR Article 9',
  },
  {
    id: 'financial',
    name: 'Financial Intelligence',
    icon: DollarSign,
    description: 'Transaction patterns, economic profiles, investment data',
    defaultDays: 2555,
    tables: ['financial_intelligence', 'economic_profiles', 'transaction_history'],
    gdprNote: 'Tax compliance requires 7-year retention in many jurisdictions',
  },
  {
    id: 'analytics',
    name: 'Analytics & AI Data',
    icon: BarChart3,
    description: 'Behavioral patterns, AI analyses, engagement metrics',
    defaultDays: 365,
    tables: ['behavioral_patterns', 'ai_analyses', 'engagement_metrics', 'platform_analytics'],
    gdprNote: 'Recommend annual review and purge for analytics data',
  },
  {
    id: 'logs',
    name: 'System Logs',
    icon: FileText,
    description: 'Audit logs, API usage, agent traces',
    defaultDays: 90,
    tables: ['audit_log', 'agent_trace_sessions', 'agent_spans', 'api_usage_logs'],
    gdprNote: 'Retain for security purposes, 90 days typical',
  },
  {
    id: 'interactions',
    name: 'Contact Interactions',
    icon: Users,
    description: 'Observations, notes, events, relationship history',
    defaultDays: 1095,
    tables: ['contact_interaction_notes', 'contact_observations', 'contact_events', 'relationship_events'],
    gdprNote: 'Core business data - 3 years recommended',
  },
];

interface RetentionPolicy {
  id: string;
  user_id: string;
  data_category: string;
  table_name: string;
  retention_days: number;
  delete_strategy: 'soft_delete' | 'hard_delete' | 'anonymize';
  is_enabled: boolean;
  last_executed_at: string | null;
  records_deleted: number;
  created_at: string;
  updated_at: string;
}

interface ExecutionLog {
  id: string;
  policy_id: string;
  table_name: string;
  records_processed: number;
  records_deleted: number;
  records_anonymized: number;
  execution_status: string;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export function DataRetentionSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch existing policies
  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ['data-retention-policies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('user_id', user!.id)
        .order('data_category');
      
      if (error) throw error;
      return data as RetentionPolicy[];
    },
    enabled: !!user,
  });

  // Fetch execution history
  const { data: executionLogs } = useQuery({
    queryKey: ['data-retention-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_retention_execution_log')
        .select('*')
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as ExecutionLog[];
    },
    enabled: !!user,
  });

  // Initialize default policies for a category
  const initializePolicies = useMutation({
    mutationFn: async (categoryId: string) => {
      const category = DATA_CATEGORIES.find(c => c.id === categoryId);
      if (!category) throw new Error('Category not found');

      const policiesToInsert = category.tables.map(table => ({
        user_id: user!.id,
        data_category: categoryId,
        table_name: table,
        retention_days: category.defaultDays,
        delete_strategy: 'soft_delete' as const,
        is_enabled: false, // Start disabled for safety
      }));

      const { error } = await supabase
        .from('data_retention_policies')
        .upsert(policiesToInsert, { onConflict: 'user_id,table_name' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-retention-policies'] });
      toast({ title: 'Policies initialized', description: 'Default retention policies have been created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update a policy
  const updatePolicy = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RetentionPolicy> }) => {
      const { error } = await supabase
        .from('data_retention_policies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-retention-policies'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating policy', description: error.message, variant: 'destructive' });
    },
  });

  // Execute retention (dry run or actual)
  const executeRetention = async (dryRun: boolean, category?: string) => {
    setIsRunning(true);
    try {
      const { data, error } = await invokeFunction('execute-data-retention', { userId: user!.id, dryRun, category },);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['data-retention-policies'] });
      queryClient.invalidateQueries({ queryKey: ['data-retention-logs'] });

      if (dryRun) {
        toast({
          title: 'Dry Run Complete',
          description: `Would affect ${data.summary.totalProcessed} records across ${data.results.length} policies`,
        });
      } else {
        toast({
          title: 'Retention Executed',
          description: `Deleted: ${data.summary.totalDeleted}, Anonymized: ${data.summary.totalAnonymized}`,
        });
      }
    } catch (error) {
      toast({ title: 'Execution failed', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    } finally {
      setIsRunning(false);
    }
  };

  // Get policies for a category
  const getCategoryPolicies = (categoryId: string) => {
    return policies?.filter(p => p.data_category === categoryId) || [];
  };

  // Check if category has policies
  const hasPolicies = (categoryId: string) => {
    return getCategoryPolicies(categoryId).length > 0;
  };

  // Get category stats
  const getCategoryStats = (categoryId: string) => {
    const categoryPolicies = getCategoryPolicies(categoryId);
    const enabled = categoryPolicies.filter(p => p.is_enabled).length;
    const totalDeleted = categoryPolicies.reduce((sum, p) => sum + (p.records_deleted || 0), 0);
    return { enabled, total: categoryPolicies.length, totalDeleted };
  };

  if (policiesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Data Retention Policies</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeRetention(true)}
                disabled={isRunning}
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                Dry Run
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => executeRetention(false)}
                disabled={isRunning}
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                Execute Now
              </Button>
            </div>
          </div>
          <CardDescription>
            Configure automatic data purging to ensure GDPR/CCPA compliance. Data older than the retention period will be deleted or anonymized based on your settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Enabling retention policies will permanently delete or anonymize data beyond the retention period. Use "Dry Run" to preview affected records before executing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Category Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Retention by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible value={expandedCategory || undefined} onValueChange={setExpandedCategory}>
            {DATA_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const stats = getCategoryStats(category.id);
              const categoryPolicies = getCategoryPolicies(category.id);

              return (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">{category.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasPolicies(category.id) ? (
                          <>
                            <Badge variant={stats.enabled > 0 ? 'default' : 'secondary'}>
                              {stats.enabled}/{stats.total} active
                            </Badge>
                            {stats.totalDeleted > 0 && (
                              <Badge variant="outline">
                                {stats.totalDeleted.toLocaleString()} deleted
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline">Not configured</Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* GDPR Note */}
                      <Alert variant="default" className="bg-muted/50">
                        <Shield className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {category.gdprNote}
                        </AlertDescription>
                      </Alert>

                      {/* Initialize or show policies */}
                      {!hasPolicies(category.id) ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <p className="text-muted-foreground">No retention policies configured for this category</p>
                          <Button
                            onClick={() => initializePolicies.mutate(category.id)}
                            disabled={initializePolicies.isPending}
                          >
                            {initializePolicies.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Initialize with Defaults ({category.defaultDays} days)
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {categoryPolicies.map((policy) => (
                            <PolicyRow
                              key={policy.id}
                              policy={policy}
                              onUpdate={(updates) => updatePolicy.mutate({ id: policy.id, updates })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Execution History */}
      {executionLogs && executionLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {executionLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={log.execution_status === 'completed' ? 'default' : log.execution_status === 'failed' ? 'destructive' : 'secondary'}>
                      {log.execution_status}
                    </Badge>
                    <span className="font-mono text-xs">{log.table_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{log.records_deleted} deleted</span>
                    <span>{log.records_anonymized} anonymized</span>
                    <span>{formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}</span>
                    {log.duration_ms && <span>{log.duration_ms}ms</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual policy row component
function PolicyRow({ 
  policy, 
  onUpdate 
}: { 
  policy: RetentionPolicy; 
  onUpdate: (updates: Partial<RetentionPolicy>) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Switch
          checked={policy.is_enabled}
          onCheckedChange={(checked) => onUpdate({ is_enabled: checked })}
        />
        <div>
          <div className="font-mono text-sm">{policy.table_name}</div>
          {policy.last_executed_at && (
            <div className="text-xs text-muted-foreground">
              Last run: {formatDistanceToNow(new Date(policy.last_executed_at), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Retention Days */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Days:</Label>
          <Input
            type="number"
            value={policy.retention_days}
            onChange={(e) => onUpdate({ retention_days: parseInt(e.target.value) || 365 })}
            className="w-20 h-8 text-sm"
            min={1}
            max={3650}
          />
        </div>

        {/* Delete Strategy */}
        <Select
          value={policy.delete_strategy}
          onValueChange={(value: 'soft_delete' | 'hard_delete' | 'anonymize') => 
            onUpdate({ delete_strategy: value })
          }
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="soft_delete">
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3" />
                Soft Delete
              </div>
            </SelectItem>
            <SelectItem value="hard_delete">
              <div className="flex items-center gap-2">
                <Trash2 className="h-3 w-3" />
                Hard Delete
              </div>
            </SelectItem>
            <SelectItem value="anonymize">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3" />
                Anonymize
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Stats */}
        {policy.records_deleted > 0 && (
          <Badge variant="outline" className="text-xs">
            {policy.records_deleted.toLocaleString()} deleted
          </Badge>
        )}
      </div>
    </div>
  );
}
