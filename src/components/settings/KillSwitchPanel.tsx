/**
 * Kill Switch Panel
 * Emergency containment controls for AI agents
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, ShieldOff, ShieldCheck, AlertTriangle, RefreshCw,
  Power, PowerOff, Clock, Zap, History
} from 'lucide-react';
import { useKillSwitch } from '@/hooks/useKillSwitch';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const AGENT_TYPES = [
  { value: 'genesis_engine', label: 'Genesis Engine' },
  { value: 'behavioral_analyzer', label: 'Behavioral Analyzer' },
  { value: 'influence_optimizer', label: 'Influence Optimizer' },
  { value: 'relationship_orchestrator', label: 'Relationship Orchestrator' },
  { value: 'predictive_engine', label: 'Predictive Engine' },
  { value: 'vulnerability_scanner', label: 'Vulnerability Scanner' },
  { value: 'all_agents', label: 'All Agents (Global)' },
];

const CONTAINMENT_MODES = [
  { value: 'soft', label: 'Soft', description: 'Graceful shutdown, complete pending operations' },
  { value: 'hard', label: 'Hard', description: 'Immediate termination, abort all operations' },
];

export function KillSwitchPanel() {
  const {
    killSwitches,
    activeKillSwitches,
    isLoading,
    error,
    refetch,
    createKillSwitch,
    updateKillSwitch,
    toggleKillSwitch,
    emergencyShutdown,
  } = useKillSwitch();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    agent_type: '',
    function_name: '',
    containment_mode: 'soft',
    reason: '',
  });

  const handleCreateKillSwitch = async () => {
    if (!formData.agent_type) {
      toast.error('Please select an agent type');
      return;
    }

    try {
      await createKillSwitch.mutateAsync({
        agent_type: formData.agent_type,
        function_name: formData.function_name || null,
        containment_mode: formData.containment_mode,
        reason: formData.reason || null,
      });
      toast.success('Kill switch created');
      setCreateDialogOpen(false);
      setFormData({ agent_type: '', function_name: '', containment_mode: 'soft', reason: '' });
    } catch (err) {
      toast.error('Failed to create kill switch');
    }
  };

  const handleToggle = async (ks: typeof killSwitches[0]) => {
    try {
      await toggleKillSwitch.mutateAsync({
        id: ks.id,
        isEnabled: !ks.is_enabled,
        reason: ks.is_enabled ? 'Manually disabled' : 'Manually enabled',
      });
      toast.success(ks.is_enabled ? 'Kill switch disabled' : 'Kill switch enabled');
    } catch (err) {
      toast.error('Failed to toggle kill switch');
    }
  };

  const handleEmergencyShutdown = async () => {
    try {
      await emergencyShutdown.mutateAsync('Emergency shutdown initiated by operator');
      toast.success('All agents have been shut down');
      setEmergencyDialogOpen(false);
    } catch (err) {
      toast.error('Emergency shutdown failed');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Failed to Load Kill Switches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Emergency Banner */}
      {activeKillSwitches.length > 0 && (
        <Card className="border-red-500 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldOff className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-500">
                    {activeKillSwitches.length} Kill Switch{activeKillSwitches.length > 1 ? 'es' : ''} Active
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Some agents are currently disabled
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShieldOff className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Switches</span>
            </div>
            <p className="text-2xl font-bold">{killSwitches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{activeKillSwitches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Inactive</span>
            </div>
            <p className="text-2xl font-bold">{killSwitches.length - activeKillSwitches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Activations</span>
            </div>
            <p className="text-2xl font-bold">
              {killSwitches.reduce((acc, ks) => acc + (ks.activation_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Agent Kill Switches</CardTitle>
              <CardDescription>
                Emergency containment controls for AI agents
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
                <Button 
                  variant="destructive" 
                  onClick={() => setEmergencyDialogOpen(true)}
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  Emergency Shutdown
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Emergency Shutdown</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately disable ALL AI agents across the platform.
                      Active operations will be terminated. Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={handleEmergencyShutdown}
                    >
                      Confirm Shutdown
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Switch
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Kill Switch</DialogTitle>
                    <DialogDescription>
                      Configure emergency containment for an AI agent.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Agent Type</label>
                      <Select
                        value={formData.agent_type}
                        onValueChange={(v) => setFormData({ ...formData, agent_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent..." />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENT_TYPES.map(agent => (
                            <SelectItem key={agent.value} value={agent.value}>
                              {agent.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Function Name (optional)</label>
                      <Input
                        value={formData.function_name}
                        onChange={(e) => setFormData({ ...formData, function_name: e.target.value })}
                        placeholder="Specific function to disable"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Containment Mode</label>
                      <Select
                        value={formData.containment_mode}
                        onValueChange={(v) => setFormData({ ...formData, containment_mode: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTAINMENT_MODES.map(mode => (
                            <SelectItem key={mode.value} value={mode.value}>
                              <div>
                                <span>{mode.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  - {mode.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason</label>
                      <Textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Why is this kill switch being created?"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateKillSwitch}
                      disabled={!formData.agent_type || createKillSwitch.isPending}
                    >
                      Create Switch
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activations</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {killSwitches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No kill switches configured. Create one to enable emergency containment.
                    </TableCell>
                  </TableRow>
                ) : (
                  killSwitches.map(ks => (
                    <TableRow key={ks.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">
                            {AGENT_TYPES.find(a => a.value === ks.agent_type)?.label || ks.agent_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ks.function_name ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {ks.function_name}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">All</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ks.containment_mode === 'hard' ? 'destructive' : 'secondary'}>
                          {ks.containment_mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ks.is_enabled ? (
                          <Badge className="bg-red-500/10 text-red-500">
                            <Power className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{ks.activation_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ks.last_activation_at 
                          ? formatDistanceToNow(new Date(ks.last_activation_at), { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={ks.is_enabled}
                          onCheckedChange={() => handleToggle(ks)}
                          disabled={toggleKillSwitch.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
