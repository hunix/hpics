import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Smartphone, Laptop, Tablet, Monitor, Watch } from 'lucide-react';

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
  const [newDevice, setNewDevice] = useState({ device_type: '', brand: '', model: '', os: '' });

  const { data: devices, isLoading } = useQuery({
    queryKey: ['contact-devices', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_devices')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newDevice) => {
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
      setNewDevice({ device_type: '', brand: '', model: '', os: '' });
      toast({ title: 'Device added' });
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
    },
  });

  const getDeviceIcon = (type: string) => {
    const deviceType = DEVICE_TYPES.find(d => d.value === type);
    const Icon = deviceType?.icon || Smartphone;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Devices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {devices && devices.length > 0 && (
              <div className="grid gap-2">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(device.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newDevice.device_type} onValueChange={(v) => setNewDevice({ ...newDevice, device_type: v })}>
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
                  value={newDevice.brand}
                  onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                  placeholder="e.g., Apple"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={newDevice.model}
                  onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                  placeholder="e.g., iPhone 15 Pro"
                />
              </div>
              <div className="space-y-2">
                <Label>OS</Label>
                <Select value={newDevice.os} onValueChange={(v) => setNewDevice({ ...newDevice, os: v })}>
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
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newDevice)}
                  disabled={!newDevice.device_type || addMutation.isPending}
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
