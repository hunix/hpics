import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, Pause, RotateCcw, Loader2, Check, X, Image, Music, Video, FileText } from 'lucide-react';

interface BulkMetadataGeneratorProps {
  profileId?: string;
  contactName?: string;
}

const MODEL_OPTIONS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)', costPer1K: 0.075 },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Cheapest)', costPer1K: 0.019 },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (High Quality)', costPer1K: 1.25 },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Best Quality)', costPer1K: 1.5 },
];

// Estimated tokens per file type (enhanced metadata uses more output tokens)
const TOKEN_ESTIMATES: Record<string, number> = {
  image: 3000, // Images use vision tokens + comprehensive output
  audio: 2500, // Full transcription + analysis
  video: 4000, // Visual + audio analysis
  document: 2000, // Full document analysis
};

export function BulkMetadataGenerator({ profileId, contactName }: BulkMetadataGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeVideos, setIncludeVideos] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [skipProcessed, setSkipProcessed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, failed: 0, total: 0, current: '' });
  const [totalCost, setTotalCost] = useState(0);

  // Fetch media counts using RPC to avoid 1000 row limit
  const { data: mediaCounts } = useQuery({
    queryKey: ['media-counts', profileId, skipProcessed],
    queryFn: async () => {
      // Use RPC function that counts ALL media
      const { data: countData, error: countError } = await supabase.rpc('get_contact_media_counts', {
        p_user_id: user!.id,
        p_profile_id: profileId || null,
        p_skip_analyzed: skipProcessed
      });
      
      if (countError) throw countError;
      
      const counts = countData?.[0] || { image_count: 0, audio_count: 0, video_count: 0, total_count: 0 };
      
      return { 
        counts: { 
          image: Number(counts.image_count), 
          audio: Number(counts.audio_count), 
          video: Number(counts.video_count) 
        },
        totalCount: Number(counts.total_count)
      };
    },
    enabled: !!user,
  });

  // Fetch document counts
  const { data: documentCounts } = useQuery({
    queryKey: ['document-counts', profileId, skipProcessed],
    queryFn: async () => {
      let query = supabase.from('documents').select('id, ai_generation_status');
      if (profileId) query = query.eq('profile_id', profileId);
      if (skipProcessed) query = query.neq('ai_generation_status', 'completed');

      const { data, error } = await query;
      if (error) throw error;

      return { count: data?.length || 0, items: data || [] };
    },
    enabled: !!user,
  });

  // Calculate estimated cost
  const estimatedCost = (() => {
    if (!mediaCounts || !documentCounts) return 0;

    const model = MODEL_OPTIONS.find(m => m.value === selectedModel);
    if (!model) return 0;

    let totalTokens = 0;
    if (includeImages) totalTokens += mediaCounts.counts.image * TOKEN_ESTIMATES.image;
    if (includeAudio) totalTokens += mediaCounts.counts.audio * TOKEN_ESTIMATES.audio;
    if (includeVideos) totalTokens += mediaCounts.counts.video * TOKEN_ESTIMATES.video;
    if (includeDocuments) totalTokens += documentCounts.count * TOKEN_ESTIMATES.document;

    return (totalTokens / 1_000_000) * model.costPer1K;
  })();

  const totalItems = (() => {
    if (!mediaCounts || !documentCounts) return 0;
    let count = 0;
    if (includeImages) count += mediaCounts.counts.image;
    if (includeAudio) count += mediaCounts.counts.audio;
    if (includeVideos) count += mediaCounts.counts.video;
    if (includeDocuments) count += documentCounts.count;
    return count;
  })();

  // Process items in batches
  const processBatch = async (
    mediaIds: string[],
    documentIds: string[],
    abortSignal: AbortSignal
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-media-metadata`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'batch',
          mediaIds,
          documentIds,
          regenerate: !skipProcessed,
          model: selectedModel,
        }),
        signal: abortSignal,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Batch processing failed');
    }

    return response.json();
  };

  const abortController = { current: null as AbortController | null };

  const startProcessing = async () => {
    if (!mediaCounts || !documentCounts) return;

    setIsProcessing(true);
    setIsPaused(false);
    setProgress({ completed: 0, failed: 0, total: totalItems, current: '' });
    setTotalCost(0);

    abortController.current = new AbortController();

  // Fetch all IDs to process using pagination
    const mediaToProcess: string[] = [];
    const documentsToProcess: string[] = [];
    
    // Build media types array
    const mediaTypes: string[] = [];
    if (includeImages) mediaTypes.push('image');
    if (includeAudio) mediaTypes.push('audio');
    if (includeVideos) mediaTypes.push('video');
    
    // Fetch media IDs in batches using RPC
    if (mediaTypes.length > 0) {
      let offset = 0;
      const batchSize = 500;
      while (true) {
        const { data, error } = await supabase.rpc('get_media_ids_for_analysis', {
          p_user_id: user!.id,
          p_profile_id: profileId || null,
          p_media_types: mediaTypes,
          p_skip_analyzed: skipProcessed,
          p_limit: batchSize,
          p_offset: offset
        });
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        data.forEach((item: any) => mediaToProcess.push(item.id));
        if (data.length < batchSize) break;
        offset += batchSize;
      }
    }

    // Fetch document IDs similarly
    if (includeDocuments && documentCounts) {
      let docQuery = supabase.from('documents').select('id');
      if (profileId) docQuery = docQuery.eq('profile_id', profileId);
      if (skipProcessed) docQuery = docQuery.neq('ai_generation_status', 'completed');
      
      const { data: docs, error: docError } = await docQuery;
      if (!docError && docs) {
        docs.forEach(doc => documentsToProcess.push(doc.id));
      }
    }

    const allIds = [
      ...mediaToProcess.map(id => ({ id, type: 'media' as const })),
      ...documentsToProcess.map(id => ({ id, type: 'document' as const })),
    ];

    const BATCH_SIZE = 5;
    let completed = 0;
    let failed = 0;
    let cost = 0;

    try {
      for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        if (abortController.current?.signal.aborted) break;

        // Check for pause
        while (isPaused && !abortController.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const batch = allIds.slice(i, i + BATCH_SIZE);
        const mediaIds = batch.filter(b => b.type === 'media').map(b => b.id);
        const documentIds = batch.filter(b => b.type === 'document').map(b => b.id);

        setProgress(prev => ({
          ...prev,
          current: `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`,
        }));

        try {
          const result = await processBatch(mediaIds, documentIds, abortController.current!.signal);
          completed += result.summary.processed;
          failed += result.summary.failed;
          cost += result.summary.totalCostCents / 100;

          setProgress({
            completed,
            failed,
            total: totalItems,
            current: `Processed ${completed + failed} of ${totalItems}`,
          });
          setTotalCost(cost);
        } catch (batchError) {
          if (batchError instanceof Error && batchError.name === 'AbortError') {
            break;
          }
          console.error('Batch error:', batchError);
          failed += batch.length;
          setProgress(prev => ({
            ...prev,
            failed: prev.failed + batch.length,
          }));
        }

        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['contact-media'] });
      queryClient.invalidateQueries({ queryKey: ['contact-documents'] });
      queryClient.invalidateQueries({ queryKey: ['media-counts'] });
      queryClient.invalidateQueries({ queryKey: ['document-counts'] });

      toast({
        title: 'Bulk generation complete',
        description: `Processed ${completed} items, ${failed} failed. Total cost: $${cost.toFixed(4)}`,
      });
    }
  };

  const stopProcessing = () => {
    abortController.current?.abort();
    setIsProcessing(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Metadata Generation
        </CardTitle>
        <CardDescription>
          Generate AI-powered metadata for {profileId ? `${contactName}'s` : 'all'} media and documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File type selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">File Types to Process</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeImages}
                onCheckedChange={(c) => setIncludeImages(!!c)}
                disabled={isProcessing}
              />
              <Image className="h-4 w-4" />
              <span>Images</span>
              <Badge variant="secondary">{mediaCounts?.counts.image || 0}</Badge>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeAudio}
                onCheckedChange={(c) => setIncludeAudio(!!c)}
                disabled={isProcessing}
              />
              <Music className="h-4 w-4" />
              <span>Audio</span>
              <Badge variant="secondary">{mediaCounts?.counts.audio || 0}</Badge>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeVideos}
                onCheckedChange={(c) => setIncludeVideos(!!c)}
                disabled={isProcessing}
              />
              <Video className="h-4 w-4" />
              <span>Videos</span>
              <Badge variant="secondary">{mediaCounts?.counts.video || 0}</Badge>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeDocuments}
                onCheckedChange={(c) => setIncludeDocuments(!!c)}
                disabled={isProcessing}
              />
              <FileText className="h-4 w-4" />
              <span>Documents</span>
              <Badge variant="secondary">{documentCounts?.count || 0}</Badge>
            </label>
          </div>
        </div>

        {/* Model selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-md">
              <Checkbox
                checked={skipProcessed}
                onCheckedChange={(c) => setSkipProcessed(!!c)}
                disabled={isProcessing}
              />
              <span className="text-sm">Skip already processed</span>
            </label>
          </div>
        </div>

        {/* Cost estimate */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Estimated Cost</p>
            <p className="text-2xl font-bold">${estimatedCost.toFixed(4)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Files to Process</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
        </div>

        {/* Progress */}
        {(isProcessing || progress.completed > 0 || progress.failed > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>{progress.current || 'Ready'}</span>
              <span>
                {progress.completed + progress.failed} / {progress.total}
              </span>
            </div>
            <Progress 
              value={progress.total > 0 ? ((progress.completed + progress.failed) / progress.total) * 100 : 0} 
            />
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                {progress.completed} completed
              </span>
              {progress.failed > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <X className="h-4 w-4" />
                  {progress.failed} failed
                </span>
              )}
              {totalCost > 0 && (
                <span className="text-muted-foreground">
                  Cost: ${totalCost.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isProcessing ? (
            <Button onClick={startProcessing} disabled={totalItems === 0} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Generation
            </Button>
          ) : (
            <>
              <Button onClick={togglePause} variant="outline" className="flex-1">
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button onClick={stopProcessing} variant="destructive">
                <X className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
