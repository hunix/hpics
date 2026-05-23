import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { invokeFunction } from '@/lib/api';
import { Heart, Loader2, Sparkles, Plus, X, Brain, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { calculateCostCents } from '@/lib/aiPricing';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface Interest {
  id: string;
  interest_type: string;
  name: string;
  notes: string | null;
  source: string | null;
  confidence_score: number | null;
  created_at: string;
}

interface InterestsManagerProps {
  profileId: string;
  contactName: string;
}

const interestTypes = [
  { value: 'hobby', label: 'Hobby', emoji: '🎯' },
  { value: 'topic', label: 'Topic', emoji: '📚' },
  { value: 'brand', label: 'Brand', emoji: '🏷️' },
  { value: 'food', label: 'Food', emoji: '🍕' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'sport', label: 'Sport', emoji: '⚽' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

const typeEmojis: Record<string, string> = Object.fromEntries(
  interestTypes.map(t => [t.value, t.emoji])
);

const MODEL_KEY = 'google/gemini-2.5-flash';

export function InterestsManager({ profileId, contactName }: InterestsManagerProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Interest | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'hobby', notes: '' });

  // Fetch interests
  const { data: interests, isLoading } = useQuery<Interest[]>({
    queryKey: ['contact-interests', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_interests')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Interest[];
    },
    enabled: !!user,
  });

  // Add interest mutation
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.name.trim()) throw new Error('Name is required');
      const { error } = await supabase.from('contact_interests').insert({
        user_id: user!.id,
        profile_id: profileId,
        interest_type: data.type,
        name: data.name.trim(),
        notes: data.notes.trim() || null,
        source: 'manual',
        confidence_score: 1.0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-interests', profileId] });
      closeDialog();
      toast.success('Interest added!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add interest');
    },
  });

  // Update interest mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('contact_interests').update({
        interest_type: data.type,
        name: data.name.trim(),
        notes: data.notes.trim() || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-interests', profileId] });
      closeDialog();
      toast.success('Interest updated!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update interest');
    },
  });

  // Delete interest mutation
  const deleteMutation = useMutation({
    mutationFn: async (interestId: string) => {
      const { error } = await supabase
        .from('contact_interests')
        .delete()
        .eq('id', interestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-interests', profileId] });
      setDeleteTarget(null);
      toast.success('Interest removed');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', type: 'hobby', notes: '' });
    setEditingInterest(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openEditDialog = (interest: Interest) => {
    setEditingInterest(interest);
    setFormData({
      name: interest.name,
      type: interest.interest_type,
      notes: interest.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editingInterest) {
      updateMutation.mutate({ id: editingInterest.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  // AI Detection with confirmation
  const detectInterests = async () => {
    const promptText = `Detecting interests for ${contactName} by analyzing their profile, communications, education, skills, and shared experiences.`;
    
    const { approved, logId } = await requestConfirmation({
      functionName: 'detect-interests',
      modelKey: MODEL_KEY,
      promptText,
      profileId,
    });
    
    if (!approved || !logId) return;
    
    setIsDetecting(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await invokeFunction('detect-interests', { profileId }, { headers: {
          Authorization: `Bearer ${session?.access_token}`,
        } });

      const responseTime = Date.now() - startTime;

      if (error) {
        await updateLogWithResult(logId, {
          status: 'failed',
          errorMessage: error.message,
          responseTimeMs: responseTime,
        });
        throw error;
      }
      
      await updateLogWithResult(logId, {
        status: 'completed',
        responseTimeMs: responseTime,
        actualCostCents: calculateCostCents(MODEL_KEY, 2000, 800),
      });
      
      queryClient.invalidateQueries({ queryKey: ['contact-interests', profileId] });
      toast.success(`Detected ${data.savedCount} new interests!`);
    } catch (error) {
      console.error('Error detecting interests:', error);
      toast.error('Failed to detect interests');
    } finally {
      setIsDetecting(false);
    }
  };

  // Group interests by type
  const groupedInterests = interests?.reduce((acc, interest) => {
    if (!acc[interest.interest_type]) {
      acc[interest.interest_type] = [];
    }
    acc[interest.interest_type].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>) || {};

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* AI Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Interest Detection
          </CardTitle>
          <CardDescription>
            Automatically detect interests from {contactName}'s profile, communications, and experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={detectInterests} disabled={isDetecting}>
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Detect Interests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Interests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Known Interests
              </CardTitle>
              <CardDescription>
                {interests?.length || 0} interests tracked for {contactName}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : interests && interests.length > 0 ? (
            <ScrollArea className="h-72">
              <div className="space-y-4">
                {Object.entries(groupedInterests).map(([type, items]) => (
                  <div key={type}>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span>{typeEmojis[type] || '📌'}</span>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                      <Badge variant="secondary">{items.length}</Badge>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((interest) => (
                        <div
                          key={interest.id}
                          className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <span>{interest.name}</span>
                          {interest.source === 'ai_detected' && (
                            <Sparkles className="h-3 w-3 text-purple-500" />
                          )}
                          {interest.confidence_score && interest.confidence_score < 1 && (
                            <span className="text-xs text-muted-foreground">
                              ({Math.round(interest.confidence_score * 100)}%)
                            </span>
                          )}
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            <button
                              onClick={() => openEditDialog(interest)}
                              className="p-0.5 hover:text-primary"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(interest)}
                              className="p-0.5 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No interests recorded yet.</p>
              <p className="text-sm">Add interests manually or use AI detection!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInterest ? 'Edit' : 'Add'} Interest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interestTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Interest name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending || !formData.name.trim()}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingInterest ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Interest"
        itemName={deleteTarget?.name}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
