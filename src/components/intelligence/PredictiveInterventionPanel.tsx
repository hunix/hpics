/**
 * Predictive Intervention Panel (v3.9.0)
 * ML-powered intervention recommendations with timing optimization
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Clock, 
  Zap, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Gift,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Intervention {
  id: string;
  profileId: string;
  profileName: string;
  interventionType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
  optimalTiming: string;
  successProbability: number;
  expiresAt: string | null;
  status: 'pending' | 'scheduled' | 'executed' | 'expired' | 'actioned';
  context: Record<string, unknown>;
}

export function PredictiveInterventionPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');

  const interventionsQuery = useQuery({
    queryKey: ['interventions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_recommendations')
        .select(`
          *,
          profiles:profile_id (first_name, last_name)
        `)
        .order('priority_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        profileId: row.profile_id,
        profileName: row.profiles ? `${row.profiles.first_name || ''} ${row.profiles.last_name || ''}`.trim() : 'Unknown',
        interventionType: row.recommendation_type,
        priority: mapPriorityScore(row.priority_score),
        suggestedAction: row.suggested_action,
        optimalTiming: row.opportunity_window?.optimal_time || 'As soon as possible',
        successProbability: row.success_probability || 0.5,
        expiresAt: row.expires_at,
        status: row.status || 'pending',
        context: {
          triggerReason: row.trigger_reason,
          expectedOutcome: row.expected_outcome,
          talkingPoints: row.talking_points,
        },
      })) as Intervention[];
    },
    enabled: !!user,
  });

  const executeIntervention = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('action_recommendations')
        .update({ 
          status: 'actioned',
          actioned_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.success('Intervention marked as executed');
    },
  });

  const scheduleIntervention = useMutation({
    mutationFn: async ({ id, scheduledFor }: { id: string; scheduledFor: string }) => {
      const { error } = await (supabase as any)
        .from('action_recommendations')
        .update({ 
          status: 'scheduled',
          opportunity_window: { scheduled_for: scheduledFor },
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.success('Intervention scheduled');
    },
  });

  const interventions = interventionsQuery.data || [];
  const pendingInterventions = interventions.filter(i => i.status === 'pending');
  const scheduledInterventions = interventions.filter(i => i.status === 'scheduled');
  const executedInterventions = interventions.filter(i => i.status === 'executed' || i.status === 'actioned');

  const priorityCounts = {
    critical: pendingInterventions.filter(i => i.priority === 'critical').length,
    high: pendingInterventions.filter(i => i.priority === 'high').length,
    medium: pendingInterventions.filter(i => i.priority === 'medium').length,
    low: pendingInterventions.filter(i => i.priority === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Priority</p>
                <p className="text-2xl font-bold text-red-500">{priorityCounts.critical}</p>
              </div>
              <Target className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-orange-500">{priorityCounts.high}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-500">{scheduledInterventions.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Executed</p>
                <p className="text-2xl font-bold text-green-500">{executedInterventions.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interventions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommended Interventions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending ({pendingInterventions.length})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Scheduled ({scheduledInterventions.length})
              </TabsTrigger>
              <TabsTrigger value="executed">
                Executed ({executedInterventions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pendingInterventions.length > 0 ? (
                    pendingInterventions.map(intervention => (
                      <InterventionCard 
                        key={intervention.id} 
                        intervention={intervention}
                        onExecute={() => executeIntervention.mutate(intervention.id)}
                        onSchedule={(date) => scheduleIntervention.mutate({ id: intervention.id, scheduledFor: date })}
                      />
                    ))
                  ) : (
                    <EmptyState message="No pending interventions" />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="scheduled">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {scheduledInterventions.length > 0 ? (
                    scheduledInterventions.map(intervention => (
                      <InterventionCard 
                        key={intervention.id} 
                        intervention={intervention}
                        onExecute={() => executeIntervention.mutate(intervention.id)}
                      />
                    ))
                  ) : (
                    <EmptyState message="No scheduled interventions" />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="executed">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {executedInterventions.length > 0 ? (
                    executedInterventions.map(intervention => (
                      <InterventionCard 
                        key={intervention.id} 
                        intervention={intervention}
                        isExecuted
                      />
                    ))
                  ) : (
                    <EmptyState message="No executed interventions" />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function mapPriorityScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 0.9) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

interface InterventionCardProps {
  intervention: Intervention;
  onExecute?: () => void;
  onSchedule?: (date: string) => void;
  isExecuted?: boolean;
}

function InterventionCard({ intervention, onExecute, onSchedule, isExecuted }: InterventionCardProps) {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-500',
    high: 'bg-orange-500/20 text-orange-500',
    medium: 'bg-amber-500/20 text-amber-500',
    low: 'bg-blue-500/20 text-blue-500',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    outreach: <MessageSquare className="h-4 w-4" />,
    gift: <Gift className="h-4 w-4" />,
    call: <Phone className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
  };

  const isExpiringSoon = intervention.expiresAt && 
    new Date(intervention.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isExecuted ? "bg-muted/20 opacity-70" : "bg-card"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", priorityColors[intervention.priority])}>
            {typeIcons[intervention.interventionType] || <Target className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{intervention.profileName}</span>
              <Badge variant="outline" className={priorityColors[intervention.priority]}>
                {intervention.priority}
              </Badge>
              {isExpiringSoon && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Expiring
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {intervention.interventionType.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className="text-xs text-muted-foreground">Success Rate</span>
            <span className="text-sm font-medium">{(intervention.successProbability * 100).toFixed(0)}%</span>
          </div>
          <Progress value={intervention.successProbability * 100} className="w-20 h-1.5" />
        </div>
      </div>

      <p className="text-sm mb-2">{intervention.suggestedAction}</p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Clock className="h-3 w-3" />
        <span>Optimal timing: {intervention.optimalTiming}</span>
      </div>

      {intervention.context.talkingPoints && Array.isArray(intervention.context.talkingPoints) && (
        <div className="bg-muted/30 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium mb-2">Talking Points:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {(intervention.context.talkingPoints as string[]).slice(0, 3).map((point, i) => (
              <li key={i}>• {point}</li>
            ))}
          </ul>
        </div>
      )}

      {!isExecuted && (
        <div className="flex gap-2">
          {onSchedule && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSchedule(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Schedule
            </Button>
          )}
          {onExecute && (
            <Button size="sm" onClick={onExecute}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark Executed
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p>{message}</p>
    </div>
  );
}
