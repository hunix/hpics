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
  Power, PowerOff, Zap
} from 'lucide-react';
import { useKillSwitch, KillSwitch, AgentType, ContainmentMode } from '@/hooks/useKillSwitch';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const AGENT_TYPES: Array<{ value: AgentType; label: string }> = [
  { value: 'edge_function', label: 'Edge Function' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'tribunal', label: 'Tribunal' },
  { value: 'agent', label: 'Agent' },
];

const CONTAINMENT_MODES: Array<{ value: ContainmentMode; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No containment' },
  { value: 'soft', label: 'Soft', description: 'Graceful shutdown' },
  { value: 'hard', label: 'Hard', description: 'Immediate termination' },
];

export function KillSwitchPanel() {
  const {
    killSwitches,
    disabledAgents,
    containedAgents,
    highErrorAgents,
    isLoading,
    error,
    refetch,
    disableAgent,
    enableAgent,
    setContainmentMode,
    emergencyShutdown,
    registerKillSwitch,
  } = useKillSwitch();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    agent_id: '',
    agent_type: 'agent' as AgentType,
    display_name: '',
    containment_mode: 'soft' as ContainmentMode,
    reason: '',
  });

  const handleCreateKillSwitch = async () => {
    if (!formData.agent_id) {
      toast.error('Please enter an agent ID');
      return;
    }

    try {
      await registerKillSwitch.mutateAsync({
        agent_id: formData.agent_id,
        agent_type: formData.agent_type,
        display_name: formData.display_name || formData.agent_id,
      });
      toast.success('Kill switch registered');
      setCreateDialogOpen(false);
      setFormData({ agent_id: '', agent_type: 'agent', display_name: '', containment_mode: 'soft', reason: '' });
    } catch (err) {
      toast.error('Failed to register kill switch');
    }
  };

  const handleToggle = async (ks: KillSwitch) => {
    try {
      if (ks.is_enabled) {
        await disableAgent.mutateAsync({
          agentId: ks.agent_id,
          agentType: ks.agent_type,
          reason: 'Manually disabled',
        });
        toast.success('Agent disabled');
      } else {
        await enableAgent.mutateAsync(ks.agent_id);
        toast.success('Agent enabled');
      }
    } catch (err) {
      toast.error('Failed to toggle agent status');
    }
  };

  const handleSetContainment = async (ks: KillSwitch, mode: ContainmentMode) => {
    try {
      await setContainmentMode.mutateAsync({
        agentId: ks.agent_id,
        mode,
      });
      toast.success(`Containment set to ${mode}`);
    } catch (err) {
      toast.error('Failed to set containment mode');
    }
  };

  const handleEmergencyShutdown = async () => {
    try {
      await emergencyShutdown.mutateAsync({
        agentType: 'all',
        reason: 'Emergency shutdown initiated by operator',
      });
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

  const activeKillSwitches = killSwitches?.filter(ks => !ks.is_enabled) || [];

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
                    {activeKillSwitches.length} Agent{activeKillSwitches.length > 1 ? 's' : ''} Disabled
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
            <p className="text-2xl font-bold">{killSwitches?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Disabled</span>
            </div>
            <p className="text-2xl font-bold">{disabledAgents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Contained</span>
            </div>
            <p className="text-2xl font-bold">{containedAgents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">High Errors</span>
            </div>
            <p className="text-2xl font-bold">{highErrorAgents.length}</p>
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
                    <DialogTitle>Register Kill Switch</DialogTitle>
                    <DialogDescription>
                      Configure emergency containment for an AI agent.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Agent ID</label>
                      <Input
                        value={formData.agent_id}
                        onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                        placeholder="e.g., genesis_engine"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Name</label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="e.g., Genesis Engine"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Agent Type</label>
                      <Select
                        value={formData.agent_type}
                        onValueChange={(v) => setFormData({ ...formData, agent_type: v as AgentType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateKillSwitch}
                      disabled={!formData.agent_id || registerKillSwitch.isPending}
                    >
                      Register
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
                  <TableHead>Type</TableHead>
                  <TableHead>Containment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead className="text-right">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!killSwitches || killSwitches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No kill switches configured. Register one to enable emergency containment.
                    </TableCell>
                  </TableRow>
                ) : (
                  killSwitches.map(ks => (
                    <TableRow key={ks.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {ks.display_name || ks.agent_id}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {ks.agent_id}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ks.agent_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ks.containment_mode}
                          onValueChange={(v) => handleSetContainment(ks, v as ContainmentMode)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTAINMENT_MODES.map(mode => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {ks.is_enabled ? (
                          <Badge className="bg-green-500/10 text-green-500">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500">
                            <Power className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={ks.current_error_count >= ks.error_threshold * 0.8 ? 'text-red-500 font-medium' : ''}>
                          {ks.current_error_count} / {ks.error_threshold}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={ks.is_enabled}
                          onCheckedChange={() => handleToggle(ks)}
                          disabled={disableAgent.isPending || enableAgent.isPending}
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
