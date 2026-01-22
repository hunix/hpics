/**
 * Procedural Memory Panel
 * 
 * SOP management and MUSE framework visualization for the Reflect agent.
 * Displays distilled procedures, reflection history, and failure analysis.
 */

import { useState } from 'react';
import { 
  useProceduralMemoryList,
  useFailureReports,
  useDistillSOP,
  useUpdateSOP,
  useReflectAgentConfigs
} from '@/hooks/intelligence/useProceduralMemory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  BookOpen, Sparkles, Clock, CheckCircle2, XCircle, 
  AlertTriangle, ChevronRight, RefreshCw, Play, Settings,
  Target, FileCode, Zap, BarChart3, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SOP {
  id: string;
  sop_key: string;
  sop_name: string;
  description: string | null;
  trigger_conditions: string[];
  action_sequence: Array<{ step: number; action: string; expected_outcome: string }>;
  success_criteria: string[];
  confidence_score: number;
  usage_count: number;
  success_rate: number;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface FailureReport {
  id: string;
  failure_type: string;
  root_cause_analysis: string;
  contributing_factors: string[];
  recommended_fixes: string[];
  severity: string;
  created_at: string;
}

interface ReflectConfig {
  id: string;
  reflection_type: string;
  display_name: string;
  evaluation_dimensions: Array<{ name: string; weight: number; criteria: string }>;
  min_confidence_for_sop: number;
  sop_generation_enabled: boolean;
  failure_analysis_enabled: boolean;
  is_active: boolean;
}

function SOPCard({ sop, onToggle }: { sop: SOP; onToggle: (id: string, active: boolean) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const healthColor = sop.success_rate >= 0.8 ? 'text-emerald-500' : sop.success_rate >= 0.5 ? 'text-amber-500' : 'text-rose-500';
  
  return (
    <Card className={cn(
      "transition-all",
      !sop.is_active && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileCode className="h-4 w-4 text-primary" />
              <span className="font-medium truncate">{sop.sop_name}</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{sop.sop_key}</p>
          </div>
          <Switch 
            checked={sop.is_active} 
            onCheckedChange={(checked) => onToggle(sop.id, checked)}
          />
        </div>
        
        {sop.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {sop.description}
          </p>
        )}
        
        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-4 text-center mb-3">
          <div>
            <p className="text-lg font-bold">{(sop.confidence_score * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Confidence</p>
          </div>
          <div>
            <p className={cn("text-lg font-bold", healthColor)}>
              {(sop.success_rate * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
          <div>
            <p className="text-lg font-bold">{sop.usage_count}</p>
            <p className="text-xs text-muted-foreground">Uses</p>
          </div>
        </div>
        
        {/* Trigger conditions */}
        {sop.trigger_conditions && sop.trigger_conditions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Triggers:</p>
            <div className="flex flex-wrap gap-1">
              {sop.trigger_conditions.slice(0, 3).map((trigger, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {trigger}
                </Badge>
              ))}
              {sop.trigger_conditions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{sop.trigger_conditions.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Action sequence preview */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-xs">{sop.action_sequence?.length || 0} steps</span>
          <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
        </Button>
        
        {isExpanded && sop.action_sequence && (
          <div className="mt-3 space-y-2 pl-2 border-l-2 border-primary/20">
            {sop.action_sequence.map((step, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-mono text-xs text-muted-foreground">Step {step.step}:</span>
                <p className="text-foreground">{step.action}</p>
                <p className="text-xs text-muted-foreground">→ {step.expected_outcome}</p>
              </div>
            ))}
          </div>
        )}
        
        {sop.last_used_at && (
          <p className="text-xs text-muted-foreground mt-3">
            Last used {formatDistanceToNow(new Date(sop.last_used_at), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FailureReportCard({ report }: { report: FailureReport }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severityColors: Record<string, string> = {
    critical: 'border-rose-500 bg-rose-500/5',
    high: 'border-amber-500 bg-amber-500/5',
    medium: 'border-yellow-500 bg-yellow-500/5',
    low: 'border-blue-500 bg-blue-500/5',
  };
  
  return (
    <Card className={cn("transition-all", severityColors[report.severity] || '')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-4 w-4",
              report.severity === 'critical' ? 'text-rose-500' : 
              report.severity === 'high' ? 'text-amber-500' : 'text-muted-foreground'
            )} />
            <span className="font-medium">{report.failure_type}</span>
          </div>
          <Badge variant="outline">{report.severity}</Badge>
        </div>
        
        <p className={cn("text-sm", isExpanded ? "" : "line-clamp-2")}>
          {report.root_cause_analysis}
        </p>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 h-6 px-2 text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
        
        {isExpanded && (
          <div className="mt-3 space-y-3">
            {report.contributing_factors && report.contributing_factors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Contributing Factors:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {report.contributing_factors.map((factor, idx) => (
                    <li key={idx} className="text-muted-foreground">{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {report.recommended_fixes && report.recommended_fixes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-500 mb-1">Recommended Fixes:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {report.recommended_fixes.map((fix, idx) => (
                    <li key={idx}>{fix}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-3">
          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

function ReflectConfigCard({ config }: { config: ReflectConfig }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium">{config.display_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{config.reflection_type}</p>
          </div>
          <Badge variant={config.is_active ? 'default' : 'secondary'}>
            {config.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-center mb-3">
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold">{(config.min_confidence_for_sop * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Min Confidence</p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold">{config.evaluation_dimensions?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Dimensions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            {config.sop_generation_enabled ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <XCircle className="h-3 w-3 text-muted-foreground" />
            )}
            SOP Gen
          </div>
          <div className="flex items-center gap-1">
            {config.failure_analysis_enabled ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <XCircle className="h-3 w-3 text-muted-foreground" />
            )}
            Failure Analysis
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SOPStats({ sops }: { sops: SOP[] }) {
  const activeSops = sops.filter(s => s.is_active);
  const avgSuccessRate = sops.length > 0
    ? sops.reduce((sum, s) => sum + s.success_rate, 0) / sops.length
    : 0;
  const totalUsage = sops.reduce((sum, s) => sum + s.usage_count, 0);
  const highConfidence = sops.filter(s => s.confidence_score >= 0.8).length;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <FileCode className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{activeSops.length}/{sops.length}</p>
          <p className="text-xs text-muted-foreground">Active SOPs</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Target className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold">{(avgSuccessRate * 100).toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Avg Success Rate</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Zap className="h-5 w-5 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold">{totalUsage}</p>
          <p className="text-xs text-muted-foreground">Total Executions</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Sparkles className="h-5 w-5 mx-auto mb-2 text-violet-500" />
          <p className="text-2xl font-bold">{highConfidence}</p>
          <p className="text-xs text-muted-foreground">High Confidence</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProceduralMemoryPanel() {
  const [activeTab, setActiveTab] = useState<'sops' | 'failures' | 'config'>('sops');
  
  const { data: sops = [], isLoading: loadingSops, refetch: refetchSops } = useProceduralMemoryList();
  const { data: failures = [], isLoading: loadingFailures } = useFailureReports(50);
  const { data: configs = [], isLoading: loadingConfigs } = useReflectAgentConfigs();
  const updateSop = useUpdateSOP();
  const distillMutation = useDistillSOP();
  
  const handleToggleSop = (id: string, active: boolean) => {
    updateSop.mutate({ id, is_active: active });
  };
  
  if (loadingSops && loadingFailures) {
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
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Procedural Memory (MUSE)</CardTitle>
              <CardDescription>SOP distillation and self-improvement framework</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => distillMutation.mutate({})}
              disabled={distillMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Distillation
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetchSops()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <SOPStats sops={(sops || []) as unknown as SOP[]} />
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="sops" className="gap-2">
              <FileCode className="h-4 w-4" />
              SOPs ({sops?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="failures" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Failures ({failures?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sops">
            <ScrollArea className="h-[450px]">
              {sops && sops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                  {sops.map(sop => (
                    <SOPCard 
                      key={sop.id} 
                      sop={sop as unknown as SOP} 
                      onToggle={handleToggleSop}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No SOPs distilled yet</p>
                  <p className="text-sm">SOPs are created from successful task patterns</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="failures">
            <ScrollArea className="h-[450px]">
              {failures && failures.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {failures.map(report => (
                    <FailureReportCard key={report.id} report={report as unknown as FailureReport} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30 text-emerald-500" />
                  <p>No failure reports</p>
                  <p className="text-sm">Failures are analyzed for continuous improvement</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="config">
            {loadingConfigs ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : configs && configs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configs.map(config => (
                  <ReflectConfigCard key={config.id} config={config as unknown as ReflectConfig} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No reflection configurations</p>
                <p className="text-sm">Configure the MUSE evaluation framework</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
