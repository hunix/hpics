/**
 * Analysis & Fusion Sections HTML Renderers (v3.9.34)
 * React components for behavioral analysis, trust, network, fusion engines, etc.
 */

import { Badge } from '@/components/ui/badge';
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
  KeyValueRow,
} from './shared/DisplayComponents';

// Behavioral Analysis
function BehavioralAnalysis({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'analysis') || data.behavioralDnaAnalysis;
  if (!rawData) return <p className="text-muted-foreground">No behavioral analysis data</p>;
  
  const analysis = extractResult(rawData as Record<string, unknown>);
  const patterns = analysis.behavioral_patterns as string[] || analysis.patterns as string[] || [];

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Predictability', value: `${((analysis.predictability || 0) as number * 100).toFixed(0)}%` },
        { label: 'Consistency', value: `${((analysis.consistency_score || 0) as number * 100).toFixed(0)}%` },
      ]} columns={2} />
      
      {patterns.length > 0 && (
        <>
          <SectionSubheader>Behavioral Patterns</SectionSubheader>
          <InsightList items={patterns} />
        </>
      )}
    </div>
  );
}

// Trust Assessment
function Trust({ data }: { data: ExtendedDossierData }) {
  const trust = data.trustData?.[0] as Record<string, unknown>;
  if (!trust) return <p className="text-muted-foreground">No trust data</p>;

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Overall Trust', value: `${trust.overall_trust_score || 0}%`, variant: (trust.overall_trust_score as number) > 70 ? 'success' : 'warning' },
        { label: 'Trajectory', value: String(trust.trust_trajectory || 'Stable') },
      ]} columns={2} />
      
      {Boolean(trust.trust_factors) && (
        <>
          <SectionSubheader>Trust Factors</SectionSubheader>
          <div className="space-y-2">
            {Object.entries(trust.trust_factors as Record<string, number>).map(([factor, score]) => (
              <ScoreBar key={factor} label={factor.replace(/_/g, ' ')} value={score} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Influence Resistance Profile
function InfluenceResistance({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'influenceResistance') || data.influenceResistanceData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No influence resistance data</p>;
  
  const ir = extractResult(rawData as Record<string, unknown>);
  const resistances = ir.resistance_points as string[] || ir.strengths as string[] || [];

  return (
    <div className="space-y-4">
      <MetricCard 
        label="Overall Resistance" 
        value={`${((ir.resistance_score || ir.overall_resistance || 0) as number * 100).toFixed(0)}%`}
        variant={(ir.resistance_score as number) > 0.7 ? 'success' : 'warning'}
      />
      
      {resistances.length > 0 && (
        <>
          <SectionSubheader>Resistance Points</SectionSubheader>
          <InsightList items={resistances} variant="success" />
        </>
      )}
    </div>
  );
}

// Behavioral Economics Profile
function BehavioralEconomics({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'behavioralEconomics') || data.financialPsychData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No behavioral economics data</p>;
  
  const be = extractResult(rawData as Record<string, unknown>);
  const biases = be.cognitive_biases as string[] || be.biases as string[] || [];

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Risk Tolerance', value: `${((be.risk_tolerance || 0) as number * 100).toFixed(0)}%` },
        { label: 'Loss Aversion', value: `${((be.loss_aversion || 0) as number * 100).toFixed(0)}%` },
      ]} columns={2} />
      
      {biases.length > 0 && (
        <>
          <SectionSubheader>Cognitive Biases</SectionSubheader>
          <TagList tags={biases} />
        </>
      )}
    </div>
  );
}

// Network Position
function NetworkPosition({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'network') || data.networkPositionData?.[0];
  const relationships = data.relationshipsData || [];
  
  if (!rawData && relationships.length === 0) {
    return <p className="text-muted-foreground">No network position data</p>;
  }
  
  const network = rawData ? extractResult(rawData as Record<string, unknown>) : {};

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Connections', value: relationships.length },
        { label: 'Centrality', value: `${((network.centrality_score || 0) as number * 100).toFixed(0)}%` },
        { label: 'Influence Reach', value: `${((network.influence_reach || 0) as number * 100).toFixed(0)}%` },
      ]} columns={3} />
      
      {(network.key_connectors as string[])?.length > 0 && (
        <>
          <SectionSubheader>Key Connectors</SectionSubheader>
          <TagList tags={network.key_connectors as string[]} />
        </>
      )}
    </div>
  );
}

// Prediction Accuracy
function PredictionAccuracy({ data }: { data: ExtendedDossierData }) {
  const predictions = data.predictionHistoryData || data.scenarioPredictions || [];
  if (predictions.length === 0) return <p className="text-muted-foreground">No prediction history</p>;

  const accurateCount = predictions.filter((p: any) => p.was_accurate || p.outcome_matched).length;
  const accuracy = predictions.length > 0 ? (accurateCount / predictions.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Total Predictions', value: predictions.length },
        { label: 'Accuracy Rate', value: `${accuracy.toFixed(0)}%`, variant: accuracy > 70 ? 'success' : 'warning' },
      ]} columns={2} />
    </div>
  );
}

// Counter-Intelligence Assessment
function CounterIntel({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'counterIntel') || data.counterIntelData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No counter-intelligence data</p>;
  
  const ci = extractResult(rawData as Record<string, unknown>);
  const threats = ci.identified_threats as string[] || ci.threats as string[] || [];

  return (
    <div className="space-y-4">
      <MetricCard 
        label="Threat Level" 
        value={String(ci.threat_level || ci.risk_level || 'Low')}
        variant={(ci.threat_level as string) === 'high' ? 'danger' : 'default'}
      />
      
      {threats.length > 0 && (
        <>
          <SectionSubheader>Identified Threats</SectionSubheader>
          <InsightList items={threats} variant="danger" />
        </>
      )}
    </div>
  );
}

// Proportional Response Log
function ProportionalResponse({ data }: { data: ExtendedDossierData }) {
  const responses = data.proportionalResponseData || [];
  if (responses.length === 0) return <p className="text-muted-foreground">No response log data</p>;

  return (
    <div className="space-y-3">
      <MetricCard label="Total Responses" value={responses.length} />
      
      {responses.slice(0, 5).map((r: any, i: number) => (
        <DataBox key={i} variant="muted">
          <KeyValueRow label="Type" value={r.response_type || 'Response'} />
          <KeyValueRow label="Effectiveness" value={`${((r.effectiveness_score || 0) * 100).toFixed(0)}%`} />
        </DataBox>
      ))}
    </div>
  );
}

// Generic fusion section renderer
function createGenericFusionSection(sectionKey: string, title: string) {
  return function FusionSection({ data }: { data: ExtendedDossierData }) {
    const rawData = getAnalysisForSection(data, sectionKey) || (data as any)[`${sectionKey}Data`]?.[0];
    if (!rawData) return <p className="text-muted-foreground">No {title.toLowerCase()} data</p>;
    
    const result = extractResult(rawData as Record<string, unknown>);
    const keys = Object.keys(result).filter(k => !['id', 'user_id', 'profile_id', 'created_at', 'updated_at'].includes(k));
    
    return (
      <div className="space-y-3">
        {keys.slice(0, 6).map(key => {
          const value = result[key];
          if (Array.isArray(value)) {
            return (
              <div key={key}>
                <SectionSubheader>{key.replace(/_/g, ' ')}</SectionSubheader>
                {typeof value[0] === 'string' ? (
                  <TagList tags={value.slice(0, 8) as string[]} />
                ) : (
                  <p className="text-sm text-muted-foreground">{value.length} items</p>
                )}
              </div>
            );
          } else if (typeof value === 'number') {
            return (
              <ScoreBar 
                key={key} 
                label={key.replace(/_/g, ' ')} 
                value={value > 1 ? value : value * 100} 
              />
            );
          } else if (typeof value === 'string' && value.length < 200) {
            return (
              <DataBox key={key} variant="muted" title={key.replace(/_/g, ' ')}>
                <p className="text-sm">{value}</p>
              </DataBox>
            );
          }
          return null;
        })}
      </div>
    );
  };
}

// Export all analysis sections
export const AnalysisSections = {
  BehavioralAnalysis,
  Trust,
  InfluenceResistance,
  BehavioralEconomics,
  NetworkPosition,
  PredictionAccuracy,
  CounterIntel,
  ProportionalResponse,
  TemporalFusion: createGenericFusionSection('temporalFusion', 'Temporal Fusion'),
  DigitalTwin: createGenericFusionSection('digitalTwin', 'Digital Twin'),
  GraphRag: createGenericFusionSection('graphRag', 'Graph RAG'),
  DempsterShafer: createGenericFusionSection('dempsterShafer', 'Dempster-Shafer'),
  Counterfactual: createGenericFusionSection('counterfactual', 'Counterfactual'),
  PatternOfLifeFusion: createGenericFusionSection('patternOfLifeFusion', 'Pattern of Life'),
  EntityResolution: createGenericFusionSection('entityResolution', 'Entity Resolution'),
  // v6.0 Advanced Intelligence
  RelationshipHalfLife: createGenericFusionSection('relationshipHalfLife', 'Relationship Half-Life'),
  ZeroDayAnomalies: createGenericFusionSection('zeroDayAnomalies', 'Zero-Day Anomalies'),
  // v7.0 Extreme Intelligence
  SubvocalizationDetection: createGenericFusionSection('subvocalizationDetection', 'Subvocalization Detection'),
  AudioBurstAnalysis: createGenericFusionSection('audioBurstAnalysis', 'Audio Burst Mental State'),
  TheoryOfMind: createGenericFusionSection('theoryOfMind', 'Adversary Theory of Mind'),
  CollectiveBehavior: createGenericFusionSection('collectiveBehavior', 'Collective Behavior Prediction'),
  StylometricAnalysis: createGenericFusionSection('stylometricAnalysis', 'Stylometric Authorship'),
  Dark2Clear: createGenericFusionSection('dark2Clear', 'Dark2Clear Identity Bridge'),
  GatedBioFusion: createGenericFusionSection('gatedBioFusion', 'Gated Biological Fusion'),
  TasComCommunity: createGenericFusionSection('tasComCommunity', 'TAS-Com Community Detection'),
  BiometricRetention: createGenericFusionSection('biometricRetention', 'Biometric Retention'),
};
