import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ANALYSIS_PURPOSES, ANALYSIS_RELATIONSHIPS, ANALYSIS_DEPTHS, AnalysisContext } from "@/lib/analysisTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, Sparkles } from "lucide-react";

interface AnalysisContextSelectorProps {
  context: Partial<AnalysisContext>;
  onContextChange: (context: Partial<AnalysisContext>) => void;
  depth: 'quick' | 'standard' | 'deep';
  onDepthChange: (depth: 'quick' | 'standard' | 'deep') => void;
}

const depthIcons = {
  quick: Zap,
  standard: Clock,
  deep: Sparkles,
};

export function AnalysisContextSelector({
  context,
  onContextChange,
  depth,
  onDepthChange,
}: AnalysisContextSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Purpose</Label>
          <Select
            value={context.purpose || 'personal'}
            onValueChange={(value) => onContextChange({ ...context, purpose: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              {ANALYSIS_PURPOSES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex flex-col">
                    <span>{p.label}</span>
                    <span className="text-xs text-muted-foreground">{p.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Relationship</Label>
          <Select
            value={context.relationship || 'direct_contact'}
            onValueChange={(value) => onContextChange({ ...context, relationship: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {ANALYSIS_RELATIONSHIPS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  <div className="flex flex-col">
                    <span>{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Analysis Depth</Label>
        <RadioGroup
          value={depth}
          onValueChange={(value) => onDepthChange(value as any)}
          className="grid grid-cols-3 gap-3"
        >
          {ANALYSIS_DEPTHS.map((d) => {
            const Icon = depthIcons[d.value as keyof typeof depthIcons];
            return (
              <div key={d.value}>
                <RadioGroupItem
                  value={d.value}
                  id={d.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={d.value}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Icon className="h-5 w-5 mb-2" />
                  <span className="font-medium">{d.label}</span>
                  <span className="text-xs text-muted-foreground text-center">{d.estimatedTime}</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}
