import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Languages } from 'lucide-react';

interface LanguagesManagerProps {
  profileId: string;
}

const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Intermediate', 'Basic'];

export function LanguagesManager({ profileId }: LanguagesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLanguage, setNewLanguage] = useState({ language_name: '', proficiency_level: '', is_native: false });

  const { data: languages, isLoading } = useQuery({
    queryKey: ['contact-languages', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_languages')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_native', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newLanguage) => {
      const { error } = await supabase.from('contact_languages').insert({
        profile_id: profileId,
        user_id: user!.id,
        language_name: data.language_name,
        proficiency_level: data.proficiency_level || null,
        is_native: data.is_native,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-languages', profileId] });
      setNewLanguage({ language_name: '', proficiency_level: '', is_native: false });
      toast({ title: 'Language added' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_languages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-languages', profileId] });
      toast({ title: 'Language removed' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Spoken Languages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {languages && languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <Badge key={lang.id} variant={lang.is_native ? 'default' : 'secondary'} className="flex items-center gap-2 py-1.5">
                    {lang.language_name}
                    {lang.proficiency_level && <span className="text-xs opacity-70">({lang.proficiency_level})</span>}
                    {lang.is_native && <span className="text-xs">★</span>}
                    <button onClick={() => deleteMutation.mutate(lang.id)} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  value={newLanguage.language_name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, language_name: e.target.value })}
                  placeholder="e.g., English"
                />
              </div>
              <div className="space-y-2">
                <Label>Proficiency</Label>
                <Select
                  value={newLanguage.proficiency_level}
                  onValueChange={(v) => setNewLanguage({ ...newLanguage, proficiency_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Level..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_native"
                    checked={newLanguage.is_native}
                    onCheckedChange={(checked) => setNewLanguage({ ...newLanguage, is_native: !!checked })}
                  />
                  <Label htmlFor="is_native">Native</Label>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addMutation.mutate(newLanguage)}
                  disabled={!newLanguage.language_name || addMutation.isPending}
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
