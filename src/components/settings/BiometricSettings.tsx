import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Eye, Volume2, Bell, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BiometricSettingsData {
  id?: string;
  face_match_threshold: number;
  voice_match_threshold: number;
  auto_tag_enabled: boolean;
  auto_tag_face_threshold: number;
  auto_tag_voice_threshold: number;
  notify_on_match: boolean;
  notify_threshold: number;
}

const defaultSettings: BiometricSettingsData = {
  face_match_threshold: 0.85,
  voice_match_threshold: 0.85,
  auto_tag_enabled: true,
  auto_tag_face_threshold: 0.90,
  auto_tag_voice_threshold: 0.90,
  notify_on_match: true,
  notify_threshold: 0.70
};

export function BiometricSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<BiometricSettingsData>(defaultSettings);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['biometric-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('biometric_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        id: savedSettings.id,
        face_match_threshold: Number(savedSettings.face_match_threshold),
        voice_match_threshold: Number(savedSettings.voice_match_threshold),
        auto_tag_enabled: savedSettings.auto_tag_enabled,
        auto_tag_face_threshold: Number(savedSettings.auto_tag_face_threshold),
        auto_tag_voice_threshold: Number(savedSettings.auto_tag_voice_threshold),
        notify_on_match: savedSettings.notify_on_match,
        notify_threshold: Number(savedSettings.notify_threshold)
      });
    }
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const payload = {
        user_id: user.id,
        face_match_threshold: settings.face_match_threshold,
        voice_match_threshold: settings.voice_match_threshold,
        auto_tag_enabled: settings.auto_tag_enabled,
        auto_tag_face_threshold: settings.auto_tag_face_threshold,
        auto_tag_voice_threshold: settings.auto_tag_voice_threshold,
        notify_on_match: settings.notify_on_match,
        notify_threshold: settings.notify_threshold
      };

      const { error } = await supabase
        .from('biometric_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-settings'] });
      toast.success('Biometric settings saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    }
  });

  const getThresholdLabel = (value: number) => {
    if (value >= 0.95) return 'Very High';
    if (value >= 0.85) return 'High';
    if (value >= 0.75) return 'Medium';
    if (value >= 0.65) return 'Low';
    return 'Very Low';
  };

  const getThresholdColor = (value: number) => {
    if (value >= 0.85) return 'bg-green-500';
    if (value >= 0.70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Match Settings
        </CardTitle>
        <CardDescription>
          Configure confidence thresholds for facial and voice recognition matching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Face Match Threshold */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Facial Recognition Threshold</Label>
            <Badge className={getThresholdColor(settings.face_match_threshold)}>
              {Math.round(settings.face_match_threshold * 100)}% - {getThresholdLabel(settings.face_match_threshold)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Minimum confidence required to consider a facial match valid
          </p>
          <Slider
            value={[settings.face_match_threshold * 100]}
            onValueChange={([value]) => setSettings(s => ({ ...s, face_match_threshold: value / 100 }))}
            min={50}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Voice Match Threshold */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Voice Recognition Threshold</Label>
            <Badge className={getThresholdColor(settings.voice_match_threshold)}>
              {Math.round(settings.voice_match_threshold * 100)}% - {getThresholdLabel(settings.voice_match_threshold)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Minimum confidence required to consider a voice match valid
          </p>
          <Slider
            value={[settings.voice_match_threshold * 100]}
            onValueChange={([value]) => setSettings(s => ({ ...s, voice_match_threshold: value / 100 }))}
            min={50}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Auto-Tagging */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Auto-Tag Media</Label>
              <p className="text-sm text-muted-foreground">
                Automatically tag contacts in media when confidence is high enough
              </p>
            </div>
            <Switch
              checked={settings.auto_tag_enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, auto_tag_enabled: checked }))}
            />
          </div>

          {settings.auto_tag_enabled && (
            <div className="space-y-6 pt-4 border-t">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Label>Auto-Tag Face Threshold</Label>
                  <Badge variant="outline">
                    {Math.round(settings.auto_tag_face_threshold * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.auto_tag_face_threshold * 100]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, auto_tag_face_threshold: value / 100 }))}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Label>Auto-Tag Voice Threshold</Label>
                  <Badge variant="outline">
                    {Math.round(settings.auto_tag_voice_threshold * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.auto_tag_voice_threshold * 100]}
                  onValueChange={([value]) => setSettings(s => ({ ...s, auto_tag_voice_threshold: value / 100 }))}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-base font-medium">Match Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when biometric matches are found
                </p>
              </div>
            </div>
            <Switch
              checked={settings.notify_on_match}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, notify_on_match: checked }))}
            />
          </div>

          {settings.notify_on_match && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Label>Notify Threshold</Label>
                <Badge variant="outline">
                  {Math.round(settings.notify_threshold * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Only notify for matches above this confidence level
              </p>
              <Slider
                value={[settings.notify_threshold * 100]}
                onValueChange={([value]) => setSettings(s => ({ ...s, notify_threshold: value / 100 }))}
                min={50}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}