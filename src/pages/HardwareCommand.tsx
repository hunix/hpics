import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHardwareDevices } from '@/hooks/useHardwareDevices';
import { useIntelligenceMissions } from '@/hooks/useIntelligenceMissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Cpu, 
  Target, 
  Radio,
  Thermometer,
  Plane,
  Shield,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { DeviceGrid } from '@/components/hardware/DeviceGrid';
import { MissionControl } from '@/components/hardware/MissionControl';
import { CommandConsole } from '@/components/hardware/CommandConsole';
import { TelemetryFeed } from '@/components/hardware/TelemetryFeed';
import { RegisterDeviceDialog } from '@/components/hardware/RegisterDeviceDialog';
import { AerialOpsPanel } from '@/components/hardware/AerialOpsPanel';
import { TSCMPanel } from '@/components/hardware/TSCMPanel';

export default function HardwareCommand() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { devices, onlineDevices, isLoading: devicesLoading } = useHardwareDevices();
  const { activeMissions } = useIntelligenceMissions();
  const [activeTab, setActiveTab] = useState('devices');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Hardware Command Center</h1>
                  <p className="text-sm text-muted-foreground">
                    {onlineDevices.length} devices online • {activeMissions.length} active missions
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowRegisterDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Register Device
            </Button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">Gateway Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span>{devices.length} Registered Devices</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{activeMissions.length} Active Ops</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="devices" className="gap-2">
              <Cpu className="h-4 w-4" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="missions" className="gap-2">
              <Target className="h-4 w-4" />
              Missions
            </TabsTrigger>
            <TabsTrigger value="console" className="gap-2">
              <Radio className="h-4 w-4" />
              Command Console
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="gap-2">
              <Thermometer className="h-4 w-4" />
              Telemetry
            </TabsTrigger>
            <TabsTrigger value="aerial" className="gap-2">
              <Plane className="h-4 w-4" />
              Aerial Ops
            </TabsTrigger>
            <TabsTrigger value="tscm" className="gap-2">
              <Shield className="h-4 w-4" />
              TSCM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <DeviceGrid devices={devices} isLoading={devicesLoading} />
          </TabsContent>

          <TabsContent value="missions">
            <MissionControl />
          </TabsContent>

          <TabsContent value="console">
            <CommandConsole devices={devices} />
          </TabsContent>

          <TabsContent value="telemetry">
            <TelemetryFeed />
          </TabsContent>

          <TabsContent value="aerial">
            <AerialOpsPanel />
          </TabsContent>

          <TabsContent value="tscm">
            <TSCMPanel />
          </TabsContent>
        </Tabs>
      </main>

      <RegisterDeviceDialog 
        open={showRegisterDialog} 
        onOpenChange={setShowRegisterDialog} 
      />
    </div>
  );
}
