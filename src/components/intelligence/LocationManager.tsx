import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, MapPin } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ContactLocation {
  id: string;
  location_type: string;
  location_name: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  confidence_score: number | null;
  source: string | null;
  is_current: boolean | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  visit_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface LocationManagerProps {
  profileId: string;
  profileName?: string;
  location?: ContactLocation | null;
  onBack: () => void;
}

const locationTypes = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'travel', label: 'Travel' },
  { value: 'current', label: 'Current' },
  { value: 'frequent', label: 'Frequent' },
  { value: 'other', label: 'Other' },
];

const sources = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'conversation', label: 'From Conversation' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'document', label: 'Document' },
  { value: 'observation', label: 'Observation' },
];

export function LocationManager({ profileId, profileName, location, onBack }: LocationManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!location;

  const [formData, setFormData] = useState({
    location_type: location?.location_type || 'other',
    location_name: location?.location_name || '',
    address: location?.address || '',
    city: location?.city || '',
    region: location?.region || '',
    country: location?.country || '',
    country_code: location?.country_code || '',
    latitude: location?.latitude?.toString() || '',
    longitude: location?.longitude?.toString() || '',
    timezone: location?.timezone || '',
    source: location?.source || 'manual',
    is_current: location?.is_current || false,
    notes: (location?.metadata as { notes?: string })?.notes || '',
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user?.id,
        profile_id: profileId,
        location_type: formData.location_type,
        location_name: formData.location_name || null,
        address: formData.address || null,
        city: formData.city || null,
        region: formData.region || null,
        country: formData.country || null,
        country_code: formData.country_code || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        timezone: formData.timezone || null,
        source: formData.source,
        is_current: formData.is_current,
        metadata: formData.notes ? { notes: formData.notes } : null,
        last_seen_at: formData.is_current ? new Date().toISOString() : location?.last_seen_at,
        visit_count: isEditing ? (location?.visit_count || 1) : 1,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('contact_locations')
          .update(payload)
          .eq('id', location.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_locations')
          .insert({
            ...payload,
            first_seen_at: new Date().toISOString(),
          });
        if (error) throw error;
      }

      // If marking as current, unset other current locations
      if (formData.is_current) {
        await supabase
          .from('contact_locations')
          .update({ is_current: false })
          .eq('profile_id', profileId)
          .eq('user_id', user?.id ?? '')
          .neq('id', location?.id || '');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-locations', profileId] });
      toast.success(isEditing ? 'Location updated' : 'Location added');
      onBack();
    },
    onError: (error) => {
      toast.error('Failed to save location');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!location) return;
      const { error } = await supabase
        .from('contact_locations')
        .delete()
        .eq('id', location.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-locations', profileId] });
      toast.success('Location deleted');
      onBack();
    },
    onError: (error) => {
      toast.error('Failed to delete location');
      console.error(error);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {isEditing ? 'Edit Location' : 'Add Location'}
            </CardTitle>
            <CardDescription>
              {profileName ? `Location for ${profileName}` : 'Manage location data'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location Type</Label>
              <Select 
                value={formData.location_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, location_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location Name (optional)</Label>
              <Input
                value={formData.location_name}
                onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                placeholder="e.g., Beach House, NYC Office"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label>Region/State</Label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="State or region"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Country"
              />
            </div>

            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input
                value={formData.country_code}
                onChange={(e) => setFormData(prev => ({ ...prev, country_code: e.target.value.toUpperCase() }))}
                placeholder="US, UK, DE..."
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Latitude (optional)</Label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="e.g., 40.7128"
              />
            </div>

            <div className="space-y-2">
              <Label>Longitude (optional)</Label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="e.g., -74.0060"
              />
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                placeholder="e.g., America/New_York"
              />
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select 
                value={formData.source} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, source: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((src) => (
                    <SelectItem key={src.value} value={src.value}>
                      {src.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this location..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                checked={formData.is_current}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_current: checked }))}
              />
              <Label>This is their current location</Label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            {isEditing ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Location</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this location? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? 'Saving...' : 'Save Location'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
