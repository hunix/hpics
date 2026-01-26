/**
 * V8 Sections HTML Renderers (v8.0)
 * React components for all v8.0 Masterpiece Intelligence Suite sections
 */

import { getAnalysisForSection, extractResult } from '@/components/reports/utils/sectionDataCheck';
import type { ExtendedDossierData } from '../utils/computeExtendedData';
import {
  MetricCard,
  MetricGrid,
  InsightList,
  DataBox,
  SectionSubheader,
  ScoreBar,
  TagList,
} from './shared/DisplayComponents';

// Generic v8.0 section renderer factory
function createV8Section(sectionKey: string, title: string) {
  return function V8Section({ data }: { data: ExtendedDossierData }) {
    const rawData = getAnalysisForSection(data, sectionKey) || (data as any)[`${sectionKey}Data`]?.[0];
    if (!rawData) return <p className="text-muted-foreground">No {title.toLowerCase()} data</p>;
    
    const result = extractResult(rawData as Record<string, unknown>);
    const excludeKeys = ['id', 'user_id', 'profile_id', 'created_at', 'updated_at', 'analysis_type', 'generated_at'];
    const keys = Object.keys(result).filter(k => !excludeKeys.includes(k));
    
    return (
      <div className="space-y-3">
        {keys.slice(0, 10).map(key => {
          const value = result[key];
          
          if (value === null || value === undefined) return null;
          
          if (Array.isArray(value)) {
            if (value.length === 0) return null;
            return (
              <div key={key}>
                <SectionSubheader>{key.replace(/_/g, ' ')}</SectionSubheader>
                {typeof value[0] === 'string' ? (
                  <TagList tags={value.slice(0, 10) as string[]} />
                ) : (
                  <p className="text-sm text-muted-foreground">{value.length} items</p>
                )}
              </div>
            );
          } else if (typeof value === 'number') {
            const normalized = value > 0 && value < 1 ? value * 100 : value;
            return (
              <ScoreBar 
                key={key} 
                label={key.replace(/_/g, ' ')}
                value={normalized} 
              />
            );
          } else if (typeof value === 'string' && value.length < 200) {
            return (
              <DataBox key={key} variant="muted" title={key.replace(/_/g, ' ')}>
                <p className="text-sm">{value}</p>
              </DataBox>
            );
          } else if (typeof value === 'object' && value !== null) {
            const objKeys = Object.keys(value as Record<string, unknown>).slice(0, 3);
            if (objKeys.length === 0) return null;
            return (
              <DataBox key={key} variant="muted" title={key.replace(/_/g, ' ')}>
                {objKeys.map(k => {
                  const v = (value as Record<string, unknown>)[k];
                  if (typeof v === 'number') {
                    const norm = v > 0 && v < 1 ? v * 100 : v;
                    return <p key={k} className="text-sm">{k.replace(/_/g, ' ')}: {Math.round(norm)}%</p>;
                  }
                  return <p key={k} className="text-sm">{k.replace(/_/g, ' ')}: {String(v)}</p>;
                })}
              </DataBox>
            );
          }
          return null;
        })}
      </div>
    );
  };
}

// Export all v8.0 sections
export const V8Sections = {
  // Phase 1 - Counter-Intelligence
  DracoDeception: createV8Section('dracoDeception', 'Draco Deception Orchestrator'),
  SentientIntent: createV8Section('sentientIntent', 'Sentient Intent Analysis'),
  InsiderThreat: createV8Section('insiderThreat', 'Insider Threat Matrix'),
  BayesianIntention: createV8Section('bayesianIntention', 'Bayesian Intention Prediction'),
  RedTeamSimulator: createV8Section('redTeamSimulator', 'Red Team Adversary Simulation'),
  SemaforForgery: createV8Section('semaforForgery', 'SEMAFOR Forgery Detection'),
  EpistemicVulnerability: createV8Section('epistemicVulnerability', 'Epistemic Vulnerability Scan'),
  CognitiveIW: createV8Section('cognitiveIW', 'Cognitive IW Detection'),
  
  // Phase 2 - Psychological Warfare
  PsychoagentCascade: createV8Section('psychoagentCascade', 'Psychoagent Cascade Prediction'),
  AffectiveManipulation: createV8Section('affectiveManipulation', 'Affective Manipulation Detection'),
  Hyperpersonalization: createV8Section('hyperpersonalization', 'Hyperpersonalization Mapping'),
  ComputationalPersuasion: createV8Section('computationalPersuasion', 'Computational Persuasion'),
  SyntheticMemory: createV8Section('syntheticMemory', 'Synthetic Memory Generation'),
  PreMemBelief: createV8Section('prememBelief', 'PreMem Belief Modification'),
  LinguisticStress: createV8Section('linguisticStress', 'Linguistic Stress Detection'),
  MemoryAnchor: createV8Section('memoryAnchor', 'Memory Anchor Generation'),
  EmotionalContagion: createV8Section('emotionalContagion', 'Emotional Contagion Modeling'),
  SacredValuePredictor: createV8Section('sacredValuePredictor', 'Sacred Value Prediction'),
  
  // Phase 3 - Biometric & Network
  Pupillometry: createV8Section('pupillometry', 'Pupillometry Analysis'),
  ThermalStress: createV8Section('thermalStress', 'Thermal Stress Detection'),
  AttentionMultimodal: createV8Section('attentionMultimodal', 'Attention Multimodal Fusion'),
  KeystrokeDynamics: createV8Section('keystrokeDynamics', 'Keystroke Dynamics Analysis'),
  SheafNeural: createV8Section('sheafNeural', 'Sheaf Neural Influence'),
  CtdgLinkPredictor: createV8Section('ctdgLinkPredictor', 'CTDG Link Prediction'),
  CascadeVirality: createV8Section('cascadeVirality', 'Cascade Virality Prediction'),
  NetworkResilience: createV8Section('networkResilience', 'Network Resilience Analysis'),
  GazePattern: createV8Section('gazePattern', 'Gaze Pattern Analysis'),
  MicroExpressionTimeline: createV8Section('microExpressionTimeline', 'Micro-Expression Timeline'),
  VoiceStressCorrelator: createV8Section('voiceStressCorrelator', 'Voice Stress Correlation'),
  SocialGraphPredictor: createV8Section('socialGraphPredictor', 'Social Graph Prediction'),
  BehavioralFingerprint: createV8Section('behavioralFingerprint', 'Behavioral Fingerprint'),
  
  // Phase 4 - Doctrine & Prediction
  InfluenceCampaignOptimizer: createV8Section('influenceCampaignOptimizer', 'Influence Campaign Optimizer'),
  CounterNarrative: createV8Section('counterNarrative', 'Counter-Narrative Generation'),
  PredictiveDoctrine: createV8Section('predictiveDoctrine', 'Predictive Doctrine'),
  CognitiveDefenseSimulator: createV8Section('cognitiveDefenseSimulator', 'Cognitive Defense Simulator'),
};
