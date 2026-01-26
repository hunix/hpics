/**
 * Dossier Section Definitions
 * Central registry of all available dossier sections with templates
 */

import {
  FileText, Download, User, Calendar, TrendingUp, Shield, Network, Brain, Image, Target, 
  Clipboard, Heart, AlertTriangle, Mic, Zap, Eye, Crosshair, Sparkles, BookOpen, Gauge, 
  Dna, Clock, Users, Radio, Scale, Fingerprint, Compass, Wand2, ShieldQuestion, Split, 
  Lightbulb, BarChart3, Database, MessageCircle, Lock, Layers, Atom, MapPin, Activity, 
  Wind, Cpu, Crown, Workflow, Share2, Beaker, Waves, PersonStanding, Boxes
} from 'lucide-react';
import type { DossierSection, DossierTemplate } from './types';

export const DEFAULT_SECTIONS: DossierSection[] = [
  // ============== CORE SECTIONS ==============
  { id: 'executive', label: 'Executive Intelligence Brief', icon: Zap, enabled: true, category: 'core' },
  { id: 'sourceDashboard', label: 'Intelligence Source Dashboard', icon: Database, enabled: true, category: 'core' },
  { id: 'overview', label: 'Contact Overview', icon: User, enabled: true, category: 'core' },
  { id: 'behavioralDna', label: 'Contact DNA Fingerprint', icon: Dna, enabled: true, category: 'core' },
  { id: 'patternOfLife', label: 'Pattern-of-Life Analysis', icon: Clock, enabled: true, category: 'core' },
  { id: 'relationshipEcosystem', label: 'Relationship Ecosystem Map', icon: Users, enabled: true, category: 'core' },
  { id: 'timeline', label: 'Interaction Timeline', icon: Calendar, enabled: false, category: 'core' },
  
  // ============== INTELLIGENCE SECTIONS ==============
  { id: 'psychological', label: 'Deep Psychological Profile', icon: Brain, enabled: true, category: 'intelligence' },
  { id: 'quantumCognition', label: 'Quantum Cognition Analysis', icon: Atom, enabled: true, category: 'intelligence' },
  { id: 'relationship', label: 'Relationship Intelligence', icon: Heart, enabled: true, category: 'intelligence' },
  { id: 'playbook', label: 'Engagement Playbook', icon: Target, enabled: true, category: 'intelligence' },
  { id: 'hypnoticPatterns', label: 'Hypnotic Language Patterns', icon: Wand2, enabled: true, category: 'intelligence' },
  { id: 'elicitation', label: 'Elicitation Technique Guide', icon: MessageCircle, enabled: true, category: 'intelligence' },
  { id: 'cognitiveLoad', label: 'Cognitive Load Exploitation', icon: Cpu, enabled: true, category: 'intelligence' },
  { id: 'mediaIntel', label: 'Media Intelligence Synthesis', icon: Image, enabled: true, category: 'intelligence' },
  { id: 'voiceIntel', label: 'Voice Intelligence', icon: Mic, enabled: true, category: 'intelligence' },
  { id: 'deceptionAnalysis', label: 'Deception Analysis Deep Dive', icon: Eye, enabled: true, category: 'intelligence' },
  { id: 'actionPlans', label: 'Strategic Action Plans', icon: Clipboard, enabled: true, category: 'intelligence' },
  
  // ============== WARFARE SECTIONS ==============
  { id: 'mice', label: 'MICE Vulnerability Matrix', icon: Crosshair, enabled: true, category: 'warfare' },
  { id: 'cialdini', label: 'RASCLS Influence Profile', icon: BookOpen, enabled: true, category: 'warfare' },
  { id: 'sacredValues', label: 'Sacred Values Profile', icon: Crown, enabled: true, category: 'warfare' },
  { id: 'realityTesting', label: 'Reality Testing Vulnerability', icon: Split, enabled: true, category: 'warfare' },
  { id: 'identityDestab', label: 'Identity Destabilization Profile', icon: Fingerprint, enabled: true, category: 'warfare' },
  { id: 'influence', label: 'Influence Vectors', icon: Radio, enabled: true, category: 'warfare' },
  { id: 'trauma', label: 'Trauma & Vulnerability Windows', icon: AlertTriangle, enabled: true, category: 'warfare' },
  { id: 'semanticWarfare', label: 'Semantic Warfare Profile', icon: MessageCircle, enabled: true, category: 'warfare' },
  { id: 'memeticPropagation', label: 'Memetic Propagation Analysis', icon: Wind, enabled: true, category: 'warfare' },
  { id: 'futureModeling', label: 'Behavioral Future Modeling', icon: TrendingUp, enabled: true, category: 'warfare' },
  { id: 'precognitive', label: 'Precognitive Pattern Analysis', icon: Compass, enabled: true, category: 'warfare' },
  { id: 'crossModal', label: 'Cross-Modal Deception Analysis', icon: Layers, enabled: true, category: 'warfare' },
  { id: 'choiceArchitecture', label: 'Choice Architecture Exploitation', icon: Scale, enabled: true, category: 'warfare' },
  { id: 'betrayal', label: 'Betrayal & Crisis Prediction', icon: Gauge, enabled: true, category: 'warfare' },
  { id: 'influenceOps', label: 'Influence Operation Planning', icon: MapPin, enabled: true, category: 'warfare' },
  { id: 'threatActor', label: 'Threat Assessment', icon: ShieldQuestion, enabled: true, category: 'warfare' },
  { id: 'cognitiveWarfare', label: 'Cognitive Warfare Operations', icon: Cpu, enabled: true, category: 'warfare' },
  { id: 'deceptionOps', label: 'Deception Operations', icon: Eye, enabled: true, category: 'warfare' },
  { id: 'vulnerabilityWindows', label: 'Vulnerability Windows', icon: Clock, enabled: true, category: 'warfare' },
  { id: 'activeDefense', label: 'Active Defense Posture', icon: Shield, enabled: true, category: 'warfare' },
  { id: 'trustTrajectory', label: '180-Day Trust Trajectory', icon: TrendingUp, enabled: true, category: 'warfare' },
  { id: 'mosaicFusion', label: 'Mosaic Intelligence Fusion', icon: Layers, enabled: true, category: 'warfare' },
  { id: 'darkTetrad', label: 'Dark Tetrad Profile', icon: Brain, enabled: true, category: 'warfare' },
  // New Defense Operations sections (v5.0)
  { id: 'opsecAssessment', label: 'OPSEC Vulnerability Assessment', icon: Shield, enabled: true, category: 'warfare' },
  { id: 'socialEngineering', label: 'Social Engineering Detection', icon: AlertTriangle, enabled: true, category: 'warfare' },
  { id: 'crisisResponse', label: 'Crisis Response Status', icon: Zap, enabled: true, category: 'warfare' },
  { id: 'lawfareDefense', label: 'Lawfare Defense Analysis', icon: Scale, enabled: true, category: 'warfare' },
  { id: 'reputationDefense', label: 'Reputation Defense Status', icon: Shield, enabled: true, category: 'warfare' },
  { id: 'familyProtection', label: 'Family & VIP Protection', icon: Users, enabled: true, category: 'warfare' },
  { id: 'economicWarfare', label: 'Economic Warfare Assessment', icon: BarChart3, enabled: true, category: 'warfare' },
  { id: 'tscmSweep', label: 'TSCM Sweep Results', icon: Radio, enabled: true, category: 'warfare' },
  { id: 'digitalFootprint', label: 'Digital Footprint Analysis', icon: Fingerprint, enabled: true, category: 'warfare' },
  { id: 'behavioralBaseline', label: 'Behavioral Baseline', icon: Activity, enabled: true, category: 'warfare' },
  
  // ============== ANALYSIS SECTIONS ==============
  { id: 'analysis', label: 'Behavioral Analysis', icon: TrendingUp, enabled: true, category: 'analysis' },
  { id: 'trust', label: 'Trust Assessment', icon: Shield, enabled: true, category: 'analysis' },
  { id: 'influenceResistance', label: 'Influence Resistance Profile', icon: Lock, enabled: true, category: 'analysis' },
  { id: 'behavioralEconomics', label: 'Behavioral Economics Profile', icon: BarChart3, enabled: true, category: 'analysis' },
  { id: 'network', label: 'Network Position', icon: Network, enabled: true, category: 'analysis' },
  { id: 'predictionAccuracy', label: 'Prediction Accuracy Tracking', icon: Activity, enabled: true, category: 'analysis' },
  { id: 'counterIntel', label: 'Counter-Intelligence Assessment', icon: Lightbulb, enabled: true, category: 'analysis' },
  { id: 'proportionalResponse', label: 'Proportional Response Log', icon: Scale, enabled: true, category: 'analysis' },
  
  // ============== DATA FUSION SECTIONS ==============
  { id: 'temporalFusion', label: 'Temporal Fusion Transformer', icon: Clock, enabled: true, category: 'analysis' },
  { id: 'digitalTwin', label: 'Behavioral Digital Twin', icon: PersonStanding, enabled: true, category: 'analysis' },
  { id: 'graphRag', label: 'Graph RAG Intelligence', icon: Share2, enabled: true, category: 'intelligence' },
  { id: 'shadowNetwork', label: 'Shadow Network Analysis', icon: Network, enabled: true, category: 'warfare' },
  { id: 'dempsterShafer', label: 'Dempster-Shafer Fusion', icon: Beaker, enabled: true, category: 'analysis' },
  { id: 'counterfactual', label: 'Counterfactual Engine', icon: Split, enabled: true, category: 'intelligence' },
  { id: 'patternOfLifeFusion', label: 'Pattern-of-Life Engine', icon: Workflow, enabled: true, category: 'analysis' },
  { id: 'entityResolution', label: 'Entity Resolution Engine', icon: Boxes, enabled: true, category: 'intelligence' },
  { id: 'sentimentCascade', label: 'Sentiment Cascade Predictor', icon: Waves, enabled: true, category: 'warfare' },
  // New v5.0 Data Fusion Sections
  { id: 'biometricFusion', label: 'Biometric-Behavioral Fusion', icon: Activity, enabled: true, category: 'analysis' },
  { id: 'calendarIntelligence', label: 'Calendar Pattern Intelligence', icon: Calendar, enabled: true, category: 'intelligence' },
  { id: 'geospatialCommunication', label: 'Geospatial-Communication Fusion', icon: MapPin, enabled: true, category: 'analysis' },
  { id: 'financialDocumentSynthesis', label: 'Financial Document Synthesis', icon: FileText, enabled: true, category: 'intelligence' },
  
  // ============== ADVANCED INTELLIGENCE SECTIONS (v6.0) ==============
  { id: 'relationshipHalfLife', label: 'Relationship Half-Life Analysis', icon: Clock, enabled: true, category: 'analysis' },
  { id: 'redTeamAssessment', label: 'Automated Red Team Assessment', icon: Shield, enabled: true, category: 'warfare' },
  { id: 'multiPartyDeception', label: 'Multi-Party Deception Network', icon: Users, enabled: true, category: 'warfare' },
  { id: 'zeroDayAnomalies', label: 'Zero-Day Anomaly Detection', icon: AlertTriangle, enabled: true, category: 'analysis' },
  { id: 'hypergameAnalysis', label: 'Hypergame Strategic Analysis', icon: Brain, enabled: true, category: 'intelligence' },
  
  // ============== EXTREME INTELLIGENCE SECTIONS (v7.0) ==============
  { id: 'subvocalizationDetection', label: 'Subvocalization Detection', icon: Mic, enabled: true, category: 'analysis' },
  { id: 'audioBurstAnalysis', label: 'Audio Burst Mental State', icon: Waves, enabled: true, category: 'analysis' },
  { id: 'iioAttribution', label: 'IIO Attribution Matrix', icon: Target, enabled: true, category: 'warfare' },
  { id: 'reflexiveControl', label: 'Reflexive Control Detection', icon: Brain, enabled: true, category: 'warfare' },
  { id: 'cognitiveEffect', label: 'Cognitive Effect Operations', icon: Cpu, enabled: true, category: 'warfare' },
  { id: 'theoryOfMind', label: 'Adversary Theory of Mind', icon: Eye, enabled: true, category: 'intelligence' },
  { id: 'collectiveBehavior', label: 'Collective Behavior Prediction', icon: Users, enabled: true, category: 'analysis' },
  { id: 'stylometricAnalysis', label: 'Stylometric Authorship', icon: FileText, enabled: true, category: 'intelligence' },
  { id: 'dark2Clear', label: 'Dark2Clear Identity Bridge', icon: Network, enabled: true, category: 'analysis' },
  { id: 'gatedBioFusion', label: 'Gated Biological Fusion', icon: Activity, enabled: true, category: 'analysis' },
  { id: 'tasComCommunity', label: 'TAS-Com Community Detection', icon: Share2, enabled: true, category: 'analysis' },
  { id: 'biometricRetention', label: 'Biometric Retention Score', icon: Fingerprint, enabled: true, category: 'analysis' },
  
  // ============== v8.0 COUNTER-INTELLIGENCE SECTIONS ==============
  { id: 'dracoDeception', label: 'Draco Deception Orchestration', icon: Shield, enabled: true, category: 'warfare' },
  { id: 'sentientIntent', label: 'Sentient Intent Analysis', icon: Eye, enabled: true, category: 'intelligence' },
  { id: 'insiderThreat', label: 'Insider Threat Matrix', icon: AlertTriangle, enabled: true, category: 'warfare' },
  { id: 'bayesianIntention', label: 'Bayesian Intention Prediction', icon: Brain, enabled: true, category: 'intelligence' },
  { id: 'redTeamSimulation', label: 'Red Team Adversary Simulation', icon: Target, enabled: true, category: 'warfare' },
  { id: 'semaforForgery', label: 'SEMAFOR Forgery Detection', icon: Fingerprint, enabled: true, category: 'analysis' },
  { id: 'epistemicVulnerability', label: 'Epistemic Vulnerability Scan', icon: ShieldQuestion, enabled: true, category: 'analysis' },
  { id: 'cognitiveIW', label: 'Cognitive Info Warfare Detection', icon: Radio, enabled: true, category: 'warfare' },
  
  // ============== v8.0 PSYCHOLOGICAL WARFARE SECTIONS ==============
  { id: 'psychoagentCascade', label: 'Psychoagent Cascade Prediction', icon: Waves, enabled: true, category: 'warfare' },
  { id: 'affectiveManipulation', label: 'Affective Manipulation Detection', icon: Heart, enabled: true, category: 'intelligence' },
  { id: 'hyperpersonalization', label: 'Hyperpersonalization Targeting', icon: Crosshair, enabled: true, category: 'intelligence' },
  { id: 'computationalPersuasion', label: 'Computational Persuasion Engine', icon: Cpu, enabled: true, category: 'intelligence' },
  { id: 'syntheticMemory', label: 'Synthetic Memory Generation', icon: Brain, enabled: true, category: 'intelligence' },
  { id: 'prememBelief', label: 'PreMem Belief Modification', icon: Sparkles, enabled: true, category: 'intelligence' },
  { id: 'linguisticStress', label: 'Linguistic Stress Detection', icon: MessageCircle, enabled: true, category: 'analysis' },
  { id: 'memoryAnchor', label: 'Memory Anchor Generation', icon: Lightbulb, enabled: true, category: 'intelligence' },
  { id: 'emotionalContagion', label: 'Emotional Contagion Modeling', icon: Waves, enabled: true, category: 'analysis' },
  { id: 'sacredValuePrediction', label: 'Sacred Value Prediction', icon: Crown, enabled: true, category: 'intelligence' },
  
  // ============== v8.0 BIOMETRIC & NETWORK SECTIONS ==============
  { id: 'pupillometry', label: 'Pupillometry Analysis', icon: Eye, enabled: true, category: 'analysis' },
  { id: 'thermalStress', label: 'Thermal Stress Detection', icon: Activity, enabled: true, category: 'analysis' },
  { id: 'attentionMultimodal', label: 'Attention Multimodal Fusion', icon: Layers, enabled: true, category: 'analysis' },
  { id: 'keystrokeDynamics', label: 'Keystroke Dynamics Analysis', icon: Fingerprint, enabled: true, category: 'analysis' },
  { id: 'sheafInfluence', label: 'Sheaf Neural Influence Map', icon: Network, enabled: true, category: 'intelligence' },
  { id: 'ctdgLink', label: 'CTDG Link Prediction', icon: Share2, enabled: true, category: 'analysis' },
  { id: 'cascadeVirality', label: 'Cascade Virality Prediction', icon: TrendingUp, enabled: true, category: 'analysis' },
  { id: 'networkResilience', label: 'Network Resilience Analysis', icon: Shield, enabled: true, category: 'analysis' },
  
  // ============== v8.0 DOCTRINE & ADVANCED SECTIONS ==============
  { id: 'gazePattern', label: 'Gaze Pattern Analysis', icon: Eye, enabled: true, category: 'analysis' },
  { id: 'microExpressionTimeline', label: 'Micro-Expression Timeline', icon: Clock, enabled: true, category: 'analysis' },
  { id: 'voiceStressCorrelation', label: 'Voice Stress Correlation', icon: Mic, enabled: true, category: 'analysis' },
  { id: 'socialGraphPrediction', label: 'Social Graph Prediction', icon: Share2, enabled: true, category: 'intelligence' },
  { id: 'influenceCampaignOptimization', label: 'Influence Campaign Optimization', icon: Target, enabled: true, category: 'warfare' },
  { id: 'counterNarrative', label: 'Counter-Narrative Generation', icon: MessageCircle, enabled: true, category: 'warfare' },
  { id: 'predictiveDoctrine', label: 'Predictive Doctrine Engine', icon: Compass, enabled: true, category: 'warfare' },
];

export const TEMPLATE_SECTION_IDS: Record<DossierTemplate, string[]> = {
  executive: ['executive', 'sourceDashboard', 'overview', 'psychological', 'actionPlans'],
  operational: ['executive', 'sourceDashboard', 'overview', 'behavioralDna', 'psychological', 'playbook', 'actionPlans', 'mice', 'cialdini', 'influence', 'trauma', 'elicitation'],
  full: DEFAULT_SECTIONS.map(s => s.id),
  surveillance: ['overview', 'sourceDashboard', 'patternOfLife', 'mediaIntel', 'voiceIntel', 'timeline', 'network', 'threatActor', 'crossModal', 'deceptionAnalysis', 'patternOfLifeFusion', 'entityResolution'],
  warfare: ['executive', 'mice', 'cialdini', 'sacredValues', 'realityTesting', 'identityDestab', 'trauma', 'semanticWarfare', 'memeticPropagation', 'choiceArchitecture', 'influenceOps', 'betrayal', 'threatActor', 'hypnoticPatterns', 'elicitation', 'cognitiveLoad', 'cognitiveWarfare', 'deceptionOps', 'vulnerabilityWindows', 'activeDefense', 'trustTrajectory', 'mosaicFusion', 'darkTetrad', 'shadowNetwork', 'sentimentCascade', 'opsecAssessment', 'socialEngineering', 'crisisResponse', 'lawfareDefense', 'reputationDefense', 'familyProtection', 'economicWarfare', 'tscmSweep', 'digitalFootprint', 'behavioralBaseline', 'redTeamAssessment', 'multiPartyDeception', 'iioAttribution', 'reflexiveControl', 'cognitiveEffect'],
  psychological: ['executive', 'behavioralDna', 'psychological', 'quantumCognition', 'relationship', 'playbook', 'deceptionAnalysis', 'behavioralEconomics', 'trust', 'influenceResistance', 'futureModeling', 'precognitive', 'darkTetrad', 'digitalTwin', 'counterfactual', 'relationshipHalfLife', 'zeroDayAnomalies', 'hypergameAnalysis', 'theoryOfMind', 'stylometricAnalysis', 'subvocalizationDetection', 'audioBurstAnalysis'],
  fusion: ['executive', 'temporalFusion', 'digitalTwin', 'graphRag', 'shadowNetwork', 'dempsterShafer', 'counterfactual', 'patternOfLifeFusion', 'entityResolution', 'sentimentCascade', 'mosaicFusion', 'quantumCognition', 'crossModal', 'biometricFusion', 'calendarIntelligence', 'geospatialCommunication', 'financialDocumentSynthesis', 'relationshipHalfLife', 'redTeamAssessment', 'multiPartyDeception', 'zeroDayAnomalies', 'hypergameAnalysis', 'collectiveBehavior', 'dark2Clear', 'gatedBioFusion', 'tasComCommunity', 'biometricRetention'],
};

export function applySectionTemplate(
  sections: DossierSection[], 
  template: DossierTemplate
): DossierSection[] {
  const enabledIds = TEMPLATE_SECTION_IDS[template];
  return sections.map(s => ({
    ...s,
    enabled: enabledIds.includes(s.id),
  }));
}
