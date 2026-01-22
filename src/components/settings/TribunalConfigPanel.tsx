/**
 * Tribunal Configuration Panel
 * 
 * Admin interface for managing Intelligence Tribunal configurations.
 * Allows editing advocate roles, consensus thresholds, and stability settings.
 */

import { useState } from 'react';
import { useTribunalConfigs, useUpdateTribunalConfig } from '@/hooks/intelligence/useIntelligenceTribunal';
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
  Scale, Users, Target, AlertTriangle, CheckCircle2,
  ChevronDown, Save, RotateCcw, Settings2, Gavel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdvocateRole {
  role: string;
  prompt_key: string;
  focus_area: string;
}

interface TribunalConfig {
  id: string;
  tribunal_type: string;
  display_name: string;
  description: string | null;
  min_advocates: number;
  max_advocates: number;
  consensus_threshold: number;
  stability_rounds: number;
  auto_escalate_to_arbitrator: boolean;
  advocate_roles: AdvocateRole[];
  is_active: boolean;
}

function TribunalConfigCard({ config, onUpdate }: { config: TribunalConfig; onUpdate: (updates: Partial<TribunalConfig> & { id: string }) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleChange = <K extends keyof TribunalConfig>(key: K, value: TribunalConfig[K]) => {
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
                  <Gavel className="h-5 w-5 text-primary" />
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
                    {config.advocate_roles?.length || 0} advocates • {config.consensus_threshold}% threshold
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
              <Label htmlFor={`active-${config.id}`}>Tribunal Active</Label>
              <Switch
                id={`active-${config.id}`}
                checked={localConfig.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
            </div>
            
            {/* Advocate Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Advocates</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={localConfig.min_advocates}
                  onChange={(e) => handleChange('min_advocates', parseInt(e.target.value) || 2)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Advocates</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={localConfig.max_advocates}
                  onChange={(e) => handleChange('max_advocates', parseInt(e.target.value) || 5)}
                />
              </div>
            </div>
            
            {/* Consensus Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Consensus Threshold</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {localConfig.consensus_threshold}%
                </span>
              </div>
              <Slider
                value={[localConfig.consensus_threshold]}
                onValueChange={([v]) => handleChange('consensus_threshold', v)}
                min={50}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Minimum agreement required for verdict without escalation
              </p>
            </div>
            
            {/* Stability Rounds */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Stability Rounds</Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {localConfig.stability_rounds}
                </span>
              </div>
              <Slider
                value={[localConfig.stability_rounds]}
                onValueChange={([v]) => handleChange('stability_rounds', v)}
                min={1}
                max={5}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Consecutive rounds with stable positions before finalizing
              </p>
            </div>
            
            {/* Auto Escalate */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Escalate to Arbitrator</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically invoke arbitrator when consensus fails
                </p>
              </div>
              <Switch
                checked={localConfig.auto_escalate_to_arbitrator}
                onCheckedChange={(checked) => handleChange('auto_escalate_to_arbitrator', checked)}
              />
            </div>
            
            {/* Advocate Roles */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Advocate Roles
              </Label>
              <div className="space-y-2">
                {(localConfig.advocate_roles || []).map((role, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                    <Badge variant="outline">{role.role}</Badge>
                    <span className="text-sm flex-1">{role.focus_area}</span>
                    <span className="text-xs text-muted-foreground font-mono">{role.prompt_key}</span>
                  </div>
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

export function TribunalConfigPanel() {
  const { data: configs, isLoading } = useTribunalConfigs();
  const updateMutation = useUpdateTribunalConfig();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }
  
  const activeCount = configs?.filter(c => c.is_active).length || 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Intelligence Tribunals</CardTitle>
            <CardDescription>
              Configure multi-agent deliberation systems for high-stakes decisions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{configs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Tribunal Types</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-emerald-500">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">
              {configs?.reduce((sum, c) => sum + (c.advocate_roles?.length || 0), 0) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total Advocates</p>
          </div>
        </div>
        
        {/* Config Cards */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {configs && configs.length > 0 ? (
              configs.map(config => (
                <TribunalConfigCard
                  key={config.id}
                  config={config as unknown as TribunalConfig}
                  onUpdate={(updates) => updateMutation.mutate(updates)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Scale className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No tribunal configurations found</p>
                <p className="text-sm">Tribunals are created via database migrations</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
