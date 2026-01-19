/**
 * Phase 2: Deep modularization script
 * - Splits advanced-operations into 4 sub-modules
 * - Creates minimal types.ts that imports from domains
 * 
 * Run with: node scripts/deep-modularize.mjs
 */

import * as fs from 'fs';
import * as path from 'path';

const TYPES_FILE = 'src/integrations/supabase/types.ts';
const DOMAINS_DIR = 'src/integrations/supabase/types/domains';
const ADVANCED_OPS_FILE = path.join(DOMAINS_DIR, 'advanced-operations.types.ts');

// Sub-groupings for advanced-operations (96 tables → 4 files)
const ADVANCED_SUB_GROUPS = {
    'reality-dimensional': [
        'reality_anchors', 'reality_comprehension', 'reality_creation', 'reality_frameworks',
        'reality_injection_protocols', 'reality_manipulation', 'reality_synthesis',
        'dimensional_influence', 'dimensional_operations', 'dimensional_sovereignty',
        'quantum_states', 'decision_entanglement', 'interference_patterns',
        'morphic_fields', 'morphic_patterns', 'synchronistic_events'
    ],
    'infinity-eternal': [
        'infinite_awareness', 'infinite_perception', 'infinite_protocols', 'infinite_recursion',
        'infinite_synthesis', 'infinity_metrics', 'infinity_protocols',
        'eternal_dominion', 'eternal_influence', 'eternity_metrics', 'eternity_protocols',
        'timeless_dominance', 'immortal_influence', 'self_perpetuation',
        'existence_mastery', 'existence_origination', 'meta_existence'
    ],
    'omniscient-transcendent': [
        'omniscient_awareness', 'omniscient_synthesis', 'omnipotent_control', 'omnipresent_control',
        'omniversal_awareness', 'omniversal_objectives',
        'transcendence_operations', 'transcendence_protocols', 'transcendent_operations', 'transcendent_synthesis',
        'universal_awareness', 'universal_creation', 'universal_omniscience',
        'total_unification', 'totality_operations', 'unified_control_matrix', 'unified_field_control',
        'unified_intelligence_feed'
    ],
    'strategic-synthesis': [
        'absolute_infinity_operations', 'absolute_knowledge', 'absolute_mastery',
        'absolute_objectives', 'absolute_permanence', 'absolute_supremacy',
        'agis_analytics', 'agis_cascade_events', 'agis_cascade_rules',
        'agis_global_state', 'agis_objective_tracking', 'agis_phase_synergies',
        'cosmic_orchestration', 'genesis_synthesis', 'primordial_creation', 'primordial_synthesis',
        'omega_culmination', 'omega_point_operations', 'omega_proximity',
        'ultimate_omega_state', 'ultimate_orchestration', 'ultimate_singularity', 'ultimate_synthesis', 'ultimate_unity',
        'strategic_omnipotence', 'strategic_synthesis', 'strategy_mutations', 'predictive_supremacy',
        'singularity_objectives', 'dominion_objectives', 'dependency_scores',
        'power_base_scores', 'power_network_analyses', 'meta_dimensional_synthesis',
        'meta_learning_models', 'meta_patterns', 'detected_egregores', 'egregore_cultivation',
        'shadow_network_entities', 'shadow_projections', 'karmic_cycles', 'karmic_debts', 'karmic_opportunities',
        'sovereignty_operations', 'sovereignty_protocols'
    ]
};

// Read advanced-operations file and normalize
const advancedContent = fs.readFileSync(ADVANCED_OPS_FILE, 'utf-8').replace(/\r\n/g, '\n');
const advancedLines = advancedContent.split('\n');

// Parse tables from advanced-operations
const tableRanges = [];
let currentTable = null;
let braceCount = 0;
let startLine = 0;

for (let i = 0; i < advancedLines.length; i++) {
    const line = advancedLines[i];

    // Match table start (6 spaces + table_name: {)
    const tableMatch = line.match(/^      ([a-z][a-z0-9_]*): \{$/);
    if (tableMatch && currentTable === null) {
        currentTable = tableMatch[1];
        startLine = i;
        braceCount = 1;
        continue;
    }

    if (currentTable) {
        const opens = (line.match(/\{/g) || []).length;
        const closes = (line.match(/\}/g) || []).length;
        braceCount += opens - closes;

        if (braceCount === 0) {
            tableRanges.push({
                name: currentTable,
                startLine,
                endLine: i,
                content: advancedLines.slice(startLine, i + 1).join('\n')
            });
            currentTable = null;
        }
    }
}

console.log(`Found ${tableRanges.length} tables in advanced-operations`);

// Create sub-module files
for (const [subDomain, tables] of Object.entries(ADVANCED_SUB_GROUPS)) {
    const subTables = tableRanges.filter(t => tables.includes(t.name));

    if (subTables.length === 0) {
        console.log(`Warning: No tables found for sub-domain ${subDomain}`);
        continue;
    }

    const tablesContent = subTables.map(t => t.content).join('\n');
    const interfaceName = toPascalCase(subDomain) + 'Tables';

    const fileContent = `/**
 * ${subDomain.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Sub-module of advanced-operations
 */

import type { Json } from '../base';

/**
 * Tables: ${subTables.map(t => t.name).join(', ')}
 */
export interface ${interfaceName} {
${tablesContent}
}
`;

    const outputPath = path.join(DOMAINS_DIR, `${subDomain}.types.ts`);
    fs.writeFileSync(outputPath, fileContent);
    console.log(`Created ${subDomain}.types.ts with ${subTables.length} tables`);
}

// Delete old advanced-operations file
fs.unlinkSync(ADVANCED_OPS_FILE);
console.log('Deleted old advanced-operations.types.ts');

// Update index.ts barrel
const indexContent = `/**
 * Domain Types Barrel Export
 * 
 * @lovable-protected - Do not regenerate
 */

// Core domain types
export * from './profiles-contacts.types';
export * from './communications.types';
export * from './intelligence.types';
export * from './media-documents.types';
export * from './network-social.types';
export * from './security-defense.types';
export * from './operations-campaigns.types';
export * from './behavioral-predictions.types';
export * from './fusion-analysis.types';
export * from './system-config.types';
export * from './hardware-devices.types';

// Advanced operations sub-modules (replaces advanced-operations.types.ts)
export * from './reality-dimensional.types';
export * from './infinity-eternal.types';
export * from './omniscient-transcendent.types';
export * from './strategic-synthesis.types';

// Re-export all domain table interfaces
export type { ProfilesContactsTables } from './profiles-contacts.types';
export type { CommunicationsTables } from './communications.types';
export type { IntelligenceTables } from './intelligence.types';
export type { MediaDocumentsTables } from './media-documents.types';
export type { NetworkSocialTables } from './network-social.types';
export type { SecurityDefenseTables } from './security-defense.types';
export type { OperationsCampaignsTables } from './operations-campaigns.types';
export type { BehavioralPredictionsTables } from './behavioral-predictions.types';
export type { FusionAnalysisTables } from './fusion-analysis.types';
export type { SystemConfigTables } from './system-config.types';
export type { HardwareDevicesTables } from './hardware-devices.types';

// Advanced sub-modules
export type { RealityDimensionalTables } from './reality-dimensional.types';
export type { InfinityEternalTables } from './infinity-eternal.types';
export type { OmniscientTranscendentTables } from './omniscient-transcendent.types';
export type { StrategicSynthesisTables } from './strategic-synthesis.types';
`;

fs.writeFileSync(path.join(DOMAINS_DIR, 'index.ts'), indexContent);
console.log('Updated index.ts barrel export');

// Now create the minimal types.ts
console.log('\\nCreating minimal types.ts...');

// Read original types.ts for Views, Functions, Enums, and helper types
const originalContent = fs.readFileSync(TYPES_FILE, 'utf-8').replace(/\r\n/g, '\n');
const originalLines = originalContent.split('\n');

// Find Views section
let viewsStart = -1, viewsEnd = -1;
let functionsStart = -1, functionsEnd = -1;
let enumsStart = -1, enumsEnd = -1;

for (let i = 0; i < originalLines.length; i++) {
    const line = originalLines[i];
    if (line.includes('Views: {')) viewsStart = i;
    if (line.includes('Functions: {')) {
        if (viewsStart > 0 && viewsEnd < 0) viewsEnd = i - 1;
        functionsStart = i;
    }
    if (line.includes('Enums: {')) {
        if (functionsStart > 0 && functionsEnd < 0) functionsEnd = i - 1;
        enumsStart = i;
    }
    if (line.includes('CompositeTypes: {')) {
        if (enumsStart > 0 && enumsEnd < 0) enumsEnd = i - 1;
    }
}

// Extract Views content
const viewsContent = viewsStart > 0 ? originalLines.slice(viewsStart, viewsEnd + 1).join('\n') : '    Views: {}';

// Extract Functions content  
const functionsContent = functionsStart > 0 ? originalLines.slice(functionsStart, functionsEnd + 1).join('\n') : '    Functions: {}';

// Find Enums section with proper brace counting
let enumsBraceCount = 0;
let enumsActualEnd = enumsStart;
for (let i = enumsStart; i < originalLines.length; i++) {
    const line = originalLines[i];
    enumsBraceCount += (line.match(/\{/g) || []).length;
    enumsBraceCount -= (line.match(/\}/g) || []).length;
    if (enumsBraceCount === 0 && i > enumsStart) {
        enumsActualEnd = i;
        break;
    }
}
const enumsContent = enumsStart > 0 ? originalLines.slice(enumsStart, enumsActualEnd + 1).join('\n') : '    Enums: {}';

// Find helper types at end of file (after Database interface)
const helperTypesStart = originalLines.findIndex(l => l.includes('type DatabaseWithoutInternals'));
const helperTypesContent = helperTypesStart > 0 ? originalLines.slice(helperTypesStart).join('\n') : '';

// Create minimal types.ts
const minimalTypesContent = `/**
 * Supabase Database Types
 * 
 * @lovable-protected - Do not regenerate this file
 * 
 * This file imports table definitions from domain-specific modules in ./types/domains/
 * See .lovable/config.json for regeneration settings.
 * 
 * Domain Structure:
 * - profiles-contacts: Profile, contact, relationship tables
 * - communications: Messages, emails, voice recordings
 * - intelligence: AI analyses, psychological profiles
 * - media-documents: Media, documents, face regions
 * - network-social: Social connections, network analysis
 * - security-defense: Threats, security, defenses
 * - operations-campaigns: Campaigns, missions, warfare
 * - behavioral-predictions: Predictions, patterns
 * - fusion-analysis: Cross-domain correlations
 * - system-config: User preferences, settings
 * - hardware-devices: Hardware, sensors
 * - reality-dimensional: Reality, quantum, dimensional ops
 * - infinity-eternal: Infinity, eternal protocols
 * - omniscient-transcendent: Omniscient, transcendent ops
 * - strategic-synthesis: Strategic, AGIS, synthesis ops
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Import all domain table types
import type { ProfilesContactsTables } from './types/domains/profiles-contacts.types';
import type { CommunicationsTables } from './types/domains/communications.types';
import type { IntelligenceTables } from './types/domains/intelligence.types';
import type { MediaDocumentsTables } from './types/domains/media-documents.types';
import type { NetworkSocialTables } from './types/domains/network-social.types';
import type { SecurityDefenseTables } from './types/domains/security-defense.types';
import type { OperationsCampaignsTables } from './types/domains/operations-campaigns.types';
import type { BehavioralPredictionsTables } from './types/domains/behavioral-predictions.types';
import type { FusionAnalysisTables } from './types/domains/fusion-analysis.types';
import type { SystemConfigTables } from './types/domains/system-config.types';
import type { HardwareDevicesTables } from './types/domains/hardware-devices.types';
import type { RealityDimensionalTables } from './types/domains/reality-dimensional.types';
import type { InfinityEternalTables } from './types/domains/infinity-eternal.types';
import type { OmniscientTranscendentTables } from './types/domains/omniscient-transcendent.types';
import type { StrategicSynthesisTables } from './types/domains/strategic-synthesis.types';

// Compose all tables from domain modules
type AllTables = 
  & ProfilesContactsTables
  & CommunicationsTables
  & IntelligenceTables
  & MediaDocumentsTables
  & NetworkSocialTables
  & SecurityDefenseTables
  & OperationsCampaignsTables
  & BehavioralPredictionsTables
  & FusionAnalysisTables
  & SystemConfigTables
  & HardwareDevicesTables
  & RealityDimensionalTables
  & InfinityEternalTables
  & OmniscientTranscendentTables
  & StrategicSynthesisTables;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: AllTables
${viewsContent}
${functionsContent}
${enumsContent}
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

${helperTypesContent}
`;

fs.writeFileSync(TYPES_FILE, minimalTypesContent);
console.log('Created minimal types.ts');

// Get final file sizes
const newTypesSize = fs.statSync(TYPES_FILE).size;
console.log(`\\nNew types.ts size: ${(newTypesSize / 1024).toFixed(1)} KB`);

function toPascalCase(str) {
    return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

console.log('\\nDone! Run npm run build to verify.');
