import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plane, 
  MapPin, 
  Plus, 
  Trash2, 
  Camera, 
  Video, 
  Timer,
  Navigation,
  Settings2,
  Play,
  Save
} from 'lucide-react';
import { useAerialIntelligence, Waypoint, MissionPlan } from '@/hooks/useAerialIntelligence';
import { useHardwareDevices } from '@/hooks/useHardwareDevices';

interface AerialMissionPlannerProps {
  onMissionCreated?: () => void;
}

export function AerialMissionPlanner({ onMissionCreated }: AerialMissionPlannerProps) {
  const { createMission, isCreating } = useAerialIntelligence();
  const { devices } = useHardwareDevices();
  
  const drones = devices.filter(d => d.device_type === 'drone');

  const [missionName, setMissionName] = useState('');
  const [selectedDrone, setSelectedDrone] = useState<string>('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [settings, setSettings] = useState({
    max_altitude_meters: 120,
    max_speed_mps: 15,
    return_to_home: true,
    obstacle_avoidance: true,
    camera_mode: 'photo' as 'photo' | 'video' | 'timelapse',
    photo_interval_seconds: 5,
    video_resolution: '4k' as '4k' | '2.7k' | '1080p'
  });

  const addWaypoint = () => {
    setWaypoints([...waypoints, {
      latitude: 0,
      longitude: 0,
      altitude_meters: settings.max_altitude_meters,
      speed_mps: settings.max_speed_mps,
      heading_degrees: 0,
      gimbal_pitch_degrees: -45,
      actions: [],
      hover_time_seconds: 0
    }]);
  };

  const updateWaypoint = (index: number, field: keyof Waypoint, value: number) => {
    const updated = [...waypoints];
    updated[index] = { ...updated[index], [field]: value };
    setWaypoints(updated);
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const addWaypointAction = (waypointIndex: number, actionType: 'photo' | 'video_start' | 'video_stop' | 'hover') => {
    const updated = [...waypoints];
    if (!updated[waypointIndex].actions) {
      updated[waypointIndex].actions = [];
    }
    updated[waypointIndex].actions!.push({ type: actionType });
    setWaypoints(updated);
  };

  const handleCreateMission = () => {
    if (!missionName || !selectedDrone || waypoints.length === 0) return;

    const plan: MissionPlan = {
      name: missionName,
      waypoints,
      settings
    };

    createMission({
      drone_device_id: selectedDrone,
      plan
    }, {
      onSuccess: () => {
        setMissionName('');
        setWaypoints([]);
        onMissionCreated?.();
      }
    });
  };

  const calculateTotalDistance = () => {
    if (waypoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const R = 6371000;
      const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
      const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return Math.round(total);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Aerial Mission Planner
        </CardTitle>
        <CardDescription>
          Plan autonomous drone reconnaissance missions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Basics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mission Name</Label>
            <Input 
              placeholder="Target Surveillance Alpha"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Drone</Label>
            <Select value={selectedDrone} onValueChange={setSelectedDrone}>
              <SelectTrigger>
                <SelectValue placeholder="Select drone" />
              </SelectTrigger>
              <SelectContent>
                {drones.map(drone => (
                  <SelectItem key={drone.id} value={drone.id}>
                    {drone.device_name}
                  </SelectItem>
                ))}
                {drones.length === 0 && (
                  <SelectItem value="none" disabled>
                    No drones registered
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Flight Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <h4 className="font-medium">Flight Settings</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Altitude (m)</Label>
              <Input 
                type="number"
                value={settings.max_altitude_meters}
                onChange={(e) => setSettings({ ...settings, max_altitude_meters: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Speed (m/s)</Label>
              <Input 
                type="number"
                value={settings.max_speed_mps}
                onChange={(e) => setSettings({ ...settings, max_speed_mps: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Camera Mode</Label>
              <Select 
                value={settings.camera_mode} 
                onValueChange={(v) => setSettings({ ...settings, camera_mode: v as 'photo' | 'video' | 'timelapse' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" /> Photo
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" /> Video
                    </div>
                  </SelectItem>
                  <SelectItem value="timelapse">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4" /> Timelapse
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch 
                checked={settings.return_to_home}
                onCheckedChange={(v) => setSettings({ ...settings, return_to_home: v })}
              />
              <Label>Return to Home</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={settings.obstacle_avoidance}
                onCheckedChange={(v) => setSettings({ ...settings, obstacle_avoidance: v })}
              />
              <Label>Obstacle Avoidance</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Waypoints */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              <h4 className="font-medium">Waypoints ({waypoints.length})</h4>
            </div>
            <Button variant="outline" size="sm" onClick={addWaypoint}>
              <Plus className="h-4 w-4 mr-1" />
              Add Waypoint
            </Button>
          </div>

          {waypoints.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {waypoints.map((wp, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => removeWaypoint(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">Latitude</Label>
                        <Input 
                          type="number"
                          step="0.000001"
                          className="h-8 text-xs"
                          value={wp.latitude}
                          onChange={(e) => updateWaypoint(index, 'latitude', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Longitude</Label>
                        <Input 
                          type="number"
                          step="0.000001"
                          className="h-8 text-xs"
                          value={wp.longitude}
                          onChange={(e) => updateWaypoint(index, 'longitude', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Altitude (m)</Label>
                        <Input 
                          type="number"
                          className="h-8 text-xs"
                          value={wp.altitude_meters}
                          onChange={(e) => updateWaypoint(index, 'altitude_meters', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Gimbal (°)</Label>
                        <Input 
                          type="number"
                          className="h-8 text-xs"
                          value={wp.gimbal_pitch_degrees}
                          onChange={(e) => updateWaypoint(index, 'gimbal_pitch_degrees', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-1 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => addWaypointAction(index, 'photo')}
                      >
                        <Camera className="h-3 w-3 mr-1" /> Photo
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => addWaypointAction(index, 'video_start')}
                      >
                        <Video className="h-3 w-3 mr-1" /> Record
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => addWaypointAction(index, 'hover')}
                      >
                        <Timer className="h-3 w-3 mr-1" /> Hover
                      </Button>
                    </div>

                    {wp.actions && wp.actions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {wp.actions.map((action, aIndex) => (
                          <Badge key={aIndex} variant="secondary" className="text-xs">
                            {action.type}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No waypoints added yet</p>
              <p className="text-xs">Click "Add Waypoint" to define the flight path</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Summary */}
        {waypoints.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4">
              <span>Distance: <strong>{calculateTotalDistance()}m</strong></span>
              <span>Est. Time: <strong>{Math.ceil(calculateTotalDistance() / (settings.max_speed_mps * 0.7) / 60)}min</strong></span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1"
            onClick={handleCreateMission}
            disabled={!missionName || !selectedDrone || waypoints.length === 0 || isCreating}
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Save Mission'}
          </Button>
          <Button 
            variant="secondary"
            onClick={handleCreateMission}
            disabled={!missionName || !selectedDrone || waypoints.length === 0 || isCreating}
          >
            <Play className="h-4 w-4 mr-2" />
            Save & Launch
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
