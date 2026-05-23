import React, { useState, useEffect } from 'react';
import { Watch, Heart, MapPin, Activity, Moon, RefreshCw, Loader2, CheckCircle, AlertCircle, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';
import {
  loadWearableSyncSettings,
  saveWearableSyncSettings,
  loadLastWearableSync,
} from '@/hooks/devices/useWearableSync';

interface WearableDevice {
  id: string;
  name: string;
  type: 'galaxy_watch_ultra' | 'galaxy_watch_7' | 'apple_watch' | 'other';
  isConnected: boolean;
  lastSync?: string;
  batteryLevel?: number;
}

interface SyncSettings {
  heartRate: boolean;
  heartRateInterval: number; // minutes
  location: boolean;
  locationDuringMeetings: boolean;
  activity: boolean;
  sleep: boolean;
  stress: boolean;
  syncDuringMeetingsOnly: boolean;
}

interface WearableSyncSettingsProps {
  className?: string;
}

export function WearableSyncSettings({ className }: WearableSyncSettingsProps) {
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [settings, setSettings] = useState<SyncSettings>({
    heartRate: true,
    heartRateInterval: 5,
    location: true,
    locationDuringMeetings: true,
    activity: true,
    sleep: false,
    stress: true,
    syncDuringMeetingsOnly: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadDevices();
    loadLastSync();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await loadWearableSyncSettings<SyncSettings>();
      if (loaded) setSettings(loaded);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would use Capacitor plugins to discover devices
      // For now, we'll show placeholder devices
      const mockDevices: WearableDevice[] = [
        {
          id: 'gw-ultra-1',
          name: 'Galaxy Watch Ultra',
          type: 'galaxy_watch_ultra',
          isConnected: false,
          lastSync: undefined,
          batteryLevel: undefined,
        },
        {
          id: 'gw7-1',
          name: 'Galaxy Watch 7 Classic',
          type: 'galaxy_watch_7',
          isConnected: false,
          lastSync: undefined,
          batteryLevel: undefined,
        },
      ];
      setDevices(mockDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLastSync = async () => {
    try {
      const lastSync = await loadLastWearableSync();
      if (lastSync) setLastSyncTime(lastSync);
    } catch {
      // No sync history yet
    }
  };

  const saveSettings = async (newSettings: SyncSettings) => {
    try {
      await saveWearableSyncSettings(newSettings);
      setSettings(newSettings);
      toast({
        title: 'Settings Saved',
        description: 'Wearable sync settings have been updated',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await invokeFunction('sync-wearable-data', {
          dataTypes: [
            settings.heartRate && 'heart_rate',
            settings.location && 'location',
            settings.activity && 'activity',
            settings.sleep && 'sleep',
            settings.stress && 'stress',
          ].filter(Boolean),
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
          endDate: new Date().toISOString(),
        },);

      if (error) throw error;

      toast({
        title: 'Sync Complete',
        description: `Synced ${data.processedCount || 0} data points`,
      });

      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not sync wearable data. Make sure devices are connected.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSetting = <K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Watch className="h-5 w-5 text-primary" />
          Wearable Sync Settings
        </CardTitle>
        <CardDescription>
          Configure how your Galaxy Watch and other wearables sync with contact intelligence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Devices */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Connected Devices</h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div 
                  key={device.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Watch className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {device.lastSync 
                          ? `Last sync: ${new Date(device.lastSync).toLocaleString()}`
                          : 'Not synced yet'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.batteryLevel !== undefined && (
                      <Badge variant="outline">{device.batteryLevel}%</Badge>
                    )}
                    <Badge variant={device.isConnected ? 'secondary' : 'outline'}>
                      {device.isConnected ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Disconnected</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={loadDevices} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh Devices
          </Button>
        </div>

        <Separator />

        {/* Data Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Data Types to Sync</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <Label htmlFor="heart-rate">Heart Rate</Label>
                  <p className="text-xs text-muted-foreground">Track stress levels during meetings</p>
                </div>
              </div>
              <Switch 
                id="heart-rate"
                checked={settings.heartRate}
                onCheckedChange={(v) => updateSetting('heartRate', v)}
              />
            </div>

            {settings.heartRate && (
              <div className="ml-8 space-y-2">
                <Label className="text-xs">Sampling Interval: {settings.heartRateInterval} min</Label>
                <Slider
                  value={[settings.heartRateInterval]}
                  onValueChange={([v]) => updateSetting('heartRateInterval', v)}
                  min={1}
                  max={15}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-500" />
                <div>
                  <Label htmlFor="location">Location</Label>
                  <p className="text-xs text-muted-foreground">Track meeting locations</p>
                </div>
              </div>
              <Switch 
                id="location"
                checked={settings.location}
                onCheckedChange={(v) => updateSetting('location', v)}
              />
            </div>

            {settings.location && (
              <div className="ml-8 flex items-center justify-between">
                <Label htmlFor="location-meetings" className="text-xs">Only during calendar meetings</Label>
                <Switch 
                  id="location-meetings"
                  checked={settings.locationDuringMeetings}
                  onCheckedChange={(v) => updateSetting('locationDuringMeetings', v)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-green-500" />
                <div>
                  <Label htmlFor="activity">Activity</Label>
                  <p className="text-xs text-muted-foreground">Steps and movement data</p>
                </div>
              </div>
              <Switch 
                id="activity"
                checked={settings.activity}
                onCheckedChange={(v) => updateSetting('activity', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-purple-500" />
                <div>
                  <Label htmlFor="stress">Stress Level</Label>
                  <p className="text-xs text-muted-foreground">Samsung stress detection</p>
                </div>
              </div>
              <Switch 
                id="stress"
                checked={settings.stress}
                onCheckedChange={(v) => updateSetting('stress', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-indigo-500" />
                <div>
                  <Label htmlFor="sleep">Sleep Data</Label>
                  <p className="text-xs text-muted-foreground">Sleep quality before important meetings</p>
                </div>
              </div>
              <Switch 
                id="sleep"
                checked={settings.sleep}
                onCheckedChange={(v) => updateSetting('sleep', v)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Sync Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Sync Options</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="meetings-only">Sync only during meetings</Label>
              <p className="text-xs text-muted-foreground">
                Only collect data when you have a calendar event
              </p>
            </div>
            <Switch 
              id="meetings-only"
              checked={settings.syncDuringMeetingsOnly}
              onCheckedChange={(v) => updateSetting('syncDuringMeetingsOnly', v)}
            />
          </div>
        </div>

        <Separator />

        {/* Manual Sync */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Manual Sync</h4>
              {lastSyncTime && (
                <p className="text-xs text-muted-foreground">
                  Last sync: {new Date(lastSyncTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <Button onClick={triggerSync} disabled={isSyncing} className="w-full">
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now (Last 24 Hours)
              </>
            )}
          </Button>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Privacy:</strong> All biometric data is stored securely and only used to enhance 
            your meeting insights. Data is never shared with contacts or third parties.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default WearableSyncSettings;
