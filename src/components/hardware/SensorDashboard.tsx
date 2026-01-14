import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Thermometer, 
  Volume2, 
  Vibrate,
  Droplets,
  Magnet,
  Wifi,
  Battery,
  AlertCircle,
  RefreshCw,
  Plus,
  Settings,
} from 'lucide-react';
import { useSensorNetwork } from '@/hooks/useSensorNetwork';

const sensorIcons: Record<string, any> = {
  motion: Activity,
  temperature: Thermometer,
  acoustic: Volume2,
  vibration: Vibrate,
  humidity: Droplets,
  magnetic: Magnet,
};

export function SensorDashboard() {
  const { 
    nodes,
    activeNodes,
    inactiveNodes,
    nodesByZone,
    zoneStatus,
    readings,
    realtimeReadings,
    isLoading,
    registerNode,
    isRegistering,
    refetchNodes,
  } = useSensorNetwork();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchNodes();
    setRefreshing(false);
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const allReadings = [...realtimeReadings, ...readings].slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Sensor Network</h2>
          <p className="text-muted-foreground">Distributed IoT sensor monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing || isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button disabled={isRegistering}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Nodes</p>
            <p className="text-2xl font-bold">{nodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Online</p>
            <p className="text-2xl font-bold text-green-500">{activeNodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Offline</p>
            <p className="text-2xl font-bold text-red-500">{inactiveNodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Zones</p>
            <p className="text-2xl font-bold">{Object.keys(nodesByZone).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Recent Readings</p>
            <p className="text-2xl font-bold">{allReadings.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Nodes Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sensor Nodes</CardTitle>
          <CardDescription>
            Real-time status of all connected sensors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nodes.map((node) => {
                const Icon = sensorIcons[node.sensors?.[0]?.type] || Activity;
                const isActive = activeNodes.some(n => n.id === node.id);
                return (
                  <Card key={node.id} className={!isActive ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            isActive ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              isActive ? 'text-green-500' : 'text-red-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{node.node_name || node.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{node.zone_name || 'Unassigned'}</p>
                          </div>
                        </div>
                        <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                          {isActive ? 'online' : 'offline'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Battery className={`h-3 w-3 ${getBatteryColor(node.battery_level || 0)}`} />
                          <span className="text-xs">{node.battery_level || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wifi className={`h-3 w-3 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No sensor nodes registered yet.</p>
              <Button className="mt-4" onClick={() => registerNode({ node_name: 'New Sensor' })}>
                <Plus className="h-4 w-4 mr-2" />
                Register First Node
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Readings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Readings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allReadings.map((reading, index) => {
              const Icon = sensorIcons[reading.sensor_type] || Activity;
              const hasAlert = (reading as any).alert;
              return (
                <div
                  key={reading.id || index}
                  className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 ${
                    hasAlert ? 'border border-red-500/50 bg-red-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {reading.sensor_type} - {reading.node_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reading.recorded_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {typeof reading.value === 'number' 
                          ? reading.value.toFixed(1) 
                          : reading.value}
                        {reading.unit && <span className="text-xs text-muted-foreground ml-1">{reading.unit}</span>}
                      </p>
                    </div>
                    {hasAlert && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}

            {allReadings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No recent readings. Sensors will report data periodically.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
