/**
 * Script to split the massive types.ts into domain-specific modules
 * Run with: node scripts/split-types.mjs
 */

import * as fs from 'fs';
import * as path from 'path';

const TYPES_FILE = 'src/integrations/supabase/types.ts';
const OUTPUT_DIR = 'src/integrations/supabase/types/domains';

// Domain groupings - tables mapped to their domain
const DOMAIN_MAPPINGS = {
    'profiles-contacts': [
        'profiles', 'contact_methods', 'contact_relationships', 'contact_personal_info',
        'contact_locations', 'contact_observations', 'contact_interests', 'contact_life_milestones',
        'contact_influence_profiles', 'dossiers', 'education', 'certifications', 'shared_contacts',
        'personality_profiles', 'unknown_persons', 'digital_twins', 'identity_blueprints',
        'profiles_access_logs'
    ],
    'communications': [
        'communications', 'messages', 'email_access_logs', 'email_accounts', 'email_messages',
        'email_threads', 'voice_notes', 'voice_insights', 'voice_signatures', 'voice_analysis_jobs',
        'voice_recording_sessions', 'meeting_recordings', 'meeting_intelligence', 'live_transcriptions',
        'whatsapp_config', 'whatsapp_import_sessions', 'whatsapp_templates', 'gmail_config',
        'outlook_config', 'message_fingerprints', 'vocal_analyses'
    ],
    'intelligence': [
        'ai_analyses', 'ai_usage_logs', 'psychological_profiles', 'psychological_profile_access_logs',
        'psychological_profile_history', 'psychology_assessments', 'mice_assessments', 'trust_assessments',
        'trust_trajectories', 'elicitation_sessions', 'sacred_values', 'behavioral_analyses',
        'intelligence_alerts', 'intelligence_alert_rules', 'intelligence_fusion_events',
        'intelligence_methodologies', 'intelligence_missions', 'intelligence_queue',
        'intelligence_session_tasks', 'intelligence_sessions', 'intelligence_snapshots',
        'action_recommendations', 'proactive_actions', 'proactive_insights'
    ],
    'media-documents': [
        'media', 'media_analyses', 'media_contact_tags', 'media_metadata_jobs',
        'documents', 'document_analysis_jobs', 'document_embeddings', 'document_hashes',
        'document_insights', 'face_regions', 'face_scan_jobs', 'facial_analyses',
        'gait_analyses', 'gait_profiles', 'screenshot_imports', 'extracted_documents',
        'video_mosaics', 'moment_captures', 'thermal_captures'
    ],
    'network-social': [
        'network_snapshots', 'network_brokerage', 'network_operations', 'network_predictions',
        'social_comments', 'social_connections', 'social_identity_links', 'social_likers',
        'social_posts', 'social_scrape_jobs', 'hidden_connections', 'influence_actions',
        'influence_campaigns', 'influence_cascades', 'influence_paths', 'influence_simulations',
        'influence_strategies', 'knowledge_graph_edges', 'knowledge_graph_nodes',
        'relationship_goals', 'relationship_inferences', 'relationship_opportunities',
        'relationship_scores', 'relationship_trends', 'entity_links', 'entity_mentions',
        'cross_references', 'resonance_connections', 'resonance_events'
    ],
    'security-defense': [
        'threat_actors', 'threat_assessments', 'threat_intelligence', 'security_alerts',
        'security_audit_logs', 'security_events', 'security_findings', 'active_defense_operations',
        'counter_intel_events', 'counter_operations', 'counter_surveillance_events',
        'vulnerability_windows', 'tscm_sweeps', 'credential_exposures', 'dark_web_mentions',
        'surveillance_alerts', 'tamper_detection_alerts', 'defensive_postures',
        'data_access_events', 'data_access_patterns', 'data_classification_tags',
        'data_residency_controls', 'encryption_keys', 'encryption_key_rotations',
        'encrypted_fields', 'immutable_audit_logs', 'secure_deletion_records'
    ],
    'operations-campaigns': [
        'autonomous_campaigns', 'cognitive_warfare_operations', 'deception_operations',
        'deception_analyses', 'deception_signatures', 'memetic_campaigns', 'narrative_campaigns',
        'narrative_crystallization', 'narrative_identities', 'narrative_nodes', 'narrative_simulations',
        'nudge_campaigns', 'multi_target_campaigns', 'intervention_playbooks', 'intervention_triggers',
        'addiction_protocols', 'cult_tactic_deployments', 'mass_formation_indicators',
        'false_memory_tracking', 'learned_helplessness_tracking', 'stockholm_syndrome_tracking',
        'identity_destabilization_logs', 'memory_interventions', 'manipulation_detections'
    ],
    'behavioral-predictions': [
        'behavioral_predictions', 'behavioral_anomalies', 'behavioral_scenario_predictions',
        'prediction_models', 'prediction_accuracy_stats', 'pattern_of_life', 'precursor_signatures',
        'timeline_probabilities', 'timeline_interventions', 'future_predictions',
        'life_trajectory_predictions', 'counterfactual_scenarios', 'decision_windows',
        'opportunity_windows', 'phase_transition_indicators', 'emergence_patterns',
        'trajectory_intercepts'
    ],
    'fusion-analysis': [
        'mosaic_intelligence_fusion', 'mosaic_metadata_sessions', 'cross_domain_correlations',
        'cross_modal_correlations', 'cross_contact_detections', 'cross_contact_insights',
        'cross_contact_patterns', 'cross_device_correlations', 'cross_phase_operations',
        'analysis_aggregates', 'analysis_events', 'analysis_sessions', 'bulk_analysis_items',
        'bulk_analysis_sessions', 'deep_correlations', 'semantic_operations',
        'cognitive_superpositions', 'cognitive_biases', 'cognitive_states',
        'emotional_cascades', 'empathic_vulnerabilities', 'phobia_mappings',
        'family_system_analyses', 'financial_intelligence', 'financial_psychology_profiles'
    ],
    'system-config': [
        'user_preferences', 'user_config_overrides', 'user_roles', 'app_settings',
        'error_logs', 'platform_config', 'workspaces', 'workspace_members',
        'notification_preferences', 'navigation_preferences', 'navigation_quick_access',
        'dashboard_layouts', 'saved_searches', 'query_suggestions', 'query_cache',
        'push_subscriptions', 'webhooks', 'webhook_logs', 'oauth_tokens',
        'integration_configs', 'integration_guides', 'integration_test_history',
        'prompt_versions', 'ab_tests', 'ab_test_assignments', 'deletion_requests',
        'sync_cursors', 'device_sync_log', 'generated_reports', 'reports_schedule',
        'weekly_summaries', 'system_health', 'system_evolution_log'
    ],
    'hardware-devices': [
        'hardware_devices', 'hardware_alerts', 'hardware_analytics_snapshots',
        'hardware_commands', 'hardware_telemetry', 'sensor_network_nodes', 'sensor_readings',
        'aerial_captures', 'aerial_missions', 'rf_signal_captures', 'nfc_tags',
        'device_captures', 'device_contacts', 'device_health_checks', 'device_health_data',
        'device_presence', 'geofences', 'location_history', 'movement_routes',
        'proximity_events', 'metal_detection_sweeps', 'microexpression_readings',
        'interaction_biometrics', 'keystroke_profiles', 'synced_calendar_events',
        'google_calendar_config'
    ],
    'advanced-operations': [
        'absolute_infinity_operations', 'absolute_knowledge', 'absolute_mastery',
        'absolute_objectives', 'absolute_permanence', 'absolute_supremacy',
        'infinite_awareness', 'infinite_perception', 'infinite_protocols', 'infinite_recursion',
        'infinite_synthesis', 'infinity_metrics', 'infinity_protocols',
        'eternal_dominion', 'eternal_influence', 'eternity_metrics', 'eternity_protocols',
        'omniscient_awareness', 'omniscient_synthesis', 'omnipotent_control', 'omnipresent_control',
        'omniversal_awareness', 'omniversal_objectives',
        'transcendence_operations', 'transcendence_protocols', 'transcendent_operations', 'transcendent_synthesis',
        'dimensional_influence', 'dimensional_operations', 'dimensional_sovereignty',
        'sovereignty_operations', 'sovereignty_protocols',
        'reality_anchors', 'reality_comprehension', 'reality_creation', 'reality_frameworks',
        'reality_injection_protocols', 'reality_manipulation', 'reality_synthesis',
        'quantum_states', 'agis_global_state', 'agis_cascade_events', 'agis_analytics',
        'agis_objective_tracking', 'agis_phase_synergies', 'agis_cascade_rules',
        'cosmic_orchestration', 'genesis_synthesis', 'primordial_creation', 'primordial_synthesis',
        'omega_culmination', 'omega_point_operations', 'omega_proximity',
        'total_unification', 'totality_operations', 'ultimate_omega_state', 'ultimate_orchestration',
        'ultimate_singularity', 'ultimate_synthesis', 'ultimate_unity',
        'unified_control_matrix', 'unified_field_control', 'unified_intelligence_feed',
        'universal_awareness', 'universal_creation', 'universal_omniscience',
        'existence_mastery', 'existence_origination', 'meta_existence', 'self_perpetuation',
        'timeless_dominance', 'immortal_influence', 'karmic_cycles', 'karmic_debts',
        'karmic_opportunities', 'morphic_fields', 'morphic_patterns', 'synchronistic_events',
        'detected_egregores', 'egregore_cultivation', 'shadow_network_entities', 'shadow_projections',
        'decision_entanglement', 'interference_patterns', 'meta_patterns', 'meta_learning_models',
        'meta_dimensional_synthesis', 'power_base_scores', 'power_network_analyses',
        'dominion_objectives', 'strategic_omnipotence', 'strategic_synthesis', 'strategy_mutations',
        'predictive_supremacy', 'singularity_objectives', 'dependency_scores'
    ]
};

// Read the types file and normalize line endings
const content = fs.readFileSync(TYPES_FILE, 'utf-8').replace(/\r\n/g, '\n');

// Find all table definitions with their line ranges
const lines = content.split('\n');
const tableRanges = [];
let currentTable = null;
let braceCount = 0;
let startLine = 0;
let foundTablesSection = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for the Tables: { section start
    if (line.includes('Tables: {')) {
        foundTablesSection = true;
        continue;
    }

    if (!foundTablesSection) continue;

    // Exit if we hit Views: { or Functions: {
    if (line.includes('Views: {') || line.includes('Functions: {')) {
        foundTablesSection = false;
        continue;
    }

    // Match table start (6 spaces + table_name: {)
    const tableMatch = line.match(/^      ([a-z][a-z0-9_]*): \{$/);
    if (tableMatch && currentTable === null) {
        currentTable = tableMatch[1];
        startLine = i;
        braceCount = 1;
        continue;
    }

    if (currentTable) {
        // Count braces
        const opens = (line.match(/\{/g) || []).length;
        const closes = (line.match(/\}/g) || []).length;
        braceCount += opens - closes;

        if (braceCount === 0) {
            tableRanges.push({
                name: currentTable,
                startLine,
                endLine: i,
                content: lines.slice(startLine, i + 1).join('\n')
            });
            currentTable = null;
        }
    }
}

console.log(`Found ${tableRanges.length} tables`);

// Create output directory
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Generate domain files
for (const [domain, tables] of Object.entries(DOMAIN_MAPPINGS)) {
    const domainTables = tableRanges.filter(t => tables.includes(t.name));

    if (domainTables.length === 0) {
        console.log(`Warning: No tables found for domain ${domain}`);
        continue;
    }

    const tablesContent = domainTables.map(t => t.content).join('\n');

    const fileContent = `/**
 * ${domain.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: ${domainTables.map(t => t.name).join(', ')}
 */
export interface ${toPascalCase(domain)}Tables {
${tablesContent}
}
`;

    const outputPath = path.join(OUTPUT_DIR, `${domain}.types.ts`);
    fs.writeFileSync(outputPath, fileContent);
    console.log(`Created ${outputPath} with ${domainTables.length} tables`);
}

// Generate index barrel file
const indexContent = `/**
 * Domain Types Barrel Export
 * 
 * @lovable-protected - Do not regenerate
 */

${Object.keys(DOMAIN_MAPPINGS).map(d =>
    `export * from './${d}.types';`
).join('\n')}

// Re-export all domain table interfaces
${Object.keys(DOMAIN_MAPPINGS).map(d =>
    `export type { ${toPascalCase(d)}Tables } from './${d}.types';`
).join('\n')}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
console.log('Created index.ts barrel export');

function toPascalCase(str) {
    return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

console.log('Done!');
