import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Plane } from 'lucide-react';
import { format } from 'date-fns';

interface TravelHistoryManagerProps {
  profileId: string;
}

const TRAVEL_PURPOSES = ['Vacation', 'Business', 'Family Visit', 'Conference', 'Medical', 'Education', 'Other'];

export function TravelHistoryManager({ profileId }: TravelHistoryManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTravel, setNewTravel] = useState({
    destination_country: '',
    destination_city: '',
    travel_date: '',
    return_date: '',
    purpose: '',
  });

  const { data: travels, isLoading } = useQuery({
    queryKey: ['contact-travel-history', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_travel_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('travel_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newTravel) => {
      const { error } = await supabase.from('contact_travel_history').insert({
        profile_id: profileId,
        user_id: user!.id,
        destination_country: data.destination_country,
        destination_city: data.destination_city || null,
        travel_date: data.travel_date || null,
        return_date: data.return_date || null,
        purpose: data.purpose || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-travel-history', profileId] });
      setNewTravel({ destination_country: '', destination_city: '', travel_date: '', return_date: '', purpose: '' });
      toast({ title: 'Travel added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_travel_history').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-travel-history', profileId] });
      toast({ title: 'Travel removed' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Travel History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {travels && travels.length > 0 && (
              <div className="grid gap-2">
                {travels.map((travel) => (
                  <div key={travel.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Plane className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {travel.destination_city ? `${travel.destination_city}, ` : ''}{travel.destination_country}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {travel.travel_date && format(new Date(travel.travel_date), 'MMM d, yyyy')}
                          {travel.return_date && ` - ${format(new Date(travel.return_date), 'MMM d, yyyy')}`}
                          {travel.purpose && ` • ${travel.purpose}`}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(travel.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={newTravel.destination_country}
                  onChange={(e) => setNewTravel({ ...newTravel, destination_country: e.target.value })}
                  placeholder="e.g., France"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={newTravel.destination_city}
                  onChange={(e) => setNewTravel({ ...newTravel, destination_city: e.target.value })}
                  placeholder="e.g., Paris"
                />
              </div>
              <div className="space-y-2">
                <Label>Travel Date</Label>
                <Input
                  type="date"
                  value={newTravel.travel_date}
                  onChange={(e) => setNewTravel({ ...newTravel, travel_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Return Date</Label>
                <Input
                  type="date"
                  value={newTravel.return_date}
                  onChange={(e) => setNewTravel({ ...newTravel, return_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={newTravel.purpose} onValueChange={(v) => setNewTravel({ ...newTravel, purpose: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAVEL_PURPOSES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newTravel)}
                  disabled={!newTravel.destination_country || addMutation.isPending}
                  size="sm"
                >
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
