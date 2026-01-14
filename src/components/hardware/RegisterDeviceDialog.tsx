import { useState } from 'react';
import { useHardwareDevices } from '@/hooks/useHardwareDevices';
import { DeviceType, DEVICE_CAPABILITIES } from '@/types/hardware';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Cpu,
  Server,
  Plane,
  Camera,
  Thermometer,
  Radio,
  Search,
  Wifi,
  Mic,
  Loader2,
} from 'lucide-react';

interface RegisterDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const deviceTypeOptions: { value: DeviceType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'flipper_zero', label: 'Flipper Zero', icon: Cpu },
  { value: 'raspberry_pi', label: 'Raspberry Pi', icon: Server },
  { value: 'arduino', label: 'Arduino', icon: Cpu },
  { value: 'drone', label: 'DJI Drone', icon: Plane },
  { value: 'thermal_camera', label: 'FLIR Thermal Camera', icon: Thermometer },
  { value: 'spectrum_analyzer', label: 'Spectrum Analyzer', icon: Radio },
  { value: 'gopro', label: 'GoPro', icon: Camera },
  { value: 'metal_detector', label: 'Metal Detector', icon: Search },
  { value: 'sensor_node', label: 'Sensor Node', icon: Wifi },
  { value: 'sdr', label: 'Software Defined Radio', icon: Radio },
  { value: 'dji_mic', label: 'DJI Mic 2', icon: Mic },
];

export function RegisterDeviceDialog({ open, onOpenChange }: RegisterDeviceDialogProps) {
  const { registerDevice } = useHardwareDevices();
  const [formData, setFormData] = useState({
    device_type: '' as DeviceType | '',
    device_id: '',
    device_name: '',
    device_model: '',
  });

  const selectedType = deviceTypeOptions.find(d => d.value === formData.device_type);
  const capabilities = formData.device_type ? DEVICE_CAPABILITIES[formData.device_type] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_type || !formData.device_id) return;

    registerDevice.mutate({
      device_id: formData.device_id,
      device_type: formData.device_type,
      device_name: formData.device_name || undefined,
      device_model: formData.device_model || undefined,
      capabilities: capabilities.reduce((acc, cap) => ({ ...acc, [cap]: true }), {}),
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          device_type: '',
          device_id: '',
          device_name: '',
          device_model: '',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Hardware Device</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Device Type */}
          <div className="space-y-2">
            <Label>Device Type *</Label>
            <Select
              value={formData.device_type}
              onValueChange={(v) => setFormData({ ...formData, device_type: v as DeviceType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Capabilities Preview */}
          {capabilities.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Capabilities</Label>
              <div className="flex flex-wrap gap-1">
                {capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary" className="text-xs">
                    {cap.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Device ID */}
          <div className="space-y-2">
            <Label>Device ID / Serial Number *</Label>
            <Input
              placeholder="e.g., FZ-001, RPI-LAB-01"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              A unique identifier for this device
            </p>
          </div>

          {/* Device Name */}
          <div className="space-y-2">
            <Label>Device Name (Optional)</Label>
            <Input
              placeholder="e.g., Field Unit Alpha"
              value={formData.device_name}
              onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
            />
          </div>

          {/* Device Model */}
          <div className="space-y-2">
            <Label>Model (Optional)</Label>
            <Input
              placeholder="e.g., Raspberry Pi 5 8GB"
              value={formData.device_model}
              onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!formData.device_type || !formData.device_id || registerDevice.isPending}
            >
              {registerDevice.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Register Device
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
