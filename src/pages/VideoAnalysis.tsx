import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAIModelPreference } from '@/hooks/useAIModelPreference';
import { useAnalysisSession, AnalysisType } from '@/hooks/useAnalysisSession';
import { VideoPreviewPlayer } from '@/components/video/VideoPreviewPlayer';
import { MosaicPreview } from '@/components/video/MosaicPreview';
import { AnalysisMonitor } from '@/components/video/AnalysisMonitor';
import { AnalysisExport } from '@/components/video/AnalysisExport';
import { MosaicResult } from '@/lib/temporalMosaic';
import { 
  Video, 
  Brain, 
  Eye, 
  Hand, 
  AudioLines, 
  Loader2, 
  Play,
  Clock,
  User,
  Film,
  AlertTriangle,
  Grid3X3,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface MediaFile {
  id: string;
  file_url: string;
  caption: string | null;
  mime_type: string | null;
  created_at: string;
}

export default function VideoAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const behavioralModel = useAIModelPreference('analyze-behavioral');
  const facialModel = useAIModelPreference('analyze-facial');
  const bodyLanguageModel = useAIModelPreference('analyze-body-language');
  const vocalModel = useAIModelPreference('analyze-vocal');
  
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [contextType, setContextType] = useState<'screening' | 'interview'>('screening');
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<AnalysisType[]>([]);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [generatedMosaic, setGeneratedMosaic] = useState<MosaicResult | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'video' | 'mosaic'>('video');
  const [selectedMosaicUrl, setSelectedMosaicUrl] = useState<string | null>(null);

  // Reset video selection and mosaic when contact changes
  useEffect(() => {
    setSelectedVideo('');
    setVideoElement(null);
    setGeneratedMosaic(null);
    setSelectedMosaicUrl(null);
    setAnalysisMode('video');
  }, [selectedContact]);

  // Reset mosaic when video changes
  useEffect(() => {
    setVideoElement(null);
    setGeneratedMosaic(null);
    setSelectedMosaicUrl(null);
    setAnalysisMode('video');
  }, [selectedVideo]);

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

  // Fetch videos from the selected contact's media library
  const { data: contactVideos, isLoading: isLoadingVideos } = useQuery({
    queryKey: ['contact-videos', selectedContact],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('id, file_url, caption, mime_type, created_at')
        .eq('profile_id', selectedContact)
        .or('mime_type.ilike.video/%,mime_type.ilike.audio/%')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MediaFile[];
    },
    enabled: !!selectedContact,
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

  const selectedVideoInfo = contactVideos?.find(v => v.id === selectedVideo);
  const selectedContactInfo = contacts?.find(c => c.id === selectedContact);

  const getModelForType = (type: AnalysisType): string => {
    switch (type) {
      case 'behavioral': return behavioralModel;
      case 'facial': return facialModel;
      case 'body_language': return bodyLanguageModel;
      case 'vocal': return vocalModel;
      default: return behavioralModel;
    }
  };

  // Initialize analysis session hook
  const {
    session,
    elapsedTime,
    currentCostEstimate,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    skipJob,
    retryJob,
    reset: resetSession,
    isRunning,
    isPaused,
    isCompleted,
  } = useAnalysisSession({
    profileId: selectedContact,
    mediaId: selectedVideo,
    mediaUrl: selectedVideoInfo?.file_url || '',
    mosaicUrl: selectedMosaicUrl,
    analysisMode,
    contextType,
    selectedTypes: selectedAnalysisTypes,
    getModelForType,
  });

  const analysisOptions = [
    { type: 'behavioral' as AnalysisType, label: 'Behavioral Analysis', icon: Brain, description: 'Personality indicators, behavioral patterns, decision-making style' },
    { type: 'facial' as AnalysisType, label: 'Facial Analysis', icon: Eye, description: 'Micro-expressions, emotional timeline, stress indicators' },
    { type: 'body_language' as AnalysisType, label: 'Body Language', icon: Hand, description: 'Posture, gestures, comfort indicators, rapport signals' },
    { type: 'vocal' as AnalysisType, label: 'Vocal Analysis', icon: AudioLines, description: 'Speech patterns, stress points, mood changes, hesitation markers' },
  ];

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
                Analyze Contact Video
              </CardTitle>
              <CardDescription>
                Select a contact and choose a video from their media library for AI-powered behavioral analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Selection */}
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

              {/* Video Selection */}
              {selectedContact && (
                <div className="space-y-2">
                  <Label>Select Video from Media Library</Label>
                  {isLoadingVideos ? (
                    <div className="flex items-center gap-2 p-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading videos...
                    </div>
                  ) : contactVideos && contactVideos.length > 0 ? (
                    <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a video" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactVideos.map((video) => (
                          <SelectItem key={video.id} value={video.id}>
                            <div className="flex items-center gap-2">
                              <Film className="h-4 w-4" />
                              <span>{video.caption || 'Untitled Video'}</span>
                              <span className="text-xs text-muted-foreground">
                                ({format(new Date(video.created_at), 'MMM d, yyyy')})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-4 border rounded-lg bg-muted/50 text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No videos found in {selectedContactInfo?.first_name}'s media library.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload videos in the contact's Media section first.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Video Preview Player */}
              {selectedVideoInfo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Video Preview</Label>
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedVideoInfo.caption || 'Untitled Video'}
                      </span>
                    </div>
                  </div>
                  <VideoPreviewPlayer
                    videoUrl={selectedVideoInfo.file_url}
                    onVideoLoaded={(video) => setVideoElement(video)}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {selectedVideoInfo.mime_type} • Uploaded {format(new Date(selectedVideoInfo.created_at), 'PPP')}
                  </p>
                </div>
              )}

              {/* Analysis Type */}
              <div className="space-y-2">
                <Label>Context Type</Label>
                <Select value={contextType} onValueChange={(v: 'screening' | 'interview') => setContextType(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="screening">Screening Video</SelectItem>
                    <SelectItem value="interview">Interview Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Analysis Types Selection */}
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

              {/* Analysis Mode Indicator */}
              {selectedVideoInfo && (
                <div className={`p-3 rounded-lg border ${
                  analysisMode === 'mosaic' 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-muted/50 border-border'
                }`}>
                  <div className="flex items-center gap-2">
                    {analysisMode === 'mosaic' ? (
                      <Grid3X3 className="h-5 w-5 text-primary" />
                    ) : (
                      <Video className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {analysisMode === 'mosaic' ? 'Mosaic Mode' : 'Video Mode'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analysisMode === 'mosaic' 
                          ? 'Using temporal mosaic for efficient analysis' 
                          : 'Using video URL for analysis'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Start/Export buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={startSession}
                  disabled={isRunning || !selectedVideo || !selectedContact || selectedAnalysisTypes.length === 0}
                  className="flex-1"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Analysis ({selectedAnalysisTypes.length} selected)
                    </>
                  )}
                </Button>
                
                {isCompleted && selectedContactInfo && (
                  <AnalysisExport
                    profileId={selectedContact}
                    contactName={`${selectedContactInfo.first_name} ${selectedContactInfo.last_name || ''}`}
                    contactOrganization={selectedContactInfo.organization || undefined}
                    contactJobTitle={selectedContactInfo.job_title || undefined}
                    analysisMode={analysisMode}
                    contextType={contextType}
                    totalDuration={session?.totalDurationMs || 0}
                    totalCost={session?.totalCostCents || 0}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Monitor */}
          {session && (
            <AnalysisMonitor
              session={session}
              elapsedTime={elapsedTime}
              currentCostEstimate={currentCostEstimate}
              isRunning={isRunning}
              isPaused={isPaused}
              onStart={startSession}
              onPause={pauseSession}
              onResume={resumeSession}
              onSkipJob={skipJob}
              onRetryJob={retryJob}
              onReset={resetSession}
            />
          )}
        </div>

        <div className="space-y-6">
          {/* Temporal Mosaic Panel */}
          {selectedVideoInfo && selectedVideo && (
            <MosaicPreview
              videoElement={videoElement}
              modelKey={facialModel}
              mediaId={selectedVideo}
              profileId={selectedContact}
              onMosaicGenerated={(mosaic) => setGeneratedMosaic(mosaic)}
              onMosaicSelected={(url) => {
                setSelectedMosaicUrl(url);
                setAnalysisMode(url ? 'mosaic' : 'video');
              }}
            />
          )}
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

                <TabsContent value="behavioral" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {recentAnalyses?.behavioral?.length ? (
                        recentAnalyses.behavioral.map((analysis: any) => (
                          <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium">
                              {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(analysis.created_at), 'PPp')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No analyses yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="facial" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {recentAnalyses?.facial?.length ? (
                        recentAnalyses.facial.map((analysis: any) => (
                          <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium">
                              {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(analysis.created_at), 'PPp')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No analyses yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="body" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {recentAnalyses?.bodyLanguage?.length ? (
                        recentAnalyses.bodyLanguage.map((analysis: any) => (
                          <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium">
                              {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(analysis.created_at), 'PPp')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No analyses yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="vocal" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {recentAnalyses?.vocal?.length ? (
                        recentAnalyses.vocal.map((analysis: any) => (
                          <div key={analysis.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium">
                              {analysis.profiles?.first_name} {analysis.profiles?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(analysis.created_at), 'PPp')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No analyses yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How it works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Select a contact from your network</p>
              <p>2. Choose a video from their media library</p>
              <p>3. Select which analyses to run</p>
              <p>4. Review cost estimates and confirm</p>
              <p>5. View results in the contact's profile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
