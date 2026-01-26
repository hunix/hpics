/**
 * Dossier Content Container (v7.0)
 * Renders all 95 sections with proper registration for scroll tracking
 */

import { useEffect, useRef } from 'react';
import type { DossierSection as DossierSectionType } from '@/components/reports/sections/types';
import type { ExtendedDossierData } from './utils/computeExtendedData';
import { DossierSection } from './DossierSection';
import { checkSectionHasData } from '@/components/reports/utils/sectionDataCheck';

// Section renderers
import { CoreSections } from './sections/CoreSections';
import { IntelligenceSections } from './sections/IntelligenceSections';
import { WarfareSections } from './sections/WarfareSections';
import { AnalysisSections } from './sections/AnalysisSections';

interface DossierContentProps {
  data: ExtendedDossierData;
  sections: DossierSectionType[];
  registerSection: (sectionId: string, element: HTMLElement | null) => void;
}

// Map section IDs to their renderer components
const sectionRenderers: Record<string, React.FC<{ data: ExtendedDossierData }>> = {
  // Core
  executive: CoreSections.ExecutiveBrief,
  sourceDashboard: CoreSections.SourceDashboard,
  overview: CoreSections.ContactOverview,
  behavioralDna: CoreSections.BehavioralDNA,
  patternOfLife: CoreSections.PatternOfLife,
  relationshipEcosystem: CoreSections.RelationshipEcosystem,
  timeline: CoreSections.Timeline,
  
  // Intelligence
  psychological: IntelligenceSections.PsychologicalProfile,
  quantumCognition: IntelligenceSections.QuantumCognition,
  relationship: IntelligenceSections.Relationship,
  playbook: IntelligenceSections.Playbook,
  hypnoticPatterns: IntelligenceSections.HypnoticPatterns,
  elicitation: IntelligenceSections.Elicitation,
  cognitiveLoad: IntelligenceSections.CognitiveLoad,
  mediaIntel: IntelligenceSections.MediaIntel,
  voiceIntel: IntelligenceSections.VoiceIntel,
  deceptionAnalysis: IntelligenceSections.DeceptionAnalysis,
  actionPlans: IntelligenceSections.ActionPlans,
  
  // Warfare
  mice: WarfareSections.MICE,
  cialdini: WarfareSections.Cialdini,
  sacredValues: WarfareSections.SacredValues,
  realityTesting: WarfareSections.RealityTesting,
  identityDestab: WarfareSections.IdentityDestab,
  influence: WarfareSections.Influence,
  trauma: WarfareSections.Trauma,
  semanticWarfare: WarfareSections.SemanticWarfare,
  memeticPropagation: WarfareSections.MemeticPropagation,
  futureModeling: WarfareSections.FutureModeling,
  precognitive: WarfareSections.Precognitive,
  crossModal: WarfareSections.CrossModal,
  choiceArchitecture: WarfareSections.ChoiceArchitecture,
  betrayal: WarfareSections.Betrayal,
  influenceOps: WarfareSections.InfluenceOps,
  threatActor: WarfareSections.ThreatActor,
  cognitiveWarfare: WarfareSections.CognitiveWarfare,
  deceptionOps: WarfareSections.DeceptionOps,
  vulnerabilityWindows: WarfareSections.VulnerabilityWindows,
  activeDefense: WarfareSections.ActiveDefense,
  trustTrajectory: WarfareSections.TrustTrajectory,
  mosaicFusion: WarfareSections.MosaicFusion,
  darkTetrad: WarfareSections.DarkTetrad,
  shadowNetwork: WarfareSections.ShadowNetwork,
  sentimentCascade: WarfareSections.SentimentCascade,
  opsecAssessment: WarfareSections.OpsecAssessment,
  socialEngineering: WarfareSections.SocialEngineering,
  crisisResponse: WarfareSections.CrisisResponse,
  lawfareDefense: WarfareSections.LawfareDefense,
  reputationDefense: WarfareSections.ReputationDefense,
  familyProtection: WarfareSections.FamilyProtection,
  economicWarfare: WarfareSections.EconomicWarfare,
  tscmSweep: WarfareSections.TscmSweep,
  digitalFootprint: WarfareSections.DigitalFootprint,
  behavioralBaseline: WarfareSections.BehavioralBaseline,
  
  // Analysis & Fusion
  analysis: AnalysisSections.BehavioralAnalysis,
  trust: AnalysisSections.Trust,
  influenceResistance: AnalysisSections.InfluenceResistance,
  behavioralEconomics: AnalysisSections.BehavioralEconomics,
  network: AnalysisSections.NetworkPosition,
  predictionAccuracy: AnalysisSections.PredictionAccuracy,
  counterIntel: AnalysisSections.CounterIntel,
  proportionalResponse: AnalysisSections.ProportionalResponse,
  temporalFusion: AnalysisSections.TemporalFusion,
  digitalTwin: AnalysisSections.DigitalTwin,
  graphRag: AnalysisSections.GraphRag,
  dempsterShafer: AnalysisSections.DempsterShafer,
  counterfactual: AnalysisSections.Counterfactual,
  patternOfLifeFusion: AnalysisSections.PatternOfLifeFusion,
  entityResolution: AnalysisSections.EntityResolution,
  
  // v6.0 Advanced Intelligence
  relationshipHalfLife: AnalysisSections.RelationshipHalfLife,
  redTeamAssessment: WarfareSections.RedTeamAssessment,
  multiPartyDeception: WarfareSections.MultiPartyDeception,
  zeroDayAnomalies: AnalysisSections.ZeroDayAnomalies,
  hypergameAnalysis: WarfareSections.HypergameAnalysis,
  
  // v7.0 Extreme Intelligence
  subvocalizationDetection: AnalysisSections.SubvocalizationDetection,
  audioBurstAnalysis: AnalysisSections.AudioBurstAnalysis,
  iioAttribution: WarfareSections.IioAttribution,
  reflexiveControl: WarfareSections.ReflexiveControl,
  cognitiveEffect: WarfareSections.CognitiveEffect,
  theoryOfMind: AnalysisSections.TheoryOfMind,
  collectiveBehavior: AnalysisSections.CollectiveBehavior,
  stylometricAnalysis: AnalysisSections.StylometricAnalysis,
  dark2Clear: AnalysisSections.Dark2Clear,
  gatedBioFusion: AnalysisSections.GatedBioFusion,
  tasComCommunity: AnalysisSections.TasComCommunity,
  biometricRetention: AnalysisSections.BiometricRetention,
};

export function DossierContent({ data, sections, registerSection }: DossierContentProps) {
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto print:max-w-none print:p-4">
      {sections.map(section => {
        const hasData = checkSectionHasData(section.id, data);
        const Renderer = sectionRenderers[section.id];
        
        // Skip sections without renderers or data
        if (!Renderer) return null;
        
        return (
          <DossierSection
            key={section.id}
            id={section.id}
            title={section.label}
            icon={section.icon}
            category={section.category}
            hasData={hasData}
            registerSection={registerSection}
          >
            <Renderer data={data} />
          </DossierSection>
        );
      })}
    </div>
  );
}
