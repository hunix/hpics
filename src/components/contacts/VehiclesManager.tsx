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
import { Loader2, Plus, Trash2, Car } from 'lucide-react';

interface VehiclesManagerProps {
  profileId: string;
}

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Truck', 'SUV', 'Van', 'Boat', 'Bicycle', 'Other'];

export function VehiclesManager({ profileId }: VehiclesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: '', make: '', model: '', year: '', color: '' });

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['contact-vehicles', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_vehicles')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newVehicle) => {
      const { error } = await supabase.from('contact_vehicles').insert({
        profile_id: profileId,
        user_id: user!.id,
        vehicle_type: data.vehicle_type,
        make: data.make || null,
        model: data.model || null,
        year: data.year ? parseInt(data.year) : null,
        color: data.color || null,
        is_current: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-vehicles', profileId] });
      setNewVehicle({ vehicle_type: '', make: '', model: '', year: '', color: '' });
      toast({ title: 'Vehicle added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-vehicles', profileId] });
      toast({ title: 'Vehicle removed' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {vehicles && vehicles.length > 0 && (
              <div className="grid gap-2">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {vehicle.year && `${vehicle.year} `}{vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.vehicle_type} {vehicle.color && `• ${vehicle.color}`}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(vehicle.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newVehicle.vehicle_type} onValueChange={(v) => setNewVehicle({ ...newVehicle, vehicle_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Input
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  placeholder="e.g., Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="e.g., Camry"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  placeholder="Black"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newVehicle)}
                  disabled={!newVehicle.vehicle_type || addMutation.isPending}
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
