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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Car, Pencil } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface Vehicle {
  id: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
}

interface VehiclesManagerProps {
  profileId: string;
}

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Truck', 'SUV', 'Van', 'Boat', 'Bicycle', 'Other'];

export function VehiclesManager({ profileId }: VehiclesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({ vehicle_type: '', make: '', model: '', year: '', color: '' });

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['contact-vehicles', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_vehicles')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
      toast({ title: 'Vehicle added' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('contact_vehicles').update({
        vehicle_type: data.vehicle_type,
        make: data.make || null,
        model: data.model || null,
        year: data.year ? parseInt(data.year) : null,
        color: data.color || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-vehicles', profileId] });
      toast({ title: 'Vehicle updated' });
      closeDialog();
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
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setFormData({ vehicle_type: '', make: '', model: '', year: '', color: '' });
    setEditingVehicle(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_type: vehicle.vehicle_type,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      color: vehicle.color || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.vehicle_type) {
      toast({ title: 'Vehicle type is required', variant: 'destructive' });
      return;
    }
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  const getVehicleLabel = (v: Vehicle) => {
    const parts = [v.year, v.make, v.model].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : v.vehicle_type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicles
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <div className="grid gap-2">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 bg-muted rounded-lg group">
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
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(vehicle)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(vehicle)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">No vehicles added.</p>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit' : 'Add'} Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}>
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
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Camry"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Color</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Black"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending || !formData.vehicle_type}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingVehicle ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Vehicle"
        itemName={deleteTarget ? getVehicleLabel(deleteTarget) : undefined}
        isPending={deleteMutation.isPending}
      />
    </Card>
  );
}
