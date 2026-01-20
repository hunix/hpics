/**
 * Section Data Availability Hook (v5.2)
 * Checks which sections have data available for a given profile
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SECTION_DATA_SOURCES, type SectionDataSource } from '../sections/sectionDataSources';

export interface SectionAvailability {
  sectionId: string;
  hasData: boolean;
  dataSource: SectionDataSource['type'];
  lastUpdated: string | null;
  recordCount: number;
}

interface UseSectionDataAvailabilityResult {
  /** Map of sectionId → hasData boolean */
  availabilityMap: Map<string, boolean>;
  /** Detailed availability info per section */
  availabilityDetails: Map<string, SectionAvailability>;
  /** Loading state */
  isLoading: boolean;
  /** Error message if check failed */
  error: string | null;
  /** Total sections with data */
  sectionsWithData: number;
  /** Total sections checked */
  totalSections: number;
  /** Refresh availability data */
  refresh: () => void;
}

/**
 * Check data availability for all sections for a given profile
 */
export function useSectionDataAvailability(profileId: string | null): UseSectionDataAvailabilityResult {
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, boolean>>(new Map());
  const [availabilityDetails, setAvailabilityDetails] = useState<Map<string, SectionAvailability>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!profileId) {
      setAvailabilityMap(new Map());
      setAvailabilityDetails(new Map());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newMap = new Map<string, boolean>();
      const newDetails = new Map<string, SectionAvailability>();

      // Group sections by check type for efficient batching
      const aiAnalysisTypes: string[] = [];
      const tableChecks: Array<{ sectionId: string; table: string; keyColumn: string }> = [];

      for (const [sectionId, source] of Object.entries(SECTION_DATA_SOURCES)) {
        if (source.alwaysAvailable) {
          newMap.set(sectionId, true);
          newDetails.set(sectionId, {
            sectionId,
            hasData: true,
            dataSource: source.type,
            lastUpdated: null,
            recordCount: 1,
          });
        } else if (source.type === 'ai_analyses' && source.analysisType) {
          aiAnalysisTypes.push(source.analysisType);
        } else if (source.type === 'table' && source.table) {
          tableChecks.push({
            sectionId,
            table: source.table,
            keyColumn: source.keyColumn || 'profile_id',
          });
        }
      }

      // Batch check AI analyses
      if (aiAnalysisTypes.length > 0) {
        const { data: analyses } = await supabase
          .from('ai_analyses')
          .select('analysis_type, generated_at')
          .eq('profile_id', profileId)
          .in('analysis_type', aiAnalysisTypes);

        const analysisSet = new Set((analyses || []).map(a => a.analysis_type));
        const analysisMap = new Map((analyses || []).map(a => [a.analysis_type, a.generated_at]));

        for (const [sectionId, source] of Object.entries(SECTION_DATA_SOURCES)) {
          if (source.type === 'ai_analyses' && source.analysisType) {
            const hasData = analysisSet.has(source.analysisType);
            newMap.set(sectionId, hasData);
            newDetails.set(sectionId, {
              sectionId,
              hasData,
              dataSource: 'ai_analyses',
              lastUpdated: analysisMap.get(source.analysisType) || null,
              recordCount: hasData ? 1 : 0,
            });
          }
        }
      }

      // Check tables in parallel (limited to avoid overwhelming DB)
      const BATCH_SIZE = 10;
      for (let i = 0; i < tableChecks.length; i += BATCH_SIZE) {
        const batch = tableChecks.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async ({ sectionId, table, keyColumn }) => {
          try {
            const { count, error: queryError } = await supabase
              .from(table as any)
              .select('*', { count: 'exact', head: true })
              .eq(keyColumn, profileId);

            if (queryError) {
              console.warn(`[SectionAvailability] Error checking ${table}:`, queryError.message);
              newMap.set(sectionId, false);
              newDetails.set(sectionId, {
                sectionId,
                hasData: false,
                dataSource: 'table',
                lastUpdated: null,
                recordCount: 0,
              });
              return;
            }

            const hasData = (count || 0) > 0;
            newMap.set(sectionId, hasData);
            newDetails.set(sectionId, {
              sectionId,
              hasData,
              dataSource: 'table',
              lastUpdated: null,
              recordCount: count || 0,
            });
          } catch (err) {
            // Table might not exist, mark as unavailable
            newMap.set(sectionId, false);
            newDetails.set(sectionId, {
              sectionId,
              hasData: false,
              dataSource: 'table',
              lastUpdated: null,
              recordCount: 0,
            });
          }
        }));
      }

      setAvailabilityMap(newMap);
      setAvailabilityDetails(newDetails);
    } catch (err) {
      console.error('[SectionAvailability] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check data availability');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const sectionsWithData = Array.from(availabilityMap.values()).filter(Boolean).length;
  const totalSections = availabilityMap.size;

  return {
    availabilityMap,
    availabilityDetails,
    isLoading,
    error,
    sectionsWithData,
    totalSections,
    refresh: checkAvailability,
  };
}

/**
 * Get sections that have data available
 */
export function filterSectionsWithData(
  sections: Array<{ id: string; enabled: boolean }>,
  availabilityMap: Map<string, boolean>
): Array<{ id: string; enabled: boolean }> {
  return sections.map(section => ({
    ...section,
    // Keep enabled state but also track if it has data
    enabled: section.enabled && (availabilityMap.get(section.id) ?? false),
  }));
}
