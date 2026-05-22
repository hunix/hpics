/**
 * Platform Configuration Settings Panel
 * 
 * Hierarchical configuration management with support for:
 * - Platform defaults (read-only for regular users)
 * - User-level overrides
 * - Per-contact overrides (via contact settings)
 */

import { useState, useMemo } from 'react';
import { usePlatformConfigsByCategory, useUserConfigOverrides, useSaveUserConfig, useResetUserConfig } from '@/hooks/usePlatformConfig';
import { CONFIG_CATEGORY_LABELS, type ConfigCategory } from '@/lib/platformConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings2, Brain, BarChart3, Fingerprint, Lightbulb, 
  Heart, Shield, Sparkles, Workflow, RotateCcw, Save,
  Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<ConfigCategory, React.ReactNode> = {
  ai: <Brain className="h-4 w-4" />,
  analysis: <BarChart3 className="h-4 w-4" />,
  biometric: <Fingerprint className="h-4 w-4" />,
  intelligence: <Lightbulb className="h-4 w-4" />,
  relationship: <Heart className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  enrichment: <Sparkles className="h-4 w-4" />,
  automation: <Workflow className="h-4 w-4" />,
};

interface ConfigItemEditorProps {
  config: {
    config_key: string;
    display_name: string;
    description: string | null;
    value_type: string;
    value_constraints: { min?: number; max?: number; options?: string[] } | null;
    default_value: unknown;
    config_value: unknown;
  };
  currentValue: unknown;
  hasOverride: boolean;
  onSave: (value: unknown) => void;
  onReset: () => void;
  isSaving: boolean;
}

function ConfigItemEditor({ 
  config, 
  currentValue, 
  hasOverride, 
  onSave, 
  onReset,
  isSaving 
}: ConfigItemEditorProps) {
  const [localValue, setLocalValue] = useState<unknown>(currentValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChanges = JSON.stringify(localValue) !== JSON.stringify(currentValue);

  const renderInput = () => {
    const constraints = config.value_constraints || {};
    
    switch (config.value_type) {
      case 'boolean':
        return (
          <Switch
            checked={localValue as boolean}
            onCheckedChange={(checked) => {
              setLocalValue(checked);
              onSave(checked);
            }}
          />
        );

      case 'percentage': {
        const percentValue = typeof localValue === 'number' ? localValue : 0;
        return (
          <div className="flex items-center gap-4 flex-1">
            <Slider
              value={[percentValue * 100]}
              onValueChange={([v]) => setLocalValue(v / 100)}
              min={(constraints.min ?? 0) * 100}
              max={(constraints.max ?? 1) * 100}
              step={1}
              className="flex-1"
            />
            <span className="w-14 text-right font-mono text-sm">
              {(percentValue * 100).toFixed(0)}%
            </span>
          </div>
        );
      }

      case 'number':
        return (
          <Input
            type="number"
            value={localValue as number}
            onChange={(e) => setLocalValue(Number(e.target.value))}
            min={constraints.min}
            max={constraints.max}
            className="w-32"
          />
        );

      case 'json':
        return (
          <Input
            value={JSON.stringify(localValue)}
            onChange={(e) => {
              try {
                setLocalValue(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, keep current
              }
            }}
            className="font-mono text-sm"
          />
        );

      default:
        return (
          <Input
            value={String(localValue)}
            onChange={(e) => setLocalValue(e.target.value)}
          />
        );
    }
  };

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-colors",
      hasOverride && "border-primary/30 bg-primary/5"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{config.display_name}</span>
            {hasOverride && (
              <Badge variant="outline" className="text-xs text-primary">
                Custom
              </Badge>
            )}
          </div>
          {config.description && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
            >
              <Info className="h-3 w-3" />
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {isExpanded && config.description && (
            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
              {config.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {renderInput()}

          {config.value_type !== 'boolean' && hasChanges && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSave(localValue)}
              disabled={isSaving}
              className="h-8 w-8 p-0"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}

          {hasOverride && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Reset to default"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlatformConfigSettings() {
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('ai');
  
  const { data: configs, isLoading: loadingConfigs } = usePlatformConfigsByCategory();
  const { data: userOverrides, isLoading: loadingOverrides } = useUserConfigOverrides();
  const saveConfig = useSaveUserConfig();
  const resetConfig = useResetUserConfig();

  // Group configs by category and subcategory
  const groupedConfigs = useMemo(() => {
    if (!configs) return {};
    
    const grouped: Record<string, Record<string, typeof configs>> = {};
    
    for (const config of configs) {
      if (!grouped[config.category]) {
        grouped[config.category] = {};
      }
      const subcategory = config.subcategory || 'General';
      if (!grouped[config.category][subcategory]) {
        grouped[config.category][subcategory] = [];
      }
      grouped[config.category][subcategory].push(config);
    }
    
    return grouped;
  }, [configs]);

  const categories = Object.keys(CONFIG_CATEGORY_LABELS) as ConfigCategory[];

  if (loadingConfigs || loadingOverrides) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentCategoryConfigs = groupedConfigs[activeCategory] || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Platform Configuration
        </CardTitle>
        <CardDescription>
          Customize system behavior. Your settings override platform defaults.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ConfigCategory)}>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="pb-2">
              <TabsList className="inline-flex h-auto gap-1 p-1 flex-nowrap min-w-max">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2"
                  >
                    {CATEGORY_ICONS[category]}
                    <span className="hidden sm:inline">{CONFIG_CATEGORY_LABELS[category]}</span>
                    <span className="sm:hidden">{CONFIG_CATEGORY_LABELS[category].split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </ScrollArea>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {Object.entries(currentCategoryConfigs).map(([subcategory, items]) => (
                    <div key={subcategory}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        {subcategory}
                      </h4>
                      <div className="space-y-2">
                        {items.map((config) => {
                          const hasOverride = userOverrides?.has(config.config_key) ?? false;
                          const currentValue = hasOverride 
                            ? userOverrides?.get(config.config_key) 
                            : config.config_value;

                          return (
                            <ConfigItemEditor
                              key={config.config_key}
                              config={config}
                              currentValue={currentValue}
                              hasOverride={hasOverride}
                              onSave={(value) => saveConfig.mutate({ 
                                configKey: config.config_key, 
                                configValue: value 
                              })}
                              onReset={() => resetConfig.mutate(config.config_key)}
                              isSaving={saveConfig.isPending}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
