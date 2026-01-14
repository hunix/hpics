import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, RotateCcw, GripVertical, Columns, Sparkles } from 'lucide-react';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { DASHLET_DEFINITIONS, LAYOUT_PRESETS, LayoutPresetId } from '@/lib/dashletDefinitions';
import { GridLayoutSelector } from '@/components/shared/GridLayoutSelector';
import { cn } from '@/lib/utils';

export function DashboardCustomizer() {
  const { 
    layout, 
    gridColumns, 
    toggleDashletVisibility, 
    setGridColumns, 
    setDashletColSpan,
    resetToDefault, 
    applyLayoutPreset,
    isSaving 
  } = useDashboardLayout();
  const [open, setOpen] = useState(false);

  const categories = [
    { key: 'overview', label: 'Overview' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'ai', label: 'AI Insights' },
    { key: 'tools', label: 'Tools' },
  ];

  const getDashletsByCategory = (category: string) => {
    return DASHLET_DEFINITIONS.filter(d => d.category === category);
  };

  const isVisible = (type: string) => {
    return layout?.find(d => d.type === type)?.visible ?? true;
  };

  const getDashletId = (type: string) => {
    return layout?.find(d => d.type === type)?.id ?? `dashlet-${type}`;
  };

  const getDashletColSpan = (type: string): number => {
    return layout?.find(d => d.type === type)?.colSpan ?? 1;
  };

  const handlePresetSelect = (presetId: string) => {
    applyLayoutPreset(presetId as LayoutPresetId);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Customize Dashboard</SheetTitle>
          <SheetDescription>
            Apply presets, adjust layout, and configure widgets.
          </SheetDescription>
        </SheetHeader>
        
        {/* Layout Presets */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Quick Presets</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors hover:border-primary hover:bg-primary/5",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
              >
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{preset.description}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {preset.gridColumns} cols
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {preset.visibleDashlets.length} widgets
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Grid Layout Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Grid Columns</Label>
          <GridLayoutSelector 
            value={gridColumns} 
            onChange={setGridColumns}
            min={1}
            max={6}
          />
          <p className="text-xs text-muted-foreground">
            Adjusts responsively on smaller screens.
          </p>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Widgets</Label>
          <Button variant="outline" size="sm" onClick={resetToDefault} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-520px)] mt-4">
          <div className="space-y-6 pr-4">
            {categories.map(category => (
              <div key={category.key}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {category.label}
                </h4>
                <div className="space-y-2">
                  {getDashletsByCategory(category.key).map(dashlet => {
                    const dashletId = getDashletId(dashlet.type);
                    const visible = isVisible(dashlet.type);
                    const colSpan = getDashletColSpan(dashlet.type);
                    
                    return (
                      <Card key={dashlet.type} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <dashlet.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <Label className="font-medium">{dashlet.title}</Label>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {dashlet.description}
                              </p>
                            </div>
                          </div>
                          
                          {/* Column Span Selector */}
                          {visible && (
                            <Select
                              value={colSpan.toString()}
                              onValueChange={(val) => setDashletColSpan(dashletId, parseInt(val) as 1 | 2 | 3 | 4 | 5 | 6)}
                            >
                              <SelectTrigger className="w-[70px] h-8">
                                <Columns className="h-3 w-3 mr-1" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6].map(span => (
                                  <SelectItem key={span} value={span.toString()}>
                                    {span}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Switch
                            checked={visible}
                            onCheckedChange={() => toggleDashletVisibility(dashletId)}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <GripVertical className="inline h-3 w-3 mr-1" />
            Tip: Drag widgets on the dashboard to reorder. Use column spans for wider widgets.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
