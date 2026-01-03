import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { calculateCostCents } from '@/lib/aiPricing';
import { 
  Video, 
  Upload, 
  Brain, 
  Eye, 
  Hand, 
  AudioLines, 
  Loader2, 
  Play,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';

type AnalysisType = 'behavioral' | 'facial' | 'body_language' | 'vocal';

interface AnalysisJob {
  id: string;
  type: AnalysisType;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

const ANALYSIS_MODEL_KEYS: Record<AnalysisType, string> = {
  behavioral: 'google/gemini-2.5-flash',
  facial: 'google/gemini-2.5-flash',
  body_language: 'google/gemini-2.5-flash',
  vocal: 'google/gemini-2.5-flash',
};

export default function VideoAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'screening' | 'interview'>('screening');
  const [isUploading, setIsUploading] = useState(false);
  const [runningAnalyses, setRunningAnalyses] = useState<AnalysisJob[]>([]);

  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-analysis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, job_title')
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentAnalyses } = useQuery({
    queryKey: ['recent-analyses', user?.id],
    queryFn: async () => {
      const [behavioral, facial, bodyLanguage, vocal] = await Promise.all([
        supabase.from('behavioral_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('facial_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('body_language_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('vocal_analyses').select('*, profiles(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
      ]);
      return {
        behavioral: behavioral.data || [],
        facial: facial.data || [],
        bodyLanguage: bodyLanguage.data || [],
        vocal: vocal.data || [],
      };
    },
    enabled: !!user,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/mp4'];
      if (!validTypes.includes(file.type)) {
        toast({ title: 'Invalid file', description: 'Please upload a video or audio file', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const runAnalysis = async (type: AnalysisType, videoUrl: string, logId: string) => {
    const jobId = `${type}-${Date.now()}`;
    setRunningAnalyses(prev => [...prev, { id: jobId, type, status: 'processing', progress: 0 }]);
    const startTime = Date.now();

    try {
      const endpoints: Record<AnalysisType, string> = {
        behavioral: 'analyze-behavioral',
        facial: 'analyze-facial',
        body_language: 'analyze-body-language',
        vocal: 'analyze-vocal',
      };

      const response = await supabase.functions.invoke(endpoints[type], {
        body: {
          profileId: selectedContact,
          videoUrl,
          analysisType,
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.error) {
        await updateLogWithResult(logId, {
          status: 'failed',
          errorMessage: response.error.message,
          responseTimeMs: responseTime,
        });
        throw response.error;
      }

      await updateLogWithResult(logId, {
        status: 'completed',
        responseTimeMs: responseTime,
        actualCostCents: calculateCostCents(ANALYSIS_MODEL_KEYS[type], 3000, 1500),
      });

      setRunningAnalyses(prev => 
        prev.map(job => job.id === jobId ? { ...job, status: 'completed', progress: 100 } : job)
      );

      queryClient.invalidateQueries({ queryKey: ['recent-analyses'] });
      toast({ title: `${type.replace('_', ' ')} analysis completed` });
    } catch (error: any) {
      setRunningAnalyses(prev => 
        prev.map(job => job.id === jobId ? { ...job, status: 'error', progress: 0 } : job)
      );
      toast({ title: 'Analysis failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleUploadAndAnalyze = async (selectedAnalyses: AnalysisType[]) => {
    if (!selectedFile || !selectedContact) {
      toast({ title: 'Missing data', description: 'Please select a file and contact', variant: 'destructive' });
      return;
    }

    // Request confirmation for each analysis
    const approvedAnalyses: { type: AnalysisType; logId: string }[] = [];
    
    for (const analysisTypeItem of selectedAnalyses) {
      const contact = contacts?.find(c => c.id === selectedContact);
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
      const promptText = `Running ${analysisTypeItem.replace('_', ' ')} analysis on video/audio for ${contactName}. This will analyze behavioral patterns, expressions, and communication style.`;
      
      const { approved, logId } = await requestConfirmation({
        functionName: `analyze-${analysisTypeItem.replace('_', '-')}`,
        modelKey: ANALYSIS_MODEL_KEYS[analysisTypeItem],
        promptText,
        profileId: selectedContact,
      });
      
      if (approved && logId) {
        approvedAnalyses.push({ type: analysisTypeItem, logId });
      }
    }

    if (approvedAnalyses.length === 0) {
      toast({ title: 'Cancelled', description: 'No analyses were approved' });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user!.id}/${selectedContact}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      for (const { type, logId } of approvedAnalyses) {
        await runAnalysis(type, publicUrl, logId);
      }

      setSelectedFile(null);
      toast({ title: 'Upload complete', description: 'Analyses are running' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const analysisOptions = [
    { type: 'behavioral' as AnalysisType, label: 'Behavioral Analysis', icon: Brain, description: 'Personality indicators, behavioral patterns, decision-making style' },
    { type: 'facial' as AnalysisType, label: 'Facial Analysis', icon: Eye, description: 'Micro-expressions, emotional timeline, stress indicators' },
    { type: 'body_language' as AnalysisType, label: 'Body Language', icon: Hand, description: 'Posture, gestures, comfort indicators, rapport signals' },
    { type: 'vocal' as AnalysisType, label: 'Vocal Analysis', icon: AudioLines, description: 'Speech patterns, stress points, mood changes, hesitation markers' },
  ];

  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<AnalysisType[]>([]);

  const toggleAnalysisType = (type: AnalysisType) => {
    setSelectedAnalysisTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <AppLayout title="Video Analysis">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Upload Video for Analysis
              </CardTitle>
              <CardDescription>
                Upload screening or interview videos for comprehensive AI-powered behavioral analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select Contact</Label>
                  <Select value={selectedContact} onValueChange={setSelectedContact}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {contact.first_name} {contact.last_name}
                            {contact.organization && (
                              <span className="text-muted-foreground text-xs">
                                ({contact.organization})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Analysis Type</Label>
                  <Select value={analysisType} onValueChange={(v: 'screening' | 'interview') => setAnalysisType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screening">Screening Video</SelectItem>
                      <SelectItem value="interview">Interview Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Video/Audio File</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Video className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP4, WebM, MOV, MP3, WAV (max 500MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Select Analyses to Run</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {analysisOptions.map((option) => (
                    <Card 
                      key={option.type}
                      className={`cursor-pointer transition-all ${
                        selectedAnalysisTypes.includes(option.type) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleAnalysisType(option.type)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <option.icon className={`h-5 w-5 mt-0.5 ${
                          selectedAnalysisTypes.includes(option.type) ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => handleUploadAndAnalyze(selectedAnalysisTypes)}
                disabled={isUploading || !selectedFile || !selectedContact || selectedAnalysisTypes.length === 0}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading & Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Analysis ({selectedAnalysisTypes.length} selected)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {runningAnalyses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {runningAnalyses.map((job) => (
                  <div key={job.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {job.type.replace('_', ' ')} Analysis
                        </span>
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {job.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {job.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {job.status}
                        </Badge>
                      </div>
                      <Progress value={job.status === 'completed' ? 100 : job.status === 'processing' ? 50 : 0} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="behavioral" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="behavioral" className="text-xs">Behavioral</TabsTrigger>
                  <TabsTrigger value="facial" className="text-xs">Facial</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="body" className="text-xs">Body Lang.</TabsTrigger>
                  <TabsTrigger value="vocal" className="text-xs">Vocal</TabsTrigger>
                </TabsList>

                <TabsContent value="behavioral" className="mt-4 space-y-2">
                  {recentAnalyses?.behavioral?.length ? (
                    recentAnalyses.behavioral.map((analysis: any) => (
                      <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">
                          {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No analyses yet</p>
                  )}
                </TabsContent>

                <TabsContent value="facial" className="mt-4 space-y-2">
                  {recentAnalyses?.facial?.length ? (
                    recentAnalyses.facial.map((analysis: any) => (
                      <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">
                          {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No analyses yet</p>
                  )}
                </TabsContent>

                <TabsContent value="body" className="mt-4 space-y-2">
                  {recentAnalyses?.bodyLanguage?.length ? (
                    recentAnalyses.bodyLanguage.map((analysis: any) => (
                      <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">
                          {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No analyses yet</p>
                  )}
                </TabsContent>

                <TabsContent value="vocal" className="mt-4 space-y-2">
                  {recentAnalyses?.vocal?.length ? (
                    recentAnalyses.vocal.map((analysis: any) => (
                      <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">
                          {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No analyses yet</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">AI-Powered Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Get deep insights into candidate behavior
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Upload screening or interview videos</p>
                  <p>• Run multiple analysis types simultaneously</p>
                  <p>• View results in contact's profile</p>
                  <p>• Track all AI usage costs in Insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
