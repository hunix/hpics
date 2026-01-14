import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeviceHealthMonitoring } from '@/hooks/useDeviceHealthMonitoring';
import { useHardwareDevices } from '@/hooks/useHardwareDevices';
import { 
  Heart, 
  Battery, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Wrench,
  Activity,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const healthStatusConfig = {
  healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Healthy' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Warning' },
  critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Critical' },
};

export function DeviceHealthMonitor() {
  const { devices } = useHardwareDevices();
  const { 
    healthChecks, 
    devicesNeedingMaintenance,
    devicesWithHealth,
    isLoading,
    runHealthCheck,
    isRunningCheck
  } = useDeviceHealthMonitoring();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const getDeviceHealth = (deviceId: string) => {
    return healthChecks.find(h => h.device_id === deviceId);
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null) return 'text-muted-foreground';
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const criticalDevices = (devicesWithHealth || []).filter(d => d.current_status === 'critical');
  const warningDevices = (devicesWithHealth || []).filter(d => d.current_status === 'warning');

  return (
    <div className="space-y-6">
      {/* Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(devicesWithHealth || []).length - criticalDevices.length - warningDevices.length}</p>
                <p className="text-sm text-muted-foreground">Healthy Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningDevices.length}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalDevices.length}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{devicesNeedingMaintenance.length}</p>
              <p className="text-sm text-muted-foreground">Maintenance Due</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="battery">Battery Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Health Status</CardTitle>
              <CardDescription>Real-time health monitoring for all registered devices</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {(devicesWithHealth || []).map(device => {
                      const health = getDeviceHealth(device.device_id);
                      const status = device.current_status || 'healthy';
                      const config = healthStatusConfig[status as keyof typeof healthStatusConfig] || healthStatusConfig.healthy;
                      const StatusIcon = config.icon;

                      return (
                        <div
                          key={device.device_id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedDevice === device.device_id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedDevice(device.device_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center`}>
                                <StatusIcon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div>
                                <p className="font-medium">{device.device_name}</p>
                                <p className="text-sm text-muted-foreground">{device.device_type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {device.battery_level !== undefined && device.battery_level !== null && (
                                <div className="flex items-center gap-1">
                                  <Battery className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
                                  <span className="text-sm">{device.battery_level}%</span>
                                </div>
                              )}
                              <Badge variant={status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}>
                                {config.label}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runHealthCheck({ deviceId: device.device_id });
                                }}
                                disabled={isRunningCheck}
                              >
                                <Activity className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {health && (
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Health Score</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={health.health_score} className="h-2" />
                                  <span>{health.health_score}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Last Check</p>
                                <p>{format(new Date(health.created_at), 'MMM d, HH:mm')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Check Type</p>
                                <p className="capitalize">{health.check_type}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Devices requiring maintenance attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {devicesNeedingMaintenance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No maintenance required</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {devicesNeedingMaintenance.map(device => (
                      <div key={device.device_id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{device.device_name}</p>
                            <p className="text-sm text-muted-foreground">{device.device_type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">
                              Due: {device.maintenance_due_at ? format(new Date(device.maintenance_due_at), 'MMM d, yyyy') : 'Now'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="battery" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Battery Levels</CardTitle>
              <CardDescription>Monitor power status across all devices</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {devices
                    .filter(d => d.battery_level !== null)
                    .sort((a, b) => (a.battery_level || 0) - (b.battery_level || 0))
                    .map(device => (
                      <div key={device.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
                            <span className="font-medium">{device.device_name}</span>
                          </div>
                          <span className={`font-bold ${getBatteryColor(device.battery_level)}`}>
                            {device.battery_level}%
                          </span>
                        </div>
                        <Progress 
                          value={device.battery_level || 0} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  {devices.filter(d => d.battery_level !== null).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Battery className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No battery-powered devices</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
