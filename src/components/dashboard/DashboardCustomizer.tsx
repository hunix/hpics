import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings2, RotateCcw, GripVertical } from 'lucide-react';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { DASHLET_DEFINITIONS } from '@/lib/dashletDefinitions';
import { GridLayoutSelector } from '@/components/shared/GridLayoutSelector';

export function DashboardCustomizer() {
  const { layout, gridColumns, toggleDashletVisibility, setGridColumns, resetToDefault, isSaving } = useDashboardLayout();
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
            Adjust layout and show/hide widgets.
          </SheetDescription>
        </SheetHeader>
        
        {/* Grid Layout Selector */}
        <div className="mt-6 space-y-3">
          <Label className="text-sm font-medium">Layout</Label>
          <GridLayoutSelector 
            value={gridColumns} 
            onChange={setGridColumns}
            min={1}
            max={6}
          />
          <p className="text-xs text-muted-foreground">
            Choose how many widgets appear side-by-side. Adjusts responsively on smaller screens.
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

        <ScrollArea className="h-[calc(100vh-340px)] mt-4">
          <div className="space-y-6 pr-4">
            {categories.map(category => (
              <div key={category.key}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {category.label}
                </h4>
                <div className="space-y-2">
                  {getDashletsByCategory(category.key).map(dashlet => (
                    <Card key={dashlet.type} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <dashlet.icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="font-medium">{dashlet.title}</Label>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {dashlet.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isVisible(dashlet.type)}
                          onCheckedChange={() => toggleDashletVisibility(getDashletId(dashlet.type))}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <GripVertical className="inline h-3 w-3 mr-1" />
            Tip: Drag and drop widgets directly on the dashboard to rearrange them.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
