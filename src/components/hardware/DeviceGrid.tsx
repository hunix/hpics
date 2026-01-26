import { HardwareDevice, DEVICE_CAPABILITIES } from '@/types/hardware';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cpu, 
  Server, 
  Plane, 
  Camera, 
  Thermometer, 
  Radio, 
  Search,
  Wifi,
  Mic,
  MoreVertical,
  Power,
  Settings,
  Trash2,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useHardwareDevices } from '@/hooks/useHardwareDevices';
import { Skeleton } from '@/components/ui/skeleton';

interface DeviceGridProps {
  devices: HardwareDevice[];
  isLoading: boolean;
}

const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  flipper_zero: Cpu,
  raspberry_pi: Server,
  arduino: Cpu,
  drone: Plane,
  thermal_camera: Thermometer,
  spectrum_analyzer: Radio,
  gopro: Camera,
  metal_detector: Search,
  sensor_node: Wifi,
  sdr: Radio,
  dji_mic: Mic,
  // GPU Compute
  gpu_workstation: Server,
  gpu_datacenter: Server,
  ai_laptop: Cpu,
  // Mobile Edge
  tablet_ios: Cpu,
  tablet_android: Cpu,
  phone_android: Cpu,
};

export function DeviceGrid({ devices, isLoading }: DeviceGridProps) {
  const { deleteDevice } = useHardwareDevices();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <Card className="py-12">
        <div className="text-center">
          <Cpu className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Devices Registered</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Register your hardware devices to start building your intelligence network
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {devices.map((device) => {
        const Icon = deviceIcons[device.device_type] || Cpu;
        const capabilities = DEVICE_CAPABILITIES[device.device_type] || [];
        
        return (
          <Card 
            key={device.id} 
            className={`relative transition-all ${
              device.is_online 
                ? 'border-green-500/50 shadow-green-500/10 shadow-lg' 
                : 'opacity-75'
            }`}
          >
            {/* Online indicator */}
            <div className={`absolute top-3 right-12 h-2 w-2 rounded-full ${
              device.is_online ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
            }`} />

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    device.is_online 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                      : 'bg-muted'
                  }`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">
                      {device.device_name || device.device_id}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">
                      {device.device_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Power className="h-4 w-4 mr-2" />
                      {device.is_online ? 'Disconnect' : 'Connect'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Activity className="h-4 w-4 mr-2" />
                      View Telemetry
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => deleteDevice.mutate(device.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Device
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Status info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {device.battery_level !== null && (
                  <div>
                    <span className="text-muted-foreground">Battery:</span>
                    <span className={`ml-1 font-medium ${
                      device.battery_level > 50 ? 'text-green-500' :
                      device.battery_level > 20 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {device.battery_level}%
                    </span>
                  </div>
                )}
                {device.signal_strength !== null && (
                  <div>
                    <span className="text-muted-foreground">Signal:</span>
                    <span className="ml-1 font-medium">{device.signal_strength}%</span>
                  </div>
                )}
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1">
                {capabilities.slice(0, 4).map((cap) => (
                  <Badge key={cap} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {cap.replace('_', ' ')}
                  </Badge>
                ))}
                {capabilities.length > 4 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{capabilities.length - 4}
                  </Badge>
                )}
              </div>

              {/* Last seen */}
              <p className="text-[10px] text-muted-foreground">
                {device.last_seen_at 
                  ? `Last seen ${formatDistanceToNow(new Date(device.last_seen_at))} ago`
                  : 'Never connected'
                }
              </p>

              {/* Location */}
              {device.location_name && (
                <p className="text-xs text-muted-foreground truncate">
                  📍 {device.location_name}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
