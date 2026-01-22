/**
 * Verification Chamber Configuration Panel
 * 
 * Admin interface for configuring the warfare verification pipeline.
 * Manages verification stages, risk thresholds, and approval workflows.
 */

import { useState } from 'react';
import { useChamberConfigs, useUpdateChamberConfig } from '@/hooks/intelligence/useVerificationChamber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Shield, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, Save, RotateCcw, Target, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationStage {
  stage_name: string;
  stage_order: number;
  prompt_key: string;
  is_required: boolean;
  timeout_seconds: number;
}

interface VerificationConfig {
  id: string;
  chamber_type: string;
  display_name: string;
  description: string | null;
  verification_stages: Array<{ stage_key: string; order: number }>;
  require_unanimous: boolean;
  timeout_per_stage_ms: number;
  auto_reject_on_timeout: boolean;
  is_active: boolean;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  planner: <Target className="h-4 w-4" />,
  red_team: <AlertTriangle className="h-4 w-4" />,
  legal: <Shield className="h-4 w-4" />,
  verifier: <CheckCircle2 className="h-4 w-4" />,
};

function StageCard({ stage, index }: { stage: VerificationStage; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {STAGE_ICONS[stage.stage_name.toLowerCase()] || <Zap className="h-4 w-4" />}
          <span className="font-medium">{stage.stage_name}</span>
          {stage.is_required && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Timeout: {stage.timeout_seconds}s • Prompt: {stage.prompt_key}
        </p>
      </div>
    </div>
  );
}

function VerificationConfigCard({ 
  config, 
  onUpdate 
}: { 
  config: VerificationConfig; 
  onUpdate: (updates: Partial<VerificationConfig> & { id: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleChange = <K extends keyof VerificationConfig>(key: K, value: VerificationConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    onUpdate({ id: config.id, ...localConfig });
    setHasChanges(false);
  };
  
  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };
  
  const requiredStages = localConfig.stages?.filter(s => s.is_required).length || 0;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "transition-colors",
        !config.is_active && "opacity-60",
        hasChanges && "border-primary/50"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{config.display_name}</CardTitle>
                    {!config.is_active && (
                      <Badge variant="outline" className="text-xs">Disabled</Badge>
                    )}
                    {hasChanges && (
                      <Badge variant="default" className="text-xs">Unsaved</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {localConfig.stages?.length || 0} stages ({requiredStages} required) • 
                    Risk threshold: {localConfig.risk_threshold}%
                  </CardDescription>
                </div>
              </div>
              <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Description */}
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
            
            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label>Verification Active</Label>
              <Switch
                checked={localConfig.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
            </div>
            
            {/* Risk Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Risk Threshold</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {localConfig.risk_threshold}%
                </span>
              </div>
              <Slider
                value={[localConfig.risk_threshold]}
                onValueChange={([v]) => handleChange('risk_threshold', v)}
                min={0}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Operations below this threshold may be auto-approved
              </p>
            </div>
            
            {/* Auto Approve */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Approve Low Risk</Label>
                <p className="text-xs text-muted-foreground">
                  Skip human review for operations below threshold
                </p>
              </div>
              <Switch
                checked={localConfig.auto_approve_below_threshold}
                onCheckedChange={(checked) => handleChange('auto_approve_below_threshold', checked)}
              />
            </div>
            
            {/* Require Human Approval */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Human Approval</Label>
                <p className="text-xs text-muted-foreground">
                  Always require human sign-off regardless of risk
                </p>
              </div>
              <Switch
                checked={localConfig.require_human_approval}
                onCheckedChange={(checked) => handleChange('require_human_approval', checked)}
              />
            </div>
            
            {/* Stages */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Verification Stages
              </Label>
              <div className="space-y-2">
                {(localConfig.stages || [])
                  .sort((a, b) => a.stage_order - b.stage_order)
                  .map((stage, idx) => (
                    <StageCard key={idx} stage={stage} index={idx} />
                  ))}
              </div>
            </div>
            
            {/* Actions */}
            {hasChanges && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function VerificationConfigPanel() {
  const { data: configs, isLoading } = useChamberConfigs();
  const updateMutation = useUpdateChamberConfig();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }
  
  const activeCount = configs?.filter(c => c.is_active).length || 0;
  const totalStages = configs?.reduce((sum, c) => sum + (c.stages?.length || 0), 0) || 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Verification Chambers</CardTitle>
            <CardDescription>
              Configure multi-stage verification pipelines for warfare operations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{configs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Verification Types</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-emerald-500">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{totalStages}</p>
            <p className="text-xs text-muted-foreground">Total Stages</p>
          </div>
        </div>
        
        {/* Config Cards */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {configs && configs.length > 0 ? (
              configs.map(config => (
                <VerificationConfigCard
                  key={config.id}
                  config={config as unknown as VerificationConfig}
                  onUpdate={(updates) => updateMutation.mutate(updates)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No verification configurations found</p>
                <p className="text-sm">Verifications are created via database migrations</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
