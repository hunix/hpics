import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Car, Smartphone, FileText, Watch, Building, User, Shirt, Sofa, PawPrint, Package,
  Link as LinkIcon, Check, X, Eye, Filter, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const CATEGORY_ICONS: Record<string, any> = {
  vehicle: Car,
  device: Smartphone,
  document: FileText,
  jewelry: Watch,
  property: Building,
  account: User,
  clothing: Shirt,
  furniture: Sofa,
  pet: PawPrint,
  other: Package,
};

const CATEGORY_COLORS: Record<string, string> = {
  vehicle: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  device: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  document: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  jewelry: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  property: 'bg-green-500/10 text-green-500 border-green-500/20',
  account: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  clothing: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  furniture: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  pet: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

interface DetectedItemsManagerProps {
  profileId?: string;
  showLinkingControls?: boolean;
}

export function DetectedItemsManager({ profileId, showLinkingControls = true }: DetectedItemsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch detected items
  const { data: items, isLoading } = useQuery({
    queryKey: ['detected-items', profileId, selectedCategory, selectedStatus, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('detected_items')
        .select(`*`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('linked_status', selectedStatus);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch profiles for linking
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user!.id)
        .order('first_name');
      if (error) throw error;
      return (data || []).map(p => ({ ...p, full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() }));
    },
    enabled: !!user && showLinkingControls,
  });

  // Fetch category counts
  const { data: categoryCounts } = useQuery({
    queryKey: ['detected-items-counts', profileId],
    queryFn: async () => {
      let query = supabase
        .from('detected_items')
        .select('category')
        .eq('user_id', user!.id);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  // Link item to profile mutation
  const linkMutation = useMutation({
    mutationFn: async ({ itemId, profileId }: { itemId: string; profileId: string }) => {
      const { error } = await supabase
        .from('detected_items')
        .update({
          profile_id: profileId,
          linked_status: 'manually_linked',
          linked_at: new Date().toISOString(),
          linked_by: 'user',
        })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detected-items'] });
      toast({ title: 'Item linked to contact' });
    },
  });

  // Ignore item mutation
  const ignoreMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('detected_items')
        .update({ linked_status: 'ignored' })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detected-items'] });
      toast({ title: 'Item ignored' });
    },
  });

  const pendingCount = items?.filter(i => i.linked_status === 'pending').length || 0;
  const linkedCount = items?.filter(i => i.linked_status !== 'pending' && i.linked_status !== 'ignored').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detected Items
            </CardTitle>
            <CardDescription>
              Items, belongings, and assets detected in media
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pendingCount} pending</Badge>
            <Badge variant="secondary">{linkedCount} linked</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryCounts || {}).map(([cat, count]) => {
                const Icon = CATEGORY_ICONS[cat] || Package;
                return (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {cat} ({count})
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="auto_linked">Auto-linked</SelectItem>
              <SelectItem value="manually_linked">Manually Linked</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_ICONS).map(([cat, Icon]) => {
            const count = categoryCounts?.[cat] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? 'all' : cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCategory === cat 
                    ? CATEGORY_COLORS[cat] 
                    : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Items list */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Package className="h-8 w-8 mb-2" />
              <p>No items detected yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items?.map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || Package;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${CATEGORY_COLORS[item.category]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {item.name || item.item_type}
                        </span>
                        {item.brand && (
                          <Badge variant="outline" className="text-xs">
                            {item.brand}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={item.linked_status === 'pending' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.linked_status}
                        </Badge>
                        {item.confidence && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(item.confidence * 100)}% confidence
                          </span>
                        )}
                        {item.profile?.full_name && (
                          <span className="text-xs text-muted-foreground">
                            → {item.profile.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {showLinkingControls && item.linked_status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Link Item to Contact</DialogTitle>
                              <DialogDescription>
                                Select a contact to link this {item.item_type} to.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 mt-4">
                              <div className="p-3 rounded-lg bg-muted">
                                <p className="font-medium">{item.name || item.item_type}</p>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              <ScrollArea className="h-[200px]">
                                <div className="space-y-2">
                                  {profiles?.map((profile) => (
                                    <button
                                      key={profile.id}
                                      onClick={() => {
                                        linkMutation.mutate({ itemId: item.id, profileId: profile.id });
                                      }}
                                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        {profile.avatar_url ? (
                                          <img src={profile.avatar_url} className="h-8 w-8 rounded-full" />
                                        ) : (
                                          <User className="h-4 w-4" />
                                        )}
                                      </div>
                                      <span>{profile.full_name}</span>
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => ignoreMutation.mutate(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Item Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-muted-foreground">Category</label>
                              <p className="font-medium capitalize">{item.category}</p>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Type</label>
                              <p className="font-medium">{item.item_type}</p>
                            </div>
                            {item.name && (
                              <div>
                                <label className="text-xs text-muted-foreground">Name</label>
                                <p className="font-medium">{item.name}</p>
                              </div>
                            )}
                            {item.brand && (
                              <div>
                                <label className="text-xs text-muted-foreground">Brand</label>
                                <p className="font-medium">{item.brand}</p>
                              </div>
                            )}
                            {item.model && (
                              <div>
                                <label className="text-xs text-muted-foreground">Model</label>
                                <p className="font-medium">{item.model}</p>
                              </div>
                            )}
                          </div>
                          {item.description && (
                            <div>
                              <label className="text-xs text-muted-foreground">Description</label>
                              <p className="text-sm">{item.description}</p>
                            </div>
                          )}
                          {item.specifications && Object.keys(item.specifications).length > 0 && (
                            <div>
                              <label className="text-xs text-muted-foreground">Specifications</label>
                              <div className="mt-1 space-y-1">
                                {Object.entries(item.specifications).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
