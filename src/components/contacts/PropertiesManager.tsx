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
import { Loader2, Plus, Trash2, Home, Building2, MapPin, ExternalLink, Edit2 } from 'lucide-react';
import { CountryFlag } from './CountryFlag';

interface PropertiesManagerProps {
  profileId: string;
}

interface Property {
  id: string;
  property_type: string;
  country: string | null;
  city: string | null;
  address: string | null;
  is_primary_residence: boolean | null;
  area_sqm: number | null;
  estimated_value: string | null;
  purchase_date: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  place_name: string | null;
  postal_code: string | null;
}

const PROPERTY_TYPES = ['House', 'Apartment', 'Villa', 'Land', 'Commercial', 'Warehouse', 'Office', 'Other'];

export function PropertiesManager({ profileId }: PropertiesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    property_type: '',
    country: '',
    city: '',
    address: '',
    postal_code: '',
    is_primary_residence: false,
    latitude: '',
    longitude: '',
    google_maps_url: '',
    place_name: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      property_type: '',
      country: '',
      city: '',
      address: '',
      postal_code: '',
      is_primary_residence: false,
      latitude: '',
      longitude: '',
      google_maps_url: '',
      place_name: '',
      notes: '',
    });
    setEditingProperty(null);
  };

  const { data: properties, isLoading } = useQuery({
    queryKey: ['contact-properties', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_properties')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_primary_residence', { ascending: false });
      if (error) throw error;
      return data as Property[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        profile_id: profileId,
        user_id: user!.id,
        property_type: data.property_type,
        country: data.country || null,
        city: data.city || null,
        address: data.address || null,
        postal_code: data.postal_code || null,
        is_primary_residence: data.is_primary_residence,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        google_maps_url: data.google_maps_url || null,
        place_name: data.place_name || null,
        notes: data.notes || null,
      };

      if (editingProperty) {
        const { error } = await supabase
          .from('contact_properties')
          .update(payload)
          .eq('id', editingProperty.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contact_properties').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-properties', profileId] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: editingProperty ? 'Property updated' : 'Property added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_properties').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-properties', profileId] });
      toast({ title: 'Property removed' });
    },
  });

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      property_type: property.property_type,
      country: property.country || '',
      city: property.city || '',
      address: property.address || '',
      postal_code: property.postal_code || '',
      is_primary_residence: property.is_primary_residence || false,
      latitude: property.latitude?.toString() || '',
      longitude: property.longitude?.toString() || '',
      google_maps_url: property.google_maps_url || '',
      place_name: property.place_name || '',
      notes: property.notes || '',
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
          <Building2 className="h-5 w-5" />
          Properties & Locations
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProperty ? 'Edit Property' : 'Add Property'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.property_type} onValueChange={(v) => setFormData({ ...formData, property_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Place Name</Label>
                <Input
                  placeholder="e.g., Beach House, Main Office"
                  value={formData.place_name}
                  onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="is_primary"
                  checked={formData.is_primary_residence}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_primary_residence: !!checked })}
                />
                <Label htmlFor="is_primary">Primary Residence</Label>
              </div>
              <div className="col-span-2">
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  Google Maps Location
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="Latitude (e.g., 25.2048)"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                  <Input
                    placeholder="Longitude (e.g., 55.2708)"
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
                  placeholder="Additional details about this property..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.property_type || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingProperty ? 'Save Changes' : 'Add Property'}
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
        ) : properties && properties.length > 0 ? (
          <div className="grid gap-3">
            {properties.map((property) => (
              <div key={property.id} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  {property.is_primary_residence ? (
                    <Home className="h-5 w-5 text-primary mt-0.5" />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {property.place_name || property.property_type}
                      {property.is_primary_residence && (
                        <span className="text-xs text-primary">(Primary)</span>
                      )}
                      {property.country && <CountryFlag country={property.country} size="sm" />}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[property.address, property.city, property.postal_code, property.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {(property.latitude && property.longitude) || property.google_maps_url ? (
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {property.google_maps_url ? (
                          <a
                            href={property.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View on Maps <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <a
                            href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
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
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(property)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(property.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No properties added yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
