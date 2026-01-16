import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PhaseHealthScore } from '@/hooks/intelligence/useAGISGlobalState';
import { getPhaseConfig, getStatusColor } from '@/lib/agis/phaseConfig';
import { ChevronLeft, ChevronRight, Zap, Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MobileAGISCommandCardProps {
  phaseHealthScores: Record<string, PhaseHealthScore>;
  onPhaseSelect?: (phase: number) => void;
  className?: string;
}

export function MobileAGISCommandCard({ 
  phaseHealthScores, 
  onPhaseSelect,
  className 
}: MobileAGISCommandCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const phases = Object.values(phaseHealthScores);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : phases.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < phases.length - 1 ? prev + 1 : 0));
  };

  if (phases.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          No phase data available
        </CardContent>
      </Card>
    );
  }

  const currentPhase = phases[currentIndex];
  const phaseConfig = getPhaseConfig(currentPhase.phase);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <div className="text-xs text-muted-foreground">
              Phase {currentPhase.phase} of {phases.length}
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase.phase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Phase Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{currentPhase.name}</h3>
              {phaseConfig && (
                <p className="text-xs text-muted-foreground mt-1">
                  {phaseConfig.description}
                </p>
              )}
            </div>

            {/* Health Score */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getStatusColor(currentPhase.status)}`}>
                  {currentPhase.health}%
                </div>
                <Badge 
                  variant={currentPhase.status === 'optimal' ? 'default' : 
                           currentPhase.status === 'stable' ? 'secondary' : 
                           currentPhase.status === 'degraded' ? 'outline' : 'destructive'}
                  className="mt-1"
                >
                  {currentPhase.status}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{currentPhase.activeOperations}</div>
                  <div className="text-xs text-muted-foreground">Active Ops</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium truncate">
                    {currentPhase.lastActivity 
                      ? formatDistanceToNow(new Date(currentPhase.lastActivity), { addSuffix: true })
                      : 'Never'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Last Activity</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {onPhaseSelect && (
              <Button 
                className="w-full" 
                onClick={() => onPhaseSelect(currentPhase.phase)}
              >
                Open Phase {currentPhase.phase} Console
              </Button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-1 mt-4">
          {phases.slice(0, 18).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
