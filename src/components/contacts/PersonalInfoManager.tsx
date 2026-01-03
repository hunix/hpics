import { useState, useEffect } from 'react';
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
import { Loader2, Save, User, Heart, MapPin, Cigarette } from 'lucide-react';

interface PersonalInfoManagerProps {
  profileId: string;
}

const BLOOD_GROUPS = ['A', 'B', 'AB', 'O'];
const RH_TYPES = ['+', '-'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const SMOKING_PREFERENCES = ['None', 'Cigarettes', 'Vape', 'Shisha', 'Cigars', 'Pipe', 'Multiple'];

export function PersonalInfoManager({ profileId }: PersonalInfoManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: personalInfo, isLoading } = useQuery({
    queryKey: ['contact-personal-info', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_personal_info')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: '',
    blood_group: '',
    rh_type: '',
    allergies: '',
    place_of_birth: '',
    mother_name: '',
    father_name: '',
    nationality: '',
    favorite_color: '',
    smoking_preference: '',
    main_residence_country: '',
    main_residence_city: '',
    usual_hangout_places: '',
  });

  useEffect(() => {
    if (personalInfo) {
      setFormData({
        date_of_birth: personalInfo.date_of_birth || '',
        gender: personalInfo.gender || '',
        blood_group: personalInfo.blood_group || '',
        rh_type: personalInfo.rh_type || '',
        allergies: personalInfo.allergies?.join(', ') || '',
        place_of_birth: personalInfo.place_of_birth || '',
        mother_name: personalInfo.mother_name || '',
        father_name: personalInfo.father_name || '',
        nationality: personalInfo.nationality || '',
        favorite_color: personalInfo.favorite_color || '',
        smoking_preference: personalInfo.smoking_preference || '',
        main_residence_country: personalInfo.main_residence_country || '',
        main_residence_city: personalInfo.main_residence_city || '',
        usual_hangout_places: personalInfo.usual_hangout_places?.join(', ') || '',
      });
    }
  }, [personalInfo]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        profile_id: profileId,
        user_id: user!.id,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        blood_group: data.blood_group || null,
        rh_type: data.rh_type || null,
        allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()).filter(Boolean) : null,
        place_of_birth: data.place_of_birth || null,
        mother_name: data.mother_name || null,
        father_name: data.father_name || null,
        nationality: data.nationality || null,
        favorite_color: data.favorite_color || null,
        smoking_preference: data.smoking_preference || null,
        main_residence_country: data.main_residence_country || null,
        main_residence_city: data.main_residence_city || null,
        usual_hangout_places: data.usual_hangout_places ? data.usual_hangout_places.split(',').map(p => p.trim()).filter(Boolean) : null,
      };

      if (personalInfo) {
        const { error } = await supabase
          .from('contact_personal_info')
          .update(payload)
          .eq('id', personalInfo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_personal_info')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-personal-info', profileId] });
      toast({ title: 'Personal info saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>RH Type</Label>
            <Select value={formData.rh_type} onValueChange={(v) => setFormData({ ...formData, rh_type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {RH_TYPES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Family */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Place of Birth</Label>
            <Input
              value={formData.place_of_birth}
              onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
              placeholder="City, Country"
            />
          </div>
          <div className="space-y-2">
            <Label>Mother's Name</Label>
            <Input
              value={formData.mother_name}
              onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Father's Name</Label>
            <Input
              value={formData.father_name}
              onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
            />
          </div>
        </div>

        {/* Residence */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nationality</Label>
            <Input
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Main Residence Country</Label>
            <Input
              value={formData.main_residence_country}
              onChange={(e) => setFormData({ ...formData, main_residence_country: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Main Residence City</Label>
            <Input
              value={formData.main_residence_city}
              onChange={(e) => setFormData({ ...formData, main_residence_city: e.target.value })}
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Favorite Color</Label>
            <Input
              value={formData.favorite_color}
              onChange={(e) => setFormData({ ...formData, favorite_color: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Smoking Preference</Label>
            <Select value={formData.smoking_preference} onValueChange={(v) => setFormData({ ...formData, smoking_preference: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {SMOKING_PREFERENCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Allergies</Label>
            <Input
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="Comma separated"
            />
          </div>
        </div>

        {/* Hangout Places */}
        <div className="space-y-2">
          <Label>Usual Hangout Places</Label>
          <Input
            value={formData.usual_hangout_places}
            onChange={(e) => setFormData({ ...formData, usual_hangout_places: e.target.value })}
            placeholder="Comma separated (e.g., Coffee Shop X, Park Y)"
          />
        </div>

        <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Personal Info
        </Button>
      </CardContent>
    </Card>
  );
}
