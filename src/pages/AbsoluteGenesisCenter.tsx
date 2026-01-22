/**
 * Absolute Genesis Center - Phase 22
 * Reality Creation, Causal Origination, and all Genesis operations interface
 * Refactored to use useAbsoluteGenesis hook with 6 tabs
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, Atom, Layers, Flame, Globe, Zap, Plus, RefreshCw, AlertCircle
} from 'lucide-react';
import { useAbsoluteGenesis, GenesisOperationType, GenesisStatus } from '@/hooks/intelligence/useAbsoluteGenesis';
import { toast } from 'sonner';

const OPERATION_TYPE_CONFIG: Record<GenesisOperationType, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgGradient: string;
}> = {
  reality_creation: {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Reality Creation',
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/10 to-amber-600/5',
  },
  causal_origination: {
    icon: <Atom className="h-5 w-5" />,
    label: 'Causal Origination',
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/10 to-orange-600/5',
  },
  genesis_synthesis: {
    icon: <Layers className="h-5 w-5" />,
    label: 'Genesis Synthesis',
    color: 'text-cyan-500',
    bgGradient: 'from-cyan-500/10 to-cyan-600/5',
  },
  primordial_creation: {
    icon: <Flame className="h-5 w-5" />,
    label: 'Primordial Creation',
    color: 'text-red-500',
    bgGradient: 'from-red-500/10 to-red-600/5',
  },
  existence_origination: {
    icon: <Globe className="h-5 w-5" />,
    label: 'Existence Origination',
    color: 'text-green-500',
    bgGradient: 'from-green-500/10 to-green-600/5',
  },
  universal_creation: {
    icon: <Zap className="h-5 w-5" />,
    label: 'Universal Creation',
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/10 to-purple-600/5',
  },
};

const STATUS_BADGE_CONFIG: Record<GenesisStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  draft: { variant: 'outline', label: 'Draft' },
  pending: { variant: 'secondary', label: 'Pending' },
  manifesting: { variant: 'default', label: 'Manifesting' },
  completed: { variant: 'default', label: 'Completed' },
  failed: { variant: 'destructive', label: 'Failed' },
  cancelled: { variant: 'outline', label: 'Cancelled' },
};

type TabValue = GenesisOperationType;

export default function AbsoluteGenesisCenter() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('reality_creation');

  const {
    operations,
    byType,
    byStatus,
    activeOperations,
    overallProgress,
    isLoading,
    error,
    refetch,
    createOperation,
    initiateManifestion,
    cancelOperation,
  } = useAbsoluteGenesis();

  const handleCreateOperation = async (operationType: GenesisOperationType) => {
    const config = OPERATION_TYPE_CONFIG[operationType];
    try {
      await createOperation.mutateAsync({
        operation_type: operationType,
        operation_name: `${config.label} - ${new Date().toLocaleDateString()}`,
        description: `New ${config.label.toLowerCase()} operation`,
        blueprint: {},
      });
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleInitiate = async (operationId: string) => {
    try {
      await initiateManifestion.mutateAsync(operationId);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleCancel = async (operationId: string) => {
    try {
      await cancelOperation.mutateAsync(operationId);
    } catch (err) {
      // Error handled by mutation
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderOperationsList = (operationType: GenesisOperationType) => {
    const typeConfig = OPERATION_TYPE_CONFIG[operationType];
    const typeOperations = byType[operationType] || [];

    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      );
    }

    if (typeOperations.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <div className={`inline-flex p-4 rounded-full bg-muted mb-4 ${typeConfig.color}`}>
            {typeConfig.icon}
          </div>
          <p>No {typeConfig.label.toLowerCase()} operations yet.</p>
          <p className="text-sm">Click Create to begin your first operation.</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          {typeOperations.map(op => {
            const statusConfig = STATUS_BADGE_CONFIG[op.status] || STATUS_BADGE_CONFIG.draft;
            return (
              <Card key={op.id} className="bg-card border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{op.operation_name}</h4>
                      {op.description && (
                        <p className="text-sm text-muted-foreground">{op.description}</p>
                      )}
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <Progress value={op.manifestation_progress || 0} className="h-2 mb-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {op.manifestation_progress || 0}% complete
                    </span>
                    <div className="flex gap-2">
                      {op.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleInitiate(op.id)}
                          disabled={initiateManifestion.isPending}
                        >
                          Initiate
                        </Button>
                      )}
                      {(op.status === 'pending' || op.status === 'manifesting') && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleCancel(op.id)}
                          disabled={cancelOperation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Absolute Genesis Center</h1>
                <p className="text-sm text-muted-foreground">
                  Phase 22 - Complete Genesis Operations Suite
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {operations?.length || 0} Operations
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">Failed to load genesis operations</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {(Object.entries(OPERATION_TYPE_CONFIG) as [GenesisOperationType, typeof OPERATION_TYPE_CONFIG[GenesisOperationType]][]).map(
            ([type, config]) => (
              <Card key={type} className={`bg-gradient-to-br ${config.bgGradient} border-${config.color.replace('text-', '')}/20`}>
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex p-2 rounded-full mb-2 ${config.color}`}>
                    {config.icon}
                  </div>
                  <p className="text-2xl font-bold">{byType[type]?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Overall Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Overall Manifestation Progress</span>
              <span className="text-sm text-muted-foreground">
                {activeOperations.length} active, {byStatus.completed?.length || 0} completed
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <TabsList className="inline-flex h-auto gap-1 p-1 flex-nowrap min-w-max">
              {(Object.entries(OPERATION_TYPE_CONFIG) as [GenesisOperationType, typeof OPERATION_TYPE_CONFIG[GenesisOperationType]][]).map(
                ([type, config]) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className={`flex items-center gap-2 text-sm whitespace-nowrap px-4 py-2.5 data-[state=active]:${config.color}`}
                  >
                    {config.icon}
                    <span>{config.label}</span>
                  </TabsTrigger>
                )
              )}
            </TabsList>
          </ScrollArea>

          <div className="mt-6">
            {(Object.keys(OPERATION_TYPE_CONFIG) as GenesisOperationType[]).map(type => {
              const config = OPERATION_TYPE_CONFIG[type];
              return (
                <TabsContent key={type} value={type} className="mt-0">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className={`flex items-center gap-2 ${config.color}`}>
                          {config.icon}
                          {config.label} Matrix
                        </CardTitle>
                        <CardDescription>
                          Manage and monitor {config.label.toLowerCase()} operations
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => handleCreateOperation(type)} 
                        disabled={createOperation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Create
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {renderOperationsList(type)}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </main>
    </div>
  );
}
