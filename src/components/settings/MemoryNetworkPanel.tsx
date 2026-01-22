/**
 * Memory Network Panel
 * 
 * Visualization and management of the A-Mem agentic memory network.
 * Displays memory nodes, links, tiers, and decay status.
 */

import { useState } from 'react';
import { 
  useProfileMemories, 
  useTriggerDecay
} from '@/hooks/intelligence/useAgenticMemory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Brain, Network, Sparkles, Clock, Search, RefreshCw,
  Trash2, Link2, Tag, AlertTriangle, ChevronRight, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Memory {
  id: string;
  memory_type: string;
  memory_tier: string;
  content: string;
  confidence_score: number;
  decay_rate: number;
  access_count: number;
  is_verified: boolean;
  keywords: string[];
  tags: string[];
  profile_id: string | null;
  created_at: string;
  last_accessed_at: string | null;
}

interface MemoryLink {
  id: string;
  source_memory_id: string;
  target_memory_id: string;
  link_type: string;
  link_strength: number;
}

const TIER_COLORS: Record<string, string> = {
  core: 'bg-violet-500',
  working: 'bg-blue-500',
  episodic: 'bg-emerald-500',
  semantic: 'bg-amber-500',
  procedural: 'bg-rose-500',
};

const TIER_LABELS: Record<string, string> = {
  core: 'Core Identity',
  working: 'Working Memory',
  episodic: 'Episodic Events',
  semantic: 'Semantic Facts',
  procedural: 'Procedures',
};

function MemoryCard({ memory }: { memory: Memory }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const healthScore = memory.confidence_score * (1 - memory.decay_rate);
  
  return (
    <Card className={cn(
      "transition-all",
      healthScore < 0.3 && "opacity-60 border-rose-500/30"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Tier indicator */}
          <div className={cn(
            "w-1 h-full min-h-[60px] rounded-full",
            TIER_COLORS[memory.memory_tier] || 'bg-gray-400'
          )} />
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {memory.memory_type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {TIER_LABELS[memory.memory_tier] || memory.memory_tier}
              </Badge>
              {memory.is_verified && (
                <Badge variant="default" className="text-xs bg-emerald-500">
                  Verified
                </Badge>
              )}
              {healthScore < 0.3 && (
                <AlertTriangle className="h-3 w-3 text-rose-500" />
              )}
            </div>
            
            {/* Content preview */}
            <p className={cn(
              "text-sm",
              isExpanded ? "" : "line-clamp-2"
            )}>
              {memory.content}
            </p>
            
            {memory.content.length > 100 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
                <ChevronRight className={cn("h-3 w-3 ml-1 transition-transform", isExpanded && "rotate-90")} />
              </Button>
            )}
            
            {/* Tags */}
            {memory.keywords && memory.keywords.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <Tag className="h-3 w-3 text-muted-foreground" />
                {memory.keywords.slice(0, 5).map((keyword, idx) => (
                  <span key={idx} className="text-xs text-muted-foreground">
                    {keyword}{idx < Math.min(memory.keywords.length - 1, 4) && ','}
                  </span>
                ))}
                {memory.keywords.length > 5 && (
                  <span className="text-xs text-muted-foreground">+{memory.keywords.length - 5} more</span>
                )}
              </div>
            )}
            
            {/* Metrics */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {(memory.confidence_score * 100).toFixed(0)}% confidence
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {memory.access_count} accesses
              </span>
              <span>
                {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {/* Health bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Health</span>
                <span className={healthScore >= 0.7 ? "text-emerald-500" : healthScore >= 0.4 ? "text-amber-500" : "text-rose-500"}>
                  {(healthScore * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={healthScore * 100} className="h-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MemoryStats({ memories }: { memories: Memory[] }) {
  const tierCounts = memories.reduce((acc, m) => {
    acc[m.memory_tier] = (acc[m.memory_tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const avgConfidence = memories.length > 0
    ? memories.reduce((sum, m) => sum + m.confidence_score, 0) / memories.length
    : 0;
    
  const verifiedCount = memories.filter(m => m.is_verified).length;
  const decayingCount = memories.filter(m => m.decay_rate > 0.5).length;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <Database className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{memories.length}</p>
          <p className="text-xs text-muted-foreground">Total Memories</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Sparkles className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold">{(avgConfidence * 100).toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Avg Confidence</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Badge className="mx-auto mb-2 bg-emerald-500">{verifiedCount}</Badge>
          <p className="text-xs text-muted-foreground mt-2">Verified</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <AlertTriangle className={cn(
            "h-5 w-5 mx-auto mb-2",
            decayingCount > 0 ? "text-amber-500" : "text-muted-foreground"
          )} />
          <p className="text-2xl font-bold">{decayingCount}</p>
          <p className="text-xs text-muted-foreground">Decaying</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function MemoryNetworkPanel() {
  const [activeTab, setActiveTab] = useState<'memories' | 'links' | 'tiers'>('memories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  const { data: memories = [], isLoading: loadingMemories, refetch } = useProfileMemories(undefined, { limit: 100 });
  const decayMutation = useTriggerDecay();
  const links: MemoryLink[] = [];
  
  const filteredMemories = (memories || []).filter(m => {
    const matchesSearch = !searchQuery || 
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.keywords?.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = !selectedTier || m.memory_tier === selectedTier;
    return matchesSearch && matchesTier;
  });
  
  if (loadingMemories) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Agentic Memory Network</CardTitle>
              <CardDescription>Self-organizing A-Mem knowledge graph</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => decayMutation.mutate()}
              disabled={decayMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Run Decay
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <MemoryStats memories={(memories || []) as unknown as Memory[]} />
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="memories" className="gap-2">
              <Brain className="h-4 w-4" />
              Memories
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <Link2 className="h-4 w-4" />
              Links ({links?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="tiers" className="gap-2">
              <Network className="h-4 w-4" />
              By Tier
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="memories" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memories by content or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Memory List */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {filteredMemories.length > 0 ? (
                  filteredMemories.map(memory => (
                    <MemoryCard key={memory.id} memory={memory as unknown as Memory} />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No memories found</p>
                    <p className="text-sm">Memories are crystallized from intelligence operations</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="links">
            <ScrollArea className="h-[450px]">
              {links && links.length > 0 ? (
                <div className="space-y-2 pr-4">
                  {links.map((link: MemoryLink) => (
                    <div key={link.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 font-mono text-xs truncate">
                        {link.source_memory_id.slice(0, 8)}...
                      </div>
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        <Badge variant="outline">{link.link_type}</Badge>
                        <span className="text-xs font-mono">
                          {(link.link_strength * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex-1 font-mono text-xs truncate text-right">
                        ...{link.target_memory_id.slice(-8)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No memory links yet</p>
                  <p className="text-sm">Links are created as memories reference each other</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="tiers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(TIER_LABELS).map(([tier, label]) => {
                const tierMemories = (memories || []).filter(m => m.memory_tier === tier);
                return (
                  <Card 
                    key={tier}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedTier === tier && "border-primary"
                    )}
                    onClick={() => {
                      setSelectedTier(selectedTier === tier ? null : tier);
                      setActiveTab('memories');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", TIER_COLORS[tier])} />
                        <div className="flex-1">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">{tierMemories.length} memories</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
