import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, Loader2, Sparkles, Plus, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface GiftSuggestion {
  title: string;
  description: string;
  reasoning: string;
  priceRange: 'budget' | 'moderate' | 'premium' | 'luxury';
  category: string;
}

interface SavedGift {
  id: string;
  title: string;
  description: string;
  price_range: string;
  category: string;
  occasion: string;
  url: string;
  is_given: boolean;
  given_date: string;
  ai_reasoning: string;
  created_at: string;
}

interface GiftSuggestionsProps {
  profileId: string;
  contactName: string;
}

const priceRangeLabels: Record<string, string> = {
  budget: 'Under $25',
  moderate: '$25 - $75',
  premium: '$75 - $200',
  luxury: '$200+',
};

const priceRangeColors: Record<string, string> = {
  budget: 'bg-green-500/10 text-green-700',
  moderate: 'bg-blue-500/10 text-blue-700',
  premium: 'bg-purple-500/10 text-purple-700',
  luxury: 'bg-amber-500/10 text-amber-700',
};

export function GiftSuggestions({ profileId, contactName }: GiftSuggestionsProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [occasion, setOccasion] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');

  // Fetch saved gift ideas
  const { data: savedGifts } = useQuery<SavedGift[]>({
    queryKey: ['gift-ideas', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_ideas')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedGift[];
    },
    enabled: !!user,
  });

  // Save gift mutation
  const saveGiftMutation = useMutation({
    mutationFn: async (gift: GiftSuggestion) => {
      const { error } = await supabase.from('gift_ideas').insert({
        user_id: user!.id,
        profile_id: profileId,
        title: gift.title,
        description: gift.description,
        price_range: gift.priceRange,
        category: gift.category,
        occasion: occasion || null,
        source: 'ai_suggested',
        ai_reasoning: gift.reasoning,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-ideas', profileId] });
      toast.success('Gift idea saved!');
    },
    onError: () => {
      toast.error('Failed to save gift idea');
    },
  });

  // Mark as given mutation
  const markGivenMutation = useMutation({
    mutationFn: async (giftId: string) => {
      const { error } = await supabase
        .from('gift_ideas')
        .update({ is_given: true, given_date: new Date().toISOString().split('T')[0] })
        .eq('id', giftId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-ideas', profileId] });
      toast.success('Marked as given!');
    },
  });

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-gifts', {
        body: { profileId, occasion, priceRange: priceFilter },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      setSuggestions(data.gifts || []);
      toast.success('Gift suggestions generated!');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const isGiftSaved = (title: string) => {
    return savedGifts?.some(g => g.title.toLowerCase() === title.toLowerCase());
  };

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-pink-500" />
            AI Gift Suggestions
          </CardTitle>
          <CardDescription>
            Generate personalized gift ideas for {contactName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Occasion (optional)"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-48"
            />
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Price range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any price</SelectItem>
                <SelectItem value="budget">Budget ($0-25)</SelectItem>
                <SelectItem value="moderate">Moderate ($25-75)</SelectItem>
                <SelectItem value="premium">Premium ($75-200)</SelectItem>
                <SelectItem value="luxury">Luxury ($200+)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateSuggestions} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="font-medium">AI Suggestions</h4>
              <div className="grid gap-3">
                {suggestions.map((gift, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium">{gift.title}</h5>
                        <p className="text-sm text-muted-foreground">{gift.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={priceRangeColors[gift.priceRange]}>
                          {priceRangeLabels[gift.priceRange]}
                        </Badge>
                        <Button
                          size="sm"
                          variant={isGiftSaved(gift.title) ? 'secondary' : 'default'}
                          onClick={() => saveGiftMutation.mutate(gift)}
                          disabled={isGiftSaved(gift.title) || saveGiftMutation.isPending}
                        >
                          {isGiftSaved(gift.title) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      💡 {gift.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Gift Ideas */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Gift Ideas</CardTitle>
          <CardDescription>
            Gift ideas you've saved for {contactName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedGifts && savedGifts.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {savedGifts.map((gift) => (
                  <div key={gift.id} className={`p-4 border rounded-lg ${gift.is_given ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{gift.title}</h5>
                          {gift.is_given && (
                            <Badge variant="secondary">Given {gift.given_date}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{gift.description}</p>
                        {gift.occasion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Occasion: {gift.occasion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {gift.price_range && (
                          <Badge className={priceRangeColors[gift.price_range] || ''}>
                            {priceRangeLabels[gift.price_range] || gift.price_range}
                          </Badge>
                        )}
                        {!gift.is_given && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markGivenMutation.mutate(gift.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Given
                          </Button>
                        )}
                        {gift.url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={gift.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    {gift.ai_reasoning && (
                      <p className="text-xs text-muted-foreground italic mt-2">
                        💡 {gift.ai_reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No saved gift ideas yet. Generate some suggestions above!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
