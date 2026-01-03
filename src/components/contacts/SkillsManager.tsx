import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: string | null;
  endorsement_count: number | null;
}

interface SkillsManagerProps {
  profileId: string;
}

const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner', color: 'bg-gray-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-purple-500' },
  { value: 'expert', label: 'Expert', color: 'bg-green-500' },
];

export function SkillsManager({ profileId }: SkillsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    skill_name: '',
    proficiency_level: '',
  });

  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_skills')
        .select('*')
        .eq('profile_id', profileId)
        .order('skill_name');
      if (error) throw error;
      return data as Skill[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('contact_skills').insert({
        profile_id: profileId,
        user_id: user!.id,
        skill_name: data.skill_name,
        proficiency_level: data.proficiency_level || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', profileId] });
      toast({ title: 'Skill added' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_skills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', profileId] });
      toast({ title: 'Skill removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({ skill_name: '', proficiency_level: '' });
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.skill_name.trim()) {
      toast({ title: 'Skill name is required', variant: 'destructive' });
      return;
    }
    addMutation.mutate(formData);
  };

  const getProficiencyColor = (level: string | null) => {
    const found = proficiencyLevels.find((p) => p.value === level);
    return found?.color || 'bg-gray-400';
  };

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Skills
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Skill Name *</Label>
                <Input
                  value={formData.skill_name}
                  onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                  placeholder="JavaScript, Project Management, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Proficiency Level</Label>
                <Select value={formData.proficiency_level} onValueChange={(v) => setFormData({ ...formData, proficiency_level: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSubmit} disabled={addMutation.isPending} className="w-full">
                Add Skill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {skills && skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <div key={skill.id} className="group relative">
              <Badge variant="outline" className="pr-6 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${getProficiencyColor(skill.proficiency_level)}`} />
                {skill.skill_name}
                {skill.proficiency_level && (
                  <span className="text-xs opacity-70 capitalize">({skill.proficiency_level})</span>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full"
                onClick={() => deleteMutation.mutate(skill.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          No skills added.
        </p>
      )}
    </div>
  );
}
