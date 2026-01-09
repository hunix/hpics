import { useState } from 'react';
import { 
  LayoutGrid, Briefcase, Shield, Users, Brain, 
  Sparkles, Save, Download, Upload, Check, 
  LayoutDashboard, BarChart3, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { toast } from '@/hooks/use-toast';
import type { DashletConfig } from '@/lib/dashletDefinitions';

interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  dashletTypes: string[];
  recommended?: string[];
}

const builtInPresets: DashboardPreset[] = [
  {
    id: 'default',
    name: 'Balanced View',
    description: 'A balanced layout showing all essential widgets for daily use.',
    icon: LayoutGrid,
    gradient: 'from-emerald-500 to-teal-500',
    dashletTypes: ['relationship-health', 'follow-up-suggestions', 'weekly-summary', 'calendar-sync', 'communication-velocity'],
    recommended: ['analyst', 'user'],
  },
  {
    id: 'relationship-focus',
    name: 'Relationship Focus',
    description: 'Prioritize relationship health, decay alerts, and contact groups.',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
    dashletTypes: ['relationship-health', 'relationship-score', 'decay-alert', 'contact-groups', 'introduction-suggestions'],
    recommended: ['user'],
  },
  {
    id: 'intelligence',
    name: 'Intelligence Hub',
    description: 'Focus on AI insights, analytics, and behavioral analysis.',
    icon: Brain,
    gradient: 'from-violet-500 to-indigo-500',
    dashletTypes: ['follow-up-suggestions', 'communication-velocity', 'relationship-analytics', 'biometric-status'],
    recommended: ['analyst', 'supervisor'],
  },
  {
    id: 'executive',
    name: 'Executive Summary',
    description: 'High-level overview with key metrics and weekly summary.',
    icon: Briefcase,
    gradient: 'from-amber-500 to-orange-500',
    dashletTypes: ['weekly-summary', 'relationship-health', 'calendar-sync'],
    recommended: ['supervisor', 'admin'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, focused view with only essential widgets.',
    icon: LayoutDashboard,
    gradient: 'from-slate-500 to-gray-600',
    dashletTypes: ['relationship-health', 'follow-up-suggestions'],
  },
  {
    id: 'power-user',
    name: 'Power User',
    description: 'All widgets enabled for comprehensive monitoring.',
    icon: Zap,
    gradient: 'from-rose-500 to-pink-500',
    dashletTypes: [
      'relationship-health', 'follow-up-suggestions', 'weekly-summary', 
      'calendar-sync', 'communication-velocity', 'relationship-score',
      'decay-alert', 'contact-groups', 'introduction-suggestions',
      'relationship-analytics', 'biometric-status', 'auto-schedule'
    ],
    recommended: ['analyst'],
  },
];

interface DashboardPresetsProps {
  currentLayout?: DashletConfig[];
}

export function DashboardPresets({ currentLayout }: DashboardPresetsProps) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [showSaveCustom, setShowSaveCustom] = useState(false);
  const { updateLayout, layout } = useDashboardLayout();
  
  const handleApplyPreset = (preset: DashboardPreset) => {
    if (!layout) return;
    
    // Update layout to show only dashlets in the preset
    const newLayout = layout.map(dashlet => ({
      ...dashlet,
      visible: preset.dashletTypes.includes(dashlet.type),
    }));
    
    updateLayout(newLayout);
    
    toast({
      title: 'Preset Applied',
      description: `"${preset.name}" layout has been applied.`,
    });
    
    setOpen(false);
  };
  
  const handleSaveCustomPreset = () => {
    if (!customName.trim() || !layout) return;
    
    // Get visible dashlet types
    const visibleTypes = layout.filter(d => d.visible).map(d => d.type);
    
    // Save to localStorage for now (could be extended to save to database)
    const customPresets = JSON.parse(localStorage.getItem('custom-dashboard-presets') || '[]');
    customPresets.push({
      id: `custom-${Date.now()}`,
      name: customName,
      description: 'Custom saved layout',
      dashletTypes: visibleTypes,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('custom-dashboard-presets', JSON.stringify(customPresets));
    
    toast({
      title: 'Preset Saved',
      description: `"${customName}" has been saved to your presets.`,
    });
    
    setCustomName('');
    setShowSaveCustom(false);
  };
  
  const handleExportLayout = () => {
    if (!layout) return;
    
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      layout: layout,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Layout Exported',
      description: 'Your dashboard layout has been exported.',
    });
  };
  
  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.layout && Array.isArray(importData.layout)) {
          updateLayout(importData.layout);
          toast({
            title: 'Layout Imported',
            description: 'Your dashboard layout has been imported successfully.',
          });
        }
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Could not parse the layout file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Presets
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Dashboard Presets
          </DialogTitle>
          <DialogDescription>
            Choose a preset layout or save your current configuration.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <RadioGroup
            value={selectedPreset || ''}
            onValueChange={setSelectedPreset}
            className="space-y-3"
          >
            {builtInPresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              
              return (
                <label
                  key={preset.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  )}
                >
                  <RadioGroupItem value={preset.id} className="sr-only" />
                  
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-xl',
                    'bg-gradient-to-br shadow-lg shrink-0',
                    preset.gradient
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{preset.name}</span>
                      {preset.recommended && (
                        <Badge variant="secondary" className="text-[10px]">
                          {preset.dashletTypes.length} widgets
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </label>
              );
            })}
          </RadioGroup>
        </ScrollArea>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveCustom(!showSaveCustom)}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Current
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLayout}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            
            <Label htmlFor="import-layout" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </span>
              </Button>
              <input
                id="import-layout"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportLayout}
              />
            </Label>
          </div>
          
          <Button
            onClick={() => {
              const preset = builtInPresets.find(p => p.id === selectedPreset);
              if (preset) handleApplyPreset(preset);
            }}
            disabled={!selectedPreset}
          >
            Apply Preset
          </Button>
        </div>
        
        {/* Save custom dialog */}
        {showSaveCustom && (
          <div className="pt-4 border-t mt-4">
            <Label htmlFor="preset-name" className="text-sm">
              Save current layout as:
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="preset-name"
                placeholder="My Custom Layout"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <Button onClick={handleSaveCustomPreset} disabled={!customName.trim()}>
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
