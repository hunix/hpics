import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Plus, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Certification {
  id: string;
  name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
}

interface CertificationsManagerProps {
  profileId: string;
}

export function CertificationsManager({ profileId }: CertificationsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: '',
  });

  const { data: certifications, isLoading } = useQuery({
    queryKey: ['certifications', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('profile_id', profileId)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return data as Certification[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('certifications').insert({
        profile_id: profileId,
        user_id: user!.id,
        name: data.name,
        issuing_organization: data.issuing_organization || null,
        issue_date: data.issue_date || null,
        expiration_date: data.expiration_date || null,
        credential_id: data.credential_id || null,
        credential_url: data.credential_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', profileId] });
      toast({ title: 'Certification added' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('certifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', profileId] });
      toast({ title: 'Certification removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiration_date: '',
      credential_id: '',
      credential_url: '',
    });
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Certification name is required', variant: 'destructive' });
      return;
    }
    addMutation.mutate(formData);
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Award className="h-4 w-4" />
          Certifications
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Certification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Certification Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="AWS Solutions Architect"
                />
              </div>

              <div className="space-y-2">
                <Label>Issuing Organization</Label>
                <Input
                  value={formData.issuing_organization}
                  onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
                  placeholder="Amazon Web Services"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Credential ID</Label>
                <Input
                  value={formData.credential_id}
                  onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                  placeholder="ABC123XYZ"
                />
              </div>

              <div className="space-y-2">
                <Label>Credential URL</Label>
                <Input
                  value={formData.credential_url}
                  onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <Button onClick={handleSubmit} disabled={addMutation.isPending} className="w-full">
                Add Certification
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {certifications && certifications.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <div key={cert.id} className="group relative">
              <Badge 
                variant={isExpired(cert.expiration_date) ? "secondary" : "default"}
                className="pr-8 flex items-center gap-1"
              >
                <Award className="h-3 w-3" />
                {cert.name}
                {cert.issuing_organization && (
                  <span className="text-xs opacity-70">• {cert.issuing_organization}</span>
                )}
                {cert.credential_url && (
                  <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="ml-1">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full"
                onClick={() => deleteMutation.mutate(cert.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {cert.issue_date && (
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs p-1 rounded shadow z-10">
                  Issued: {format(new Date(cert.issue_date), 'MMM yyyy')}
                  {cert.expiration_date && ` • Expires: ${format(new Date(cert.expiration_date), 'MMM yyyy')}`}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          No certifications added.
        </p>
      )}
    </div>
  );
}
