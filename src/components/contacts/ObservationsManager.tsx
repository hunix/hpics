import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Plus, 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Loader2,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface ObservationsManagerProps {
  profileId: string;
  contactName: string;
}

interface Observation {
  id: string;
  category: 'personality' | 'communication' | 'behavioral' | 'professional';
  title: string;
  observation: string;
  confidence_level: 'low' | 'medium' | 'high' | null;
  ai_validation_status: 'pending' | 'validated' | 'challenged' | 'inconclusive';
  ai_validation_result: {
    summary?: string;
    supporting_evidence?: string[];
    challenging_evidence?: string[];
    confidence_score?: number;
    recommendation?: string;
  } | null;
  ai_confidence_score: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const categoryConfig = {
  personality: { icon: Brain, label: 'Personality Traits', color: 'bg-purple-500' },
  communication: { icon: MessageSquare, label: 'Communication Style', color: 'bg-blue-500' },
  behavioral: { icon: TrendingUp, label: 'Behavioral Patterns', color: 'bg-green-500' },
  professional: { icon: Briefcase, label: 'Professional Traits', color: 'bg-orange-500' },
};

const validationStatusConfig = {
  pending: { icon: HelpCircle, label: 'Pending', color: 'text-muted-foreground' },
  validated: { icon: CheckCircle2, label: 'Validated', color: 'text-green-500' },
  challenged: { icon: XCircle, label: 'Challenged', color: 'text-red-500' },
  inconclusive: { icon: HelpCircle, label: 'Inconclusive', color: 'text-yellow-500' },
};

export function ObservationsManager({ profileId, contactName }: ObservationsManagerProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '' as string,
    title: '',
    observation: '',
    confidence_level: '' as string,
    tags: '',
  });

  const { data: observations, isLoading } = useQuery({
    queryKey: ['contact-observations', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_observations')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Observation[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('contact_observations')
        .insert({
          user_id: user.user.id,
          profile_id: profileId,
          category: data.category,
          title: data.title,
          observation: data.observation,
          confidence_level: data.confidence_level || null,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-observations', profileId] });
      setIsAddDialogOpen(false);
      setFormData({ category: '', title: '', observation: '', confidence_level: '', tags: '' });
      toast.success('Observation added');
    },
    onError: (error) => {
      toast.error('Failed to add observation: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_observations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-observations', profileId] });
      toast.success('Observation deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const handleValidateWithAI = async (observation: Observation) => {
    setIsValidating(observation.id);
    try {
      const { data, error } = await supabase.functions.invoke('validate-observation', {
        body: {
          observationId: observation.id,
          profileId,
          category: observation.category,
          observation: observation.observation,
          contactName,
        },
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['contact-observations', profileId] });
      toast.success('AI validation complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Validation failed: ' + message);
    } finally {
      setIsValidating(null);
    }
  };

  const handleViewDetails = (obs: Observation) => {
    setSelectedObservation(obs);
    setIsViewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const groupedObservations = observations?.reduce((acc, obs) => {
    if (!acc[obs.category]) acc[obs.category] = [];
    acc[obs.category].push(obs);
    return acc;
  }, {} as Record<string, Observation[]>) || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              My Observations
            </CardTitle>
            <CardDescription>
              Track your personal observations and validate them with AI analysis
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Observation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Observation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category || undefined}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="Brief title for your observation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observation *</Label>
                  <Textarea
                    placeholder="Describe your observation in detail..."
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Your Confidence Level</Label>
                  <Select
                    value={formData.confidence_level || undefined}
                    onValueChange={(v) => setFormData({ ...formData, confidence_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How confident are you?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Just a hunch</SelectItem>
                      <SelectItem value="medium">Medium - Fairly confident</SelectItem>
                      <SelectItem value="high">High - Very certain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="e.g., first-impression, interview, negotiation"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addMutation.mutate(formData)}
                  disabled={!formData.category || !formData.title || !formData.observation || addMutation.isPending}
                >
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Add Observation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.keys(groupedObservations).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No observations yet.</p>
            <p className="text-sm">Add your first observation about {contactName}.</p>
          </div>
        ) : (
          Object.entries(categoryConfig).map(([category, { icon: Icon, label, color }]) => {
            const categoryObs = groupedObservations[category];
            if (!categoryObs?.length) return null;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-medium">{label}</h3>
                  <Badge variant="secondary" className="ml-auto">{categoryObs.length}</Badge>
                </div>

                <div className="space-y-2 pl-8">
                  {categoryObs.map((obs) => {
                    const StatusIcon = validationStatusConfig[obs.ai_validation_status].icon;
                    const statusColor = validationStatusConfig[obs.ai_validation_status].color;

                    return (
                      <div
                        key={obs.id}
                        className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{obs.title}</h4>
                              <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {obs.observation}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleViewDetails(obs)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleValidateWithAI(obs)}
                              disabled={isValidating === obs.id}
                            >
                              {isValidating === obs.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteMutation.mutate(obs.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {obs.confidence_level && (
                            <Badge variant="outline" className="text-xs">
                              {obs.confidence_level} confidence
                            </Badge>
                          )}
                          {obs.ai_confidence_score && (
                            <Badge variant="secondary" className="text-xs">
                              AI: {Math.round(obs.ai_confidence_score * 100)}% match
                            </Badge>
                          )}
                          {obs.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(obs.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedObservation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = categoryConfig[selectedObservation.category].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {selectedObservation.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Your Observation</Label>
                  <p className="mt-1">{selectedObservation.observation}</p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="mt-1">{categoryConfig[selectedObservation.category].label}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Your Confidence</Label>
                    <p className="mt-1 capitalize">{selectedObservation.confidence_level || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">AI Status</Label>
                    <p className="mt-1 capitalize flex items-center gap-1">
                      {(() => {
                        const StatusIcon = validationStatusConfig[selectedObservation.ai_validation_status].icon;
                        const color = validationStatusConfig[selectedObservation.ai_validation_status].color;
                        return <StatusIcon className={`h-4 w-4 ${color}`} />;
                      })()}
                      {validationStatusConfig[selectedObservation.ai_validation_status].label}
                    </p>
                  </div>
                </div>

                {selectedObservation.ai_validation_result && (
                  <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Analysis Result
                    </h4>

                    {selectedObservation.ai_validation_result.summary && (
                      <div>
                        <Label className="text-muted-foreground">Summary</Label>
                        <p className="mt-1 text-sm">{selectedObservation.ai_validation_result.summary}</p>
                      </div>
                    )}

                    {selectedObservation.ai_confidence_score !== null && (
                      <div>
                        <Label className="text-muted-foreground">Confidence Score</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(selectedObservation.ai_confidence_score || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round((selectedObservation.ai_confidence_score || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedObservation.ai_validation_result.supporting_evidence?.length ? (
                      <div>
                        <Label className="text-muted-foreground text-green-600">Supporting Evidence</Label>
                        <ul className="mt-1 text-sm space-y-1">
                          {selectedObservation.ai_validation_result.supporting_evidence.map((e, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {selectedObservation.ai_validation_result.challenging_evidence?.length ? (
                      <div>
                        <Label className="text-muted-foreground text-red-600">Challenging Evidence</Label>
                        <ul className="mt-1 text-sm space-y-1">
                          {selectedObservation.ai_validation_result.challenging_evidence.map((e, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {selectedObservation.ai_validation_result.recommendation && (
                      <div>
                        <Label className="text-muted-foreground">Recommendation</Label>
                        <p className="mt-1 text-sm">{selectedObservation.ai_validation_result.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedObservation.ai_validation_status === 'pending' && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      handleValidateWithAI(selectedObservation);
                      setIsViewDialogOpen(false);
                    }}
                    disabled={isValidating === selectedObservation.id}
                  >
                    {isValidating === selectedObservation.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Validate with AI
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
