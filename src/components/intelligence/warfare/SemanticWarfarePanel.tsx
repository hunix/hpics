import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Target, Zap, TrendingUp, Plus } from 'lucide-react';
import { useSemanticWarfare } from '@/hooks/intelligence/useSemanticWarfare';

interface SemanticWarfarePanelProps {
  profileId?: string;
}

export function SemanticWarfarePanel({ profileId }: SemanticWarfarePanelProps) {
  const { 
    operations, 
    isLoading, 
    createOperation, 
    isCreating,
    analyzeTerm,
    isAnalyzing,
  } = useSemanticWarfare();

  const [newTerm, setNewTerm] = useState('');
  const [currentDefinition, setCurrentDefinition] = useState('');
  const [targetDefinition, setTargetDefinition] = useState('');
  const [operationName, setOperationName] = useState('');

  const handleCreateOperation = () => {
    if (!newTerm.trim() || !targetDefinition.trim()) return;
    
    createOperation({
      operationName: operationName || `Reframe: ${newTerm}`,
      targetTerm: newTerm,
      currentDefinition: currentDefinition || 'Current public understanding',
      targetDefinition,
      framingStrategy: 'reframe',
    });
    
    setNewTerm('');
    setCurrentDefinition('');
    setTargetDefinition('');
    setOperationName('');
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'planning': return 'bg-amber-500/20 text-amber-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-violet-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-400" />
            <CardTitle>Semantic Warfare Engine</CardTitle>
          </div>
          <Badge variant="outline" className="border-violet-500/50">
            {operations.length} Operations
          </Badge>
        </div>
        <CardDescription>
          Control meaning through strategic term redefinition and frame shifting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="operations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="operations">Active Operations</TabsTrigger>
            <TabsTrigger value="create">New Operation</TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading operations...</div>
            ) : operations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No semantic operations yet. Create one to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {operations.map((op) => (
                  <Card key={op.id} className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">"{op.target_term}"</h4>
                          <p className="text-sm text-muted-foreground">{op.operation_name}</p>
                        </div>
                        <Badge className={getStatusColor(op.status)}>
                          {op.status || 'planning'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Definition</p>
                          <p className="text-sm">{op.current_definition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Target Definition</p>
                          <p className="text-sm">{op.target_definition}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Shift Progress</span>
                          <span>{op.shift_progress || 0}%</span>
                        </div>
                        <Progress value={op.shift_progress || 0} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Operation Name</label>
                <Input
                  placeholder="e.g., Project Clarity"
                  value={operationName}
                  onChange={(e) => setOperationName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Term</label>
                <Input
                  placeholder="e.g., 'freedom', 'security', 'progress'"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Current Definition</label>
                <Textarea
                  placeholder="How this term is currently understood..."
                  value={currentDefinition}
                  onChange={(e) => setCurrentDefinition(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Definition</label>
                <Textarea
                  placeholder="How you want this term to be understood..."
                  value={targetDefinition}
                  onChange={(e) => setTargetDefinition(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleCreateOperation} 
                disabled={isCreating || !newTerm.trim() || !targetDefinition.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Launch Semantic Operation'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-violet-400" />
            <p className="text-2xl font-bold">{operations.filter(o => o.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-amber-400" />
            <p className="text-2xl font-bold">
              {Math.round(operations.reduce((acc, o) => acc + (o.shift_progress || 0), 0) / Math.max(operations.length, 1))}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Progress</p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold">{operations.filter(o => o.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
