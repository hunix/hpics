import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Target, Flame, Plus, Check, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow, addDays, addWeeks, addMonths, addYears } from 'date-fns';

interface Goal {
  id: string;
  goal_type: string;
  title: string;
  description: string | null;
  frequency: string;
  target_count: number;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
  next_due_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface RelationshipGoalsProps {
  profileId: string;
  contactName: string;
}

const goalTypes = [
  { value: 'contact_frequency', label: 'Contact Frequency', icon: '📞' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'call', label: 'Call', icon: '📱' },
  { value: 'message', label: 'Message', icon: '💬' },
  { value: 'gift', label: 'Gift', icon: '🎁' },
  { value: 'custom', label: 'Custom', icon: '⭐' },
];

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const getNextDueDate = (frequency: string, from: Date = new Date()): Date => {
  switch (frequency) {
    case 'daily': return addDays(from, 1);
    case 'weekly': return addWeeks(from, 1);
    case 'biweekly': return addWeeks(from, 2);
    case 'monthly': return addMonths(from, 1);
    case 'quarterly': return addMonths(from, 3);
    case 'yearly': return addYears(from, 1);
    default: return addWeeks(from, 1);
  }
};

export function RelationshipGoals({ profileId, contactName }: RelationshipGoalsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'contact_frequency',
    title: '',
    frequency: 'weekly',
  });

  // Fetch goals
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['relationship-goals', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_goals')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async () => {
      if (!newGoal.title.trim()) throw new Error('Title is required');
      const { error } = await supabase.from('relationship_goals').insert({
        user_id: user!.id,
        profile_id: profileId,
        goal_type: newGoal.type,
        title: newGoal.title.trim(),
        frequency: newGoal.frequency,
        next_due_at: getNextDueDate(newGoal.frequency).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-goals', profileId] });
      setNewGoal({ type: 'contact_frequency', title: '', frequency: 'weekly' });
      setIsAdding(false);
      toast.success('Goal created!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    },
  });

  // Complete goal mutation
  const completeGoalMutation = useMutation({
    mutationFn: async (goal: Goal) => {
      const now = new Date();
      const nextDue = getNextDueDate(goal.frequency, now);
      const newStreak = goal.current_streak + 1;
      
      const { error } = await supabase
        .from('relationship_goals')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(goal.longest_streak, newStreak),
          last_completed_at: now.toISOString(),
          next_due_at: nextDue.toISOString(),
        })
        .eq('id', goal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-goals', profileId] });
      toast.success('Goal completed! 🎉');
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('relationship_goals')
        .delete()
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-goals', profileId] });
      toast.success('Goal deleted');
    },
  });

  const isDue = (goal: Goal) => {
    if (!goal.next_due_at) return false;
    return new Date(goal.next_due_at) <= new Date();
  };

  const getGoalIcon = (type: string) => {
    return goalTypes.find(t => t.value === type)?.icon || '⭐';
  };

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Relationship Goals
              </CardTitle>
              <CardDescription>
                Track your commitment to staying connected with {contactName}
              </CardDescription>
            </div>
            <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Goal Form */}
          {isAdding && (
            <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
              <div className="flex flex-wrap gap-3">
                <Select value={newGoal.type} onValueChange={(v) => setNewGoal(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Goal title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="flex-1 min-w-48"
                />
                <Select value={newGoal.frequency} onValueChange={(v) => setNewGoal(prev => ({ ...prev, frequency: v }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addGoalMutation.mutate()} disabled={addGoalMutation.isPending || !newGoal.title.trim()}>
                  Create Goal
                </Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Goals List */}
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-muted rounded-lg" />
              ))}
            </div>
          ) : goals && goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-4 border rounded-lg ${isDue(goal) ? 'border-yellow-500 bg-yellow-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getGoalIcon(goal.goal_type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge variant="secondary">{goal.frequency}</Badge>
                          {isDue(goal) && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                              Due Now
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {goal.current_streak > 0 && (
                            <span className="flex items-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              {goal.current_streak} streak
                            </span>
                          )}
                          {goal.longest_streak > 0 && (
                            <span>Best: {goal.longest_streak}</span>
                          )}
                          {goal.next_due_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {isDue(goal) ? 'Overdue' : `Due ${formatDistanceToNow(new Date(goal.next_due_at), { addSuffix: true })}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isDue(goal) ? 'default' : 'outline'}
                        onClick={() => completeGoalMutation.mutate(goal)}
                        disabled={completeGoalMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {goal.current_streak > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress to next milestone</span>
                        <span>{goal.current_streak % 7} / 7</span>
                      </div>
                      <Progress value={(goal.current_streak % 7) / 7 * 100} className="h-1.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No goals set yet.</p>
              <p className="text-sm">Create goals to track your relationship commitments!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
