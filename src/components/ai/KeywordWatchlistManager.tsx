import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Eye, 
  Plus, 
  Trash2, 
  Bell,
  Tag,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function KeywordWatchlistManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWatchlist, setNewWatchlist] = useState({
    name: '',
    category: 'general',
    priority: 'normal',
    keywords: [] as string[],
    notify_on_match: false,
  });
  const [newKeyword, setNewKeyword] = useState('');

  const { data: watchlists, isLoading } = useQuery({
    queryKey: ['keyword-watchlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keyword_watchlists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: detections } = useQuery({
    queryKey: ['keyword-detections-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keyword_detections')
        .select('watchlist_id, keyword_matched')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      
      // Group by watchlist
      const summary: Record<string, number> = {};
      data?.forEach(d => {
        if (d.watchlist_id) {
          summary[d.watchlist_id] = (summary[d.watchlist_id] || 0) + 1;
        }
      });
      return summary;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (watchlist: typeof newWatchlist) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('keyword_watchlists')
        .insert({
          user_id: user.id,
          name: watchlist.name,
          category: watchlist.category,
          priority: watchlist.priority,
          keywords: watchlist.keywords,
          notify_on_match: watchlist.notify_on_match,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-watchlists'] });
      setIsDialogOpen(false);
      setNewWatchlist({
        name: '',
        category: 'general',
        priority: 'normal',
        keywords: [],
        notify_on_match: false,
      });
      toast.success('Watchlist created');
    },
    onError: (error) => {
      toast.error('Failed to create watchlist: ' + error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('keyword_watchlists')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-watchlists'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('keyword_watchlists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-watchlists'] });
      toast.success('Watchlist deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const addKeyword = () => {
    if (newKeyword.trim() && !newWatchlist.keywords.includes(newKeyword.trim())) {
      setNewWatchlist(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setNewWatchlist(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4 animate-pulse" />
            Loading watchlists...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Keyword Watchlists
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Keyword Watchlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newWatchlist.name}
                    onChange={(e) => setNewWatchlist(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Competitors, Legal Terms"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newWatchlist.category}
                      onValueChange={(value) => setNewWatchlist(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="competitors">Competitors</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="opportunities">Opportunities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newWatchlist.priority}
                      onValueChange={(value) => setNewWatchlist(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add keyword..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" onClick={addKeyword} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {newWatchlist.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newWatchlist.keywords.map((kw, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {kw}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeKeyword(kw)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label>Notify on match</Label>
                  <Switch
                    checked={newWatchlist.notify_on_match}
                    onCheckedChange={(checked) => setNewWatchlist(prev => ({ ...prev, notify_on_match: checked }))}
                  />
                </div>

                <Button
                  onClick={() => createMutation.mutate(newWatchlist)}
                  disabled={!newWatchlist.name || newWatchlist.keywords.length === 0 || createMutation.isPending}
                  className="w-full"
                >
                  Create Watchlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!watchlists?.length ? (
          <div className="text-center text-muted-foreground py-8">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No watchlists created</p>
            <p className="text-sm mt-1">Create a watchlist to track keywords across all content</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {watchlists.map((watchlist) => (
                <div
                  key={watchlist.id}
                  className={`p-4 border rounded-lg ${!watchlist.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{watchlist.name}</span>
                      <Badge variant={getPriorityColor(watchlist.priority)}>
                        {watchlist.priority}
                      </Badge>
                      {watchlist.notify_on_match && (
                        <Bell className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {detections?.[watchlist.id] && (
                        <Badge variant="outline">
                          {detections[watchlist.id]} matches
                        </Badge>
                      )}
                      <Switch
                        checked={watchlist.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: watchlist.id, isActive: checked })}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Watchlist?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the watchlist and all its detection history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(watchlist.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(watchlist.keywords as string[])?.slice(0, 10).map((kw, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                    {(watchlist.keywords as string[])?.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{(watchlist.keywords as string[]).length - 10} more
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Category: {watchlist.category}
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
