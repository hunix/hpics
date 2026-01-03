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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Home, Building2 } from 'lucide-react';

interface PropertiesManagerProps {
  profileId: string;
}

const PROPERTY_TYPES = ['House', 'Apartment', 'Villa', 'Land', 'Commercial', 'Warehouse', 'Office', 'Other'];

export function PropertiesManager({ profileId }: PropertiesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newProperty, setNewProperty] = useState({
    property_type: '',
    country: '',
    city: '',
    address: '',
    is_primary_residence: false,
  });

  const { data: properties, isLoading } = useQuery({
    queryKey: ['contact-properties', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_properties')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_primary_residence', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newProperty) => {
      const { error } = await supabase.from('contact_properties').insert({
        profile_id: profileId,
        user_id: user!.id,
        property_type: data.property_type,
        country: data.country || null,
        city: data.city || null,
        address: data.address || null,
        is_primary_residence: data.is_primary_residence,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-properties', profileId] });
      setNewProperty({ property_type: '', country: '', city: '', address: '', is_primary_residence: false });
      toast({ title: 'Property added' });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Properties & Real Estate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {properties && properties.length > 0 && (
              <div className="grid gap-2">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {property.is_primary_residence ? <Home className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {property.property_type}
                          {property.is_primary_residence && <span className="text-xs text-primary">(Primary)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[property.address, property.city, property.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(property.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newProperty.property_type} onValueChange={(v) => setNewProperty({ ...newProperty, property_type: v })}>
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
                <Label>Country</Label>
                <Input
                  value={newProperty.country}
                  onChange={(e) => setNewProperty({ ...newProperty, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={newProperty.city}
                  onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary"
                    checked={newProperty.is_primary_residence}
                    onCheckedChange={(checked) => setNewProperty({ ...newProperty, is_primary_residence: !!checked })}
                  />
                  <Label htmlFor="is_primary" className="text-xs">Primary</Label>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newProperty)}
                  disabled={!newProperty.property_type || addMutation.isPending}
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
