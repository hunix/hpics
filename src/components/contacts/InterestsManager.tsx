import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Loader2, Sparkles, Plus, X, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { calculateCostCents } from '@/lib/aiPricing';
import { toast } from 'sonner';

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
  const [newInterest, setNewInterest] = useState({ name: '', type: 'hobby', notes: '' });

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
  const addInterestMutation = useMutation({
    mutationFn: async () => {
      if (!newInterest.name.trim()) throw new Error('Name is required');
      const { error } = await supabase.from('contact_interests').insert({
        user_id: user!.id,
        profile_id: profileId,
        interest_type: newInterest.type,
        name: newInterest.name.trim(),
        notes: newInterest.notes.trim() || null,
        source: 'manual',
        confidence_score: 1.0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-interests', profileId] });
      setNewInterest({ name: '', type: 'hobby', notes: '' });
      toast.success('Interest added!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add interest');
    },
  });

  // Delete interest mutation
  const deleteInterestMutation = useMutation({
    mutationFn: async (interestId: string) => {
      const { error } = await supabase
        .from('contact_interests')
        .delete()
        .eq('id', interestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-interests', profileId] });
      toast.success('Interest removed');
    },
  });

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
      const { data, error } = await supabase.functions.invoke('detect-interests', {
        body: { profileId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

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

      {/* Add Interest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Interest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={newInterest.type} onValueChange={(v) => setNewInterest(prev => ({ ...prev, type: v }))}>
              <SelectTrigger className="w-32">
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
            <Input
              placeholder="Interest name"
              value={newInterest.name}
              onChange={(e) => setNewInterest(prev => ({ ...prev, name: e.target.value }))}
              className="w-48"
            />
            <Input
              placeholder="Notes (optional)"
              value={newInterest.notes}
              onChange={(e) => setNewInterest(prev => ({ ...prev, notes: e.target.value }))}
              className="flex-1 min-w-48"
            />
            <Button onClick={() => addInterestMutation.mutate()} disabled={addInterestMutation.isPending || !newInterest.name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Known Interests
          </CardTitle>
          <CardDescription>
            {interests?.length || 0} interests tracked for {contactName}
          </CardDescription>
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
                          <button
                            onClick={() => deleteInterestMutation.mutate(interest.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
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
    </div>
  );
}
