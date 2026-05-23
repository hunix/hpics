import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Play, 
  Pause, 
  RefreshCw, 
  Zap, 
  Brain, 
  Eye, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileSearch,
  Users,
  Activity,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { invokeFunction } from '@/lib/api';

interface AutopilotAction {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: string;
  itemsProcessed?: number;
  icon: React.ElementType;
}

interface SystemHealth {
  unanalyzedMedia: number;
  staleDossiers: number;
  missingMice: number;
  missingInfluence: number;
  activeAnomalies: number;
  pendingAggregations: number;
}

export function IntelligenceAutopilotPanel() {
  const queryClient = useQueryClient();
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [actionProgress, setActionProgress] = useState(0);
  
  const [actions, setActions] = useState<AutopilotAction[]>([
    { id: 'analyze_new_media', name: 'Analyze New Media', description: 'Queue unanalyzed media items for processing', status: 'idle', icon: FileSearch },
    { id: 'aggregate_intelligence', name: 'Aggregate Intelligence', description: 'Consolidate analyses into unified profiles', status: 'idle', icon: Brain },
    { id: 'refresh_dossiers', name: 'Refresh Stale Dossiers', description: 'Update outdated intelligence reports', status: 'idle', icon: RefreshCw },
    { id: 'detect_anomalies', name: 'Detect Anomalies', description: 'Monitor for behavioral changes and sentiment shifts', status: 'idle', icon: AlertTriangle },
    { id: 'generate_mice', name: 'Generate MICE Profiles', description: 'Create vulnerability assessments for contacts', status: 'idle', icon: Eye },
    { id: 'generate_influence', name: 'Generate Influence Profiles', description: 'Create Cialdini/RASCLS profiles for contacts', status: 'idle', icon: TrendingUp },
    { id: 'full_sweep', name: 'Full System Sweep', description: 'Complete system-wide intelligence refresh', status: 'idle', icon: Zap },
  ]);

  // Fetch system health metrics
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ['autopilot-system-health'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [
        unanalyzedMedia,
        allProfiles,
        miceAssessments,
        influenceProfiles,
        anomalies,
        recentAggregations
      ] = await Promise.all([
        // Media without ai_metadata
        supabase.from('media').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).is('ai_metadata', null),
        // All active profiles
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('is_active', true),
        // MICE assessments
        supabase.from('mice_assessments').select('profile_id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        // Influence profiles
        supabase.from('contact_influence_profiles').select('profile_id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        // Unresolved anomalies
        supabase.from('behavioral_anomalies').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('is_resolved', false),
        // Aggregations older than 7 days
        supabase.from('ai_analyses').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('analysis_type', 'media_intelligence_aggregation')
          .lt('generated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const totalProfiles = allProfiles.count || 0;
      const miceCount = miceAssessments.count || 0;
      const influenceCount = influenceProfiles.count || 0;

      return {
        unanalyzedMedia: unanalyzedMedia.count || 0,
        staleDossiers: recentAggregations.count || 0,
        missingMice: Math.max(0, totalProfiles - miceCount),
        missingInfluence: Math.max(0, totalProfiles - influenceCount),
        activeAnomalies: anomalies.count || 0,
        pendingAggregations: recentAggregations.count || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Recent autopilot activity
  const { data: recentActivity } = useQuery({
    queryKey: ['autopilot-activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', 'autonomous_intelligence')
        .order('executed_at', { ascending: false })
        .limit(10);
      
      return data || [];
    },
  });

  // Execute autopilot action
  const executeAction = useMutation({
    mutationFn: async (actionId: string) => {
      setCurrentAction(actionId);
      setActionProgress(0);

      // Map action to orchestrator endpoint
      const actionMap: Record<string, string> = {
        'analyze_new_media': 'analyze_new_media',
        'aggregate_intelligence': 'aggregate_intelligence',
        'refresh_dossiers': 'refresh_dossiers',
        'detect_anomalies': 'detect_anomalies',
        'generate_mice': 'generate_mice',
        'generate_influence': 'generate_influence',
        'full_sweep': 'full_sweep',
      };

      const { data, error } = await invokeFunction('autonomous-intelligence-orchestrator', { action: actionMap[actionId] || actionId },);

      if (error) throw error;
      return data;
    },
    onSuccess: (data, actionId) => {
      setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { ...a, status: 'completed', lastRun: new Date().toISOString(), itemsProcessed: data?.itemsProcessed || 0 }
          : a
      ));
      toast.success(`${actionId.replace(/_/g, ' ')} completed successfully`);
      refetchHealth();
      queryClient.invalidateQueries({ queryKey: ['autopilot-activity'] });
    },
    onError: (error, actionId) => {
      setActions(prev => prev.map(a => 
        a.id === actionId ? { ...a, status: 'error' } : a
      ));
      toast.error(`Action failed: ${error.message}`);
    },
    onSettled: () => {
      setCurrentAction(null);
      setActionProgress(0);
    },
  });

  // Cascade analysis for a specific profile
  const cascadeAnalysis = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await invokeFunction('autonomous-intelligence-orchestrator', { action: 'cascade_analysis', profileId },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Cascade analysis completed');
      refetchHealth();
    },
    onError: (error) => {
      toast.error(`Cascade analysis failed: ${error.message}`);
    },
  });

  // Simulate progress for running actions
  useEffect(() => {
    if (currentAction) {
      const interval = setInterval(() => {
        setActionProgress(prev => Math.min(prev + Math.random() * 15, 95));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentAction]);

  const getStatusBadge = (status: AutopilotAction['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Running</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Idle</Badge>;
    }
  };

  const totalIssues = systemHealth 
    ? systemHealth.unanalyzedMedia + systemHealth.staleDossiers + systemHealth.missingMice + systemHealth.missingInfluence + systemHealth.activeAnomalies
    : 0;

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Intelligence Autopilot</CardTitle>
                <CardDescription>Autonomous intelligence management system</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="autopilot-toggle" className="text-sm text-muted-foreground">
                  Autopilot
                </Label>
                <Switch
                  id="autopilot-toggle"
                  checked={isAutopilotActive}
                  onCheckedChange={setIsAutopilotActive}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchHealth()}
                disabled={healthLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${healthLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Health Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-500">{systemHealth?.unanalyzedMedia || 0}</div>
              <div className="text-xs text-muted-foreground">Unanalyzed Media</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-500">{systemHealth?.staleDossiers || 0}</div>
              <div className="text-xs text-muted-foreground">Stale Dossiers</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-500">{systemHealth?.missingMice || 0}</div>
              <div className="text-xs text-muted-foreground">Missing MICE</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-500">{systemHealth?.missingInfluence || 0}</div>
              <div className="text-xs text-muted-foreground">Missing Influence</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-pink-500">{systemHealth?.activeAnomalies || 0}</div>
              <div className="text-xs text-muted-foreground">Active Anomalies</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg text-center border border-green-500/20">
              <div className={`text-2xl font-bold ${totalIssues === 0 ? 'text-green-500' : 'text-amber-500'}`}>
                {totalIssues === 0 ? '✓' : totalIssues}
              </div>
              <div className="text-xs text-muted-foreground">Total Issues</div>
            </div>
          </div>

          {/* Action Progress */}
          {currentAction && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Running: {currentAction.replace(/_/g, ' ')}
                </span>
              </div>
              <Progress value={actionProgress} className="h-2" />
            </div>
          )}

          {/* Available Actions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Available Actions</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {actions.map((action) => {
                const Icon = action.icon;
                const isRunning = currentAction === action.id;
                
                return (
                  <div 
                    key={action.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isRunning ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isRunning ? 'bg-blue-100 dark:bg-blue-900' : 'bg-muted'}`}>
                          <Icon className={`h-4 w-4 ${isRunning ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{action.name}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                          {action.lastRun && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Last run: {format(new Date(action.lastRun), 'MMM d, HH:mm')}
                              {action.itemsProcessed !== undefined && ` • ${action.itemsProcessed} items`}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isRunning ? 'secondary' : 'outline'}
                        disabled={!!currentAction}
                        onClick={() => executeAction.mutate(action.id)}
                      >
                        {isRunning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.outcome === 'success' ? 'bg-green-500' : 
                        activity.outcome === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <div className="text-sm font-medium">{activity.action_taken}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(activity.executed_at), 'MMM d, HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                    {activity.execution_time_ms && (
                      <Badge variant="outline" className="text-xs">
                        {activity.execution_time_ms}ms
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
