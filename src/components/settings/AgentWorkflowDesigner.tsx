/**
 * Agent Workflow Designer Panel
 * Visual state machine editor for AI agent workflows
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
  Plus, GitBranch, Play, Pause, RefreshCw, AlertTriangle,
  CheckCircle, Clock, Settings2, Trash2, Copy
} from 'lucide-react';
import { useAgentWorkflows } from '@/hooks/useAgentWorkflows';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const WORKFLOW_TYPES = [
  { value: 'sequential', label: 'Sequential', description: 'Linear step-by-step execution' },
  { value: 'parallel', label: 'Parallel', description: 'Concurrent state execution' },
  { value: 'conditional', label: 'Conditional', description: 'Branch based on conditions' },
  { value: 'loop', label: 'Loop', description: 'Iterative state execution' },
];

interface WorkflowFormData {
  workflow_name: string;
  workflow_type: string;
  description: string;
  initial_state: string;
  timeout_seconds: number;
  backtrack_enabled: boolean;
  max_backtrack_depth: number;
  checkpoint_enabled: boolean;
}

const DEFAULT_FORM: WorkflowFormData = {
  workflow_name: '',
  workflow_type: 'sequential',
  description: '',
  initial_state: 'start',
  timeout_seconds: 300,
  backtrack_enabled: true,
  max_backtrack_depth: 3,
  checkpoint_enabled: true,
};

export function AgentWorkflowDesigner() {
  const {
    workflows,
    activeWorkflows,
    isLoading,
    error,
    refetch,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
  } = useAgentWorkflows();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<WorkflowFormData>(DEFAULT_FORM);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Filter workflows
  const filteredWorkflows = workflows.filter(wf => 
    selectedType === 'all' || wf.workflow_type === selectedType
  );

  const handleCreateWorkflow = async () => {
    if (!formData.workflow_name) {
      toast.error('Please enter a workflow name');
      return;
    }

    try {
      await createWorkflow.mutateAsync({
        workflow_name: formData.workflow_name,
        workflow_type: formData.workflow_type,
        description: formData.description || null,
        initial_state: formData.initial_state,
        timeout_seconds: formData.timeout_seconds,
        backtrack_enabled: formData.backtrack_enabled,
        max_backtrack_depth: formData.max_backtrack_depth,
        checkpoint_enabled: formData.checkpoint_enabled,
        states: [
          { name: 'start', type: 'initial' },
          { name: 'processing', type: 'intermediate' },
          { name: 'completed', type: 'terminal' },
          { name: 'failed', type: 'terminal' },
        ],
        transitions: [
          { from: 'start', to: 'processing', condition: 'always' },
          { from: 'processing', to: 'completed', condition: 'success' },
          { from: 'processing', to: 'failed', condition: 'error' },
        ],
      });
      toast.success('Workflow created');
      setCreateDialogOpen(false);
      setFormData(DEFAULT_FORM);
    } catch (err) {
      toast.error('Failed to create workflow');
    }
  };

  const handleEditWorkflow = (wf: typeof workflows[0]) => {
    setEditingWorkflowId(wf.id);
    setFormData({
      workflow_name: wf.workflow_name,
      workflow_type: wf.workflow_type,
      description: wf.description || '',
      initial_state: wf.initial_state,
      timeout_seconds: wf.timeout_seconds,
      backtrack_enabled: wf.backtrack_enabled,
      max_backtrack_depth: wf.max_backtrack_depth,
      checkpoint_enabled: wf.checkpoint_enabled,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflowId) return;

    try {
      await updateWorkflow.mutateAsync({
        id: editingWorkflowId,
        updates: {
          description: formData.description || null,
          timeout_seconds: formData.timeout_seconds,
          backtrack_enabled: formData.backtrack_enabled,
          max_backtrack_depth: formData.max_backtrack_depth,
          checkpoint_enabled: formData.checkpoint_enabled,
        },
      });
      toast.success('Workflow updated');
      setEditDialogOpen(false);
      setEditingWorkflowId(null);
      setFormData(DEFAULT_FORM);
    } catch (err) {
      toast.error('Failed to update workflow');
    }
  };

  const handleDeleteWorkflow = async (wf: typeof workflows[0]) => {
    try {
      await deleteWorkflow.mutateAsync(wf.id);
      toast.success('Workflow deleted');
    } catch (err) {
      toast.error('Failed to delete workflow');
    }
  };

  const handleDuplicateWorkflow = async (wf: typeof workflows[0]) => {
    try {
      await createWorkflow.mutateAsync({
        workflow_name: `${wf.workflow_name}_copy`,
        workflow_type: wf.workflow_type,
        description: wf.description,
        initial_state: wf.initial_state,
        timeout_seconds: wf.timeout_seconds,
        backtrack_enabled: wf.backtrack_enabled,
        max_backtrack_depth: wf.max_backtrack_depth,
        checkpoint_enabled: wf.checkpoint_enabled,
        states: wf.states,
        transitions: wf.transitions,
      });
      toast.success('Workflow duplicated');
    } catch (err) {
      toast.error('Failed to duplicate workflow');
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
            Failed to Load Workflows
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

  const WorkflowFormFields = () => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Workflow Name</label>
          <Input
            value={formData.workflow_name}
            onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
            placeholder="e.g., profile_analysis"
            disabled={!!editingWorkflowId}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select
            value={formData.workflow_type}
            onValueChange={(v) => setFormData({ ...formData, workflow_type: v })}
            disabled={!!editingWorkflowId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What does this workflow do?"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Initial State</label>
          <Input
            value={formData.initial_state}
            onChange={(e) => setFormData({ ...formData, initial_state: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Timeout (seconds)</label>
          <Input
            type="number"
            value={formData.timeout_seconds}
            onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) || 300 })}
          />
        </div>
      </div>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Enable Backtracking</label>
            <p className="text-xs text-muted-foreground">Allow workflow to revert to previous states</p>
          </div>
          <Switch
            checked={formData.backtrack_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, backtrack_enabled: checked })}
          />
        </div>
        {formData.backtrack_enabled && (
          <div className="space-y-2 pl-4 border-l-2">
            <label className="text-sm font-medium">Max Backtrack Depth</label>
            <Input
              type="number"
              value={formData.max_backtrack_depth}
              onChange={(e) => setFormData({ ...formData, max_backtrack_depth: parseInt(e.target.value) || 3 })}
              className="w-24"
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Enable Checkpoints</label>
            <p className="text-xs text-muted-foreground">Save state for recovery</p>
          </div>
          <Switch
            checked={formData.checkpoint_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, checkpoint_enabled: checked })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Workflows</span>
            </div>
            <p className="text-2xl font-bold">{workflows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{activeWorkflows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">With Checkpoints</span>
            </div>
            <p className="text-2xl font-bold">
              {workflows.filter(w => w.checkpoint_enabled).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">With Backtrack</span>
            </div>
            <p className="text-2xl font-bold">
              {workflows.filter(w => w.backtrack_enabled).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Agent Workflows</CardTitle>
              <CardDescription>
                State machine definitions for AI agent operations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {WORKFLOW_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Workflow</DialogTitle>
                    <DialogDescription>
                      Define a new state machine workflow for AI agents.
                    </DialogDescription>
                  </DialogHeader>
                  <WorkflowFormFields />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateWorkflow}
                      disabled={!formData.workflow_name || createWorkflow.isPending}
                    >
                      Create
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
                  <TableHead>Workflow</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>States</TableHead>
                  <TableHead>Timeout</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No workflows found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkflows.map(wf => (
                    <TableRow key={wf.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{wf.workflow_name}</span>
                          {wf.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {wf.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{wf.workflow_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{(wf.states as unknown[])?.length || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{wf.timeout_seconds}s</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {wf.backtrack_enabled && (
                            <Badge variant="secondary" className="text-xs">Backtrack</Badge>
                          )}
                          {wf.checkpoint_enabled && (
                            <Badge variant="secondary" className="text-xs">Checkpoint</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={wf.is_active}
                          onCheckedChange={() => toggleWorkflowStatus.mutate({
                            id: wf.id,
                            isActive: !wf.is_active
                          })}
                          disabled={toggleWorkflowStatus.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateWorkflow(wf)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditWorkflow(wf)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteWorkflow(wf)}
                            disabled={deleteWorkflow.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>
              Modify workflow configuration settings.
            </DialogDescription>
          </DialogHeader>
          <WorkflowFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingWorkflowId(null);
              setFormData(DEFAULT_FORM);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateWorkflow}
              disabled={updateWorkflow.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
