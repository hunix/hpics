/**
 * Intelligence Components - Optimized Exports
 * 
 * PERFORMANCE NOTE: Only frequently-used components are exported here.
 * For specialized dashboards, import directly from their files:
 * 
 * @example
 * // For heavy/specialized components, import directly:
 * import { SupremacyDashboard } from '@/components/intelligence/SupremacyDashboard';
 * import { DarkPsychologyDashboard } from '@/components/intelligence/DarkPsychologyDashboard';
 */

// Core frequently-used components
export { ContactAIAgent } from './ContactAIAgent';
export { IntelligenceHub } from './IntelligenceHub';
export { RAGPoweredAgent } from './RAGPoweredAgent';
export { IntelligenceStatsPanel } from './IntelligenceStatsPanel';
export { EntityMentionsPanel } from './EntityMentionsPanel';
export { CrossContactAnalyzer } from './CrossContactAnalyzer';
export { VoiceSignaturePanel } from './VoiceSignaturePanel';

// Task Progress Components (commonly used)
export { TaskProgressPanel } from './TaskProgressPanel';
export type { Task, TaskStatus, TaskNote } from './TaskProgressPanel';

// NOTE: The following components should be imported directly from their files
// to avoid loading them when not needed:
//
// Advanced Intelligence:
// - RomanticIntelligencePanel
// - ShadowNetworkGraph
// - BehavioralDNAPanel
// - CounterIntelligenceDashboard
// - FortuneTrajectoryPanel
// - ManipulationVulnerabilityPanel
//
// Superiority Intelligence:
// - SuperiorityDashboard
// - PowerDynamicsAnalyzer
// - NetworkInfluenceMap
//
// Psychology & Deception:
// - DarkPsychologyDashboard
// - DeceptionDetectionConsole
// - MicroExpressionTimeline
// - VoiceStressPanel
// - InfluencePlaybookPanel
// - LocalMLDashboard
//
// AGIS Phases:
// - SupremacyDashboard
// - SituationRoom
// - SupremacyDashboardV2
// - MissionControlConsole
// - TacticalNegotiationPanel
// - AttachmentVulnerabilityPanel
// - ChronotypePanel
// - LifeTrajectoryPanel
// - NetworkBrokeragePanel
// - BehavioralEconomicsPanel
// - MemoryReconsolidationPanel
// - ChoiceArchitecturePanel
// - FamilySystemsPanel

// Phase 5 exports - import directly from './phase5' when needed
// Removed: export * from './phase5';
