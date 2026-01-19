/**
 * Section Orchestrator Hook (v3.7.2)
 * Dynamically maps section IDs to renderers with performance tracking
 */

import { useCallback, useMemo } from 'react';
import { allSectionRenderers } from '../sections/renderers';
import type { PDFContext, ExtendedDossierData, SectionRenderer } from '../sections/renderers/types';

export interface SectionRenderResult {
  sectionId: string;
  success: boolean;
  renderTimeMs: number;
  error?: string;
}

export interface SectionOrchestrator {
  renderSection: (sectionId: string, ctx: PDFContext, data: ExtendedDossierData) => SectionRenderResult;
  renderEnabledSections: (sections: Array<{ id: string; enabled: boolean }>, ctx: PDFContext, data: ExtendedDossierData) => SectionRenderResult[];
  getSectionRenderer: (sectionId: string) => SectionRenderer | undefined;
  getMissingSections: (sectionIds: string[]) => string[];
  getRegisteredSections: () => string[];
}

/**
 * Fallback renderer for sections without a specific renderer
 */
const fallbackRenderer: SectionRenderer = (ctx, _data) => {
  // Silent fallback - don't render anything for unmapped sections
  console.warn(`[SectionOrchestrator] No renderer found for section, skipping...`);
};

/**
 * Hook for orchestrating section rendering with performance tracking
 */
export function useSectionOrchestrator(): SectionOrchestrator {
  /**
   * Get all registered section IDs
   */
  const getRegisteredSections = useCallback((): string[] => {
    return Object.keys(allSectionRenderers);
  }, []);

  /**
   * Get a specific section renderer
   */
  const getSectionRenderer = useCallback((sectionId: string): SectionRenderer | undefined => {
    return allSectionRenderers[sectionId];
  }, []);

  /**
   * Get list of section IDs that don't have renderers
   */
  const getMissingSections = useCallback((sectionIds: string[]): string[] => {
    return sectionIds.filter(id => !allSectionRenderers[id]);
  }, []);

  /**
   * Render a single section with performance tracking
   */
  const renderSection = useCallback((
    sectionId: string,
    ctx: PDFContext,
    data: ExtendedDossierData
  ): SectionRenderResult => {
    const startTime = performance.now();
    
    try {
      const renderer = allSectionRenderers[sectionId] || fallbackRenderer;
      renderer(ctx, data);
      
      return {
        sectionId,
        success: true,
        renderTimeMs: performance.now() - startTime,
      };
    } catch (error) {
      console.error(`[SectionOrchestrator] Error rendering section ${sectionId}:`, error);
      return {
        sectionId,
        success: false,
        renderTimeMs: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  /**
   * Render all enabled sections with performance tracking
   */
  const renderEnabledSections = useCallback((
    sections: Array<{ id: string; enabled: boolean }>,
    ctx: PDFContext,
    data: ExtendedDossierData
  ): SectionRenderResult[] => {
    const results: SectionRenderResult[] = [];
    
    const enabledSections = sections.filter(s => s.enabled);
    
    for (const section of enabledSections) {
      const result = renderSection(section.id, ctx, data);
      results.push(result);
    }
    
    // Log performance summary
    const totalTime = results.reduce((sum, r) => sum + r.renderTimeMs, 0);
    const failedCount = results.filter(r => !r.success).length;
    
    console.log(`[SectionOrchestrator] Rendered ${results.length} sections in ${totalTime.toFixed(2)}ms (${failedCount} failed)`);
    
    return results;
  }, [renderSection]);

  return useMemo(() => ({
    renderSection,
    renderEnabledSections,
    getSectionRenderer,
    getMissingSections,
    getRegisteredSections,
  }), [renderSection, renderEnabledSections, getSectionRenderer, getMissingSections, getRegisteredSections]);
}
