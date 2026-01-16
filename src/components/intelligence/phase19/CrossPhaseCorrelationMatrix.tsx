import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PhaseSynergy } from '@/hooks/intelligence/useAGISCascade';

interface CrossPhaseCorrelationMatrixProps {
  synergies: PhaseSynergy[];
  totalPhases?: number;
}

const PHASE_ABBREVIATIONS: Record<number, string> = {
  1: 'COR', 2: 'SUP', 3: 'COG', 4: 'DOM', 5: 'OMN',
  6: 'REA', 7: 'SIN', 8: 'CON', 9: 'INF', 10: 'TRA',
  11: 'SOV', 12: 'ABS', 13: 'GEN', 14: 'COS', 15: 'ETE',
  16: 'TOT', 17: 'OME', 18: 'UNI'
};

export function CrossPhaseCorrelationMatrix({ synergies, totalPhases = 18 }: CrossPhaseCorrelationMatrixProps) {
  const matrix = useMemo(() => {
    const grid: Record<string, number> = {};
    
    synergies.forEach(s => {
      grid[`${s.phaseA}-${s.phaseB}`] = s.synergyScore;
      grid[`${s.phaseB}-${s.phaseA}`] = s.synergyScore;
    });
    
    return grid;
  }, [synergies]);

  const phases = Array.from({ length: totalPhases }, (_, i) => i + 1);

  const getColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    if (score > 0) return 'bg-red-500';
    return 'bg-muted/20';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row */}
        <div className="flex">
          <div className="w-10 h-8" />
          {phases.map(p => (
            <div 
              key={p} 
              className="w-8 h-8 flex items-center justify-center text-[10px] font-bold text-muted-foreground"
            >
              {PHASE_ABBREVIATIONS[p]}
            </div>
          ))}
        </div>
        
        {/* Matrix rows */}
        {phases.map((rowPhase, rowIndex) => (
          <div key={rowPhase} className="flex">
            <div className="w-10 h-8 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {PHASE_ABBREVIATIONS[rowPhase]}
            </div>
            {phases.map((colPhase, colIndex) => {
              const score = rowPhase === colPhase ? 100 : (matrix[`${rowPhase}-${colPhase}`] || 0);
              const isDiagonal = rowPhase === colPhase;
              
              return (
                <motion.div
                  key={colPhase}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (rowIndex * phases.length + colIndex) * 0.002 }}
                  className={cn(
                    'w-8 h-8 m-[1px] rounded-sm flex items-center justify-center text-[9px] font-medium transition-all',
                    'hover:scale-125 hover:z-10 cursor-pointer',
                    getColor(score),
                    isDiagonal && 'opacity-50'
                  )}
                  style={{ opacity: isDiagonal ? 0.3 : Math.max(0.2, score / 100) }}
                  title={`P${rowPhase} ↔ P${colPhase}: ${score}%`}
                >
                  {score > 0 && !isDiagonal && score}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>High (80%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Good (60-79%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Moderate (40-59%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Low (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
}
