import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  generateMetadataMosaic, 
  getMosaicPreviewInfo,
  calculateMosaicSavings,
  type MediaItem,
  type MetadataMosaicResult
} from '@/lib/metadataMosaic';

export interface MosaicGenerationProgress {
  phase: 'loading' | 'building_mosaic' | 'uploading' | 'analyzing' | 'processing_results' | 'complete' | 'error';
  currentMosaic: number;
  totalMosaics: number;
  imagesProcessed: number;
  totalImages: number;
  itemsDetected: number;
  facesDetected: number;
  documentsDetected: number;
  costCents: number;
  message: string;
}

export interface MosaicGenerationOptions {
  profileId?: string;
  model?: string;
  skipProcessed?: boolean;
  mediaTypes?: ('image' | 'video')[];
}

export interface MosaicGenerationResult {
  success: boolean;
  totalProcessed: number;
  totalMosaics: number;
  itemsDetected: number;
  facesDetected: number;
  documentsDetected: number;
  totalCostCents: number;
  errors: string[];
}

export function useMosaicMetadataGeneration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [progress, setProgress] = useState<MosaicGenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get cost preview for a number of images
  const getCostPreview = useCallback((imageCount: number, modelKey: string = 'google/gemini-2.5-flash') => {
    const preview = getMosaicPreviewInfo(imageCount, modelKey);
    const savings = calculateMosaicSavings(imageCount, modelKey);
    return { ...preview, ...savings };
  }, []);

  // Main generation mutation
  const generateMutation = useMutation({
    mutationFn: async (options: MosaicGenerationOptions): Promise<MosaicGenerationResult> => {
      if (!user) throw new Error('Not authenticated');

      const { profileId, model = 'google/gemini-2.5-flash', skipProcessed = true, mediaTypes = ['image'] } = options;
      
      setIsGenerating(true);
      setProgress({
        phase: 'loading',
        currentMosaic: 0,
        totalMosaics: 0,
        imagesProcessed: 0,
        totalImages: 0,
        itemsDetected: 0,
        facesDetected: 0,
        documentsDetected: 0,
        costCents: 0,
        message: 'Loading media files...',
      });

      // Fetch media IDs to process
      let query = supabase
        .from('media')
        .select('id, file_url, storage_path, profile_id, mime_type')
        .eq('user_id', user.id);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      if (skipProcessed) {
        query = query.or('ai_generation_status.is.null,ai_generation_status.neq.completed');
      }

      // Filter by media types - only add filter if there are types to filter
      if (mediaTypes.length > 0) {
        const mimeFilters = mediaTypes.map(t => `mime_type.ilike.${t}/%`).join(',');
        query = query.or(mimeFilters);
      } else {
        // No media types selected, return early with empty result
        return {
          success: true,
          totalProcessed: 0,
          totalMosaics: 0,
          itemsDetected: 0,
          facesDetected: 0,
          documentsDetected: 0,
          totalCostCents: 0,
          errors: [],
        };
      }

      const { data: mediaItems, error: mediaError } = await query.limit(1000);

      if (mediaError) throw mediaError;
      if (!mediaItems || mediaItems.length === 0) {
        return {
          success: true,
          totalProcessed: 0,
          totalMosaics: 0,
          itemsDetected: 0,
          facesDetected: 0,
          documentsDetected: 0,
          totalCostCents: 0,
          errors: [],
        };
      }

      // Get signed URLs for all media
      setProgress(prev => prev ? { ...prev, message: 'Getting file URLs...' } : null);
      
      const mediaWithUrls: MediaItem[] = [];
      for (const item of mediaItems) {
        const storagePath = item.storage_path || item.file_url;
        const { data: signedUrlData } = await supabase.storage
          .from('media')
          .createSignedUrl(storagePath, 3600);
        
        if (signedUrlData?.signedUrl) {
          mediaWithUrls.push({
            id: item.id,
            url: signedUrlData.signedUrl,
            profileId: item.profile_id || undefined,
            mimeType: item.mime_type || undefined,
          });
        }
      }

      // Calculate mosaic batches
      const preview = getMosaicPreviewInfo(mediaWithUrls.length, model);
      const imagesPerMosaic = Math.floor(preview.gridCols * preview.gridRows);
      const totalMosaics = Math.ceil(mediaWithUrls.length / imagesPerMosaic);

      setProgress(prev => prev ? {
        ...prev,
        totalImages: mediaWithUrls.length,
        totalMosaics,
        message: `Processing ${mediaWithUrls.length} images in ${totalMosaics} mosaics...`,
      } : null);

      // Create session for tracking
      const { data: session } = await supabase
        .from('mosaic_metadata_sessions')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          status: 'processing',
          total_images: mediaWithUrls.length,
          total_mosaics: totalMosaics,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      const sessionId = session?.id;
      const errors: string[] = [];
      let totalItemsDetected = 0;
      let totalFacesDetected = 0;
      let totalDocumentsDetected = 0;
      let totalCostCents = 0;
      let totalProcessed = 0;

      // Process in batches
      for (let mosaicIndex = 0; mosaicIndex < totalMosaics; mosaicIndex++) {
        const startIdx = mosaicIndex * imagesPerMosaic;
        const batchItems = mediaWithUrls.slice(startIdx, startIdx + imagesPerMosaic);

        setProgress(prev => prev ? {
          ...prev,
          phase: 'building_mosaic',
          currentMosaic: mosaicIndex + 1,
          message: `Building mosaic ${mosaicIndex + 1}/${totalMosaics}...`,
        } : null);

        try {
          // Generate mosaic image
          const mosaic = await generateMetadataMosaic(
            batchItems,
            model,
            (percent, msg) => {
              setProgress(prev => prev ? { ...prev, message: msg } : null);
            }
          );

          setProgress(prev => prev ? {
            ...prev,
            phase: 'analyzing',
            message: `Analyzing mosaic ${mosaicIndex + 1}/${totalMosaics}...`,
          } : null);

          // Get auth token
          const { data: { session: authSession } } = await supabase.auth.getSession();
          if (!authSession) throw new Error('Not authenticated');

          // Send to edge function for analysis
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-media-metadata-mosaic`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authSession.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                mosaicImageUrl: mosaic.imageDataUrl,
                cells: mosaic.cells,
                mosaicId: mosaic.mosaicId,
                model,
                sessionId,
                gridCols: mosaic.gridCols,
                gridRows: mosaic.gridRows,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Mosaic analysis failed');
          }

          const result = await response.json();
          
          totalProcessed += mosaic.cells.length;
          totalItemsDetected += result.itemsDetected || 0;
          totalFacesDetected += result.facesDetected || 0;
          totalDocumentsDetected += result.documentsDetected || 0;
          totalCostCents += result.costCents || 0;

          setProgress(prev => prev ? {
            ...prev,
            imagesProcessed: totalProcessed,
            itemsDetected: totalItemsDetected,
            facesDetected: totalFacesDetected,
            documentsDetected: totalDocumentsDetected,
            costCents: totalCostCents,
            message: `Completed mosaic ${mosaicIndex + 1}/${totalMosaics}`,
          } : null);

        } catch (mosaicError) {
          console.error(`Mosaic ${mosaicIndex + 1} failed:`, mosaicError);
          errors.push(`Mosaic ${mosaicIndex + 1}: ${mosaicError instanceof Error ? mosaicError.message : 'Unknown error'}`);
        }

        // Small delay between mosaics
        if (mosaicIndex < totalMosaics - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update session with final results
      if (sessionId) {
        await supabase
          .from('mosaic_metadata_sessions')
          .update({
            status: errors.length === totalMosaics ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            processed_images: totalProcessed,
            processed_mosaics: totalMosaics - errors.length,
            items_detected: totalItemsDetected,
            faces_detected: totalFacesDetected,
            documents_detected: totalDocumentsDetected,
            actual_cost_cents: totalCostCents,
            error_message: errors.length > 0 ? errors.join('; ') : null,
          })
          .eq('id', sessionId);
      }

      setProgress(prev => prev ? {
        ...prev,
        phase: 'complete',
        message: 'Generation complete!',
      } : null);

      return {
        success: errors.length < totalMosaics,
        totalProcessed,
        totalMosaics: totalMosaics - errors.length,
        itemsDetected: totalItemsDetected,
        facesDetected: totalFacesDetected,
        documentsDetected: totalDocumentsDetected,
        totalCostCents,
        errors,
      };
    },
    onSuccess: (result) => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['contact-media'] });
      queryClient.invalidateQueries({ queryKey: ['detected-items'] });
      queryClient.invalidateQueries({ queryKey: ['unknown-persons'] });
      queryClient.invalidateQueries({ queryKey: ['extracted-documents'] });
      
      toast({
        title: 'Mosaic generation complete',
        description: `Processed ${result.totalProcessed} images. Detected: ${result.itemsDetected} items, ${result.facesDetected} faces, ${result.documentsDetected} documents. Cost: $${(result.totalCostCents / 100).toFixed(4)}`,
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      setProgress(prev => prev ? { ...prev, phase: 'error', message: error.message } : null);
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const reset = useCallback(() => {
    setProgress(null);
    setIsGenerating(false);
  }, []);

  return {
    generate: generateMutation.mutate,
    generateAsync: generateMutation.mutateAsync,
    isGenerating,
    progress,
    reset,
    getCostPreview,
  };
}
