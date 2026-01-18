import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAutoAggregateOnCompletionOptions {
  sessionId: string | null;
  sessionStatus: string;
  profileId: string | null;
  autoAggregate?: boolean;
}

/**
 * Hook that automatically triggers intelligence aggregation when a bulk analysis session completes.
 * This updates contact profiles with extracted intelligence from analyzed media.
 */
export function useAutoAggregateOnCompletion({
  sessionId,
  sessionStatus,
  profileId,
  autoAggregate = true
}: UseAutoAggregateOnCompletionOptions) {
  const hasAggregatedRef = useRef<Set<string>>(new Set());
  const isAggregatingRef = useRef(false);

  useEffect(() => {
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
      
      try {
        // First, aggregate media intelligence
        const { data: aggregateResult, error: aggregateError } = await supabase.functions.invoke(
          'aggregate-media-intelligence',
          { body: { profile_id: profileId } }
        );

        if (aggregateError) {
          console.error('[AutoAggregate] Media aggregation failed:', aggregateError);
          toast.error('Failed to aggregate media intelligence');
          return;
        }

        console.log('[AutoAggregate] Media aggregation result:', aggregateResult);

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
          // Don't show error toast, dossier is optional enhancement
        } else {
          console.log('[AutoAggregate] Dossier generated:', dossierResult);
        }

        toast.success('Intelligence aggregated', {
          description: `Updated profile with ${aggregateResult?.extracted_count || 0} intelligence indicators`
        });

      } catch (error) {
        console.error('[AutoAggregate] Aggregation error:', error);
        toast.error('Intelligence aggregation failed');
      } finally {
        isAggregatingRef.current = false;
      }
    };

    // Delay slightly to ensure all DB updates are complete
    const timeout = setTimeout(aggregateIntelligence, 2000);
    return () => clearTimeout(timeout);
  }, [sessionId, sessionStatus, profileId, autoAggregate]);

  return {
    hasAggregated: sessionId ? hasAggregatedRef.current.has(sessionId) : false
  };
}
