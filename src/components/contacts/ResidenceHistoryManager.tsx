import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface ResidenceHistoryManagerProps {
  profileId: string;
}

export function ResidenceHistoryManager({ profileId }: ResidenceHistoryManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newResidence, setNewResidence] = useState({
    country: '',
    city: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  const { data: residences, isLoading } = useQuery({
    queryKey: ['contact-residences', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_residences')
        .select('*')
        .eq('profile_id', profileId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newResidence) => {
      const { error } = await supabase.from('contact_residences').insert({
        profile_id: profileId,
        user_id: user!.id,
        country: data.country,
        city: data.city || null,
        start_date: data.start_date || null,
        end_date: data.is_current ? null : (data.end_date || null),
        is_current: data.is_current,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-residences', profileId] });
      setNewResidence({ country: '', city: '', start_date: '', end_date: '', is_current: false });
      toast({ title: 'Residence added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_residences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-residences', profileId] });
      toast({ title: 'Residence removed' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Residence History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {residences && residences.length > 0 && (
              <div className="grid gap-2">
                {residences.map((residence) => (
                  <div key={residence.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className={`h-5 w-5 ${residence.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {residence.city ? `${residence.city}, ` : ''}{residence.country}
                          {residence.is_current && <span className="text-xs text-primary">(Current)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {residence.start_date && format(new Date(residence.start_date), 'MMM yyyy')}
                          {residence.is_current ? ' - Present' : residence.end_date ? ` - ${format(new Date(residence.end_date), 'MMM yyyy')}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(residence.id)}>
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
                  value={newResidence.country}
                  onChange={(e) => setNewResidence({ ...newResidence, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={newResidence.city}
                  onChange={(e) => setNewResidence({ ...newResidence, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>From</Label>
                <Input
                  type="date"
                  value={newResidence.start_date}
                  onChange={(e) => setNewResidence({ ...newResidence, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input
                  type="date"
                  value={newResidence.end_date}
                  onChange={(e) => setNewResidence({ ...newResidence, end_date: e.target.value })}
                  disabled={newResidence.is_current}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_current"
                    checked={newResidence.is_current}
                    onCheckedChange={(checked) => setNewResidence({ ...newResidence, is_current: !!checked })}
                  />
                  <Label htmlFor="is_current" className="text-xs">Current</Label>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newResidence)}
                  disabled={!newResidence.country || addMutation.isPending}
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
