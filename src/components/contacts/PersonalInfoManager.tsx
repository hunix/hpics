import { useState, useEffect } from 'react';
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
import { Loader2, Save, User, Eye, Ruler, Globe, Heart, Sparkles } from 'lucide-react';

interface PersonalInfoManagerProps {
  profileId: string;
}

const BLOOD_GROUPS = ['A', 'B', 'AB', 'O'];
const RH_TYPES = ['+', '-'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const SMOKING_PREFERENCES = ['None', 'Cigarettes', 'Vape', 'Shisha', 'Cigars', 'Pipe', 'Multiple'];
const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black', 'Other'];
const HAIR_COLORS = ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White', 'Bald', 'Other'];
const ETHNICITIES = ['Asian', 'Black/African', 'Caucasian/White', 'Hispanic/Latino', 'Middle Eastern', 'Native American', 'Pacific Islander', 'South Asian', 'Mixed', 'Other'];
const RELIGIONS = ['None', 'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Buddhism', 'Sikhism', 'Atheist', 'Agnostic', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Partnered', 'Engaged'];
const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const CHINESE_ZODIACS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const HANDEDNESS = ['Right', 'Left', 'Ambidextrous'];
const DIETARY_OPTIONS = ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher', 'Gluten-free', 'Keto', 'Paleo'];

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
    // New demographic fields
    eye_color: '',
    hair_color: '',
    height_cm: '',
    weight_kg: '',
    ethnicity: '',
    religion: '',
    marital_status: '',
    dietary_preferences: '',
    political_affiliation: '',
    zodiac_sign: '',
    chinese_zodiac: '',
    mbti_type: '',
    handedness: '',
    shoe_size: '',
    clothing_size: '',
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
        // New fields
        eye_color: (personalInfo as any).eye_color || '',
        hair_color: (personalInfo as any).hair_color || '',
        height_cm: (personalInfo as any).height_cm?.toString() || '',
        weight_kg: (personalInfo as any).weight_kg?.toString() || '',
        ethnicity: (personalInfo as any).ethnicity || '',
        religion: (personalInfo as any).religion || '',
        marital_status: (personalInfo as any).marital_status || '',
        dietary_preferences: (personalInfo as any).dietary_preferences?.join(', ') || '',
        political_affiliation: (personalInfo as any).political_affiliation || '',
        zodiac_sign: (personalInfo as any).zodiac_sign || '',
        chinese_zodiac: (personalInfo as any).chinese_zodiac || '',
        mbti_type: (personalInfo as any).mbti_type || '',
        handedness: (personalInfo as any).handedness || '',
        shoe_size: (personalInfo as any).shoe_size || '',
        clothing_size: (personalInfo as any).clothing_size || '',
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
        // New demographic fields
        eye_color: data.eye_color || null,
        hair_color: data.hair_color || null,
        height_cm: data.height_cm ? parseInt(data.height_cm) : null,
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
        ethnicity: data.ethnicity || null,
        religion: data.religion || null,
        marital_status: data.marital_status || null,
        dietary_preferences: data.dietary_preferences ? data.dietary_preferences.split(',').map(d => d.trim()).filter(Boolean) : null,
        political_affiliation: data.political_affiliation || null,
        zodiac_sign: data.zodiac_sign || null,
        chinese_zodiac: data.chinese_zodiac || null,
        mbti_type: data.mbti_type || null,
        handedness: data.handedness || null,
        shoe_size: data.shoe_size || null,
        clothing_size: data.clothing_size || null,
      };

      if (personalInfo) {
        const { error } = await supabase
          .from('contact_personal_info')
          .update(payload as any)
          .eq('id', personalInfo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_personal_info')
          .insert(payload as any);
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
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <User className="h-4 w-4" /> Basic Info
          </h4>
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
              <Label>Marital Status</Label>
              <Select value={formData.marital_status} onValueChange={(v) => setFormData({ ...formData, marital_status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Physical Characteristics */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Physical Characteristics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Eye Color</Label>
              <Select value={formData.eye_color} onValueChange={(v) => setFormData({ ...formData, eye_color: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {EYE_COLORS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hair Color</Label>
              <Select value={formData.hair_color} onValueChange={(v) => setFormData({ ...formData, hair_color: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {HAIR_COLORS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                placeholder="70"
              />
            </div>
            <div className="space-y-2">
              <Label>Handedness</Label>
              <Select value={formData.handedness} onValueChange={(v) => setFormData({ ...formData, handedness: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {HANDEDNESS.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Health */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4" /> Health
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="space-y-2">
              <Label>Allergies</Label>
              <Input
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Comma separated"
              />
            </div>
            <div className="space-y-2">
              <Label>Dietary Preferences</Label>
              <Select value={formData.dietary_preferences.split(',')[0]?.trim() || ''} onValueChange={(v) => setFormData({ ...formData, dietary_preferences: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {DIETARY_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cultural Background */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" /> Cultural Background
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Ethnicity</Label>
              <Select value={formData.ethnicity} onValueChange={(v) => setFormData({ ...formData, ethnicity: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {ETHNICITIES.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Religion</Label>
              <Select value={formData.religion} onValueChange={(v) => setFormData({ ...formData, religion: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {RELIGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Political Affiliation</Label>
              <Input
                value={formData.political_affiliation}
                onChange={(e) => setFormData({ ...formData, political_affiliation: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Place of Birth</Label>
              <Input
                value={formData.place_of_birth}
                onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Family */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Family</h4>
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Personality & Astrology */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Personality & Astrology
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Zodiac Sign</Label>
              <Select value={formData.zodiac_sign} onValueChange={(v) => setFormData({ ...formData, zodiac_sign: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {ZODIAC_SIGNS.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chinese Zodiac</Label>
              <Select value={formData.chinese_zodiac} onValueChange={(v) => setFormData({ ...formData, chinese_zodiac: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {CHINESE_ZODIACS.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>MBTI Type</Label>
              <Select value={formData.mbti_type} onValueChange={(v) => setFormData({ ...formData, mbti_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {MBTI_TYPES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sizing */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Ruler className="h-4 w-4" /> Sizing
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shoe Size</Label>
              <Input
                value={formData.shoe_size}
                onChange={(e) => setFormData({ ...formData, shoe_size: e.target.value })}
                placeholder="e.g., US 10, EU 43"
              />
            </div>
            <div className="space-y-2">
              <Label>Clothing Size</Label>
              <Input
                value={formData.clothing_size}
                onChange={(e) => setFormData({ ...formData, clothing_size: e.target.value })}
                placeholder="e.g., M, L, XL"
              />
            </div>
          </div>
        </div>

        {/* Residence */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Residence</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <div className="space-y-2 md:col-span-1">
              <Label>Usual Hangout Places</Label>
              <Input
                value={formData.usual_hangout_places}
                onChange={(e) => setFormData({ ...formData, usual_hangout_places: e.target.value })}
                placeholder="Comma separated"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Preferences</h4>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
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
