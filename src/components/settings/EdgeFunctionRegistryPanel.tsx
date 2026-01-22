/**
 * Edge Function Registry Panel
 * Admin interface for managing database-driven edge function configuration
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { 
  Search, RefreshCw, Activity, AlertTriangle, 
  CheckCircle, XCircle, Clock, Zap, Settings2
} from 'lucide-react';
import { useEdgeFunctionRegistry, FunctionConfig } from '@/hooks/useEdgeFunctionRegistry';
import { toast } from 'sonner';

export function EdgeFunctionRegistryPanel() {
  const {
    functions,
    activeFunctions,
    categories,
    phases,
    byCategory,
    isLoading,
    error,
    refetch,
    updateFunctionStatus,
    updateFunctionConfig
  } = useEdgeFunctionRegistry();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [editingFunction, setEditingFunction] = useState<FunctionConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Filter functions
  const filteredFunctions = functions.filter(fn => {
    const matchesSearch = fn.function_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fn.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || fn.category === selectedCategory;
    const matchesPhase = selectedPhase === 'all' || fn.phase_level.toString() === selectedPhase;
    return matchesSearch && matchesCategory && matchesPhase;
  });

  const handleToggleStatus = async (fn: FunctionConfig) => {
    try {
      await updateFunctionStatus.mutateAsync({
        functionName: fn.function_name,
        isActive: !fn.is_active
      });
      toast.success(`${fn.display_name} ${fn.is_active ? 'disabled' : 'enabled'}`);
    } catch (err) {
      toast.error('Failed to update function status');
    }
  };

  const handleEditFunction = (fn: FunctionConfig) => {
    setEditingFunction({ ...fn });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFunction) return;

    try {
      await updateFunctionConfig.mutateAsync({
        functionName: editingFunction.function_name,
        updates: {
          timeout_ms: editingFunction.timeout_ms,
          rate_limit_per_minute: editingFunction.rate_limit_per_minute,
          is_critical: editingFunction.is_critical,
          health_check_enabled: editingFunction.health_check_enabled
        }
      });
      toast.success('Function configuration updated');
      setEditDialogOpen(false);
      setEditingFunction(null);
    } catch (err) {
      toast.error('Failed to update function configuration');
    }
  };

  const getCostTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-green-500/10 text-green-500';
      case 'standard': return 'bg-blue-500/10 text-blue-500';
      case 'premium': return 'bg-purple-500/10 text-purple-500';
      case 'enterprise': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-muted text-muted-foreground';
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
            {[1, 2, 3, 4, 5].map(i => (
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
            Failed to Load Registry
          </CardTitle>
          <CardDescription>
            Could not load edge function registry from database.
          </CardDescription>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Functions</span>
            </div>
            <p className="text-2xl font-bold">{functions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{activeFunctions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Critical</span>
            </div>
            <p className="text-2xl font-bold">
              {functions.filter(f => f.is_critical).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Categories</span>
            </div>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Edge Function Registry</CardTitle>
          <CardDescription>
            Database-driven configuration for all edge functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search functions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {phases.map(phase => (
                  <SelectItem key={phase} value={phase.toString()}>Phase {phase}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Functions Table */}
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Function</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Timeout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFunctions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {functions.length === 0 
                        ? 'No functions registered. Run the seeding migration to populate.'
                        : 'No functions match your filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFunctions.map(fn => (
                    <TableRow key={fn.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{fn.display_name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {fn.function_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{fn.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">P{fn.phase_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCostTierColor(fn.cost_tier)}>
                          {fn.cost_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {fn.timeout_ms / 1000}s
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {fn.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          {fn.is_critical && (
                            <Zap className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={fn.is_active}
                            onCheckedChange={() => handleToggleStatus(fn)}
                            disabled={updateFunctionStatus.isPending}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditFunction(fn)}
                          >
                            <Settings2 className="h-4 w-4" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Function Configuration</DialogTitle>
            <DialogDescription>
              {editingFunction?.display_name} ({editingFunction?.function_name})
            </DialogDescription>
          </DialogHeader>
          {editingFunction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeout (ms)</label>
                  <Input
                    type="number"
                    value={editingFunction.timeout_ms}
                    onChange={(e) => setEditingFunction({
                      ...editingFunction,
                      timeout_ms: parseInt(e.target.value) || 30000
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate Limit/min</label>
                  <Input
                    type="number"
                    value={editingFunction.rate_limit_per_minute}
                    onChange={(e) => setEditingFunction({
                      ...editingFunction,
                      rate_limit_per_minute: parseInt(e.target.value) || 60
                    })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Critical Function</label>
                <Switch
                  checked={editingFunction.is_critical}
                  onCheckedChange={(checked) => setEditingFunction({
                    ...editingFunction,
                    is_critical: checked
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Health Check Enabled</label>
                <Switch
                  checked={editingFunction.health_check_enabled}
                  onCheckedChange={(checked) => setEditingFunction({
                    ...editingFunction,
                    health_check_enabled: checked
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateFunctionConfig.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
