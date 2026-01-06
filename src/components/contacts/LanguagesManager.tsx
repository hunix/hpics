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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Languages, Pencil } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface Language {
  id: string;
  language_name: string;
  proficiency_level: string | null;
  is_native: boolean | null;
}

interface LanguagesManagerProps {
  profileId: string;
}

const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Intermediate', 'Basic'];

export function LanguagesManager({ profileId }: LanguagesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);
  const [formData, setFormData] = useState({ language_name: '', proficiency_level: '', is_native: false });

  const { data: languages, isLoading } = useQuery({
    queryKey: ['contact-languages', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_languages')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_native', { ascending: false });
      if (error) throw error;
      return data as Language[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
      toast({ title: 'Language added' });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('contact_languages').update({
        language_name: data.language_name,
        proficiency_level: data.proficiency_level || null,
        is_native: data.is_native,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-languages', profileId] });
      toast({ title: 'Language updated' });
      closeDialog();
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
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setFormData({ language_name: '', proficiency_level: '', is_native: false });
    setEditingLanguage(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openEditDialog = (lang: Language) => {
    setEditingLanguage(lang);
    setFormData({
      language_name: lang.language_name,
      proficiency_level: lang.proficiency_level || '',
      is_native: lang.is_native || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.language_name.trim()) {
      toast({ title: 'Language name is required', variant: 'destructive' });
      return;
    }
    if (editingLanguage) {
      updateMutation.mutate({ id: editingLanguage.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Spoken Languages
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : languages && languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <Badge 
                key={lang.id} 
                variant={lang.is_native ? 'default' : 'secondary'} 
                className="flex items-center gap-2 py-1.5 pr-1 group"
              >
                {lang.language_name}
                {lang.proficiency_level && <span className="text-xs opacity-70">({lang.proficiency_level})</span>}
                {lang.is_native && <span className="text-xs">★</span>}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditDialog(lang)} className="p-0.5 hover:text-primary">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeleteTarget(lang)} className="p-0.5 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">No languages added.</p>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLanguage ? 'Edit' : 'Add'} Language</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Language *</Label>
              <Input
                value={formData.language_name}
                onChange={(e) => setFormData({ ...formData, language_name: e.target.value })}
                placeholder="e.g., English"
              />
            </div>
            <div className="space-y-2">
              <Label>Proficiency</Label>
              <Select
                value={formData.proficiency_level}
                onValueChange={(v) => setFormData({ ...formData, proficiency_level: v })}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_native"
                checked={formData.is_native}
                onCheckedChange={(checked) => setFormData({ ...formData, is_native: !!checked })}
              />
              <Label htmlFor="is_native">Native</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending || !formData.language_name.trim()}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingLanguage ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Language"
        itemName={deleteTarget?.language_name}
        isPending={deleteMutation.isPending}
      />
    </Card>
  );
}
