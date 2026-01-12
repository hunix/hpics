import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Bluetooth, 
  Mic, 
  Camera, 
  Zap, 
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EcosystemService {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'active' | 'inactive' | 'pending' | 'error';
  description: string;
  metrics?: {
    label: string;
    value: string | number;
  }[];
}

interface RecentEvent {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'info' | 'warning';
}

interface EcosystemProgressPanelProps {
  className?: string;
  services?: EcosystemService[];
  recentEvents?: RecentEvent[];
  overallProgress?: number;
}

const DEFAULT_SERVICES: EcosystemService[] = [
  {
    id: 'location',
    name: 'Location Tracking',
    icon: MapPin,
    status: 'active',
    description: 'GPS and geofence monitoring',
    metrics: [
      { label: 'Geofences', value: 12 },
      { label: 'Updates/hr', value: 60 }
    ]
  },
  {
    id: 'bluetooth',
    name: 'Bluetooth Scanning',
    icon: Bluetooth,
    status: 'active',
    description: 'Nearby device detection',
    metrics: [
      { label: 'Known Devices', value: 8 },
      { label: 'Nearby', value: 3 }
    ]
  },
  {
    id: 'speech',
    name: 'Speech Recognition',
    icon: Mic,
    status: 'pending',
    description: 'Ambient audio processing',
    metrics: [
      { label: 'Wake Word', value: 'Hey Intel' },
      { label: 'Sessions', value: 0 }
    ]
  },
  {
    id: 'face',
    name: 'Face Detection',
    icon: Camera,
    status: 'active',
    description: 'Visual contact identification',
    metrics: [
      { label: 'Enrolled', value: 24 },
      { label: 'Matches Today', value: 5 }
    ]
  },
  {
    id: 'automation',
    name: 'Automation Rules',
    icon: Zap,
    status: 'active',
    description: 'Smart trigger execution',
    metrics: [
      { label: 'Active Rules', value: 7 },
      { label: 'Triggered Today', value: 12 }
    ]
  },
  {
    id: 'context',
    name: 'Context Engine',
    icon: Brain,
    status: 'active',
    description: 'Situation awareness AI',
    metrics: [
      { label: 'Confidence', value: '87%' },
      { label: 'Current', value: 'Work' }
    ]
  }
];

const DEFAULT_EVENTS: RecentEvent[] = [
  {
    id: '1',
    type: 'proximity',
    description: 'John Smith detected nearby (Office)',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'success'
  },
  {
    id: '2',
    type: 'context',
    description: 'Context changed: Commute → Work',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    status: 'info'
  },
  {
    id: '3',
    type: 'automation',
    description: 'Rule triggered: Morning briefing notification',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'info'
  }
];

const STATUS_STYLES = {
  active: {
    badge: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle2,
    dot: 'bg-green-500'
  },
  inactive: {
    badge: 'bg-muted text-muted-foreground border-muted',
    icon: Clock,
    dot: 'bg-muted-foreground'
  },
  pending: {
    badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Clock,
    dot: 'bg-yellow-500'
  },
  error: {
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertCircle,
    dot: 'bg-destructive'
  }
};

export function EcosystemProgressPanel({
  className,
  services = DEFAULT_SERVICES,
  recentEvents = DEFAULT_EVENTS,
  overallProgress = 75
}: EcosystemProgressPanelProps) {
  const activeCount = services.filter(s => s.status === 'active').length;

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Ecosystem Health
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {activeCount}/{services.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Intelligence Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => {
              const statusStyle = STATUS_STYLES[service.status];
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={service.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <service.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">{service.name}</span>
                    </div>
                    <div className={cn("h-2 w-2 rounded-full", statusStyle.dot)} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {service.description}
                  </p>
                  {service.metrics && (
                    <div className="flex flex-wrap gap-2">
                      {service.metrics.map((metric, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="text-muted-foreground">{metric.label}: </span>
                          <span className="font-medium">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 text-sm"
              >
                <div className={cn(
                  "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                  event.status === 'success' && "bg-green-500",
                  event.status === 'info' && "bg-blue-500",
                  event.status === 'warning' && "bg-yellow-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{event.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(event.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
