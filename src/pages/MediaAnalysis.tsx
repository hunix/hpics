import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactPicker } from "@/components/contacts/ContactPicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ListChecks,
  AlertCircle,
  DollarSign,
  BarChart3,
  FileSearch,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MEDIA_ANALYSIS_MODES, MediaType, AnalysisContext } from "@/lib/analysisTypes";
import { AnalysisContextSelector } from "@/components/analysis/AnalysisContextSelector";
import { MediaTypeBrowser } from "@/components/analysis/MediaTypeBrowser";
import { MediaTypeBrowserMultiSelect, type MediaItem } from "@/components/analysis/MediaTypeBrowserMultiSelect";
import { MediaAnalysisResults } from "@/components/analysis/MediaAnalysisResults";
import { EnhancedBulkProgress } from "@/components/analysis/EnhancedBulkProgress";
import { BulkCostEstimator } from "@/components/analysis/BulkCostEstimator";
import { BulkSessionRecovery } from "@/components/analysis/BulkSessionRecovery";
import { ProcessingStrategySelector } from "@/components/analysis/ProcessingStrategySelector";
import { usePersistentBulkSession, type ProcessingStrategy } from "@/hooks/usePersistentBulkSession";
import { MosaicFailureDialog } from "@/components/analysis/MosaicFailureDialog";
import { IntelligenceAnalyticsDashboard } from "@/components/analysis/IntelligenceAnalyticsDashboard";
import { IntelligenceDossierPanel } from "@/components/analysis/IntelligenceDossierPanel";
import { VoiceBulkAnalysisPanel } from "@/components/analysis/VoiceBulkAnalysisPanel";
import { useAutoAggregateOnCompletion } from "@/hooks/useAutoAggregateOnCompletion";
import { estimateBulkCost } from "@/lib/bulkAnalysisPrioritization";
import { useMutation } from "@tanstack/react-query";
import { getSignedUrls } from "@/hooks/useSignedUrl";

const mediaTypeConfig = {
  image: { icon: Image, label: 'Images', color: 'text-blue-500' },
  audio: { icon: FileAudio, label: 'Audio', color: 'text-green-500' },
  video: { icon: Video, label: 'Video', color: 'text-purple-500' },
  document: { icon: FileText, label: 'Documents', color: 'text-orange-500' },
};

export default function MediaAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedContact, setSelectedContact] = useState<string>(() => searchParams.get('contact') || "");
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [selectedMedia, setSelectedMedia] = useState<{ id: string; url: string; name: string } | null>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [context, setContext] = useState<Partial<AnalysisContext>>({ purpose: 'personal', relationship: 'direct_contact' });
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  // Bulk mode state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
  const [recoveredSession, setRecoveredSession] = useState<ReturnType<typeof usePersistentBulkSession>['session']>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPreparingUrls, setIsPreparingUrls] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'analytics' | 'dossier' | 'voice'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'voice' || tabParam === 'dossier' || tabParam === 'analytics') {
      return tabParam;
    }
    return 'analysis';
  });

  // Sync URL params when contact or tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedContact) params.set('contact', selectedContact);
    if (activeTab !== 'analysis') params.set('tab', activeTab);
    setSearchParams(params, { replace: true });
  }, [selectedContact, activeTab, setSearchParams]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistent bulk analysis session
  const bulkSession = usePersistentBulkSession({
    profileId: selectedContact,
    analysisModes: selectedModes,
    analysisContext: context,
    analysisDepth: depth,
  });

  // Auto-aggregate intelligence when bulk analysis completes
  useAutoAggregateOnCompletion({
    sessionId: bulkSession.session?.id || null,
    sessionStatus: bulkSession.session?.status || '',
    profileId: selectedContact || null,
    autoAggregate: true
  });

  // Check for existing session on mount - auto-resume running sessions
  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true);
      try {
        const existingSession = await bulkSession.checkExistingSession();
        if (existingSession) {
          console.log('[MediaAnalysis] Found existing session:', existingSession.id, 'status:', existingSession.status);
          
          // Double-check session actually exists and isn't stale/cancelled in DB
          const { data: freshCheck, error: fetchError } = await supabase
            .from('bulk_analysis_sessions')
            .select('status, completed_at')
            .eq('id', existingSession.id)
            .single();
          
          if (fetchError || !freshCheck) {
            console.log('[MediaAnalysis] Session not found in DB, ignoring');
            return;
          }
          
          // Ignore cancelled or completed sessions
          if (freshCheck.status === 'cancelled' || freshCheck.status === 'completed') {
            console.log('[MediaAnalysis] Session is cancelled/completed, ignoring');
            return;
          }
          
          setIsBulkMode(true);
          
          if (existingSession.status === 'running') {
            // Auto-restore and resume running sessions immediately
            console.log('[MediaAnalysis] Auto-resuming running session with direct session override');
            bulkSession.restoreSession(existingSession);
            // Pass session directly to avoid React state timing issues
            setTimeout(() => bulkSession.resume(existingSession), 100);
          } else if (existingSession.status === 'paused' || existingSession.status === 'pending') {
            // Show recovery dialog for paused/pending sessions
            setRecoveredSession(existingSession);
          }
        }
      } catch (error) {
        console.error('[MediaAnalysis] Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  // Calculate cost estimate when items or modes change
  const costEstimate = selectedItems.length > 0 && selectedModes.length > 0
    ? estimateBulkCost(
        selectedItems.map(item => ({ mediaType: item.type, fileSize: item.size })),
        selectedModes,
        depth
      )
    : null;

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

  // Single analysis mutation
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
    setSelectedItems([]);
    setSelectedModes([]);
    setAnalysisResults(null);
  };

  const handleBulkModeToggle = (checked: boolean) => {
    setIsBulkMode(checked);
    setSelectedMedia(null);
    setSelectedItems([]);
    setAnalysisResults(null);
  };

  const handleStartBulkAnalysis = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    if (selectedModes.length === 0) {
      toast.error('Please select at least one analysis mode');
      return;
    }

    console.log('[MediaAnalysis] Starting bulk analysis with', selectedItems.length, 'items');

    // Fetch signed URLs for items with storagePath
    setIsPreparingUrls(true);
    let itemsWithUrls = selectedItems;
    
    try {
      const mediaPathsToSign = selectedItems
        .filter(item => item.storagePath && !item.isDocument)
        .map(item => item.storagePath!);
      
      const documentPathsToSign = selectedItems
        .filter(item => item.storagePath && item.isDocument)
        .map(item => item.storagePath!);

      const [mediaUrls, documentUrls] = await Promise.all([
        mediaPathsToSign.length > 0 ? getSignedUrls('media', mediaPathsToSign) : Promise.resolve(new Map<string, string>()),
        documentPathsToSign.length > 0 ? getSignedUrls('documents', documentPathsToSign) : Promise.resolve(new Map<string, string>()),
      ]);

      // Map signed URLs back to items
      itemsWithUrls = selectedItems.map(item => {
        if (!item.storagePath) return item;
        const urlMap = item.isDocument ? documentUrls : mediaUrls;
        const signedUrl = urlMap.get(item.storagePath);
        return signedUrl ? { ...item, url: signedUrl } : item;
      });

      console.log('[MediaAnalysis] Resolved', mediaUrls.size + documentUrls.size, 'signed URLs');
    } catch (error) {
      console.error('[MediaAnalysis] Error fetching signed URLs:', error);
      toast.error('Failed to prepare files. Please try again.');
      setIsPreparingUrls(false);
      return;
    }
    
    setIsPreparingUrls(false);

    const session = await bulkSession.initSession(
      itemsWithUrls.map(item => ({
        id: item.id,
        mediaId: item.isDocument ? undefined : item.id,
        documentId: item.isDocument ? item.id : undefined,
        profileId: selectedContact,
        mediaType: item.type,
        url: item.url,
        storagePath: item.storagePath,
        name: item.name,
        size: item.size,
        createdAt: item.created_at,
      })),
      {
        name: `${mediaTypeConfig[mediaType].label} Analysis - ${new Date().toLocaleDateString()}`,
        maxCostCents: maxBudget,
        autoAggregate: true,
        triggerDeepAnalysis: depth === 'deep',
      }
    );

    if (session) {
      // Start immediately with the returned session and current strategy
      console.log('[MediaAnalysis] Session created, waiting for state sync...');
      
      try {
        // Longer delay to ensure React state is properly synced
        await new Promise(r => setTimeout(r, 300));
        
        console.log('[MediaAnalysis] Starting with strategy:', bulkSession.processingStrategy, 'Session ID:', session.id);
        await bulkSession.start(session, bulkSession.processingStrategy);
      } catch (error) {
        console.error('[MediaAnalysis] Failed to start bulk analysis:', error);
        toast.error('Failed to start analysis: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  // Calculate image count for strategy selector
  const imageCount = selectedItems.filter(i => i.type === 'image').length;

  const handleRecoveryResume = () => {
    if (recoveredSession) {
      bulkSession.restoreSession(recoveredSession);
      setRecoveredSession(null);
      bulkSession.resume();
    }
  };

  const handleRecoveryDiscard = async () => {
    if (recoveredSession) {
      await supabase
        .from('bulk_analysis_sessions')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', recoveredSession.id);
      setRecoveredSession(null);
    }
  };

  const availableModes = MEDIA_ANALYSIS_MODES[mediaType];
  const MediaIcon = mediaTypeConfig[mediaType].icon;

  const showBulkProgress = bulkSession.session && bulkSession.session.status !== 'idle';

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6 space-y-6">
        {/* Header with Tabs */}
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
          
          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
              <Button
                variant={activeTab === 'analysis' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('analysis')}
                className="h-8"
              >
                <Brain className="h-4 w-4 mr-1.5" />
                Analysis
              </Button>
              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('analytics')}
                className="h-8"
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Analytics
              </Button>
              <Button
                variant={activeTab === 'dossier' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('dossier')}
                className="h-8"
                disabled={!selectedContact}
              >
                <FileSearch className="h-4 w-4 mr-1.5" />
                Dossier
              </Button>
              <Button
                variant={activeTab === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('voice')}
                className="h-8"
                disabled={!selectedContact}
              >
                <FileAudio className="h-4 w-4 mr-1.5" />
                Voice
              </Button>
            </div>
            
            {/* Bulk Mode Toggle - Only show on Analysis tab */}
            {activeTab === 'analysis' && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                <Switch 
                  id="bulk-mode" 
                  checked={isBulkMode} 
                  onCheckedChange={handleBulkModeToggle}
                  disabled={showBulkProgress}
                />
                <Label htmlFor="bulk-mode" className="flex items-center gap-2 cursor-pointer font-medium">
                  <ListChecks className="h-4 w-4" />
                  Bulk Mode
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <IntelligenceAnalyticsDashboard />
        )}

        {/* Dossier Tab Content */}
        {activeTab === 'dossier' && selectedContact && (
          <IntelligenceDossierPanel profileId={selectedContact} />
        )}

        {/* Voice Tab Content */}
        {activeTab === 'voice' && selectedContact && (
          <VoiceBulkAnalysisPanel 
            profileId={selectedContact} 
            profileName={contacts?.find(c => c.id === selectedContact)?.first_name || 'Contact'}
            onComplete={() => {
              toast.success('Voice analysis completed');
            }}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <>
            {/* Recovered Session Banner */}
            {recoveredSession && (
              <BulkSessionRecovery
                session={recoveredSession}
                onResume={handleRecoveryResume}
                onDiscard={handleRecoveryDiscard}
              />
            )}

        {/* Bulk Progress Panel - Full Width when active */}
        {showBulkProgress && bulkSession.session && (
          <EnhancedBulkProgress
            session={bulkSession.session}
            onPause={bulkSession.pause}
            onResume={bulkSession.resume}
            onCancel={bulkSession.cancel}
            onRetryItem={bulkSession.retryItem}
            onSkipItem={bulkSession.skipItem}
            onRetryAllFailed={bulkSession.retryAllFailed}
            isOnline={isOnline}
          />
        )}

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Configuration */}
          <div className="col-span-3 space-y-4">
            {/* Contact Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Contact</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ContactPicker
                  contacts={contacts || []}
                  selectedId={selectedContact}
                  onSelect={setSelectedContact}
                  placeholder="Select contact..."
                />
              </CardContent>
            </Card>

            {/* Media Type Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Media Type</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(mediaTypeConfig) as MediaType[]).map((type) => {
                    const config = mediaTypeConfig[type];
                    const TypeIcon = config.icon;
                    return (
                      <Button
                        key={type}
                        variant={mediaType === type ? "default" : "outline"}
                        className="flex items-center gap-2 h-10 justify-start"
                        onClick={() => handleMediaTypeChange(type)}
                        disabled={showBulkProgress}
                      >
                        <TypeIcon className={cn("h-4 w-4", mediaType !== type && config.color)} />
                        <span className="text-sm">{config.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Context Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Context & Depth</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <AnalysisContextSelector
                  context={context}
                  onContextChange={setContext}
                  depth={depth}
                  onDepthChange={setDepth}
                />
              </CardContent>
            </Card>

            {/* Budget Input for Bulk Mode */}
            {isBulkMode && !showBulkProgress && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget Limit
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="No limit (cents)"
                      value={maxBudget || ''}
                      onChange={(e) => setMaxBudget(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="h-9"
                    />
                    {maxBudget && (
                      <p className="text-xs text-muted-foreground">
                        ${(maxBudget / 100).toFixed(2)} max spend
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Strategy Selector */}
            {isBulkMode && !showBulkProgress && (
              <ProcessingStrategySelector
                strategy={bulkSession.processingStrategy}
                onStrategyChange={bulkSession.setProcessingStrategy}
                imageCount={imageCount}
                totalItemCount={selectedItems.length}
                disabled={showBulkProgress}
              />
            )}
          </div>

          {/* Main Content Area */}
          <div className="col-span-9 space-y-4">
            {/* Media Browser - Much Larger */}
            {selectedContact ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MediaIcon className={cn("h-4 w-4", mediaTypeConfig[mediaType].color)} />
                      {isBulkMode ? 'Select Files' : 'Choose File'}
                    </CardTitle>
                    {isBulkMode && selectedItems.length > 0 && (
                      <Badge variant="default">
                        {selectedItems.length} selected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {isBulkMode ? (
                    <MediaTypeBrowserMultiSelect
                      profileId={selectedContact}
                      mediaType={mediaType}
                      selectedIds={selectedItems.map(i => i.id)}
                      onSelectionChange={setSelectedItems}
                      maxSelection={500}
                      requestedModes={selectedModes}
                      hideFullyAnalyzed={true}
                    />
                  ) : (
                    <MediaTypeBrowser
                      profileId={selectedContact}
                      mediaType={mediaType}
                      selectedId={selectedMedia?.id || null}
                      onSelect={(item) => {
                        setSelectedMedia(item);
                        setAnalysisResults(null);
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Brain className="h-16 w-16 mb-4 opacity-30" />
                    <p className="font-medium text-lg">Select a contact to begin</p>
                    <p className="text-sm mt-1">Choose a contact from the sidebar to view and analyze their media files</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Modes - Horizontal Compact */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Analysis Modes</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllModes}>
                      All
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearModes}>
                      None
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {availableModes.map((mode) => {
                    const isSelected = selectedModes.includes(mode.key);
                    return (
                      <Badge
                        key={mode.key}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer py-1.5 px-3 text-sm transition-all",
                          isSelected ? "bg-primary hover:bg-primary/90" : "hover:bg-accent"
                        )}
                        onClick={() => toggleMode(mode.key)}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1.5" />}
                        {mode.name}
                      </Badge>
                    );
                  })}
                </div>
                {selectedModes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {selectedModes.length} mode{selectedModes.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cost Estimate & Action Button Row */}
            <div className="flex items-stretch gap-4">
              {/* Cost Estimator */}
              {isBulkMode && costEstimate && !showBulkProgress && (
                <Card className="flex-1">
                  <CardContent className="py-4">
                    <BulkCostEstimator 
                      estimate={costEstimate}
                      maxBudget={maxBudget}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Action Button */}
              <Card className={cn("flex items-center justify-center", !costEstimate && "flex-1")}>
                <CardContent className="py-4 px-6 w-full">
                  {isBulkMode ? (
                    selectedItems.length > 0 && selectedModes.length > 0 && !showBulkProgress ? (
                      <Button
                        className="w-full h-12"
                        size="lg"
                        onClick={handleStartBulkAnalysis}
                        disabled={bulkSession.isLoading || isPreparingUrls}
                      >
                        {isPreparingUrls ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Preparing files...
                          </>
                        ) : bulkSession.isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Creating Session...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Bulk Analysis ({selectedItems.length} files)
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-center py-2 text-muted-foreground">
                        <p className="text-sm">
                          {!selectedItems.length && !selectedModes.length
                            ? 'Select files and analysis modes'
                            : !selectedItems.length
                              ? 'Select files to analyze'
                              : 'Select analysis modes'}
                        </p>
                      </div>
                    )
                  ) : (
                    selectedMedia && selectedModes.length > 0 ? (
                      <Button
                        className="w-full h-12"
                        size="lg"
                        onClick={() => analysisMutation.mutate()}
                        disabled={analysisMutation.isPending}
                      >
                        {analysisMutation.isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Analyze {mediaTypeConfig[mediaType].label.slice(0, -1)} ({selectedModes.length} modes)
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-center py-2 text-muted-foreground">
                        <p className="text-sm">
                          {!selectedMedia && !selectedModes.length
                            ? 'Select a file and analysis modes'
                            : !selectedMedia
                              ? 'Select a file to analyze'
                              : 'Select analysis modes'}
                        </p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            {(analysisResults?.results || (isBulkMode && showBulkProgress)) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {analysisResults?.results ? (
                    <MediaAnalysisResults
                      results={analysisResults.results}
                      mediaType={mediaType}
                      processingTime={analysisResults.processing_time_ms}
                      estimatedCost={analysisResults.estimated_cost_cents}
                    />
                  ) : isBulkMode && showBulkProgress ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
                      <p className="font-medium">Bulk analysis in progress</p>
                      <p className="text-sm mt-1">
                        Results are saved automatically to each file
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Analyses */}
        {recentAnalyses && recentAnalyses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Analyses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-6 gap-3">
                {recentAnalyses.slice(0, 6).map((analysis: any) => {
                  const AnalysisIcon = mediaTypeConfig[analysis.media_type as MediaType]?.icon || FileText;
                  return (
                    <Card key={analysis.id} className="cursor-pointer hover:bg-accent transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AnalysisIcon className="h-4 w-4" />
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
          </>
        )}
      </div>

      {/* Mosaic Failure Dialog */}
      {bulkSession.mosaicFailure && (
        <MosaicFailureDialog
          state={bulkSession.mosaicFailure}
          onRetry={bulkSession.handleMosaicRetry}
          onRetrySmaller={bulkSession.handleMosaicRetrySmaller}
          onSwitchIndividual={bulkSession.handleMosaicSwitchIndividual}
          onAbort={bulkSession.handleMosaicAbort}
        />
      )}
    </AppLayout>
  );
}
