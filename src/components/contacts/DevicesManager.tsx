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
import { Loader2, Plus, Trash2, Smartphone, Laptop, Tablet, Monitor, Watch, Pencil } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface Device {
  id: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  os: string | null;
}

interface DevicesManagerProps {
  profileId: string;
}

const DEVICE_TYPES = [
  { value: 'phone', label: 'Phone', icon: Smartphone },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'laptop', label: 'Laptop', icon: Laptop },
  { value: 'desktop', label: 'Desktop', icon: Monitor },
  { value: 'watch', label: 'Smart Watch', icon: Watch },
  { value: 'other', label: 'Other', icon: Smartphone },
];

const OS_OPTIONS = ['iOS', 'Android', 'Windows', 'macOS', 'Linux', 'watchOS', 'Other'];

export function DevicesManager({ profileId }: DevicesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [formData, setFormData] = useState({ device_type: '', brand: '', model: '', os: '' });

  const { data: devices, isLoading } = useQuery({
    queryKey: ['contact-devices', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_devices')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Device[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('contact_devices').insert({
        profile_id: profileId,
        user_id: user!.id,
        device_type: data.device_type,
        brand: data.brand || null,
        model: data.model || null,
        os: data.os || null,
        is_current: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-devices', profileId] });
      toast({ title: 'Device added' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('contact_devices').update({
        device_type: data.device_type,
        brand: data.brand || null,
        model: data.model || null,
        os: data.os || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-devices', profileId] });
      toast({ title: 'Device updated' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_devices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-devices', profileId] });
      toast({ title: 'Device removed' });
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setFormData({ device_type: '', brand: '', model: '', os: '' });
    setEditingDevice(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openEditDialog = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_type: device.device_type,
      brand: device.brand || '',
      model: device.model || '',
      os: device.os || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.device_type) {
      toast({ title: 'Device type is required', variant: 'destructive' });
      return;
    }
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const getDeviceIcon = (type: string) => {
    const deviceType = DEVICE_TYPES.find(d => d.value === type);
    const Icon = deviceType?.icon || Smartphone;
    return <Icon className="h-4 w-4" />;
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  const getDeviceLabel = (d: Device) => {
    const parts = [d.brand, d.model].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : d.device_type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Devices
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
        ) : devices && devices.length > 0 ? (
          <div className="grid gap-2">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-3 bg-muted rounded-lg group">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(device.device_type)}
                  <div>
                    <p className="font-medium">
                      {device.brand} {device.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {device.device_type} {device.os && `• ${device.os}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(device)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(device)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">No devices added.</p>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Edit' : 'Add'} Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.device_type} onValueChange={(v) => setFormData({ ...formData, device_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Apple"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., iPhone 15 Pro"
                />
              </div>
              <div className="space-y-2">
                <Label>OS</Label>
                <Select value={formData.os} onValueChange={(v) => setFormData({ ...formData, os: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OS_OPTIONS.map((os) => (
                      <SelectItem key={os} value={os}>{os}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending || !formData.device_type}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingDevice ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Device"
        itemName={deleteTarget ? getDeviceLabel(deleteTarget) : undefined}
        isPending={deleteMutation.isPending}
      />
    </Card>
  );
}
