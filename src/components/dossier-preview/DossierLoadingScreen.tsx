/**
 * Dossier Loading Screen (v3.9.20)
 * Premium loading experience with progress indication
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Brain, Shield, Network, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DossierLoadingScreenProps {
  contactName?: string;
}

const LOADING_STAGES = [
  { icon: FileText, label: 'Loading profile data...', duration: 800 },
  { icon: Brain, label: 'Retrieving intelligence analyses...', duration: 1200 },
  { icon: Shield, label: 'Fetching security assessments...', duration: 1000 },
  { icon: Network, label: 'Building relationship map...', duration: 800 },
];

export function DossierLoadingScreen({ contactName }: DossierLoadingScreenProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate through stages
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Update stage based on progress
        if (newProgress > 25 && currentStage < 1) setCurrentStage(1);
        else if (newProgress > 50 && currentStage < 2) setCurrentStage(2);
        else if (newProgress > 75 && currentStage < 3) setCurrentStage(3);
        
        return Math.min(newProgress, 95); // Cap at 95% until actual load completes
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStage]);

  const CurrentIcon = LOADING_STAGES[currentStage]?.icon || Loader2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div 
        className="max-w-md w-full space-y-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Animated Icon */}
        <div className="relative mx-auto w-20 h-20">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <CurrentIcon className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Loading Intelligence Dossier</h2>
          {contactName && (
            <p className="text-muted-foreground">
              Compiling data for <span className="font-medium text-foreground">{contactName}</span>
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{progress}% complete</p>
        </div>

        {/* Stage Indicators */}
        <div className="grid grid-cols-2 gap-3">
          {LOADING_STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = index === currentStage;
            const isComplete = index < currentStage;
            
            return (
              <motion.div
                key={index}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
                  isActive && "bg-primary/10 text-primary",
                  isComplete && "text-emerald-600",
                  !isActive && !isComplete && "text-muted-foreground"
                )}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: isActive || isComplete ? 1 : 0.5 }}
              >
                <StageIcon className={cn(
                  "h-4 w-4",
                  isActive && "animate-spin"
                )} />
                <span className="text-xs truncate">
                  {isComplete ? stage.label.replace('...', ' ✓') : stage.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Tip */}
        <p className="text-xs text-muted-foreground/60">
          Tip: Intelligence dossiers contain up to 124 sections of analyzed data
        </p>
      </motion.div>
    </div>
  );
}
