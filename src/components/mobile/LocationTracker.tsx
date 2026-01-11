import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Activity, 
  Footprints,
  Pause,
  Play,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { cn } from '@/lib/utils';

interface LocationTrackerProps {
  profileId?: string;
  compact?: boolean;
  className?: string;
}

export function LocationTracker({ 
  profileId, 
  compact = false,
  className 
}: LocationTrackerProps) {
  const [showDetails, setShowDetails] = useState(!compact);
  const [highAccuracy, setHighAccuracy] = useState(true);

  const {
    isTracking,
    currentLocation,
    activityType,
    permissionStatus,
    startTracking,
    stopTracking,
    getCurrentPosition,
  } = useLocationTracking({
    profileId,
    enableHighAccuracy: highAccuracy,
  });

  const getActivityIcon = () => {
    switch (activityType) {
      case 'walking': return <Footprints className="h-4 w-4" />;
      case 'running': return <Activity className="h-4 w-4" />;
      case 'driving': return <Navigation className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getActivityColor = () => {
    switch (activityType) {
      case 'walking': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'running': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'driving': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'stationary': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant={isTracking ? "destructive" : "default"}
          size="sm"
          onClick={isTracking ? stopTracking : startTracking}
          className="touch-target"
        >
          {isTracking ? (
            <>
              <Pause className="h-4 w-4 mr-1" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Track
            </>
          )}
        </Button>
        
        {isTracking && currentLocation && (
          <Badge variant="outline" className={cn("gap-1", getActivityColor())}>
            {getActivityIcon()}
            {activityType}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location Tracking
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 w-8"
          >
            {showDetails ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-3 w-3 rounded-full",
              isTracking ? "bg-green-500 animate-pulse" : "bg-muted"
            )} />
            <span className="text-sm">
              {isTracking ? 'Tracking Active' : 'Tracking Paused'}
            </span>
          </div>

          <Button
            variant={isTracking ? "destructive" : "default"}
            size="sm"
            onClick={isTracking ? stopTracking : startTracking}
            disabled={permissionStatus === 'denied'}
            className="touch-target"
          >
            {isTracking ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>

        {permissionStatus === 'denied' && (
          <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            Location permission denied. Please enable in your device settings.
          </div>
        )}

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Current Location */}
              {currentLocation && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Current Position
                    </span>
                    <Badge variant="outline" className={cn("gap-1", getActivityColor())}>
                      {getActivityIcon()}
                      {activityType}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latitude</span>
                      <p className="font-mono">{currentLocation.latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Longitude</span>
                      <p className="font-mono">{currentLocation.longitude.toFixed(6)}</p>
                    </div>
                    {currentLocation.speed !== null && (
                      <div>
                        <span className="text-muted-foreground">Speed</span>
                        <p className="font-mono">{(currentLocation.speed * 3.6).toFixed(1)} km/h</p>
                      </div>
                    )}
                    {currentLocation.accuracy !== null && (
                      <div>
                        <span className="text-muted-foreground">Accuracy</span>
                        <p className="font-mono">±{currentLocation.accuracy.toFixed(0)}m</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="high-accuracy">High Accuracy</Label>
                    <p className="text-xs text-muted-foreground">
                      Uses GPS for precise location (uses more battery)
                    </p>
                  </div>
                  <Switch
                    id="high-accuracy"
                    checked={highAccuracy}
                    onCheckedChange={setHighAccuracy}
                  />
                </div>
              </div>

              {/* Quick Get Location */}
              {!isTracking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentPosition}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Current Location
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
