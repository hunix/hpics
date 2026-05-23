import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { 
  Gift, 
  Calendar, 
  Sparkles, 
  RefreshCw,
  Cake,
  Heart,
  Star,
  DollarSign,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isBefore, isAfter, parseISO } from "date-fns";
import { invokeFunction } from '@/lib/api';

interface UpcomingOccasion {
  id: string;
  profileId: string;
  profileName: string;
  avatarUrl?: string;
  occasionType: 'birthday' | 'anniversary' | 'milestone' | 'holiday';
  date: Date;
  daysUntil: number;
  interests?: string[];
  giftSuggestions?: GiftSuggestion[];
}

interface GiftSuggestion {
  name: string;
  description: string;
  priceRange: string;
  reason: string;
  purchaseUrl?: string;
}

export function GiftCalendarWidget() {
  const [budgetRange, setBudgetRange] = useState<number[]>([50]);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, GiftSuggestion[]>>({});

  const { data: occasions, isLoading, refetch } = useQuery({
    queryKey: ['upcoming-occasions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      const twoWeeksOut = addDays(today, 14);

      // Get upcoming events (birthdays, anniversaries, milestones)
      const { data: events } = await supabase
        .from('events')
        .select('id, title, event_date, event_type, profile_id, profiles(first_name, last_name, avatar_url)')
        .eq('user_id', user.id)
        .gte('event_date', format(today, 'yyyy-MM-dd'))
        .lte('event_date', format(twoWeeksOut, 'yyyy-MM-dd'));

      const upcomingOccasions: UpcomingOccasion[] = [];

      if (events) {
        for (const event of events) {
          const eventDate = parseISO(event.event_date);
          const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          const profileData = event.profiles as { first_name?: string; last_name?: string; avatar_url?: string } | null;
          const occasionType = event.event_type === 'birthday' ? 'birthday' 
            : event.event_type === 'anniversary' ? 'anniversary' 
            : 'milestone';
          
          upcomingOccasions.push({
            id: `event-${event.id}`,
            profileId: event.profile_id || '',
            profileName: profileData 
              ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() 
              : event.title,
            avatarUrl: profileData?.avatar_url || undefined,
            occasionType,
            date: eventDate,
            daysUntil,
            interests: []
          });
        }
      }

      return upcomingOccasions.sort((a, b) => a.daysUntil - b.daysUntil);
    }
  });

  const generateGiftsMutation = useMutation({
    mutationFn: async (occasion: UpcomingOccasion) => {
      setGeneratingFor(occasion.id);
      const { data, error } = await invokeFunction('generate-gift-suggestions', {
          profileId: occasion.profileId,
          occasionType: occasion.occasionType,
          interests: occasion.interests || [],
          budget: budgetRange[0]
        });
      if (error) throw error;
      return { occasionId: occasion.id, suggestions: data.suggestions };
    },
    onSuccess: ({ occasionId, suggestions: newSuggestions }) => {
      setSuggestions(prev => ({ ...prev, [occasionId]: newSuggestions }));
      setGeneratingFor(null);
      toast.success("Gift ideas generated!");
    },
    onError: (error) => {
      setGeneratingFor(null);
      toast.error("Failed to generate suggestions: " + (error as Error).message);
    }
  });

  const getOccasionIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Cake className="h-4 w-4 text-pink-500" />;
      case 'anniversary': return <Heart className="h-4 w-4 text-red-500" />;
      case 'milestone': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Calendar className="h-4 w-4 text-primary" />;
    }
  };

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 2) return <Badge variant="destructive">Urgent</Badge>;
    if (daysUntil <= 5) return <Badge className="bg-orange-500">Soon</Badge>;
    if (daysUntil <= 10) return <Badge variant="secondary">Upcoming</Badge>;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Gift Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Gift Calendar
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Budget
            </span>
            <span className="font-medium">${budgetRange[0]}</span>
          </div>
          <Slider
            value={budgetRange}
            onValueChange={setBudgetRange}
            min={10}
            max={500}
            step={10}
          />
        </div>

        {!occasions || occasions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p>No upcoming occasions</p>
            <p className="text-sm">Add birthdays to contact profiles</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {occasions.map((occasion) => (
                <div 
                  key={occasion.id} 
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={occasion.avatarUrl} />
                      <AvatarFallback>{occasion.profileName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium truncate">{occasion.profileName}</span>
                        {getOccasionIcon(occasion.occasionType)}
                        {getUrgencyBadge(occasion.daysUntil)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(occasion.date, 'MMM d')} • {occasion.daysUntil === 0 ? 'Today!' : `${occasion.daysUntil} days`}
                      </div>

                      {occasion.interests && occasion.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {occasion.interests.slice(0, 3).map((interest, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {suggestions[occasion.id] ? (
                        <div className="mt-3 space-y-2">
                          {suggestions[occasion.id].map((gift, i) => (
                            <div key={i} className="p-2 bg-muted rounded text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{gift.name}</span>
                                <Badge variant="secondary">{gift.priceRange}</Badge>
                              </div>
                              <p className="text-muted-foreground text-xs mt-1">{gift.reason}</p>
                              {gift.purchaseUrl && (
                                <Button size="sm" variant="link" className="h-auto p-0 mt-1" asChild>
                                  <a href={gift.purchaseUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => generateGiftsMutation.mutate(occasion)}
                          disabled={generatingFor === occasion.id}
                        >
                          {generatingFor === occasion.id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 mr-1" />
                          )}
                          Suggest Gifts
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
