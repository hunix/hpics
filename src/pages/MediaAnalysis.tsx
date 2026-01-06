import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactPicker } from "@/components/contacts/ContactPicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Image, 
  Video, 
  FileAudio, 
  FileText, 
  Brain, 
  Play,
  Loader2,
  Check,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MEDIA_ANALYSIS_MODES, MediaType, AnalysisContext } from "@/lib/analysisTypes";
import { AnalysisContextSelector } from "@/components/analysis/AnalysisContextSelector";
import { MediaTypeBrowser } from "@/components/analysis/MediaTypeBrowser";
import { MediaAnalysisResults } from "@/components/analysis/MediaAnalysisResults";

const mediaTypeConfig = {
  image: { icon: Image, label: 'Images', color: 'text-blue-500' },
  audio: { icon: FileAudio, label: 'Audio', color: 'text-green-500' },
  video: { icon: Video, label: 'Video', color: 'text-purple-500' },
  document: { icon: FileText, label: 'Documents', color: 'text-orange-500' },
};

export default function MediaAnalysis() {
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [selectedMedia, setSelectedMedia] = useState<{ id: string; url: string; name: string } | null>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [context, setContext] = useState<Partial<AnalysisContext>>({ purpose: 'personal', relationship: 'direct_contact' });
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  // Fetch ALL contacts with pagination
  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-analysis-all'],
    queryFn: async () => {
      const allContacts: { id: string; first_name: string; last_name: string | null; avatar_url: string | null }[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .order('first_name')
          .range(from, from + pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allContacts.push(...data);
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      return allContacts;
    },
  });

  // Fetch recent analyses
  const { data: recentAnalyses } = useQuery({
    queryKey: ['recent-media-analyses', selectedContact],
    queryFn: async () => {
      let query = supabase
        .from('media_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (selectedContact) {
        query = query.eq('profile_id', selectedContact);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMedia || selectedModes.length === 0) {
        throw new Error('Please select media and analysis modes');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('analyze-media-deep', {
        body: {
          media_id: mediaType !== 'document' ? selectedMedia.id : null,
          document_id: mediaType === 'document' ? selectedMedia.id : null,
          profile_id: selectedContact || null,
          media_type: mediaType,
          media_url: selectedMedia.url,
          analysis_modes: selectedModes,
          analysis_context: context,
          analysis_depth: depth,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      toast.success('Analysis complete!');
    },
    onError: (error: any) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const toggleMode = (mode: string) => {
    setSelectedModes(prev => 
      prev.includes(mode) 
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
  };

  const selectAllModes = () => {
    setSelectedModes(MEDIA_ANALYSIS_MODES[mediaType].map(m => m.key));
  };

  const clearModes = () => {
    setSelectedModes([]);
  };

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type);
    setSelectedMedia(null);
    setSelectedModes([]);
    setAnalysisResults(null);
  };

  const availableModes = MEDIA_ANALYSIS_MODES[mediaType];
  const MediaIcon = mediaTypeConfig[mediaType].icon;

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Media Analysis Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Deep intelligence extraction from images, audio, video, and documents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Configuration */}
          <div className="col-span-4 space-y-4">
            {/* Contact Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Select Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactPicker
                  contacts={contacts || []}
                  selectedId={selectedContact}
                  onSelect={setSelectedContact}
                  placeholder="Search contacts..."
                />
              </CardContent>
            </Card>

            {/* Media Type Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Media Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(mediaTypeConfig) as MediaType[]).map((type) => {
                    const config = mediaTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <Button
                        key={type}
                        variant={mediaType === type ? "default" : "outline"}
                        className="flex flex-col h-16 gap-1"
                        onClick={() => handleMediaTypeChange(type)}
                      >
                        <Icon className={cn("h-5 w-5", mediaType !== type && config.color)} />
                        <span className="text-xs">{config.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Media Browser */}
            {selectedContact && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MediaIcon className={cn("h-4 w-4", mediaTypeConfig[mediaType].color)} />
                    Select {mediaTypeConfig[mediaType].label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MediaTypeBrowser
                    profileId={selectedContact}
                    mediaType={mediaType}
                    selectedId={selectedMedia?.id || null}
                    onSelect={(item) => {
                      setSelectedMedia(item);
                      setAnalysisResults(null);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Context Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Analysis Context</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalysisContextSelector
                  context={context}
                  onContextChange={setContext}
                  depth={depth}
                  onDepthChange={setDepth}
                />
              </CardContent>
            </Card>
          </div>

          {/* Middle Panel - Analysis Modes */}
          <div className="col-span-4 space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Analysis Modes</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllModes}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearModes}>
                      Clear
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Select which analyses to run on your {mediaType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableModes.map((mode) => {
                    const isSelected = selectedModes.includes(mode.key);
                    return (
                      <div
                        key={mode.key}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                        )}
                        onClick={() => toggleMode(mode.key)}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded border flex items-center justify-center mt-0.5",
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{mode.name}</h4>
                          <p className="text-xs text-muted-foreground">{mode.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedMedia && selectedModes.length > 0 && (
                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={() => analysisMutation.mutate()}
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Analysis ({selectedModes.length} modes)
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="col-span-4 space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResults?.results ? (
                  <MediaAnalysisResults
                    results={analysisResults.results}
                    mediaType={mediaType}
                    processingTime={analysisResults.processing_time_ms}
                    estimatedCost={analysisResults.estimated_cost_cents}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Info className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">No analysis results yet</p>
                    <p className="text-sm mt-1">
                      Select media and analysis modes, then click "Run Analysis"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Analyses */}
        {recentAnalyses && recentAnalyses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {recentAnalyses.map((analysis: any) => {
                  const Icon = mediaTypeConfig[analysis.media_type as MediaType]?.icon || FileText;
                  return (
                    <Card key={analysis.id} className="cursor-pointer hover:bg-accent">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-medium capitalize">{analysis.media_type}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {analysis.analysis_modes?.slice(0, 2).map((mode: string) => (
                            <Badge key={mode} variant="secondary" className="text-[10px]">
                              {mode.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {(analysis.analysis_modes?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{analysis.analysis_modes.length - 2}
                            </Badge>
                          )}
                        </div>
                        {analysis.confidence_score && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {analysis.confidence_score}% confidence
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
