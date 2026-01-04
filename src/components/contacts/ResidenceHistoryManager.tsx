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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, MapPin, ExternalLink, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { CountryFlag } from './CountryFlag';

interface ResidenceHistoryManagerProps {
  profileId: string;
}

interface Residence {
  id: string;
  country: string;
  city: string | null;
  address: string | null;
  residence_type: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  place_name: string | null;
  postal_code: string | null;
}

export function ResidenceHistoryManager({ profileId }: ResidenceHistoryManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResidence, setEditingResidence] = useState<Residence | null>(null);
  const [formData, setFormData] = useState({
    country: '',
    city: '',
    address: '',
    postal_code: '',
    residence_type: '',
    start_date: '',
    end_date: '',
    is_current: false,
    latitude: '',
    longitude: '',
    google_maps_url: '',
    place_name: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      country: '',
      city: '',
      address: '',
      postal_code: '',
      residence_type: '',
      start_date: '',
      end_date: '',
      is_current: false,
      latitude: '',
      longitude: '',
      google_maps_url: '',
      place_name: '',
      notes: '',
    });
    setEditingResidence(null);
  };

  const { data: residences, isLoading } = useQuery({
    queryKey: ['contact-residences', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_residences')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as Residence[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        profile_id: profileId,
        user_id: user!.id,
        country: data.country,
        city: data.city || null,
        address: data.address || null,
        postal_code: data.postal_code || null,
        residence_type: data.residence_type || null,
        start_date: data.start_date || null,
        end_date: data.is_current ? null : (data.end_date || null),
        is_current: data.is_current,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        google_maps_url: data.google_maps_url || null,
        place_name: data.place_name || null,
        notes: data.notes || null,
      };

      if (editingResidence) {
        const { error } = await supabase
          .from('contact_residences')
          .update(payload)
          .eq('id', editingResidence.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contact_residences').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-residences', profileId] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: editingResidence ? 'Residence updated' : 'Residence added' });
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

  const handleEdit = (residence: Residence) => {
    setEditingResidence(residence);
    setFormData({
      country: residence.country,
      city: residence.city || '',
      address: residence.address || '',
      postal_code: residence.postal_code || '',
      residence_type: residence.residence_type || '',
      start_date: residence.start_date || '',
      end_date: residence.end_date || '',
      is_current: residence.is_current || false,
      latitude: residence.latitude?.toString() || '',
      longitude: residence.longitude?.toString() || '',
      google_maps_url: residence.google_maps_url || '',
      place_name: residence.place_name || '',
      notes: residence.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Residence History
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Residence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingResidence ? 'Edit Residence' : 'Add Residence'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Place Name</Label>
                <Input
                  placeholder="e.g., Childhood Home"
                  value={formData.place_name}
                  onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>From</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  disabled={formData.is_current}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_current_residence"
                  checked={formData.is_current}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_current: !!checked })}
                />
                <Label htmlFor="is_current_residence">Current Residence</Label>
              </div>
              <div className="col-span-2">
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  Google Maps Location
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                  <Input
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                  <Input
                    placeholder="Google Maps URL"
                    value={formData.google_maps_url}
                    onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.country || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingResidence ? 'Save Changes' : 'Add Residence'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : residences && residences.length > 0 ? (
          <div className="grid gap-3">
            {residences.map((residence) => (
              <div key={residence.id} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className={`h-5 w-5 mt-0.5 ${residence.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {residence.place_name || (residence.city ? `${residence.city}, ${residence.country}` : residence.country)}
                      {residence.is_current && <span className="text-xs text-primary">(Current)</span>}
                      <CountryFlag country={residence.country} size="sm" />
                    </p>
                    {residence.address && (
                      <p className="text-sm text-muted-foreground">{residence.address}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {residence.start_date && format(new Date(residence.start_date), 'MMM yyyy')}
                      {residence.is_current ? ' - Present' : residence.end_date ? ` - ${format(new Date(residence.end_date), 'MMM yyyy')}` : ''}
                    </p>
                    {(residence.latitude && residence.longitude) || residence.google_maps_url ? (
                      <div className="flex items-center gap-2 mt-1">
                        {residence.google_maps_url ? (
                          <a
                            href={residence.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View on Maps <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <a
                            href={`https://www.google.com/maps?q=${residence.latitude},${residence.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View on Maps <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(residence)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(residence.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No residence history added yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
