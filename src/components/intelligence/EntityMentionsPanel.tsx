import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, MapPin, Package, Search, Filter,
  ExternalLink, TrendingUp, Clock, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface EntityMention {
  id: string;
  entity_type: string;
  entity_name: string;
  source_type: string | null;
  context: string | null;
  sentiment: number | null;
  created_at: string | null;
  mentioned_in_profile_id: string | null;
  profiles?: { full_name: string } | null;
  [key: string]: unknown;
}

interface EntityMentionsPanelProps {
  profileId?: string;
  className?: string;
}

const ENTITY_TYPES = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'person', label: 'People', icon: Users },
  { id: 'company', label: 'Companies', icon: Building2 },
  { id: 'location', label: 'Locations', icon: MapPin },
  { id: 'product', label: 'Products', icon: Package },
];

export function EntityMentionsPanel({ profileId, className }: EntityMentionsPanelProps) {
  const [mentions, setMentions] = useState<EntityMention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadMentions();
  }, [profileId, activeType]);

  const loadMentions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('entity_mentions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (profileId) {
        query = query.eq('mentioned_in_profile_id', profileId);
      }

      if (activeType !== 'all') {
        query = query.eq('entity_type', activeType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data to match interface
      const transformedData: EntityMention[] = (data || []).map(m => ({
        ...m,
        profiles: null, // We'll fetch profile names separately if needed
      }));

      setMentions(transformedData);

      // Calculate counts
      const counts: Record<string, number> = { all: data?.length || 0 };
      (data || []).forEach(m => {
        counts[m.entity_type] = (counts[m.entity_type] || 0) + 1;
      });
      setEntityCounts(counts);
    } catch (error) {
      console.error('Failed to load entity mentions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMentions = mentions.filter(m => 
    searchQuery === '' || 
    m.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.context?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByEntity = filteredMentions.reduce((acc, mention) => {
    const key = `${mention.entity_type}:${mention.entity_name.toLowerCase()}`;
    if (!acc[key]) {
      acc[key] = {
        entityName: mention.entity_name,
        entityType: mention.entity_type,
        mentions: [],
        totalSentiment: 0,
        count: 0,
      };
    }
    acc[key].mentions.push(mention);
    acc[key].count++;
    if (mention.sentiment !== null) {
      acc[key].totalSentiment += mention.sentiment;
    }
    return acc;
  }, {} as Record<string, { entityName: string; entityType: string; mentions: EntityMention[]; totalSentiment: number; count: number }>);

  const topEntities = Object.values(groupedByEntity)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person': return Users;
      case 'company': return Building2;
      case 'location': return MapPin;
      case 'product': return Package;
      default: return Search;
    }
  };

  const getSentimentColor = (sentiment: number | null) => {
    if (sentiment === null) return 'text-muted-foreground';
    if (sentiment > 0.3) return 'text-green-500';
    if (sentiment < -0.3) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Entity Mentions
          {!profileId && (
            <Badge variant="secondary" className="text-xs ml-auto">
              Cross-Contact
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {ENTITY_TYPES.map(type => (
            <Button
              key={type.id}
              variant={activeType === type.id ? 'default' : 'ghost'}
              size="sm"
              className="text-xs shrink-0 h-7 px-2"
              onClick={() => setActiveType(type.id)}
            >
              <type.icon className="h-3 w-3 mr-1" />
              {type.label}
              {entityCounts[type.id] !== undefined && (
                <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                  {entityCounts[type.id]}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Search className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading entities...</p>
          </div>
        ) : topEntities.length === 0 ? (
          <div className="py-8 text-center">
            <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No entity mentions found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Entities are extracted from messages, documents, and transcriptions
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {topEntities.map((entity, i) => {
                const Icon = getEntityIcon(entity.entityType);
                const avgSentiment = entity.count > 0 
                  ? entity.totalSentiment / entity.count 
                  : null;
                const latestMention = entity.mentions[0];

                return (
                  <div
                    key={i}
                    className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {entity.entityName}
                          </span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {entity.count} mentions
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {latestMention.context}
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(latestMention.created_at ?? Date.now()), { addSuffix: true })}
                          </span>
                          {avgSentiment !== null && (
                            <span className={cn('flex items-center gap-1', getSentimentColor(avgSentiment))}>
                              Sentiment: {avgSentiment > 0 ? '+' : ''}{(avgSentiment * 100).toFixed(0)}%
                            </span>
                          )}
                          {!profileId && latestMention.profiles?.full_name && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {latestMention.profiles.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default EntityMentionsPanel;
