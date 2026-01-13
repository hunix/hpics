import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scale, TrendingUp, TrendingDown, Minus,
  Shield, Target, Eye, AlertTriangle,
  ChevronRight, Info, Lock, Unlock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PowerDynamicsAnalyzerProps {
  profileId?: string;
  profileName?: string;
  className?: string;
}

interface Dependency {
  type: string;
  description: string;
  strength: number;
  reversible: boolean;
  direction: 'inbound' | 'outbound';
}

interface Leverage {
  type: string;
  description: string;
  usability: number;
  ethical: boolean;
}

export function PowerDynamicsAnalyzer({ 
  profileId, 
  profileName = 'Contact',
  className 
}: PowerDynamicsAnalyzerProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Mock data - would come from AI analysis
  const powerScore: number = 15; // -100 to +100, positive = you have power
  const dependencies: Dependency[] = [
    { 
      type: 'Information', 
      description: 'You have access to industry insights they need', 
      strength: 70, 
      reversible: true,
      direction: 'inbound'
    },
    { 
      type: 'Network', 
      description: 'They can introduce you to key decision makers', 
      strength: 85, 
      reversible: false,
      direction: 'outbound'
    },
    { 
      type: 'Expertise', 
      description: 'Your technical expertise is hard to replace', 
      strength: 60, 
      reversible: true,
      direction: 'inbound'
    }
  ];
  
  const leverage: Leverage[] = [
    { 
      type: 'Time Sensitivity', 
      description: 'Their project has a tight deadline',
      usability: 80,
      ethical: true
    },
    { 
      type: 'Exclusive Access', 
      description: 'You have relationships they cannot easily replicate',
      usability: 65,
      ethical: true
    },
    { 
      type: 'Reputation', 
      description: 'Your endorsement carries significant weight',
      usability: 55,
      ethical: true
    }
  ];

  const getScoreColor = (score: number) => {
    if (score > 20) return 'text-emerald-400';
    if (score > 0) return 'text-emerald-300';
    if (score === 0) return 'text-muted-foreground';
    if (score > -20) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score > 0) return TrendingUp;
    if (score < 0) return TrendingDown;
    return Minus;
  };

  const ScoreIcon = getScoreIcon(powerScore);

  return (
    <Card className={cn("border-border/40", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Scale className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Power Dynamics</CardTitle>
              <CardDescription>Balance of influence with {profileName}</CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p className="text-sm">
                  Power dynamics analysis shows the balance of influence and leverage 
                  in your relationship. Positive scores indicate you have more leverage.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Power Score Gauge */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${Math.abs(powerScore) * 1.76} 352`}
                strokeLinecap="round"
                className={cn(
                  powerScore >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ScoreIcon className={cn("h-6 w-6", getScoreColor(powerScore))} />
              <span className={cn("text-2xl font-bold", getScoreColor(powerScore))}>
                {powerScore > 0 ? '+' : ''}{powerScore}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <Badge 
              variant="outline"
              className={cn(
                powerScore > 20 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : powerScore > -20
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              )}
            >
              {powerScore > 20 ? 'Strong Position' : 
               powerScore > 0 ? 'Slight Advantage' :
               powerScore === 0 ? 'Balanced' :
               powerScore > -20 ? 'Slight Disadvantage' : 'Weak Position'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Dependencies */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            Dependencies
          </h4>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {dependencies.map((dep, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          dep.direction === 'inbound' 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {dep.direction === 'inbound' ? 'They need you' : 'You need them'}
                      </Badge>
                      <span className="text-sm font-medium">{dep.type}</span>
                    </div>
                    {dep.reversible ? (
                      <Unlock className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{dep.description}</p>
                  <Progress value={dep.strength} className="h-1 mt-2" />
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Leverage Points */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-violet-400" />
            Available Leverage
          </h4>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {leverage.map((lev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{lev.type}</span>
                    <div className="flex items-center gap-2">
                      {lev.ethical ? (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          Ethical
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Caution
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{lev.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Usability:</span>
                    <Progress value={lev.usability} className="h-1 flex-1" />
                    <span className="text-xs font-medium">{lev.usability}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full bg-gradient-to-r from-violet-500/10 to-primary/10 hover:from-violet-500/20 hover:to-primary/20"
        >
          <Shield className="h-4 w-4 mr-2" />
          Generate Strategy
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
