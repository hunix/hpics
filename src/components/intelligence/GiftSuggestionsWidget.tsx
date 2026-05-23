import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Sparkles, RefreshCw, DollarSign, Heart, Briefcase, Home, Utensils, Music } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface GiftSuggestion {
  title: string;
  description: string;
  reasoning: string;
  priceRange: 'budget' | 'moderate' | 'premium' | 'luxury';
  category: string;
}

interface GiftSuggestionsWidgetProps {
  profileId: string;
  profileName?: string;
}

const priceRangeConfig = {
  budget: { label: '$', color: 'text-green-500', bg: 'bg-green-500/10' },
  moderate: { label: '$$', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  premium: { label: '$$$', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  luxury: { label: '$$$$', color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

const categoryIcons: Record<string, React.ElementType> = {
  experience: Heart,
  professional: Briefcase,
  home: Home,
  food: Utensils,
  entertainment: Music,
  default: Gift,
};

const occasions = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'congratulations', label: 'Congratulations' },
  { value: 'just_because', label: 'Just Because' },
];

const priceRanges = [
  { value: 'budget', label: 'Budget ($0-50)' },
  { value: 'moderate', label: 'Moderate ($50-150)' },
  { value: 'premium', label: 'Premium ($150-500)' },
  { value: 'luxury', label: 'Luxury ($500+)' },
];

export function GiftSuggestionsWidget({ profileId, profileName }: GiftSuggestionsWidgetProps) {
  const [occasion, setOccasion] = useState<string>('birthday');
  const [priceRange, setPriceRange] = useState<string>('moderate');
  const [gifts, setGifts] = useState<GiftSuggestion[]>([]);

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const response = await invokeFunction('suggest-gifts', { profileId, occasion, priceRange },);

      if (response.error) throw response.error;
      return response.data as { gifts: GiftSuggestion[] };
    },
    onSuccess: (data) => {
      setGifts(data.gifts || []);
      toast.success('Gift suggestions generated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate suggestions');
    },
  });

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    for (const [key, Icon] of Object.entries(categoryIcons)) {
      if (lowerCategory.includes(key)) return Icon;
    }
    return categoryIcons.default;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-pink-500" />
          Gift Ideas
        </CardTitle>
        <CardDescription>
          AI-powered gift suggestions{profileName ? ` for ${profileName}` : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Occasion</label>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {occasions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Budget</label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => suggestMutation.mutate()}
          disabled={suggestMutation.isPending}
          className="w-full"
          size="sm"
        >
          {suggestMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate Suggestions
        </Button>

        {/* Results */}
        {suggestMutation.isPending && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {gifts.length > 0 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {gifts.map((gift, index) => {
                const priceConfig = priceRangeConfig[gift.priceRange];
                const CategoryIcon = getCategoryIcon(gift.category);

                return (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${priceConfig.bg}`}>
                          <CategoryIcon className={`h-4 w-4 ${priceConfig.color}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{gift.title}</h4>
                          <Badge variant="outline" className="text-xs mt-0.5">
                            {gift.category}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="secondary" className={priceConfig.color}>
                        <DollarSign className="h-3 w-3" />
                        {priceConfig.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {gift.description}
                    </p>
                    
                    <div className="text-xs bg-muted/50 p-2 rounded">
                      <span className="font-medium">Why this gift: </span>
                      {gift.reasoning}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {gifts.length === 0 && !suggestMutation.isPending && (
          <div className="text-center py-6 text-muted-foreground">
            <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click generate to get personalized gift ideas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
