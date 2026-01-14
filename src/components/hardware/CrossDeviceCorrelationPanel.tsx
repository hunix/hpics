import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCrossDeviceCorrelation } from '@/hooks/useCrossDeviceCorrelation';
import { 
  Link2, 
  ChevronDown, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  Cpu,
  Radio,
  Plane,
  Shield,
  Activity,
  GitBranch
} from 'lucide-react';
import { format } from 'date-fns';

const correlationTypeConfig = {
  spatial: { label: 'Spatial', color: 'bg-blue-500' },
  temporal: { label: 'Temporal', color: 'bg-green-500' },
  signal: { label: 'Signal', color: 'bg-purple-500' },
  behavioral: { label: 'Behavioral', color: 'bg-orange-500' },
};

const deviceTypeIcons: Record<string, any> = {
  drone: Plane,
  sdr: Radio,
  sensor: Activity,
  tscm: Shield,
  default: Cpu,
};

export function CrossDeviceCorrelationPanel() {
  const {
    correlations,
    isLoading,
    autoCorrelate,
    isAutoCorrelating,
    verifyCorrelation,
    stats
  } = useCrossDeviceCorrelation();
  
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCorrelations = typeFilter === 'all' 
    ? correlations 
    : correlations.filter(c => c.correlation_type === typeFilter);

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'text-green-500';
    if (strength >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCorrelations}</p>
                <p className="text-sm text-muted-foreground">Total Correlations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verifiedCorrelations}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unverifiedCorrelations}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(Number(stats.averageStrength) * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Avg Strength</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="spatial">Spatial</SelectItem>
              <SelectItem value="temporal">Temporal</SelectItem>
              <SelectItem value="signal">Signal</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => autoCorrelate({ timeframeMinutes: 24 * 60 })} disabled={isAutoCorrelating}>
          {isAutoCorrelating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4 mr-2" />
          )}
          Auto-Correlate (24h)
        </Button>
      </div>

      {/* Correlations List */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Device Correlations</CardTitle>
          <CardDescription>
            Automatically detected relationships between device events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCorrelations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No correlations found</p>
              <p className="text-sm mt-1">Run auto-correlation to detect patterns</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredCorrelations.map(correlation => {
                  const typeConfig = correlationTypeConfig[correlation.correlation_type as keyof typeof correlationTypeConfig] || correlationTypeConfig.behavioral;
                  const sourceEvents = correlation.source_events as any[] || [];
                  const findings = correlation.findings as any || {};

                  return (
                    <Collapsible
                      key={correlation.id}
                      open={expandedId === correlation.id}
                      onOpenChange={() => setExpandedId(expandedId === correlation.id ? null : correlation.id)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-3 w-3 rounded-full ${typeConfig.color}`} />
                              <div>
                                <p className="font-medium">
                                  {typeConfig.label} Correlation
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {sourceEvents.length} linked events
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={`font-bold ${getStrengthColor(correlation.correlation_strength)}`}>
                                  {(correlation.correlation_strength * 100).toFixed(0)}%
                                </p>
                                <p className="text-xs text-muted-foreground">strength</p>
                              </div>
                              {correlation.is_verified ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === correlation.id ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 border-t pt-4 space-y-4">
                            {/* Source Events */}
                            <div>
                              <p className="text-sm font-medium mb-2">Linked Events</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {sourceEvents.map((event, idx) => {
                                  const Icon = deviceTypeIcons[event.device_type] || deviceTypeIcons.default;
                                  return (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{event.event_type}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Overlap Info */}
                            <div className="grid grid-cols-2 gap-4">
                              {correlation.time_overlap_seconds && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Time Overlap</p>
                                  <p className="font-medium">{correlation.time_overlap_seconds}s</p>
                                </div>
                              )}
                              {correlation.location_overlap && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Location Overlap</p>
                                  <p className="font-medium">{(correlation.location_overlap as any)?.distance_meters}m</p>
                                </div>
                              )}
                            </div>

                            {/* Findings */}
                            {findings.summary && (
                              <div>
                                <p className="text-sm font-medium mb-1">Analysis</p>
                                <p className="text-sm text-muted-foreground">{findings.summary}</p>
                              </div>
                            )}

                            {/* Actions */}
                            {!correlation.is_verified && (
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => verifyCorrelation(correlation.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verify Correlation
                                </Button>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
