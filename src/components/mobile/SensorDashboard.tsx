/**
 * Mobile Sensor Dashboard
 * Real-time display of device sensors and biometric data
 */

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Activity, 
  Heart, 
  Footprints,
  Navigation,
  Gauge,
  Thermometer,
  Battery,
  Wifi,
  Signal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLocationTracking } from '@/hooks/useLocationTracking';

interface SensorData {
  acceleration: { x: number; y: number; z: number } | null;
  rotation: { alpha: number; beta: number; gamma: number } | null;
  battery: { level: number; charging: boolean } | null;
  connection: { type: string; downlink: number } | null;
}

export function SensorDashboard() {
  const { 
    currentLocation, 
    activityType, 
    isTracking, 
    startTracking, 
    stopTracking,
    permissionStatus 
  } = useLocationTracking();
  
  const [sensorData, setSensorData] = useState<SensorData>({
    acceleration: null,
    rotation: null,
    battery: null,
    connection: null
  });

  // Listen to device motion
  useEffect(() => {
    const handleMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (a) {
        setSensorData(prev => ({
          ...prev,
          acceleration: {
            x: a.x ?? 0,
            y: a.y ?? 0,
            z: a.z ?? 0
          }
        }));
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      setSensorData(prev => ({
        ...prev,
        rotation: {
          alpha: e.alpha ?? 0,
          beta: e.beta ?? 0,
          gamma: e.gamma ?? 0
        }
      }));
    };

    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Get battery status — cleanup stored in ref since effect is async
  useEffect(() => {
    let batteryRef: any = null;
    let updateFn: (() => void) | null = null;
    
    const getBattery = async () => {
      try {
        // @ts-expect-error - Battery API is not in TypeScript types
        const battery = await navigator.getBattery?.();
        if (battery) {
          batteryRef = battery;
          updateFn = () => {
            setSensorData(prev => ({
              ...prev,
              battery: {
                level: battery.level * 100,
                charging: battery.charging
              }
            }));
          };
          
          updateFn();
          battery.addEventListener('levelchange', updateFn);
          battery.addEventListener('chargingchange', updateFn);
        }
      } catch (e) {
        // Battery API not available
      }
    };
    
    getBattery();
    
    return () => {
      if (batteryRef && updateFn) {
        batteryRef.removeEventListener('levelchange', updateFn);
        batteryRef.removeEventListener('chargingchange', updateFn);
      }
    };
  }, []);

  // Get network info
  useEffect(() => {
    const updateConnection = () => {
      // @ts-expect-error - Network Information API
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        setSensorData(prev => ({
          ...prev,
          connection: {
            type: conn.effectiveType || 'unknown',
            downlink: conn.downlink || 0
          }
        }));
      }
    };

    updateConnection();
    
    // @ts-expect-error - Connection type is not standard in navigator
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateConnection);
      return () => conn.removeEventListener('change', updateConnection);
    }
  }, []);

  const getActivityIcon = () => {
    switch (activityType) {
      case 'walking': return Footprints;
      case 'running': return Activity;
      case 'cycling': return Navigation;
      case 'driving': return Gauge;
      default: return Activity;
    }
  };

  const ActivityIcon = getActivityIcon();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Device Sensors</CardTitle>
          <Badge 
            variant={isTracking ? 'default' : 'secondary'}
            className={cn(isTracking && 'bg-green-500')}
          >
            {isTracking ? 'Active' : 'Idle'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span>Location</span>
            </div>
            {currentLocation ? (
              <div className="text-sm font-medium">
                <div>{currentLocation.latitude.toFixed(6)}</div>
                <div>{currentLocation.longitude.toFixed(6)}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {permissionStatus === 'denied' ? 'Blocked' : 'Not tracking'}
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ActivityIcon className="h-3.5 w-3.5 text-green-500" />
              <span>Activity</span>
            </div>
            <div className="text-sm font-medium capitalize">
              {activityType || 'Unknown'}
            </div>
            {currentLocation?.speed && (
              <div className="text-xs text-muted-foreground">
                {(currentLocation.speed * 3.6).toFixed(1)} km/h
              </div>
            )}
          </div>
        </div>

        {/* Motion Sensors */}
        {sensorData.acceleration && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Gauge className="h-3.5 w-3.5 text-purple-500" />
              <span>Accelerometer</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">X: </span>
                <span className="font-mono">{sensorData.acceleration.x.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Y: </span>
                <span className="font-mono">{sensorData.acceleration.y.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Z: </span>
                <span className="font-mono">{sensorData.acceleration.z.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Device Status */}
        <div className="grid grid-cols-2 gap-3">
          {sensorData.battery && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Battery className={cn(
                  "h-3.5 w-3.5",
                  sensorData.battery.charging ? "text-green-500" : 
                  sensorData.battery.level < 20 ? "text-red-500" : "text-yellow-500"
                )} />
                <span>Battery</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{Math.round(sensorData.battery.level)}%</span>
                  {sensorData.battery.charging && (
                    <Badge variant="secondary" className="text-[10px] h-4">Charging</Badge>
                  )}
                </div>
                <Progress value={sensorData.battery.level} className="h-1.5" />
              </div>
            </div>
          )}

          {sensorData.connection && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wifi className="h-3.5 w-3.5 text-blue-500" />
                <span>Network</span>
              </div>
              <div className="text-sm font-medium uppercase">
                {sensorData.connection.type}
              </div>
              <div className="text-xs text-muted-foreground">
                {sensorData.connection.downlink} Mbps
              </div>
            </div>
          )}
        </div>

        {/* Location Tracking Toggle */}
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={cn(
            "w-full py-3 rounded-lg font-medium transition-colors",
            isTracking 
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
              : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          )}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </CardContent>
    </Card>
  );
}
