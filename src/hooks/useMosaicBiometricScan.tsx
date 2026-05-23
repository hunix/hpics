import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { handleAIError } from '@/lib/aiErrorHandler';
import { toast } from 'sonner';
import { 
  buildAllMosaics, 
  planMosaicBatches, 
  getCostComparison,
  type ImageInput,
  type MosaicCanvas
} from '@/lib/biometricMosaic';
import { invokeFunction } from '@/lib/api';
import { bulkRequestQueue } from '@/lib/requestQueue';

export interface MosaicScanProgress {
  phase: 'preparing' | 'loading' | 'building' | 'analyzing' | 'matching' | 'saving' | 'complete';
  currentMosaic: number;
  totalMosaics: number;
  currentImage: number;
  totalImages: number;
  facesDetected: number;
  matchesFound: number;
  autoTagged: number;
  pendingConfirmation: number;
  estimatedCostCents: number;
  actualCostCents: number;
  errorCount: number;
}

export interface MosaicScanResult {
  success: boolean;
  totalImages: number;
  facesDetected: number;
  matchesFound: number;
  autoTagged: number;
  pendingConfirmation: number;
  totalCostCents: number;
  savingsPercent: number;
  processingTimeMs: number;
  errors: string[];
}

interface MosaicScanOptions {
  mediaIds: string[];
  modelKey?: string;
  autoTagThreshold?: number;
  confirmThreshold?: number;
  onProgress?: (progress: MosaicScanProgress) => void;
}

/**
 * Hook for mosaic-based batch biometric scanning
 * 
 * Processes multiple images in a single AI call by arranging them in a mosaic grid.
 * Reduces API costs by 96%+ compared to per-image calls.
 */
export function useMosaicBiometricScan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<MosaicScanProgress | null>(null);

  const updateProgress = useCallback((updates: Partial<MosaicScanProgress>) => {
    setProgress(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const mutation = useMutation({
    mutationFn: async ({
      mediaIds,
      modelKey = 'google/gemini-2.5-flash-lite',
      autoTagThreshold = 0.85,
      confirmThreshold = 0.60,
      onProgress
    }: MosaicScanOptions): Promise<MosaicScanResult> => {
      const startTime = Date.now();
      const errors: string[] = [];

      if (!user) throw new Error('Not authenticated');

      // Initialize progress
      const plan = planMosaicBatches(mediaIds.length, modelKey);
      const initialProgress: MosaicScanProgress = {
        phase: 'preparing',
        currentMosaic: 0,
        totalMosaics: plan.totalMosaics,
        currentImage: 0,
        totalImages: mediaIds.length,
        facesDetected: 0,
        matchesFound: 0,
        autoTagged: 0,
        pendingConfirmation: 0,
        estimatedCostCents: plan.estimatedCostCents,
        actualCostCents: 0,
        errorCount: 0
      };
      setProgress(initialProgress);
      onProgress?.(initialProgress);

      // Phase 1: Load media URLs
      updateProgress({ phase: 'loading' });
      onProgress?.({ ...initialProgress, phase: 'loading' });

      const { data: mediaItems, error: mediaError } = await supabase
        .from('media')
        .select('id, storage_path')
        .in('id', mediaIds);

      if (mediaError) throw mediaError;

      // Get signed URLs for all media
      const imageInputs: ImageInput[] = [];
      for (const media of (mediaItems || []) as { id: string; storage_path: string }[]) {
        try {
          const { data: signedData } = await supabase.storage
            .from('contact-media')
            .createSignedUrl(media.storage_path, 600);

          if (signedData?.signedUrl) {
            imageInputs.push({
              id: media.id,
              url: signedData.signedUrl
            });
          }
        } catch (e) {
          console.warn(`Failed to get signed URL for ${media.id}:`, e);
          errors.push(`Failed to load media: ${media.id}`);
        }
      }

      if (imageInputs.length === 0) {
        throw new Error('No valid images to process');
      }

      // Phase 2: Fetch existing profile embeddings for matching
      const { data: biometrics } = await supabase
        .from('contact_biometrics')
        .select(`
          profile_id,
          facial_embedding,
          profiles:profile_id (first_name, last_name)
        `)
        .eq('user_id', user.id)
        .not('facial_embedding', 'is', null);

      const profileEmbeddings = (biometrics || [])
        .filter(b => b.facial_embedding)
        .map(b => ({
          profileId: b.profile_id,
          profileName: `${(b.profiles as any)?.first_name || ''} ${(b.profiles as any)?.last_name || ''}`.trim() || 'Unknown',
          embedding: JSON.parse(b.facial_embedding as string)
        }));

      // Phase 3: Build mosaics
      updateProgress({ phase: 'building' });
      onProgress?.({ ...initialProgress, phase: 'building' });

      const mosaics = await buildAllMosaics(
        imageInputs,
        modelKey,
        (current, total, phase) => {
          const updates = { 
            currentMosaic: current, 
            phase: phase as any 
          };
          updateProgress(updates);
          onProgress?.({ ...initialProgress, ...updates });
        }
      );

      // Phase 4: Analyze mosaics (queued to avoid rate limits)
      updateProgress({ phase: 'analyzing' });

      let totalFacesDetected = 0;
      let totalMatchesFound = 0;
      let totalAutoTagged = 0;
      let totalPendingConfirmation = 0;
      let totalActualCost = 0;

      for (let i = 0; i < mosaics.length; i++) {
        const mosaic = mosaics[i];
        
        try {
          // Queue the request to avoid rate limits
          const result = await bulkRequestQueue.enqueue(async () => {
            const { data, error } = await invokeFunction('mosaic-biometric-match', {
                mosaicDataUrl: mosaic.dataUrl,
                cellMap: mosaic.cellMap,
                gridCols: mosaic.gridCols,
                gridRows: mosaic.gridRows,
                profileEmbeddings,
                options: {
                  autoTagThreshold,
                  confirmThreshold,
                  extractEmbeddings: true
                }
              });

            if (error) throw error;
            return data;
          }, { priority: 10 - i });

          if (result?.success) {
            totalFacesDetected += result.summary?.facesDetected || 0;
            totalAutoTagged += result.summary?.autoTagged || 0;
            totalPendingConfirmation += result.summary?.requiresConfirmation || 0;
            totalActualCost += result.cost?.cents || 0;

            // Process cell results for auto-tagging and match logging
            for (const cell of result.cellResults || []) {
              if (cell.autoTagged && cell.bestMatch) {
                totalMatchesFound++;
                
                // Auto-tag in media_contact_tags
                await supabase.from('media_contact_tags').upsert({
                  media_id: cell.imageId,
                  profile_id: cell.bestMatch.profileId,
                  user_id: user.id,
                  tag_type: 'face',
                  confidence: cell.bestMatch.confidence,
                  detection_method: 'mosaic_auto',
                  auto_detected: true,
                  tagged_at: new Date().toISOString()
                }, { onConflict: 'media_id,profile_id,tag_type' });
              } else if (cell.requiresConfirmation && cell.bestMatch) {
                // Log for user confirmation
                await supabase.from('biometric_matches').insert({
                  user_id: user.id,
                  source_type: 'media',
                  source_id: cell.imageId,
                  match_type: 'face',
                  matched_profile_id: cell.bestMatch.profileId,
                  confidence_score: cell.bestMatch.confidence,
                  alternative_matches: cell.matches?.slice(1, 5) || [],
                  auto_tagged: false
                });
              }

            }
          }
        } catch (e) {
          console.error(`Mosaic ${i + 1} processing failed:`, e);
          errors.push(`Mosaic ${i + 1} failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
          updateProgress({ errorCount: errors.length });
        }

        // Update progress after each mosaic
        const progressUpdate = {
          currentMosaic: i + 1,
          facesDetected: totalFacesDetected,
          matchesFound: totalMatchesFound,
          autoTagged: totalAutoTagged,
          pendingConfirmation: totalPendingConfirmation,
          actualCostCents: totalActualCost
        };
        updateProgress(progressUpdate);
        onProgress?.({ ...initialProgress, ...progressUpdate, phase: 'analyzing' });
      }

      // Phase 5: Complete
      updateProgress({ phase: 'complete' });

      const costComparison = getCostComparison(imageInputs.length, modelKey);
      const processingTimeMs = Date.now() - startTime;

      const result: MosaicScanResult = {
        success: true,
        totalImages: imageInputs.length,
        facesDetected: totalFacesDetected,
        matchesFound: totalMatchesFound,
        autoTagged: totalAutoTagged,
        pendingConfirmation: totalPendingConfirmation,
        totalCostCents: totalActualCost,
        savingsPercent: costComparison.savingsPercent,
        processingTimeMs,
        errors
      };

      onProgress?.({ 
        ...initialProgress, 
        phase: 'complete',
        facesDetected: totalFacesDetected,
        matchesFound: totalMatchesFound,
        autoTagged: totalAutoTagged,
        pendingConfirmation: totalPendingConfirmation,
        actualCostCents: totalActualCost
      });

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pending-biometric-matches'] });
      queryClient.invalidateQueries({ queryKey: ['media-contact-tags'] });
      queryClient.invalidateQueries({ queryKey: ['biometric-stats'] });
      
      if (result.autoTagged > 0) {
        toast.success(`Auto-tagged ${result.autoTagged} faces (${result.savingsPercent.toFixed(0)}% cost savings)`);
      } else if (result.facesDetected > 0) {
        toast.info(`Detected ${result.facesDetected} faces, ${result.pendingConfirmation} pending review`);
      } else {
        toast.info('Scan complete - no faces detected');
      }
    },
    onError: (error: any) => {
      setProgress(null);
      if (!handleAIError(error).handled) {
        toast.error(`Mosaic scan failed: ${error.message}`);
      }
    }
  });

  return {
    scanMosaic: mutation.mutate,
    scanMosaicAsync: mutation.mutateAsync,
    isScanning: mutation.isPending,
    progress,
    reset: () => setProgress(null)
  };
}

/**
 * Hook to get mosaic cost estimation
 */
export function useMosaicCostEstimate(imageCount: number, modelKey: string = 'google/gemini-2.5-flash-lite') {
  const plan = planMosaicBatches(imageCount, modelKey);
  const comparison = getCostComparison(imageCount, modelKey);

  return {
    ...plan,
    ...comparison,
    recommendation: comparison.savingsPercent > 90 
      ? 'Highly recommended - 90%+ savings' 
      : comparison.savingsPercent > 50 
        ? 'Recommended - significant savings'
        : 'Consider per-image for small batches'
  };
}
