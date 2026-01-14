import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    getNetworkStatus, 
    getReadings, 
    registerNode,
    isRegistering,
  } = useSensorNetwork();

  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    const status = await getNetworkStatus();
    if (status) {
      setNetworkStatus(status);
    }
    const sensorReadings = await getReadings();
    if (sensorReadings) {
      setReadings(sensorReadings);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Sensor Network</h2>
          <p className="text-muted-foreground">Distributed IoT sensor monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Network Overview */}
      {networkStatus && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Nodes</p>
              <p className="text-2xl font-bold">{networkStatus.total_nodes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-green-500">{networkStatus.online_nodes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold text-red-500">{networkStatus.offline_nodes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-orange-500">{networkStatus.alerts_active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Mesh Health</p>
              <p className="text-2xl font-bold">{Math.round(networkStatus.mesh_health * 100)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sensor Nodes Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sensor Nodes</CardTitle>
          <CardDescription>
            Real-time status of all connected sensors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {networkStatus?.nodes?.map((node: any) => {
              const Icon = sensorIcons[node.type] || Activity;
              return (
                <Card key={node.id} className={node.status === 'offline' ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          node.status === 'online' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            node.status === 'online' ? 'text-green-500' : 'text-red-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{node.name}</p>
                          <p className="text-xs text-muted-foreground">{node.type}</p>
                        </div>
                      </div>
                      <Badge variant={node.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                        {node.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Battery className={`h-3 w-3 ${getBatteryColor(node.battery)}`} />
                        <span className="text-xs">{node.battery}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wifi className={`h-3 w-3 ${node.status === 'online' ? 'text-green-500' : 'text-muted-foreground'}`} />
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
            {readings.map((reading, index) => {
              const Icon = sensorIcons[reading.sensor_type] || Activity;
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 ${
                    reading.alert ? 'border border-red-500/50 bg-red-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {reading.sensor_type} - {reading.node_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reading.timestamp).toLocaleTimeString()}
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
                    {reading.alert && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}

            {readings.length === 0 && (
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
