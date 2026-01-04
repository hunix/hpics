import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, GraduationCap, Edit2, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface KidsSchoolsManagerProps {
  profileId: string;
}

interface KidsSchool {
  id: string;
  profile_id: string;
  user_id: string;
  child_profile_id: string | null;
  child_name: string | null;
  school_name: string;
  school_type: string | null;
  grade_or_year: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  school_address: string | null;
  school_city: string | null;
  school_country: string | null;
  notes: string | null;
}

const SCHOOL_TYPES = [
  'Kindergarten',
  'Elementary',
  'Middle School',
  'High School',
  'University',
  'Vocational',
  'Special Education',
  'Other',
];

export function KidsSchoolsManager({ profileId }: KidsSchoolsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSchool, setNewSchool] = useState({
    child_name: '',
    school_name: '',
    school_type: '',
    grade_or_year: '',
    start_date: '',
    end_date: '',
    is_current: true,
    school_city: '',
    school_country: '',
  });

  // Fetch existing contacts for linking
  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-linking', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_id', user!.id)
        .neq('id', profileId)
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: schools, isLoading } = useQuery({
    queryKey: ['contact-kids-schools', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_kids_schools')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_current', { ascending: false });
      if (error) throw error;
      return data as KidsSchool[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newSchool) => {
      const { error } = await supabase.from('contact_kids_schools').insert({
        profile_id: profileId,
        user_id: user!.id,
        child_name: data.child_name || null,
        school_name: data.school_name,
        school_type: data.school_type || null,
        grade_or_year: data.grade_or_year || null,
        start_date: data.start_date || null,
        end_date: data.is_current ? null : (data.end_date || null),
        is_current: data.is_current,
        school_city: data.school_city || null,
        school_country: data.school_country || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-kids-schools', profileId] });
      setNewSchool({
        child_name: '',
        school_name: '',
        school_type: '',
        grade_or_year: '',
        start_date: '',
        end_date: '',
        is_current: true,
        school_city: '',
        school_country: '',
      });
      toast({ title: 'School record added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_kids_schools').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-kids-schools', profileId] });
      toast({ title: 'School record removed' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Kids' Schools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {schools && schools.length > 0 && (
              <div className="grid gap-3">
                {schools.map((school) => (
                  <div key={school.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-start gap-3">
                      <GraduationCap className={`h-5 w-5 mt-0.5 ${school.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {school.child_name && <span className="text-muted-foreground">{school.child_name}:</span>}
                          {school.school_name}
                          {school.is_current && <span className="text-xs text-primary">(Current)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[school.school_type, school.grade_or_year].filter(Boolean).join(' • ')}
                        </p>
                        {(school.school_city || school.school_country) && (
                          <p className="text-sm text-muted-foreground">
                            {[school.school_city, school.school_country].filter(Boolean).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {school.start_date && format(new Date(school.start_date), 'MMM yyyy')}
                          {school.is_current ? ' - Present' : school.end_date ? ` - ${format(new Date(school.end_date), 'MMM yyyy')}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(school.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Child's Name</Label>
                <Input
                  placeholder="e.g., Ahmad"
                  value={newSchool.child_name}
                  onChange={(e) => setNewSchool({ ...newSchool, child_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>School Name *</Label>
                <Input
                  placeholder="e.g., International School"
                  value={newSchool.school_name}
                  onChange={(e) => setNewSchool({ ...newSchool, school_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newSchool.school_type} onValueChange={(v) => setNewSchool({ ...newSchool, school_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade/Year</Label>
                <Input
                  placeholder="e.g., Grade 5"
                  value={newSchool.grade_or_year}
                  onChange={(e) => setNewSchool({ ...newSchool, grade_or_year: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={newSchool.school_city}
                  onChange={(e) => setNewSchool({ ...newSchool, school_city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={newSchool.school_country}
                  onChange={(e) => setNewSchool({ ...newSchool, school_country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>From</Label>
                <Input
                  type="date"
                  value={newSchool.start_date}
                  onChange={(e) => setNewSchool({ ...newSchool, start_date: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_current_school"
                    checked={newSchool.is_current}
                    onCheckedChange={(checked) => setNewSchool({ ...newSchool, is_current: !!checked })}
                  />
                  <Label htmlFor="is_current_school" className="text-xs">Current</Label>
                </div>
                <Button
                  onClick={() => addMutation.mutate(newSchool)}
                  disabled={!newSchool.school_name || addMutation.isPending}
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
