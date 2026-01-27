import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAutoAggregateOnCompletionOptions {
  sessionId: string | null;
  sessionStatus: string;
  profileId: string | null;
  autoAggregate?: boolean;
  includeVoice?: boolean;
}

/**
 * Hook that automatically triggers intelligence aggregation when a bulk analysis session completes.
 * This updates contact profiles with extracted intelligence from analyzed media and voice recordings.
 */
export function useAutoAggregateOnCompletion({
  sessionId,
  sessionStatus,
  profileId,
  autoAggregate = true,
  includeVoice = true
}: UseAutoAggregateOnCompletionOptions) {
  const hasAggregatedRef = useRef<Set<string>>(new Set());
  const isAggregatingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Only trigger on completion
    if (sessionStatus !== 'completed') return;
    if (!sessionId || !profileId) return;
    if (!autoAggregate) return;
    
    // Prevent duplicate aggregation
    if (hasAggregatedRef.current.has(sessionId)) return;
    if (isAggregatingRef.current) return;

    const aggregateIntelligence = async () => {
      isAggregatingRef.current = true;
      hasAggregatedRef.current.add(sessionId);
      
      console.log('[AutoAggregate] Starting intelligence aggregation for session:', sessionId);
      
      let mediaCount = 0;
      let voiceCount = 0;
      
      try {
        // First, aggregate media intelligence
        const { data: aggregateResult, error: aggregateError } = await supabase.functions.invoke(
          'aggregate-media-intelligence',
          { body: { profile_id: profileId } }
        );

        if (aggregateError) {
          console.error('[AutoAggregate] Media aggregation failed:', aggregateError);
        } else {
          console.log('[AutoAggregate] Media aggregation result:', aggregateResult);
          mediaCount = aggregateResult?.extracted_count || 0;
        }

        // Aggregate voice intelligence if enabled
        if (includeVoice) {
          const { data: voiceResult, error: voiceError } = await supabase.functions.invoke(
            'aggregate-voice-intelligence',
            { body: { profile_id: profileId } }
          );

          if (voiceError) {
            console.error('[AutoAggregate] Voice aggregation failed:', voiceError);
          } else {
            console.log('[AutoAggregate] Voice aggregation result:', voiceResult);
            voiceCount = voiceResult?.insights_count || 0;
          }
        }

        // Then, generate/update intelligence dossier
        const { data: dossierResult, error: dossierError } = await supabase.functions.invoke(
          'generate-intelligence-dossier',
          { 
            body: { 
              profile_id: profileId,
              include_actionable: true,
              depth: 'full'
            } 
          }
        );

        if (dossierError) {
          console.error('[AutoAggregate] Dossier generation failed:', dossierError);
        } else {
          console.log('[AutoAggregate] Dossier generated:', dossierResult);
        }

        if (!isMountedRef.current) return;
        
        const totalCount = mediaCount + voiceCount;
        if (totalCount > 0 || !aggregateError) {
          toast.success('Intelligence aggregated', {
            description: `Updated profile with ${mediaCount} media + ${voiceCount} voice insights`
          });
        } else {
          toast.error('Failed to aggregate intelligence');
        }

      } catch (error) {
        console.error('[AutoAggregate] Aggregation error:', error);
        if (isMountedRef.current) {
          toast.error('Intelligence aggregation failed');
        }
      } finally {
        isAggregatingRef.current = false;
      }
    };

    // Delay slightly to ensure all DB updates are complete
    const timeout = setTimeout(aggregateIntelligence, 2000);
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeout);
    };
  }, [sessionId, sessionStatus, profileId, autoAggregate, includeVoice]);

  return {
    hasAggregated: sessionId ? hasAggregatedRef.current.has(sessionId) : false
  };
}
