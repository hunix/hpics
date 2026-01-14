import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Video, 
  VideoOff, 
  Radio, 
  Image, 
  Download, 
  Settings,
  Wifi,
  Battery,
  HardDrive
} from 'lucide-react';
import { useGoProIntelligence } from '@/hooks/useGoProIntelligence';
import { useHardwareDevices } from '@/hooks/useHardwareDevices';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function GoProControl() {
  const { 
    registerGoPro, 
    startRecording, 
    stopRecording, 
    capturePhoto, 
    startLivestream,
    isRecording, 
    isStreaming,
    isRegistering 
  } = useGoProIntelligence();
  const { devices } = useHardwareDevices();
  
  const gopros = devices.filter(d => d.device_type === 'gopro');
  const [selectedGoPro, setSelectedGoPro] = useState<string>('');
  const [recordMode, setRecordMode] = useState<'video' | 'photo' | 'timelapse' | 'burst'>('video');
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    gopro_model: 'HERO11 Black',
    serial_number: ''
  });

  const handleRegister = () => {
    registerGoPro(newDevice, {
      onSuccess: () => {
        setRegisterDialogOpen(false);
        setNewDevice({ device_name: '', gopro_model: 'HERO11 Black', serial_number: '' });
      }
    });
  };

  const selectedDevice = gopros.find(g => g.id === selectedGoPro);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          GoPro Control
        </CardTitle>
        <CardDescription>
          Remote control and media capture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Selection */}
        <div className="flex gap-2">
          <Select value={selectedGoPro} onValueChange={setSelectedGoPro}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select GoPro" />
            </SelectTrigger>
            <SelectContent>
              {gopros.map(gopro => (
                <SelectItem key={gopro.id} value={gopro.id}>
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {gopro.device_name}
                    {gopro.is_online && (
                      <Badge variant="outline" className="ml-2 text-green-500 border-green-500">
                        Online
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Camera className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register GoPro</DialogTitle>
                <DialogDescription>
                  Connect a GoPro camera to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Device Name</Label>
                  <Input 
                    placeholder="My GoPro"
                    value={newDevice.device_name}
                    onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select 
                    value={newDevice.gopro_model}
                    onValueChange={(v) => setNewDevice({ ...newDevice, gopro_model: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HERO13 Black">HERO13 Black</SelectItem>
                      <SelectItem value="HERO12 Black">HERO12 Black</SelectItem>
                      <SelectItem value="HERO11 Black">HERO11 Black</SelectItem>
                      <SelectItem value="HERO10 Black">HERO10 Black</SelectItem>
                      <SelectItem value="MAX">MAX 360</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Serial Number (optional)</Label>
                  <Input 
                    placeholder="C3XXXXXXX"
                    value={newDevice.serial_number}
                    onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleRegister}
                  disabled={!newDevice.device_name || isRegistering}
                >
                  {isRegistering ? 'Registering...' : 'Register GoPro'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedDevice && (
          <>
            {/* Device Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Wifi className={`h-4 w-4 ${selectedDevice.is_online ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{selectedDevice.is_online ? 'Connected' : 'Offline'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Battery className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">--</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">--</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Recording Mode */}
            <div className="space-y-2">
              <Label>Recording Mode</Label>
              <div className="flex gap-2">
                {(['video', 'photo', 'timelapse', 'burst'] as const).map(mode => (
                  <Button
                    key={mode}
                    variant={recordMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRecordMode(mode)}
                  >
                    {mode === 'video' && <Video className="h-4 w-4 mr-1" />}
                    {mode === 'photo' && <Image className="h-4 w-4 mr-1" />}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
              {recordMode === 'video' && (
                <Button 
                  variant={isRecording ? 'destructive' : 'default'}
                  className="col-span-2"
                  onClick={() => isRecording 
                    ? stopRecording(selectedGoPro) 
                    : startRecording({ device_id: selectedGoPro, mode: 'video' })
                  }
                >
                  {isRecording ? (
                    <><VideoOff className="h-4 w-4 mr-2" /> Stop Recording</>
                  ) : (
                    <><Video className="h-4 w-4 mr-2" /> Start Recording</>
                  )}
                </Button>
              )}
              
              {recordMode === 'photo' && (
                <Button 
                  className="col-span-2"
                  onClick={() => capturePhoto({ device_id: selectedGoPro })}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              )}
              
              {recordMode === 'timelapse' && (
                <Button 
                  variant={isRecording ? 'destructive' : 'default'}
                  className="col-span-2"
                  onClick={() => isRecording 
                    ? stopRecording(selectedGoPro) 
                    : startRecording({ device_id: selectedGoPro, mode: 'timelapse' })
                  }
                >
                  {isRecording ? 'Stop Timelapse' : 'Start Timelapse'}
                </Button>
              )}
              
              {recordMode === 'burst' && (
                <Button 
                  className="col-span-2"
                  onClick={() => startRecording({ device_id: selectedGoPro, mode: 'burst' })}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Burst
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => startLivestream({ device_id: selectedGoPro })}
                disabled={isStreaming}
              >
                <Radio className={`h-4 w-4 mr-2 ${isStreaming ? 'text-red-500 animate-pulse' : ''}`} />
                {isStreaming ? 'Streaming...' : 'Livestream'}
              </Button>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Sync Media
              </Button>
            </div>
          </>
        )}

        {!selectedDevice && gopros.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No GoPro devices registered</p>
            <p className="text-xs">Click "Add" to connect a GoPro</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
