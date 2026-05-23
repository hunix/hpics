import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Siren, CheckCircle, Clock, ArrowRight, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invokeFunction } from '@/lib/api';

interface CrisisEvent {
  id: string;
  crisis_type: string;
  severity_level: string;
  status: string;
  detected_at: string;
  current_phase?: string;
  response_actions?: any[];
}

interface PlaybookPhase {
  name: string;
  duration: string;
  actions: string[];
}

export function CrisisResponsePanel() {
  const [activeEvents, setActiveEvents] = useState<CrisisEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInitiate, setShowInitiate] = useState(false);
  const [newCrisis, setNewCrisis] = useState({ type: '', severity: 'medium', assessment: '' });
  const [currentPlaybook, setCurrentPlaybook] = useState<{ phases: PlaybookPhase[]; immediateActions: string[] } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  const fetchActiveEvents = async () => {
    try {
      const { data, error } = await invokeFunction('crisis-response-orchestrator', { action: 'get_status' });

      if (error) throw error;
      setActiveEvents(data.activeEvents || []);
    } catch (error) {
      console.error('Failed to fetch crisis events:', error);
    }
  };

  const initiateCrisis = async () => {
    if (!newCrisis.type) {
      toast({ title: 'Error', description: 'Select a crisis type', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await invokeFunction('crisis-response-orchestrator', {
          action: 'initiate',
          crisisType: newCrisis.type,
          severity: newCrisis.severity,
          details: { assessment: newCrisis.assessment }
        });

      if (error) throw error;

      setCurrentPlaybook(data.playbook);
      setActiveEvents(prev => [data.crisis, ...prev]);
      setShowInitiate(false);
      setNewCrisis({ type: '', severity: 'medium', assessment: '' });

      toast({
        title: 'Crisis Response Initiated',
        description: `${data.playbook.immediateActions.length} immediate actions generated`
      });
    } catch (error) {
      console.error('Crisis initiation error:', error);
      toast({ title: 'Error', description: 'Failed to initiate crisis response', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resolveCrisis = async (eventId: string) => {
    try {
      await invokeFunction('crisis-response-orchestrator', {
          action: 'resolve',
          eventId,
          details: { summary: 'Resolved via dashboard' }
        });

      setActiveEvents(prev => prev.filter(e => e.id !== eventId));
      toast({ title: 'Crisis Resolved', description: 'Event has been marked as resolved' });
    } catch (error) {
      console.error('Resolution error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getCrisisIcon = (type: string) => {
    switch (type) {
      case 'physical_threat': return <AlertTriangle className="h-4 w-4" />;
      case 'data_breach': return <Shield className="h-4 w-4" />;
      default: return <Siren className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-destructive" />
                Crisis Response Center
              </CardTitle>
              <CardDescription>
                Manage active crisis events and response protocols
              </CardDescription>
            </div>
            <Button 
              variant={showInitiate ? "outline" : "destructive"}
              onClick={() => setShowInitiate(!showInitiate)}
            >
              {showInitiate ? 'Cancel' : 'Initiate Crisis Response'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showInitiate && (
            <Card className="mb-6 border-destructive/50">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Crisis Type</label>
                    <Select value={newCrisis.type} onValueChange={v => setNewCrisis(prev => ({ ...prev, type: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crisis type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data_breach">Data Breach</SelectItem>
                        <SelectItem value="physical_threat">Physical Threat</SelectItem>
                        <SelectItem value="reputation_attack">Reputation Attack</SelectItem>
                        <SelectItem value="legal_threat">Legal Threat</SelectItem>
                        <SelectItem value="financial_attack">Financial Attack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Severity</label>
                    <Select value={newCrisis.severity} onValueChange={v => setNewCrisis(prev => ({ ...prev, severity: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Initial Assessment</label>
                  <Textarea
                    value={newCrisis.assessment}
                    onChange={e => setNewCrisis(prev => ({ ...prev, assessment: e.target.value }))}
                    placeholder="Describe the crisis situation..."
                    rows={3}
                  />
                </div>
                <Button onClick={initiateCrisis} disabled={isLoading} className="w-full">
                  {isLoading ? 'Initiating...' : 'Initiate Crisis Response'}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentPlaybook && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Active Playbook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-destructive mb-2">Immediate Actions:</h4>
                  <ul className="space-y-2">
                    {currentPlaybook.immediateActions.map((action, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-3 w-3 text-destructive" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response Phases:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {currentPlaybook.phases.map((phase, idx) => (
                      <Badge key={idx} variant="outline">
                        {phase.name} ({phase.duration})
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="font-medium">Active Events ({activeEvents.length})</h3>
            {activeEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div>No active crisis events</div>
              </div>
            ) : (
              activeEvents.map(event => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCrisisIcon(event.crisis_type)}
                        <div>
                          <div className="font-medium capitalize">
                            {event.crisis_type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(event.detected_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(event.severity_level)}>
                          {event.severity_level}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => resolveCrisis(event.id)}>
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
