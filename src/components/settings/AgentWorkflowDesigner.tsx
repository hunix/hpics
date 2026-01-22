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
  Plus, GitBranch, Play, RefreshCw, AlertTriangle,
  CheckCircle, Settings2, Trash2, Copy
} from 'lucide-react';
import { useAgentWorkflows, AgentWorkflow, WorkflowState, WorkflowTransition } from '@/hooks/useAgentWorkflows';
import { toast } from 'sonner';

const WORKFLOW_TYPES: Array<{ value: AgentWorkflow['workflow_type']; label: string; description: string }> = [
  { value: 'linear', label: 'Linear', description: 'Step-by-step execution' },
  { value: 'parallel', label: 'Parallel', description: 'Concurrent state execution' },
  { value: 'conditional', label: 'Conditional', description: 'Branch based on conditions' },
  { value: 'cyclical', label: 'Cyclical', description: 'Iterative with backtracking' },
];

interface WorkflowFormData {
  workflow_name: string;
  workflow_key: string;
  workflow_type: AgentWorkflow['workflow_type'];
  description: string;
  initial_state: string;
  timeout_ms: number;
  enable_backtracking: boolean;
  max_backtrack_depth: number;
  checkpoint_enabled: boolean;
}

const DEFAULT_FORM: WorkflowFormData = {
  workflow_name: '',
  workflow_key: '',
  workflow_type: 'linear',
  description: '',
  initial_state: 'start',
  timeout_ms: 300000,
  enable_backtracking: true,
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
    if (!formData.workflow_name || !formData.workflow_key) {
      toast.error('Please enter workflow name and key');
      return;
    }

    const defaultStates: WorkflowState[] = [
      { name: 'start', action: 'initialize', description: 'Initial state' },
      { name: 'processing', action: 'process', description: 'Processing state' },
      { name: 'completed', action: 'finalize', description: 'Terminal success state' },
      { name: 'failed', action: 'handle_error', description: 'Terminal error state' },
    ];

    const defaultTransitions: WorkflowTransition[] = [
      { from: 'start', to: 'processing', condition: 'always' },
      { from: 'processing', to: 'completed', condition: 'success' },
      { from: 'processing', to: 'failed', condition: 'error' },
    ];

    try {
      await createWorkflow.mutateAsync({
        workflow_name: formData.workflow_name,
        workflow_key: formData.workflow_key,
        workflow_type: formData.workflow_type,
        description: formData.description || null,
        initial_state: formData.initial_state,
        timeout_ms: formData.timeout_ms,
        enable_backtracking: formData.enable_backtracking,
        max_backtrack_depth: formData.max_backtrack_depth,
        checkpoint_enabled: formData.checkpoint_enabled,
        states: defaultStates,
        transitions: defaultTransitions,
        self_correction_rules: [],
        max_iterations: 100,
        requires_human_approval: false,
        approval_stages: [],
        tags: [],
        priority: 100,
        is_active: true,
        is_system: false,
      });
      toast.success('Workflow created');
      setCreateDialogOpen(false);
      setFormData(DEFAULT_FORM);
    } catch (err) {
      toast.error('Failed to create workflow');
    }
  };

  const handleEditWorkflow = (wf: AgentWorkflow) => {
    setEditingWorkflowId(wf.id);
    setFormData({
      workflow_name: wf.workflow_name,
      workflow_key: wf.workflow_key,
      workflow_type: wf.workflow_type,
      description: wf.description || '',
      initial_state: wf.initial_state,
      timeout_ms: wf.timeout_ms,
      enable_backtracking: wf.enable_backtracking,
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
          timeout_ms: formData.timeout_ms,
          enable_backtracking: formData.enable_backtracking,
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

  const handleDeleteWorkflow = async (wf: AgentWorkflow) => {
    if (wf.is_system) {
      toast.error('Cannot delete system workflows');
      return;
    }
    try {
      await deleteWorkflow.mutateAsync(wf.id);
      toast.success('Workflow deleted');
    } catch (err) {
      toast.error('Failed to delete workflow');
    }
  };

  const handleDuplicateWorkflow = async (wf: AgentWorkflow) => {
    try {
      await createWorkflow.mutateAsync({
        workflow_name: `${wf.workflow_name} (Copy)`,
        workflow_key: `${wf.workflow_key}_copy_${Date.now()}`,
        workflow_type: wf.workflow_type,
        description: wf.description,
        initial_state: wf.initial_state,
        timeout_ms: wf.timeout_ms,
        enable_backtracking: wf.enable_backtracking,
        max_backtrack_depth: wf.max_backtrack_depth,
        checkpoint_enabled: wf.checkpoint_enabled,
        states: wf.states,
        transitions: wf.transitions,
        self_correction_rules: wf.self_correction_rules,
        max_iterations: wf.max_iterations,
        requires_human_approval: wf.requires_human_approval,
        approval_stages: wf.approval_stages,
        tags: wf.tags,
        priority: wf.priority,
        is_active: true,
        is_system: false,
      });
      toast.success('Workflow duplicated');
    } catch (err) {
      toast.error('Failed to duplicate workflow');
    }
  };

  const handleToggleActive = async (wf: AgentWorkflow) => {
    try {
      await updateWorkflow.mutateAsync({
        id: wf.id,
        updates: { is_active: !wf.is_active },
      });
      toast.success(wf.is_active ? 'Workflow disabled' : 'Workflow enabled');
    } catch (err) {
      toast.error('Failed to toggle workflow status');
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
            placeholder="e.g., Profile Analysis"
            disabled={!!editingWorkflowId}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Workflow Key</label>
          <Input
            value={formData.workflow_key}
            onChange={(e) => setFormData({ ...formData, workflow_key: e.target.value })}
            placeholder="e.g., profile_analysis"
            disabled={!!editingWorkflowId}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          value={formData.workflow_type}
          onValueChange={(v) => setFormData({ ...formData, workflow_type: v as AgentWorkflow['workflow_type'] })}
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
          <label className="text-sm font-medium">Timeout (ms)</label>
          <Input
            type="number"
            value={formData.timeout_ms}
            onChange={(e) => setFormData({ ...formData, timeout_ms: parseInt(e.target.value) || 300000 })}
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
            checked={formData.enable_backtracking}
            onCheckedChange={(checked) => setFormData({ ...formData, enable_backtracking: checked })}
          />
        </div>
        {formData.enable_backtracking && (
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
              {workflows.filter(w => w.enable_backtracking).length}
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
                      disabled={!formData.workflow_name || !formData.workflow_key || createWorkflow.isPending}
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{wf.workflow_name}</span>
                            {wf.is_system && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
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
                        <span className="text-sm">{wf.states?.length || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{Math.round(wf.timeout_ms / 1000)}s</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {wf.enable_backtracking && (
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
                          onCheckedChange={() => handleToggleActive(wf)}
                          disabled={updateWorkflow.isPending}
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
                            disabled={wf.is_system || deleteWorkflow.isPending}
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
