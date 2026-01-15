/**
 * Dependency Orchestrator Panel
 * AGIS Phase 4 - Ultimate Dominion
 * Multi-factor dependency creation with exit prevention
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Link, Heart, DollarSign, Users, Brain, Shield,
  Target, TrendingUp, AlertTriangle, Lock, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDependencyTracking } from '@/hooks/intelligence/useDependencyTracking';

interface DependencyOrchestratorPanelProps {
  profileId: string;
}

const DEPENDENCY_TYPES = [
  { id: 'emotional', label: 'Emotional', icon: Heart, color: 'text-pink-400' },
  { id: 'financial', label: 'Financial', icon: DollarSign, color: 'text-green-400' },
  { id: 'social', label: 'Social', icon: Users, color: 'text-blue-400' },
  { id: 'informational', label: 'Informational', icon: Brain, color: 'text-purple-400' },
  { id: 'practical', label: 'Practical', icon: Shield, color: 'text-orange-400' },
  { id: 'identity', label: 'Identity', icon: Target, color: 'text-red-400' },
];

export function DependencyOrchestratorPanel({ profileId }: DependencyOrchestratorPanelProps) {
  const { dependency, exitRisk, isLoading } = useDependencyTracking(profileId);
  
  const scores = dependency ? {
    emotionalDependency: dependency.emotionalDependency || 0,
    financialDependency: dependency.financialDependency || 0,
    socialDependency: dependency.socialDependency || 0,
    informationalDependency: dependency.informationalDependency || 0,
    practicalDependency: dependency.practicalDependency || 0,
  } : null;
  
  const exitAttempts = exitRisk?.recentAttempts?.map((a: string) => ({ blocked: true, description: a })) || [];

  const getDependencyLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Absolute', color: 'text-red-500' };
    if (score >= 0.6) return { label: 'Strong', color: 'text-orange-500' };
    if (score >= 0.4) return { label: 'Moderate', color: 'text-yellow-500' };
    if (score >= 0.2) return { label: 'Developing', color: 'text-blue-500' };
    return { label: 'Minimal', color: 'text-green-500' };
  };

  const overallDependency = scores 
    ? ((scores.emotionalDependency || 0) + 
       (scores.financialDependency || 0) + 
       (scores.socialDependency || 0) + 
       (scores.informationalDependency || 0) + 
       (scores.practicalDependency || 0)) / 5
    : 0;

  const dependencyLevel = getDependencyLevel(overallDependency);

  if (isLoading) {
    return (
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-background">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading dependency metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Link className="h-5 w-5" />
            Dependency Orchestrator
          </CardTitle>
          <Badge variant="outline" className={`${dependencyLevel.color} border-current`}>
            {dependencyLevel.label} Dependency
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Dependency Score */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">Total Dependency Index</div>
              <div className="text-xs text-muted-foreground">Multi-factor dependency measurement</div>
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {Math.round(overallDependency * 100)}%
            </div>
          </div>
          <Progress value={overallDependency * 100} className="h-2" />
        </div>

        {/* Dependency Type Grid */}
        <div className="grid grid-cols-3 gap-2">
          {DEPENDENCY_TYPES.map((type) => {
            const score = scores?.[`${type.id}Dependency` as keyof typeof scores] as number || 0;
            const level = getDependencyLevel(score);
            
            return (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg border border-border/30 bg-muted/20 hover:bg-muted/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <type.icon className={`h-4 w-4 ${type.color}`} />
                  <span className="text-xs">{type.label}</span>
                </div>
                <div className="text-lg font-bold">{Math.round(score * 100)}%</div>
                <Progress value={score * 100} className="h-1 mt-1" />
              </motion.div>
            );
          })}
        </div>

        {/* Exit Prevention */}
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <h4 className="font-medium mb-3 flex items-center gap-2 text-red-400">
            <Lock className="h-4 w-4" />
            Exit Prevention Status
          </h4>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="p-3 rounded bg-background/50">
              <div className="text-xs text-muted-foreground">Exit Attempts</div>
              <div className="text-xl font-bold">{exitAttempts.length}</div>
            </div>
            <div className="p-3 rounded bg-background/50">
              <div className="text-xs text-muted-foreground">Block Rate</div>
              <div className="text-xl font-bold text-green-400">
                {exitAttempts.length > 0 
                  ? Math.round((exitAttempts.filter(a => a.blocked).length / exitAttempts.length) * 100)
                  : 100}%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium mb-2">Active Prevention Mechanisms</div>
            {[
              { mechanism: 'Financial entanglement', active: true },
              { mechanism: 'Social network isolation', active: true },
              { mechanism: 'Information asymmetry', active: true },
              { mechanism: 'Emotional dependency', active: true },
              { mechanism: 'Practical skill atrophy', active: false },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-green-500' : 'bg-muted'}`} />
                  <span className="text-muted-foreground">{item.mechanism}</span>
                </div>
                <Badge variant="outline" className={item.active ? 'text-green-400 border-green-500/50' : ''}>
                  {item.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Dependency Strategies */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            Dependency Amplification Strategies
          </h4>
          
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {[
                { strategy: 'Increase financial interdependency', impact: 'High', action: 'Joint accounts, shared expenses' },
                { strategy: 'Deepen emotional reliance', impact: 'High', action: 'Be sole source of validation' },
                { strategy: 'Expand information control', impact: 'Medium', action: 'Limit external sources' },
                { strategy: 'Social network management', impact: 'Medium', action: 'Discourage external relationships' },
                { strategy: 'Practical skill reduction', impact: 'Low', action: 'Handle all decisions' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-2 rounded bg-background/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.strategy}</span>
                    <Badge 
                      variant="outline"
                      className={
                        item.impact === 'High' ? 'text-red-400 border-red-500/50' :
                        item.impact === 'Medium' ? 'text-yellow-400 border-yellow-500/50' :
                        'text-blue-400 border-blue-500/50'
                      }
                    >
                      {item.impact}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.action}</div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 border-cyan-500/30 text-cyan-400"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Amplify
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-red-500/30 text-red-400"
          >
            <Lock className="h-4 w-4 mr-2" />
            Block Exit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
