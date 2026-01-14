import { useState } from 'react';
import { useIntelligenceMissions, useMissionEvents } from '@/hooks/useIntelligenceMissions';
import { useHardwareDevices } from '@/hooks/useHardwareDevices';
import { IntelligenceMission, MissionType } from '@/types/hardware';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Target,
  Play,
  Pause,
  Square,
  Plus,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const missionTypeLabels: Record<MissionType, string> = {
  surveillance: 'Surveillance',
  counter_surveillance: 'Counter-Surveillance',
  reconnaissance: 'Reconnaissance',
  signal_collection: 'Signal Collection',
  thermal_sweep: 'Thermal Sweep',
  aerial_recon: 'Aerial Recon',
  perimeter_monitoring: 'Perimeter Monitoring',
  tscm_sweep: 'TSCM Sweep',
};

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-gray-500',
  aborted: 'bg-red-500',
};

export function MissionControl() {
  const { 
    missions, 
    activeMissions, 
    plannedMissions, 
    createMission, 
    updateMissionStatus,
    isLoading 
  } = useIntelligenceMissions();
  const { devices } = useHardwareDevices();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMission, setSelectedMission] = useState<IntelligenceMission | null>(null);
  const [newMission, setNewMission] = useState({
    mission_name: '',
    mission_type: 'surveillance' as MissionType,
    target_location_name: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'critical',
  });

  const handleCreateMission = () => {
    createMission.mutate(newMission, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewMission({
          mission_name: '',
          mission_type: 'surveillance',
          target_location_name: '',
          priority: 'normal',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mission Control</h2>
          <p className="text-muted-foreground">
            {activeMissions.length} active, {plannedMissions.length} planned
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Mission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Intelligence Mission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Mission Name</Label>
                <Input
                  placeholder="Enter mission name"
                  value={newMission.mission_name}
                  onChange={(e) => setNewMission({ ...newMission, mission_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mission Type</Label>
                <Select
                  value={newMission.mission_type}
                  onValueChange={(v) => setNewMission({ ...newMission, mission_type: v as MissionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(missionTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Location</Label>
                <Input
                  placeholder="Enter location name"
                  value={newMission.target_location_name}
                  onChange={(e) => setNewMission({ ...newMission, target_location_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newMission.priority}
                  onValueChange={(v) => setNewMission({ ...newMission, priority: v as typeof newMission.priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateMission}
                disabled={!newMission.mission_name || createMission.isPending}
              >
                Create Mission
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Active Missions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeMissions.map((mission) => (
              <MissionCard 
                key={mission.id} 
                mission={mission} 
                onSelect={() => setSelectedMission(mission)}
                onStatusChange={updateMissionStatus.mutate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Planned Missions */}
      {plannedMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Planned Missions</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {plannedMissions.map((mission) => (
              <MissionCard 
                key={mission.id} 
                mission={mission}
                onSelect={() => setSelectedMission(mission)}
                onStatusChange={updateMissionStatus.mutate}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Missions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">All Missions</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {missions.map((mission) => (
              <Card 
                key={mission.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedMission(mission)}
              >
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${statusColors[mission.status]}`} />
                    <div>
                      <p className="font-medium">{mission.mission_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {missionTypeLabels[mission.mission_type]}
                        {mission.target_location_name && ` • ${mission.target_location_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {mission.status}
                    </Badge>
                    {mission.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(mission.created_at))} ago
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Empty State */}
      {missions.length === 0 && !isLoading && (
        <Card className="py-12">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Missions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first intelligence mission to start operations
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Mission
            </Button>
          </div>
        </Card>
      )}

      {/* Mission Detail Dialog */}
      {selectedMission && (
        <MissionDetailDialog 
          mission={selectedMission} 
          open={!!selectedMission}
          onClose={() => setSelectedMission(null)}
          onStatusChange={updateMissionStatus.mutate}
        />
      )}
    </div>
  );
}

interface MissionCardProps {
  mission: IntelligenceMission;
  onSelect: () => void;
  onStatusChange: (data: { missionId: string; status: IntelligenceMission['status'] }) => void;
}

function MissionCard({ mission, onSelect, onStatusChange }: MissionCardProps) {
  return (
    <Card className={mission.status === 'active' ? 'border-green-500/50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{mission.mission_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {missionTypeLabels[mission.mission_type]}
            </p>
          </div>
          <Badge variant={mission.priority === 'critical' ? 'destructive' : 'outline'} className="capitalize">
            {mission.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mission.target_location_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {mission.target_location_name}
          </div>
        )}
        
        {mission.started_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Started {formatDistanceToNow(new Date(mission.started_at))} ago
          </div>
        )}

        <div className="flex items-center gap-2">
          {mission.status === 'planned' && (
            <Button 
              size="sm" 
              onClick={() => onStatusChange({ missionId: mission.id, status: 'active' })}
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {mission.status === 'active' && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusChange({ missionId: mission.id, status: 'paused' })}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onStatusChange({ missionId: mission.id, status: 'completed' })}
              >
                <Square className="h-4 w-4 mr-1" />
                End
              </Button>
            </>
          )}
          {mission.status === 'paused' && (
            <Button 
              size="sm"
              onClick={() => onStatusChange({ missionId: mission.id, status: 'active' })}
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onSelect}>
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MissionDetailDialogProps {
  mission: IntelligenceMission;
  open: boolean;
  onClose: () => void;
  onStatusChange: (data: { missionId: string; status: IntelligenceMission['status'] }) => void;
}

function MissionDetailDialog({ mission, open, onClose, onStatusChange }: MissionDetailDialogProps) {
  const { data: events = [] } = useMissionEvents(mission.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {mission.mission_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium">{missionTypeLabels[mission.mission_type]}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge className={`${statusColors[mission.status]} text-white capitalize`}>
                {mission.status}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Priority</Label>
              <p className="font-medium capitalize">{mission.priority}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Location</Label>
              <p className="font-medium">{mission.target_location_name || 'Not set'}</p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <Label className="text-muted-foreground">Mission Timeline</Label>
            <ScrollArea className="h-[200px] mt-2">
              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events recorded</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 text-sm">
                      {event.severity === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />}
                      {event.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                      {event.severity === 'info' && <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />}
                      <div className="flex-1">
                        <p className="font-medium capitalize">{event.event_type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {mission.status === 'planned' && (
              <Button onClick={() => onStatusChange({ missionId: mission.id, status: 'active' })}>
                <Play className="h-4 w-4 mr-2" />
                Start Mission
              </Button>
            )}
            {mission.status === 'active' && (
              <Button 
                variant="destructive"
                onClick={() => onStatusChange({ missionId: mission.id, status: 'completed' })}
              >
                <Square className="h-4 w-4 mr-2" />
                End Mission
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
