import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Activity, 
  Footprints, 
  Moon, 
  Brain,
  Flame,
  RefreshCw,
  Bluetooth,
  BluetoothOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBiometricStream } from '@/hooks/useBiometricStream';
import { cn } from '@/lib/utils';

interface BiometricMonitorProps {
  compact?: boolean;
  className?: string;
}

export function BiometricMonitor({ 
  compact = false,
  className 
}: BiometricMonitorProps) {
  const {
    summary,
    isConnected,
    lastSync,
    fetchRecent,
    syncFromWearable,
  } = useBiometricStream();

  const getStressColor = () => {
    switch (summary.stress.level) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSleepColor = () => {
    switch (summary.sleep.quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const handleSync = async () => {
    await syncFromWearable('samsung_galaxy_watch');
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {/* Heart Rate */}
        <div className="flex items-center gap-1.5">
          <Heart className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">
            {summary.heartRate.current ?? '--'}
          </span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1.5">
          <Footprints className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">
            {summary.steps.today.toLocaleString()}
          </span>
        </div>

        {/* Connection Status */}
        {isConnected ? (
          <Bluetooth className="h-4 w-4 text-blue-500" />
        ) : (
          <BluetoothOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Biometrics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1",
                isConnected 
                  ? "text-green-500 border-green-500/30" 
                  : "text-muted-foreground"
              )}
            >
              {isConnected ? (
                <Bluetooth className="h-3 w-3" />
              ) : (
                <BluetoothOff className="h-3 w-3" />
              )}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Heart Rate */}
        <motion.div 
          className="p-3 bg-red-500/10 rounded-lg"
          animate={summary.heartRate.current ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">Heart Rate</span>
            </div>
            <span className="text-2xl font-bold text-red-500">
              {summary.heartRate.current ?? '--'}
              <span className="text-sm font-normal ml-1">bpm</span>
            </span>
          </div>
          {summary.heartRate.min !== null && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {summary.heartRate.min}</span>
              <span>Avg: {summary.heartRate.avg}</span>
              <span>Max: {summary.heartRate.max}</span>
            </div>
          )}
        </motion.div>

        {/* Steps */}
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Footprints className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Steps</span>
            </div>
            <span className="text-lg font-bold">
              {summary.steps.today.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                / {summary.steps.goal.toLocaleString()}
              </span>
            </span>
          </div>
          <Progress 
            value={(summary.steps.today / summary.steps.goal) * 100} 
            className="h-2"
          />
        </div>

        {/* Stress & Activity Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Stress */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Brain className={cn("h-4 w-4", getStressColor())} />
              <span className="text-xs font-medium">Stress</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-xl font-bold", getStressColor())}>
                {summary.stress.current ?? '--'}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {summary.stress.level}
              </span>
            </div>
          </div>

          {/* Calories */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium">Calories</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-orange-500">
                {summary.activity.calories}
              </span>
              <span className="text-xs text-muted-foreground">kcal</span>
            </div>
          </div>
        </div>

        {/* Sleep */}
        <div className="p-3 bg-purple-500/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Last Night's Sleep</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold">
                {summary.sleep.lastNight !== null 
                  ? `${summary.sleep.lastNight}h`
                  : '--'
                }
              </span>
              <Badge 
                variant="outline" 
                className={cn("ml-2", getSleepColor())}
              >
                {summary.sleep.quality}
              </Badge>
            </div>
          </div>
        </div>

        {/* Last Sync */}
        {lastSync && (
          <p className="text-xs text-center text-muted-foreground">
            Last synced: {lastSync.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
