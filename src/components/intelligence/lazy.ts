/**
 * Lazy-loaded Intelligence Components
 * 
 * Use these for code-splitting heavy dashboard components.
 * Wrap with <Suspense fallback={<Loading />}> when using.
 * 
 * @example
 * import { LazySupremacyDashboard } from '@/components/intelligence/lazy';
 * 
 * <Suspense fallback={<Skeleton className="h-96" />}>
 *   <LazySupremacyDashboard />
 * </Suspense>
 */

import { lazy } from 'react';

// AGIS Phase 10: Supremacy
export const LazySupremacyDashboard = lazy(() => 
  import('./SupremacyDashboard').then(m => ({ default: m.SupremacyDashboard }))
);

export const LazySituationRoom = lazy(() =>
  import('./SituationRoom').then(m => ({ default: m.SituationRoom }))
);

// AGIS Phase 2: Absolute Superiority
export const LazySupremacyDashboardV2 = lazy(() =>
  import('./SupremacyDashboardV2').then(m => ({ default: m.SupremacyDashboardV2 }))
);

export const LazyMissionControlConsole = lazy(() =>
  import('./MissionControlConsole').then(m => ({ default: m.MissionControlConsole }))
);

// Psychology & Deception (Heavy components)
export const LazyDarkPsychologyDashboard = lazy(() =>
  import('./DarkPsychologyDashboard').then(m => ({ default: m.DarkPsychologyDashboard }))
);

export const LazyDeceptionDetectionConsole = lazy(() =>
  import('./DeceptionDetectionConsole').then(m => ({ default: m.DeceptionDetectionConsole }))
);

export const LazyMicroExpressionTimeline = lazy(() =>
  import('./MicroExpressionTimeline').then(m => ({ default: m.MicroExpressionTimeline }))
);

export const LazyLocalMLDashboard = lazy(() =>
  import('./LocalMLDashboard').then(m => ({ default: m.LocalMLDashboard }))
);

// Advanced Intelligence
export const LazyRomanticIntelligencePanel = lazy(() =>
  import('./RomanticIntelligencePanel').then(m => ({ default: m.RomanticIntelligencePanel }))
);

export const LazyShadowNetworkGraph = lazy(() =>
  import('./ShadowNetworkGraph').then(m => ({ default: m.ShadowNetworkGraph }))
);

export const LazyBehavioralDNAPanel = lazy(() =>
  import('./BehavioralDNAPanel').then(m => ({ default: m.BehavioralDNAPanel }))
);

export const LazyCounterIntelligenceDashboard = lazy(() =>
  import('./CounterIntelligenceDashboard').then(m => ({ default: m.CounterIntelligenceDashboard }))
);

export const LazyFortuneTrajectoryPanel = lazy(() =>
  import('./FortuneTrajectoryPanel').then(m => ({ default: m.FortuneTrajectoryPanel }))
);

export const LazyManipulationVulnerabilityPanel = lazy(() =>
  import('./ManipulationVulnerabilityPanel').then(m => ({ default: m.ManipulationVulnerabilityPanel }))
);

// Superiority Intelligence
export const LazySuperiorityDashboard = lazy(() =>
  import('./SuperiorityDashboard').then(m => ({ default: m.SuperiorityDashboard }))
);

export const LazyPowerDynamicsAnalyzer = lazy(() =>
  import('./PowerDynamicsAnalyzer').then(m => ({ default: m.PowerDynamicsAnalyzer }))
);

export const LazyNetworkInfluenceMap = lazy(() =>
  import('./NetworkInfluenceMap').then(m => ({ default: m.NetworkInfluenceMap }))
);

// AGIS Phase 2 Panels
export const LazyTacticalNegotiationPanel = lazy(() =>
  import('./TacticalNegotiationPanel').then(m => ({ default: m.TacticalNegotiationPanel }))
);

export const LazyAttachmentVulnerabilityPanel = lazy(() =>
  import('./AttachmentVulnerabilityPanel').then(m => ({ default: m.AttachmentVulnerabilityPanel }))
);

export const LazyChronotypePanel = lazy(() =>
  import('./ChronotypePanel').then(m => ({ default: m.ChronotypePanel }))
);

export const LazyLifeTrajectoryPanel = lazy(() =>
  import('./LifeTrajectoryPanel').then(m => ({ default: m.LifeTrajectoryPanel }))
);

export const LazyNetworkBrokeragePanel = lazy(() =>
  import('./NetworkBrokeragePanel').then(m => ({ default: m.NetworkBrokeragePanel }))
);

export const LazyBehavioralEconomicsPanel = lazy(() =>
  import('./BehavioralEconomicsPanel').then(m => ({ default: m.BehavioralEconomicsPanel }))
);

export const LazyMemoryReconsolidationPanel = lazy(() =>
  import('./MemoryReconsolidationPanel').then(m => ({ default: m.MemoryReconsolidationPanel }))
);

export const LazyChoiceArchitecturePanel = lazy(() =>
  import('./ChoiceArchitecturePanel').then(m => ({ default: m.ChoiceArchitecturePanel }))
);

export const LazyFamilySystemsPanel = lazy(() =>
  import('./FamilySystemsPanel').then(m => ({ default: m.FamilySystemsPanel }))
);

// Voice & Analysis
export const LazyVoiceStressPanel = lazy(() =>
  import('./VoiceStressPanel').then(m => ({ default: m.VoiceStressPanel }))
);

export const LazyInfluencePlaybookPanel = lazy(() =>
  import('./InfluencePlaybookPanel').then(m => ({ default: m.InfluencePlaybookPanel }))
);
