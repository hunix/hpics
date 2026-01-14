import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plane, 
  MapPin, 
  Camera, 
  Video, 
  Play, 
  Pause, 
  RotateCcw,
  Battery,
  Wifi,
  Navigation,
  Target,
  Eye,
  Plus,
} from 'lucide-react';
import { useAerialIntelligence } from '@/hooks/useAerialIntelligence';
import { AerialMissionPlanner } from './AerialMissionPlanner';
import { GoProControl } from './GoProControl';

export function AerialOpsPanel() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const { missions, missionsLoading, isCreating, isStarting } = useAerialIntelligence();
  const [showMissionPlanner, setShowMissionPlanner] = useState(false);

  const activeMissions = missions?.filter(m => m.status === 'active') || [];
  const completedMissions = missions?.filter(m => m.status === 'completed') || [];

  // Mock drone status
  const droneStatus = {
    name: 'Recon-1 (DJI Mavic 3)',
    status: 'ready',
    battery: 87,
    signal: 95,
    altitude: 0,
    speed: 0,
    gpsLock: true,
    homeDistance: 0,
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="missions" className="gap-2">
            <Target className="h-4 w-4" />
            Missions
          </TabsTrigger>
          <TabsTrigger value="planner" className="gap-2">
            <MapPin className="h-4 w-4" />
            Mission Planner
          </TabsTrigger>
          <TabsTrigger value="gopro" className="gap-2">
            <Camera className="h-4 w-4" />
            GoPro Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Drone Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>{droneStatus.name}</CardTitle>
                    <CardDescription>Primary reconnaissance platform</CardDescription>
                  </div>
                </div>
                <Badge variant={droneStatus.status === 'ready' ? 'default' : 'secondary'}>
                  {droneStatus.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{droneStatus.battery}% Battery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{droneStatus.signal}% Signal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">{droneStatus.altitude}m Alt</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{droneStatus.gpsLock ? 'GPS Lock' : 'No GPS'}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Launch
                </Button>
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Hover
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  RTH
                </Button>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Record
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Missions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeMissions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedMissions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Flight Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5h</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Aerial Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {missionsLoading ? (
                <p className="text-muted-foreground">Loading missions...</p>
              ) : missions && missions.length > 0 ? (
                <div className="space-y-2">
                  {missions.slice(0, 5).map((mission) => (
                    <div
                      key={mission.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Plane className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            Mission {mission.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mission.waypoints?.length || 0} waypoints
                          </p>
                        </div>
                      </div>
                      <Badge variant={mission.status === 'active' ? 'default' : 'secondary'}>
                        {mission.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No aerial missions yet. Create one to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mission Queue</h3>
            <Button onClick={() => setActiveSubTab('planner')}>
              <Plus className="h-4 w-4 mr-2" />
              New Mission
            </Button>
          </div>

          <div className="space-y-4">
            {missions && missions.length > 0 ? (
              missions.map((mission) => (
                <Card key={mission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Mission {mission.id.slice(0, 8)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {mission.waypoints?.length || 0} waypoints • {mission.flight_mode || 'Standard'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={mission.status === 'active' ? 'default' : 'secondary'}>
                          {mission.status}
                        </Badge>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">No missions planned</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first aerial reconnaissance mission
                  </p>
                  <Button onClick={() => setActiveSubTab('planner')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Mission
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="planner">
          <AerialMissionPlanner />
        </TabsContent>

        <TabsContent value="gopro">
          <GoProControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}
