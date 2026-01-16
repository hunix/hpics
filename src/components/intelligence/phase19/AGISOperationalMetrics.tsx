import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, Zap, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AGISOperationalMetricsProps {
  globalStats: {
    overallHealth: number;
    activePhases: number;
    criticalPhases: number;
    totalOperations: number;
  };
  cascadeStats: {
    totalEvents: number;
    pendingEvents: number;
    activeRules: number;
    totalRules: number;
    averageSynergy: number;
  };
  analyticsStats: {
    activeObjectives: number;
    completedObjectives: number;
    avgCompletion: number;
    phasesWithActivity: number;
  };
}

export function AGISOperationalMetrics({ globalStats, cascadeStats, analyticsStats }: AGISOperationalMetricsProps) {
  const metrics = [
    {
      label: 'System Health',
      value: `${globalStats.overallHealth.toFixed(0)}%`,
      icon: Activity,
      color: globalStats.overallHealth >= 80 ? 'text-emerald-400' : globalStats.overallHealth >= 60 ? 'text-blue-400' : 'text-amber-400',
      progress: globalStats.overallHealth
    },
    {
      label: 'Active Phases',
      value: `${globalStats.activePhases}/18`,
      icon: Zap,
      color: 'text-purple-400',
      progress: (globalStats.activePhases / 18) * 100
    },
    {
      label: 'Cascade Rules',
      value: `${cascadeStats.activeRules}/${cascadeStats.totalRules}`,
      icon: TrendingUp,
      color: 'text-cyan-400',
      progress: cascadeStats.totalRules > 0 ? (cascadeStats.activeRules / cascadeStats.totalRules) * 100 : 0
    },
    {
      label: 'Avg Synergy',
      value: `${cascadeStats.averageSynergy.toFixed(0)}%`,
      icon: Target,
      color: cascadeStats.averageSynergy >= 60 ? 'text-emerald-400' : 'text-amber-400',
      progress: cascadeStats.averageSynergy
    },
    {
      label: 'Active Objectives',
      value: analyticsStats.activeObjectives.toString(),
      icon: Clock,
      color: 'text-orange-400',
      progress: null
    },
    {
      label: 'Completed',
      value: analyticsStats.completedObjectives.toString(),
      icon: CheckCircle,
      color: 'text-emerald-400',
      progress: null
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs text-muted-foreground truncate">{metric.label}</span>
              </div>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              {metric.progress !== null && (
                <Progress value={metric.progress} className="mt-2 h-1" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
