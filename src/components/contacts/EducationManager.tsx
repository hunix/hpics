import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Plus, Trash2, Edit, Building, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Education {
  id: string;
  institution_name: string;
  degree_type: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  grade_or_gpa: string | null;
  activities: string | null;
  description: string | null;
}

interface EducationManagerProps {
  profileId: string;
}

const degreeTypes = [
  'High School',
  'Associate',
  "Bachelor's",
  "Master's",
  'MBA',
  'PhD',
  'MD',
  'JD',
  'Certificate',
  'Diploma',
  'Other',
];

export function EducationManager({ profileId }: EducationManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [formData, setFormData] = useState({
    institution_name: '',
    degree_type: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    grade_or_gpa: '',
    activities: '',
    description: '',
  });

  const { data: educations, isLoading } = useQuery({
    queryKey: ['education', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', profileId)
        .order('end_date', { ascending: false, nullsFirst: true });
      if (error) throw error;
      return data as Education[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('education').insert({
        profile_id: profileId,
        user_id: user!.id,
        institution_name: data.institution_name,
        degree_type: data.degree_type || null,
        field_of_study: data.field_of_study || null,
        start_date: data.start_date || null,
        end_date: data.is_current ? null : (data.end_date || null),
        is_current: data.is_current,
        grade_or_gpa: data.grade_or_gpa || null,
        activities: data.activities || null,
        description: data.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', profileId] });
      toast({ title: 'Education added' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('education').update({
        institution_name: data.institution_name,
        degree_type: data.degree_type || null,
        field_of_study: data.field_of_study || null,
        start_date: data.start_date || null,
        end_date: data.is_current ? null : (data.end_date || null),
        is_current: data.is_current,
        grade_or_gpa: data.grade_or_gpa || null,
        activities: data.activities || null,
        description: data.description || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', profileId] });
      toast({ title: 'Education updated' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('education').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', profileId] });
      toast({ title: 'Education removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      institution_name: '',
      degree_type: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false,
      grade_or_gpa: '',
      activities: '',
      description: '',
    });
    setEditingEducation(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (edu: Education) => {
    setEditingEducation(edu);
    setFormData({
      institution_name: edu.institution_name,
      degree_type: edu.degree_type || '',
      field_of_study: edu.field_of_study || '',
      start_date: edu.start_date || '',
      end_date: edu.end_date || '',
      is_current: edu.is_current || false,
      grade_or_gpa: edu.grade_or_gpa || '',
      activities: edu.activities || '',
      description: edu.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.institution_name.trim()) {
      toast({ title: 'Institution name is required', variant: 'destructive' });
      return;
    }
    if (editingEducation) {
      updateMutation.mutate({ id: editingEducation.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Education
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEducation ? 'Edit Education' : 'Add Education'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label>Institution Name *</Label>
                  <Input
                    value={formData.institution_name}
                    onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                    placeholder="Stanford University"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Degree Type</Label>
                    <Select value={formData.degree_type} onValueChange={(v) => setFormData({ ...formData, degree_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {degreeTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      value={formData.field_of_study}
                      onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      disabled={formData.is_current}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_current"
                    checked={formData.is_current}
                    onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_current">Currently attending</Label>
                </div>

                <div className="space-y-2">
                  <Label>Grade / GPA</Label>
                  <Input
                    value={formData.grade_or_gpa}
                    onChange={(e) => setFormData({ ...formData, grade_or_gpa: e.target.value })}
                    placeholder="3.8 / 4.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Activities & Societies</Label>
                  <Textarea
                    value={formData.activities}
                    onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                    placeholder="Student Council, Debate Club, etc."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Notable achievements, thesis topic, etc."
                    rows={2}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending} className="w-full">
                  {editingEducation ? 'Update' : 'Add'} Education
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {educations && educations.length > 0 ? (
        <div className="space-y-2">
          {educations.map((edu) => (
            <Card key={edu.id} className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm truncate">{edu.institution_name}</p>
                    </div>
                    {(edu.degree_type || edu.field_of_study) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {edu.degree_type}{edu.degree_type && edu.field_of_study && ' in '}{edu.field_of_study}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {edu.start_date ? format(new Date(edu.start_date), 'MMM yyyy') : 'Unknown'} - {' '}
                        {edu.is_current ? 'Present' : (edu.end_date ? format(new Date(edu.end_date), 'MMM yyyy') : 'Unknown')}
                      </span>
                    </div>
                    {edu.grade_or_gpa && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        GPA: {edu.grade_or_gpa}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(edu)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive" 
                      onClick={() => deleteMutation.mutate(edu.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No education records. Add educational background.
        </p>
      )}
    </div>
  );
}
