/**
 * Genesis Configuration Panel
 * Phase 22 Absolute Genesis operations configuration
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Sparkles, Atom, GitBranch, Zap, Globe, Star,
  RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { useAbsoluteGenesis } from '@/hooks/intelligence/useAbsoluteGenesis';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const OPERATION_TYPES = [
  { value: 'reality_creation', label: 'Reality Creation', icon: Globe, color: 'text-blue-500' },
  { value: 'causal_origination', label: 'Causal Origination', icon: GitBranch, color: 'text-purple-500' },
  { value: 'genesis_synthesis', label: 'Genesis Synthesis', icon: Atom, color: 'text-green-500' },
  { value: 'primordial_creation', label: 'Primordial Creation', icon: Star, color: 'text-amber-500' },
  { value: 'existence_origination', label: 'Existence Origination', icon: Sparkles, color: 'text-pink-500' },
  { value: 'universal_creation', label: 'Universal Creation', icon: Zap, color: 'text-cyan-500' },
];

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
  processing: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: 'bg-blue-500/10 text-blue-500' },
  completed: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' },
  failed: { icon: <XCircle className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' },
};

export function GenesisConfigPanel() {
  const {
    operations,
    config,
    isLoading,
    error,
    refetch,
    initiateOperation,
    updateConfig,
  } = useAbsoluteGenesis();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [manifestationLevel, setManifestationLevel] = useState(1);
  const [powerLevel, setPowerLevel] = useState(1);

  // Filter operations
  const filteredOperations = operations.filter(op => 
    selectedType === 'all' || op.operation_type === selectedType
  );

  const handleInitiateOperation = async (operationType: string) => {
    try {
      await initiateOperation.mutateAsync({
        operationType,
        manifestationLevel,
        powerLevel,
        parameters: {},
      });
      toast.success(`${operationType.replace('_', ' ')} initiated`);
    } catch (err) {
      toast.error('Failed to initiate operation');
    }
  };

  // Calculate stats by type
  const statsByType = OPERATION_TYPES.reduce((acc, type) => {
    const typeOps = operations.filter(op => op.operation_type === type.value);
    acc[type.value] = {
      total: typeOps.length,
      completed: typeOps.filter(op => op.status === 'completed').length,
      processing: typeOps.filter(op => op.status === 'processing').length,
    };
    return acc;
  }, {} as Record<string, { total: number; completed: number; processing: number }>);

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
              <Skeleton key={i} className="h-16 w-full" />
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
            Failed to Load Genesis Config
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
      {/* Operation Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {OPERATION_TYPES.map(type => {
          const Icon = type.icon;
          const stats = statsByType[type.value] || { total: 0, completed: 0, processing: 0 };
          return (
            <Card 
              key={type.value} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedType(type.value === selectedType ? 'all' : type.value)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${type.color}`} />
                  <span className="text-xs font-medium truncate">{type.label.split(' ')[0]}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold">{stats.total}</span>
                  {stats.processing > 0 && (
                    <Badge className="bg-blue-500/10 text-blue-500 text-xs">
                      {stats.processing} active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Genesis Configuration</CardTitle>
          <CardDescription>
            Configure Phase 22 Absolute Genesis operation parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Power Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Manifestation Level</label>
                <Badge variant="outline">{manifestationLevel}</Badge>
              </div>
              <Slider
                value={[manifestationLevel]}
                onValueChange={([v]) => setManifestationLevel(v)}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Controls the depth of reality manifestation
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Power Level</label>
                <Badge variant="outline">{powerLevel}</Badge>
              </div>
              <Slider
                value={[powerLevel]}
                onValueChange={([v]) => setPowerLevel(v)}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Determines the intensity of genesis operations
              </p>
            </div>
          </div>

          {/* Quick Launch Buttons */}
          <div>
            <label className="text-sm font-medium block mb-3">Quick Launch Operations</label>
            <div className="flex flex-wrap gap-2">
              {OPERATION_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleInitiateOperation(type.value)}
                    disabled={initiateOperation.isPending}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${type.color}`} />
                    {type.label.split(' ')[0]}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Genesis Operations</CardTitle>
              <CardDescription>
                History of Phase 22 operations
              </CardDescription>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {OPERATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No genesis operations found. Initiate one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperations.map(op => {
                    const typeConfig = OPERATION_TYPES.find(t => t.value === op.operation_type);
                    const Icon = typeConfig?.icon || Sparkles;
                    const statusConfig = STATUS_CONFIG[op.status] || STATUS_CONFIG.pending;
                    
                    return (
                      <TableRow key={op.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${typeConfig?.color || 'text-primary'}`} />
                            <span className="font-medium text-sm truncate max-w-[150px]">
                              {op.operation_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {typeConfig?.label || op.operation_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={op.manifestation_progress || 0} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {op.manifestation_progress || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <span className="flex items-center gap-1">
                              {statusConfig.icon}
                              {op.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(op.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
