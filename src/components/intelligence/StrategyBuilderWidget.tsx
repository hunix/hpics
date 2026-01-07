import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, Sparkles, CheckCircle, Clock, AlertTriangle,
  MessageSquare, Calendar, ChevronRight, Copy, RefreshCw
} from 'lucide-react';
import { useInfluenceStrategies, useGenerateStrategy, useUpdateStrategy } from '@/hooks/useInfluenceProfile';

interface StrategyBuilderWidgetProps {
  profileId: string;
  contactName: string;
}

const goalTypes = [
  { value: 'deepen_relationship', label: 'Deepen Relationship', icon: '❤️' },
  { value: 'ask_favor', label: 'Ask for a Favor', icon: '🙏' },
  { value: 'resolve_conflict', label: 'Resolve Conflict', icon: '🤝' },
  { value: 'close_deal', label: 'Close a Deal', icon: '💼' },
  { value: 'gain_trust', label: 'Gain Trust', icon: '🛡️' },
  { value: 'request_introduction', label: 'Request Introduction', icon: '🔗' },
  { value: 'rebuild_connection', label: 'Rebuild Connection', icon: '🔄' },
  { value: 'propose_collaboration', label: 'Propose Collaboration', icon: '🤲' },
  { value: 'deliver_bad_news', label: 'Deliver Bad News', icon: '📢' },
  { value: 'negotiate', label: 'Negotiate', icon: '⚖️' },
];

export function StrategyBuilderWidget({ profileId, contactName }: StrategyBuilderWidgetProps) {
  const { toast } = useToast();
  const [goalType, setGoalType] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [context, setContext] = useState('');
  
  const { data: strategies, isLoading } = useInfluenceStrategies(profileId);
  const generateMutation = useGenerateStrategy();
  const updateMutation = useUpdateStrategy();

  const handleGenerate = async () => {
    if (!goalType) {
      toast({ title: 'Select a goal', description: 'Please select what you want to achieve.', variant: 'destructive' });
      return;
    }

    try {
      await generateMutation.mutateAsync({
        profileId,
        goalType: goalType as any,
        goalDescription: goalDescription || undefined,
        context: context || undefined,
      });
      toast({ title: 'Strategy generated', description: 'Your personalized influence strategy is ready.' });
      setGoalDescription('');
      setContext('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Text copied to clipboard.' });
  };

  const handleUpdateStatus = async (strategyId: string, status: string) => {
    try {
      await updateMutation.mutateAsync({ strategyId, updates: { status } });
      toast({ title: 'Status updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const activeStrategies = strategies?.filter(s => s.status === 'active' || s.status === 'draft') || [];
  const completedStrategies = strategies?.filter(s => s.status === 'successful' || s.status === 'failed' || s.status === 'executed') || [];

  return (
    <div className="space-y-6">
      {/* Strategy Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Build Influence Strategy
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create an AI-powered strategy to achieve your goal with {contactName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>What do you want to achieve?</Label>
            <Select value={goalType} onValueChange={setGoalType}>
              <SelectTrigger>
                <SelectValue placeholder="Select your goal..." />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    <span className="flex items-center gap-2">
                      <span>{goal.icon}</span>
                      <span>{goal.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Specific goal details (optional)</Label>
            <Input
              placeholder="e.g., Get them to invest in my startup"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Current context (optional)</Label>
            <Textarea
              placeholder="Any relevant context: recent interactions, their current situation, timing considerations..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={generateMutation.isPending || !goalType}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Strategy
          </Button>
        </CardContent>
      </Card>

      {/* Active Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : activeStrategies.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {activeStrategies.map((strategy) => (
                <AccordionItem key={strategy.id} value={strategy.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div>
                        <p className="font-medium">{strategy.strategy_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {goalTypes.find(g => g.value === strategy.goal_type)?.label || strategy.goal_type}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Strategy Summary */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{strategy.strategy_summary}</p>
                      </div>

                      {/* Success Probability */}
                      <div className="flex items-center gap-4">
                        <Badge variant={strategy.success_probability && strategy.success_probability > 70 ? 'default' : 'secondary'}>
                          {Math.round(strategy.success_probability || 0)}% Success Probability
                        </Badge>
                        {strategy.optimal_timing && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Best time: {(strategy.optimal_timing as any)?.best_day} {(strategy.optimal_timing as any)?.best_time}
                          </span>
                        )}
                      </div>

                      {/* Preparation Steps */}
                      {strategy.preparation_steps && (
                        <div>
                          <p className="font-medium text-sm mb-2">📋 Preparation</p>
                          <ol className="space-y-1 text-sm">
                            {((strategy.preparation_steps as any)?.steps || []).map((step: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-muted-foreground">{i + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Execution Steps */}
                      {strategy.execution_steps && (
                        <div>
                          <p className="font-medium text-sm mb-2">🎯 Execution</p>
                          <ol className="space-y-1 text-sm">
                            {((strategy.execution_steps as any)?.steps || []).map((step: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-muted-foreground">{i + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Scripts */}
                      {strategy.opening_scripts && strategy.opening_scripts.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2">💬 Opening Scripts</p>
                          <div className="space-y-2">
                            {strategy.opening_scripts.map((script: string, i: number) => (
                              <div key={i} className="p-2 bg-muted rounded text-sm flex justify-between items-start gap-2">
                                <span>"{script}"</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(script)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {strategy.closing_scripts && strategy.closing_scripts.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2">🎬 Closing Scripts</p>
                          <div className="space-y-2">
                            {strategy.closing_scripts.map((script: string, i: number) => (
                              <div key={i} className="p-2 bg-muted rounded text-sm flex justify-between items-start gap-2">
                                <span>"{script}"</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(script)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(strategy.id, 'executed')}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Executed
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(strategy.id, 'successful')}>
                          ✅ Successful
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(strategy.id, 'failed')}>
                          ❌ Failed
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active strategies. Create one above!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Past Strategies */}
      {completedStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {completedStrategies.map((strategy) => (
                  <div key={strategy.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{strategy.strategy_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {goalTypes.find(g => g.value === strategy.goal_type)?.label}
                      </p>
                    </div>
                    <Badge variant={strategy.status === 'successful' ? 'default' : 'secondary'}>
                      {strategy.status === 'successful' ? '✅ Success' : strategy.status === 'failed' ? '❌ Failed' : '📋 Executed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
