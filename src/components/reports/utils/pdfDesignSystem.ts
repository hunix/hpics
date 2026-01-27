/**
 * Unified PDF Design System (v6.0)
 * Centralized design utilities for consistent PDF styling
 * 
 * This module provides:
 * - Category-based color mapping for all 161 sections
 * - Robust data extraction handling nested and flat structures
 * - Content validation to prevent blank pages
 * - Standardized content box rendering
 */

import type { ExtendedDossierData } from '../sections/renderers/types';
import { PDF_DESIGN } from '../hooks/usePDFGeneration';

// Re-export PDF_DESIGN for convenience
export { PDF_DESIGN };

/**
 * Section category mapping for all 161 sections
 * Maps section IDs to their category for consistent coloring
 */
const SECTION_CATEGORIES: Record<string, 'core' | 'intelligence' | 'warfare' | 'analysis' | 'fusion'> = {
  // Core sections (9)
  executive: 'core',
  sourceDashboard: 'core',
  overview: 'core',
  timeline: 'core',
  patternOfLife: 'core',
  relationshipEcosystem: 'core',
  mediaIntel: 'core',
  voiceIntel: 'core',
  anomalyDetection: 'core',
  
  // Intelligence sections (16)
  mice: 'intelligence',
  cialdini: 'intelligence',
  psychological: 'intelligence',
  psychProfile: 'intelligence',
  trust: 'intelligence',
  behavioralDna: 'intelligence',
  quantumCognition: 'intelligence',
  relationship: 'intelligence',
  playbook: 'intelligence',
  hypnoticPatterns: 'intelligence',
  elicitation: 'intelligence',
  cognitiveLoad: 'intelligence',
  darkTetrad: 'intelligence',
  influenceVectors: 'intelligence',
  financialPsychology: 'intelligence',
  sacredValues: 'intelligence',
  deceptionAnalysis: 'intelligence',
  
  // Warfare sections (28)
  cognitiveWarfare: 'warfare',
  deceptionOps: 'warfare',
  trauma: 'warfare',
  betrayal: 'warfare',
  vulnerabilityWindows: 'warfare',
  activeDefense: 'warfare',
  realityTesting: 'warfare',
  identityDestab: 'warfare',
  semanticWarfare: 'warfare',
  memeticPropagation: 'warfare',
  futureModeling: 'warfare',
  precognitive: 'warfare',
  choiceArchitecture: 'warfare',
  influenceOps: 'warfare',
  threatActor: 'warfare',
  trustTrajectory: 'warfare',
  coerciveControl: 'warfare',
  influence: 'warfare',
  opsecAssessment: 'warfare',
  socialEngineering: 'warfare',
  crisisResponse: 'warfare',
  lawfareDefense: 'warfare',
  reputationDefense: 'warfare',
  familyProtection: 'warfare',
  economicWarfare: 'warfare',
  tscmSweep: 'warfare',
  digitalFootprint: 'warfare',
  behavioralBaseline: 'warfare',
  
  // Fusion sections (12)
  temporalFusion: 'fusion',
  digitalTwin: 'fusion',
  graphRag: 'fusion',
  shadowNetwork: 'fusion',
  dempsterShafer: 'fusion',
  counterfactual: 'fusion',
  mosaicFusion: 'fusion',
  patternOfLifeFusion: 'fusion',
  entityResolution: 'fusion',
  sentimentCascade: 'fusion',
  crossDomainSynthesis: 'fusion',
  predictiveConvergence: 'fusion',
  
  // Analysis sections (9)
  analysis: 'analysis',
  influenceResistance: 'analysis',
  behavioralEconomics: 'analysis',
  network: 'analysis',
  networkPosition: 'analysis',
  predictionAccuracy: 'analysis',
  counterIntel: 'analysis',
  proportionalResponse: 'analysis',
  crossModal: 'analysis',
  actionPlans: 'analysis',
};

/**
 * Get the category for a section ID
 */
export function getSectionCategory(sectionId: string): 'core' | 'intelligence' | 'warfare' | 'analysis' | 'fusion' {
  return SECTION_CATEGORIES[sectionId] || 'core';
}

/**
 * Get the standardized color for a section category
 */
export function getCategoryColor(category: 'core' | 'intelligence' | 'warfare' | 'analysis' | 'fusion'): [number, number, number] {
  return PDF_DESIGN.colors[category];
}

/**
 * Get the standardized color for a section by its ID
 */
export function getSectionColor(sectionId: string): [number, number, number] {
  const category = getSectionCategory(sectionId);
  return getCategoryColor(category);
}

/**
 * Get light background color for a category (for content boxes)
 */
export function getCategoryBackgroundColor(category: 'core' | 'intelligence' | 'warfare' | 'analysis' | 'fusion'): [number, number, number] {
  const backgrounds: Record<string, [number, number, number]> = {
    core: [245, 245, 248],
    intelligence: [240, 248, 255],
    warfare: [255, 245, 245],
    analysis: [245, 250, 255],
    fusion: [248, 245, 255],
  };
  return backgrounds[category] || [245, 248, 252];
}

/**
 * Enhanced result extraction (v4.0)
 * Handles multiple data structure patterns from ai_analyses
 * 
 * Priority order:
 * 1. record.result (standard ai_analyses structure)
 * 2. record.data (alternative structure)
 * 3. record itself (flat table data)
 */
export function extractResultSafe(record: unknown): Record<string, unknown> {
  if (!record || typeof record !== 'object') return {};
  const obj = record as Record<string, unknown>;
  
  // Priority 1: Direct result field (ai_analyses standard)
  if (obj.result && typeof obj.result === 'object' && !Array.isArray(obj.result)) {
    return obj.result as Record<string, unknown>;
  }
  
  // Priority 2: Data field (some analyses use this)
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as Record<string, unknown>;
  }
  
  // Priority 3: Return the record itself (flat structure from table queries)
  // Filter out metadata fields
  const metadataKeys = ['id', 'user_id', 'profile_id', 'created_at', 'updated_at', 'generated_at', 'analysis_type'];
  const cleanRecord: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!metadataKeys.includes(key)) {
      cleanRecord[key] = value;
    }
  }
  
  return Object.keys(cleanRecord).length > 0 ? cleanRecord : obj;
}

/**
 * Check if extracted result has meaningful content for rendering
 */
export function hasRenderableContent(result: Record<string, unknown>): boolean {
  if (!result || typeof result !== 'object') return false;
  
  const keys = Object.keys(result);
  if (keys.length === 0) return false;
  
  // Check if at least one value is non-empty
  return keys.some(key => {
    const value = result[key];
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  });
}

/**
 * Validate section content before rendering (v4.0)
 * Returns true if section has actual content to render
 * This is stricter than checkSectionHasData to prevent blank pages
 */
export function validateSectionContent(
  sectionId: string,
  data: ExtendedDossierData
): boolean {
  // Import the aliases from sectionDataCheck
  const analysisTypeAliases: Record<string, string[]> = {
    behavioralDna: ['behavioral_dna', 'behavioral_baseline'],
    mice: ['mice_recruitment'],
    cialdini: ['influence_profile'],
    psychological: ['personality', 'manipulation_susceptibility'],
    quantumCognition: ['quantum_cognition'],
    cognitiveWarfare: ['cognitive_warfare'],
    trauma: ['trauma_exploitation', 'attachment_vulnerability'],
    temporalFusion: ['temporal_fusion'],
    mosaicFusion: ['mosaic_intelligence_fusion'],
    shadowNetwork: ['network_exploitation', 'shadow_network'],
    deceptionAnalysis: ['enhanced_deception_detection'],
  };
  
  // Check if has specific data arrays
  const specificDataFields: Record<string, string> = {
    timeline: 'commData',
    mediaIntel: 'mediaData',
    voiceIntel: 'voiceData',
    anomalyDetection: 'anomaliesData',
    trust: 'trustData',
    activeDefense: 'activeDefenseData',
  };
  
  // Always render these essential sections
  const alwaysRender = ['executive', 'sourceDashboard', 'overview'];
  if (alwaysRender.includes(sectionId)) return true;
  
  // Check specific data field
  const fieldName = specificDataFields[sectionId];
  if (fieldName && (data as Record<string, unknown>)[fieldName]) {
    const fieldData = (data as Record<string, unknown>)[fieldName];
    if (Array.isArray(fieldData) && fieldData.length > 0) return true;
    if (fieldData && typeof fieldData === 'object' && !Array.isArray(fieldData)) return true;
  }
  
  // Check allAnalyses for matching analysis_type
  if (data.allAnalyses?.length) {
    const aliases = analysisTypeAliases[sectionId] || [sectionId];
    const hasAnalysis = data.allAnalyses.some((a: Record<string, unknown>) => 
      aliases.includes(a.analysis_type as string)
    );
    if (hasAnalysis) return true;
  }
  
  return false;
}

/**
 * Safe string conversion for any value
 */
export function safeString(value: unknown, fallback: string = 'N/A'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(v => safeString(v, '')).filter(Boolean).join(', ') || fallback;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value).slice(0, 200);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Safe number conversion with bounds
 */
export function safeNumber(value: unknown, fallback: number = 0, min?: number, max?: number): number {
  let num = fallback;
  if (typeof value === 'number' && !isNaN(value)) {
    num = value;
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) num = parsed;
  }
  
  if (min !== undefined && num < min) num = min;
  if (max !== undefined && num > max) num = max;
  
  return num;
}

/**
 * Normalize score to percentage (0-100)
 * Handles both decimal (0-1) and percentage (0-100) inputs
 */
export function normalizeScore(value: unknown, fallback: number = 0): number {
  const num = safeNumber(value, fallback);
  // If value is between 0 and 1, assume it's a decimal and convert to percentage
  if (num > 0 && num <= 1) {
    return Math.round(num * 100);
  }
  // Otherwise assume it's already a percentage
  return Math.round(Math.min(100, Math.max(0, num)));
}
