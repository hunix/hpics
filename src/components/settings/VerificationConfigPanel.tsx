/**
 * Verification Chamber Configuration Panel
 * 
 * Admin interface for configuring the warfare verification pipeline.
 * Manages verification stages, timeout settings, and approval workflows.
 */

import { useState } from 'react';
import { useChamberConfigs, useUpdateChamberConfig } from '@/hooks/intelligence/useVerificationChamber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Shield, CheckCircle2, AlertTriangle, Clock,
  ChevronDown, Save, RotateCcw, Target, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationStageRef {
  stage_key: string;
  order: number;
}

interface ChamberConfig {
  id: string;
  chamber_type: string;
  display_name: string;
  description: string | null;
  verification_stages: VerificationStageRef[];
  require_unanimous: boolean;
  timeout_per_stage_ms: number;
  auto_reject_on_timeout: boolean;
  escalation_config: Record<string, unknown>;
  is_active: boolean;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  planner: <Target className="h-4 w-4" />,
  red_team: <AlertTriangle className="h-4 w-4" />,
  legal: <Shield className="h-4 w-4" />,
  verifier: <CheckCircle2 className="h-4 w-4" />,
};

function StageCard({ stageRef, index }: { stageRef: VerificationStageRef; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {STAGE_ICONS[stageRef.stage_key.toLowerCase()] || <Zap className="h-4 w-4" />}
          <span className="font-medium capitalize">{stageRef.stage_key.replace(/_/g, ' ')}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Order: {stageRef.order}
        </p>
      </div>
    </div>
  );
}

function ChamberConfigCard({ 
  config, 
  onUpdate 
}: { 
  config: ChamberConfig; 
  onUpdate: (updates: Partial<ChamberConfig> & { id: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleChange = <K extends keyof ChamberConfig>(key: K, value: ChamberConfig[K]) => {
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
  
  const stageCount = localConfig.verification_stages?.length || 0;
  const timeoutSeconds = Math.round((localConfig.timeout_per_stage_ms || 30000) / 1000);
  
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
                    {stageCount} stages • Timeout: {timeoutSeconds}s per stage
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
              <Label>Chamber Active</Label>
              <Switch
                checked={localConfig.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
            </div>
            
            {/* Timeout per Stage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeout per Stage
                </Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {timeoutSeconds}s
                </span>
              </div>
              <Slider
                value={[timeoutSeconds]}
                onValueChange={([v]) => handleChange('timeout_per_stage_ms', v * 1000)}
                min={10}
                max={300}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                Maximum time allowed for each verification stage
              </p>
            </div>
            
            {/* Require Unanimous */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Unanimous Approval</Label>
                <p className="text-xs text-muted-foreground">
                  All stages must approve for campaign to proceed
                </p>
              </div>
              <Switch
                checked={localConfig.require_unanimous}
                onCheckedChange={(checked) => handleChange('require_unanimous', checked)}
              />
            </div>
            
            {/* Auto Reject on Timeout */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Reject on Timeout</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically reject if stage times out
                </p>
              </div>
              <Switch
                checked={localConfig.auto_reject_on_timeout}
                onCheckedChange={(checked) => handleChange('auto_reject_on_timeout', checked)}
              />
            </div>
            
            {/* Stages */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Verification Stages
              </Label>
              <div className="space-y-2">
                {(localConfig.verification_stages || [])
                  .sort((a, b) => a.order - b.order)
                  .map((stageRef, idx) => (
                    <StageCard key={idx} stageRef={stageRef} index={idx} />
                  ))}
                {stageCount === 0 && (
                  <p className="text-sm text-muted-foreground italic">No stages configured</p>
                )}
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
  const totalStages = configs?.reduce((sum, c) => sum + (c.verification_stages?.length || 0), 0) || 0;
  
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
            <p className="text-xs text-muted-foreground">Chamber Types</p>
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
                <ChamberConfigCard
                  key={config.id}
                  config={config as unknown as ChamberConfig}
                  onUpdate={(updates) => updateMutation.mutate(updates)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No chamber configurations found</p>
                <p className="text-sm">Chambers are created via database migrations</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
