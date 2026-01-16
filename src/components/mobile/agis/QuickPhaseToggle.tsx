import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PhaseHealthScore } from '@/hooks/intelligence/useAGISGlobalState';
import { getStatusColor } from '@/lib/agis/phaseConfig';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Loader2 } from 'lucide-react';

interface QuickPhaseToggleProps {
  phaseHealthScores: Record<string, PhaseHealthScore>;
  onToggle?: (phase: number, enabled: boolean) => Promise<void>;
  className?: string;
}

export function QuickPhaseToggle({ 
  phaseHealthScores, 
  onToggle,
  className 
}: QuickPhaseToggleProps) {
  const [loadingPhases, setLoadingPhases] = useState<Set<number>>(new Set());
  const [enabledPhases, setEnabledPhases] = useState<Set<number>>(
    new Set(Object.values(phaseHealthScores)
      .filter(p => p.activeOperations > 0)
      .map(p => p.phase))
  );

  const phases = Object.values(phaseHealthScores).slice(0, 9); // Show first 9 for mobile

  const handleToggle = async (phase: number) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }

    const newEnabled = !enabledPhases.has(phase);
    
    setLoadingPhases(prev => new Set(prev).add(phase));
    
    try {
      if (onToggle) {
        await onToggle(phase, newEnabled);
      }
      
      setEnabledPhases(prev => {
        const next = new Set(prev);
        if (newEnabled) {
          next.add(phase);
        } else {
          next.delete(phase);
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to toggle phase:', error);
    } finally {
      setLoadingPhases(prev => {
        const next = new Set(prev);
        next.delete(phase);
        return next;
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Quick Phase Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {phases.map(phase => (
          <motion.div
            key={phase.phase}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(phase.status)} border-current`}
              >
                P{phase.phase}
              </Badge>
              <span className="text-sm truncate">{phase.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {phase.health}%
              </span>
              {loadingPhases.has(phase.phase) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Switch
                  checked={enabledPhases.has(phase.phase)}
                  onCheckedChange={() => handleToggle(phase.phase)}
                  disabled={loadingPhases.has(phase.phase)}
                />
              )}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
