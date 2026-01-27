/**
 * Cognitive Warfare Panel (v9.0)
 * 
 * Dashboard for reflexive control operations and cognitive domain operations.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Target, 
  Zap, 
  Shield, 
  AlertTriangle,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useCognitiveWarfare } from '@/hooks/intelligence/useCognitiveWarfare';

interface CognitiveWarfarePanelProps {
  profileId?: string;
}

export function CognitiveWarfarePanel({ profileId }: CognitiveWarfarePanelProps) {
  const {
    operations,
    activeOperations,
    completedOperations,
    isLoading,
    createOperation,
    updateOperationStatus,
    isCreating
  } = useCognitiveWarfare(profileId);

  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'reflexive_control': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'perception_shaping': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'belief_synthesis': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cognitive_friction': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleCreateOperation = async (operationType: string) => {
    if (!profileId) return;
    await createOperation({
      profileId,
      operationType,
      targetMentalModel: {},
      payloads: []
    });
  };

  if (isLoading) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Brain className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <CardTitle>Cognitive Warfare Operations</CardTitle>
              <CardDescription>Reflexive control and cognitive domain operations</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              {activeOperations.length} Active
            </Badge>
            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
              {completedOperations.length} Completed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-red-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Operations</p>
                      <p className="text-2xl font-bold text-red-400">{operations?.length || 0}</p>
                    </div>
                    <Target className="h-8 w-8 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-400">{activeOperations.length}</p>
                    </div>
                    <Zap className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-blue-400">{completedOperations.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {operations?.length ? Math.round((completedOperations.length / operations.length) * 100) : 0}%
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-yellow-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {operations?.map(op => (
                  <div 
                    key={op.id} 
                    className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(op.status)}
                        <div>
                          <p className="font-medium capitalize">
                            {op.operationType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(op.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getOperationTypeColor(op.operationType)}>
                          {op.operationType}
                        </Badge>
                        {op.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateOperationStatus({ operationId: op.id, status: 'completed' })}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!operations || operations.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No operations found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create">
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'reflexive_control', label: 'Reflexive Control', desc: 'Transmit decision motives' },
                { type: 'perception_shaping', label: 'Perception Shaping', desc: 'Alter reality interpretation' },
                { type: 'belief_synthesis', label: 'Belief Synthesis', desc: 'Generate compelling narratives' },
                { type: 'cognitive_friction', label: 'Cognitive Friction', desc: 'Increase mental load' }
              ].map(op => (
                <Card key={op.type} className="border-border/50 hover:border-red-500/50 transition-colors cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{op.label}</p>
                        <p className="text-xs text-muted-foreground">{op.desc}</p>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={!profileId || isCreating}
                        onClick={() => handleCreateOperation(op.type)}
                      >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
