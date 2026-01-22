/**
 * Reality Engineering Dashboard
 * 
 * AGIS Phase 6: Perception management, belief architecture, and reality framework control
 */

import { useState } from 'react';
import { useRealityEngineering } from '@/hooks/intelligence/useRealityEngineering';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Target, Layers, Shield, Zap, TrendingUp, 
  AlertTriangle, CheckCircle, Plus, Eye, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealityFrameworkCardProps {
  framework: {
    id: string;
    frameworkName: string;
    frameworkType: string;
    progressPercentage: number;
    cognitiveLoadScore?: number;
    resistancePatterns: unknown[];
    isActive: boolean;
    createdAt: Date;
  };
  onView: () => void;
}

function RealityFrameworkCard({ framework, onView }: RealityFrameworkCardProps) {
  const typeColors: Record<string, string> = {
    belief_shift: 'text-purple-500 bg-purple-500/10',
    perception_reframe: 'text-blue-500 bg-blue-500/10',
    identity_engineering: 'text-amber-500 bg-amber-500/10',
    narrative_control: 'text-emerald-500 bg-emerald-500/10',
  };

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{framework.frameworkName}</h4>
            <Badge variant="outline" className={cn('text-xs mt-1', typeColors[framework.frameworkType] || 'text-muted-foreground')}>
              {framework.frameworkType.replace(/_/g, ' ')}
            </Badge>
          </div>
          {framework.isActive ? (
            <Badge variant="default" className="bg-green-500/20 text-green-500">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{framework.progressPercentage}%</span>
          </div>
          <Progress value={framework.progressPercentage} className="h-2" />
          
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Cognitive Load</span>
            <span className={cn('font-medium', 
              framework.cognitiveLoadScore && framework.cognitiveLoadScore > 0.7 ? 'text-red-500' : 
              framework.cognitiveLoadScore && framework.cognitiveLoadScore > 0.4 ? 'text-amber-500' : 
              'text-green-500'
            )}>
              {framework.cognitiveLoadScore ? `${(framework.cognitiveLoadScore * 100).toFixed(0)}%` : 'N/A'}
            </span>
          </div>
          
          {(framework.resistancePatterns as any[])?.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-500 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {(framework.resistancePatterns as any[]).length} resistance patterns detected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BeliefArchitectureCardProps {
  architecture: {
    id: string;
    profileId?: string;
    coreBeliefs: unknown[];
    supportingBeliefs: unknown[];
    stabilityScore?: number;
    lastMajorShift?: Date;
    vulnerabilityMap: Record<string, unknown>;
  };
}

function BeliefArchitectureCard({ architecture }: BeliefArchitectureCardProps) {
  const coreBeliefs = architecture.coreBeliefs as any[] || [];
  const supportingBeliefs = architecture.supportingBeliefs as any[] || [];
  const vulnerabilities = Object.keys(architecture.vulnerabilityMap || {});

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-purple-500" />
          <span className="font-medium">Belief Structure</span>
          {architecture.stabilityScore && (
            <Badge variant="outline" className={cn(
              architecture.stabilityScore > 0.7 ? 'text-green-500' : 
              architecture.stabilityScore > 0.4 ? 'text-amber-500' : 'text-red-500'
            )}>
              {(architecture.stabilityScore * 100).toFixed(0)}% stable
            </Badge>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <span className="text-xs text-muted-foreground">Core Beliefs</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {coreBeliefs.slice(0, 4).map((belief: any, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {typeof belief === 'string' ? belief : belief?.name || `Belief ${idx + 1}`}
                </Badge>
              ))}
              {coreBeliefs.length > 4 && (
                <Badge variant="outline" className="text-xs">+{coreBeliefs.length - 4} more</Badge>
              )}
            </div>
          </div>
          
          <div>
            <span className="text-xs text-muted-foreground">Supporting Beliefs</span>
            <div className="text-sm mt-1">{supportingBeliefs.length} identified</div>
          </div>
          
          {vulnerabilities.length > 0 && (
            <div className="pt-2 border-t">
              <span className="text-xs text-red-500 flex items-center gap-1">
                <Target className="h-3 w-3" />
                {vulnerabilities.length} vulnerability points mapped
              </span>
            </div>
          )}
          
          {architecture.lastMajorShift && (
            <div className="text-xs text-muted-foreground">
              Last shift: {new Date(architecture.lastMajorShift).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RealityEngineeringDashboard() {
  const { 
    frameworks, 
    beliefArchitectures, 
    isLoading,
    createFramework,
    updateProgress 
  } = useRealityEngineering();
  
  const [activeTab, setActiveTab] = useState('frameworks');

  // Calculate metrics
  const activeFrameworks = frameworks.filter(f => f.isActive);
  const avgProgress = activeFrameworks.length > 0 
    ? activeFrameworks.reduce((sum, f) => sum + f.progressPercentage, 0) / activeFrameworks.length 
    : 0;
  const totalResistance = frameworks.reduce((sum, f) => sum + ((f.resistancePatterns as any[])?.length || 0), 0);
  const avgStability = beliefArchitectures.length > 0
    ? beliefArchitectures.reduce((sum, b) => sum + (b.stabilityScore || 0), 0) / beliefArchitectures.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Brain className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Reality Engineering</h2>
            <p className="text-sm text-muted-foreground">
              AGIS Phase 6 • Perception management & belief architecture
            </p>
          </div>
        </div>
        <Button onClick={() => createFramework.mutate({ 
          frameworkName: 'New Framework', 
          frameworkType: 'perception_reframe' 
        })}>
          <Plus className="h-4 w-4 mr-2" />
          New Framework
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeFrameworks.length}</p>
              <p className="text-xs text-muted-foreground">Active Frameworks</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgProgress.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalResistance}</p>
              <p className="text-xs text-muted-foreground">Resistance Points</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(avgStability * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Belief Stability</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="frameworks" className="gap-1.5">
            <Target className="h-4 w-4" />
            Reality Frameworks
          </TabsTrigger>
          <TabsTrigger value="beliefs" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Belief Architectures
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5">
            <Zap className="h-4 w-4" />
            Active Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-40 bg-muted/50" />
                </Card>
              ))}
            </div>
          ) : frameworks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {frameworks.map(framework => (
                <RealityFrameworkCard 
                  key={framework.id} 
                  framework={framework}
                  onView={() => console.log('View framework:', framework.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Reality Frameworks</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first reality framework to begin perception management operations.
                </p>
                <Button onClick={() => createFramework.mutate({ 
                  frameworkName: 'Initial Framework', 
                  frameworkType: 'perception_reframe' 
                })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Framework
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="beliefs" className="space-y-4">
          {beliefArchitectures.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {beliefArchitectures.map(architecture => (
                <BeliefArchitectureCard key={architecture.id} architecture={architecture} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Belief Architectures</h3>
                <p className="text-sm text-muted-foreground">
                  Belief architectures are automatically generated from profile analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Active Perception Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeFrameworks.length > 0 ? (
                  activeFrameworks.map(framework => (
                    <div key={framework.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{framework.frameworkName}</span>
                        <Badge variant="outline">{framework.progressPercentage}% complete</Badge>
                      </div>
                      <Progress value={framework.progressPercentage} className="h-1.5" />
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        Monitoring {(framework.resistancePatterns as any[])?.length || 0} resistance patterns
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No active perception operations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
