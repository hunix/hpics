/**
 * Warfare Sections HTML Renderers (v3.9.34)
 * React components for MICE, Cialdini, Trauma, Cognitive Warfare, etc.
 */

import { Badge } from '@/components/ui/badge';
import { getAnalysisForSection, extractResult } from '@/components/reports/utils/sectionDataCheck';
import { CIALDINI_PRINCIPLES } from '@/components/reports/sections/types';
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

// MICE Vulnerability Matrix
function MICE({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'mice') || data.miceData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No MICE data</p>;
  
  const mice = extractResult(rawData as Record<string, unknown>);
  const factors = ['money', 'ideology', 'compromise', 'ego'];

  return (
    <div className="space-y-4">
      <MetricGrid 
        metrics={factors.map(f => ({
          label: f.toUpperCase(),
          value: `${((mice[`${f}_score`] || mice[f] || 0) as number * 100).toFixed(0)}%`,
        }))} 
        columns={4} 
      />
      
      {mice.primary_vulnerability && (
        <DataBox variant="danger" title="Primary Vulnerability">
          <p className="font-medium">{String(mice.primary_vulnerability)}</p>
          {mice.recruitment_likelihood && (
            <p className="text-sm text-muted-foreground mt-1">
              Recruitment Likelihood: {((mice.recruitment_likelihood as number) * 100).toFixed(0)}%
            </p>
          )}
        </DataBox>
      )}
      
      {(mice.approach_recommendations as string[])?.length > 0 && (
        <>
          <SectionSubheader>Approach Recommendations</SectionSubheader>
          <InsightList items={mice.approach_recommendations as string[]} variant="warning" />
        </>
      )}
    </div>
  );
}

// RASCLS/Cialdini Influence Profile
function Cialdini({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'cialdini') || data.influenceData?.data;
  if (!rawData) return <p className="text-muted-foreground">No influence profile data</p>;
  
  const inf = rawData as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <SectionSubheader>Influence Susceptibility Scores</SectionSubheader>
      <div className="space-y-2">
        {CIALDINI_PRINCIPLES.map(p => {
          const score = (inf[`${p.key}_susceptibility`] as number) || (inf[p.key] as number) || 0;
          return (
            <ScoreBar 
              key={p.key} 
              label={p.label} 
              value={score} 
              variant={score > 70 ? 'danger' : score > 40 ? 'warning' : 'default'}
            />
          );
        })}
      </div>
    </div>
  );
}

// Sacred Values Profile
function SacredValues({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'sacredValues') || data.sacredValuesData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No sacred values data</p>;
  
  const sv = extractResult(rawData as Record<string, unknown>);
  const values = sv.sacred_values as string[] || sv.core_values as string[] || [];
  const taboos = sv.taboo_topics as string[] || sv.taboos as string[] || [];

  return (
    <div className="space-y-4">
      {values.length > 0 && (
        <>
          <SectionSubheader>Sacred Values</SectionSubheader>
          <TagList tags={values} />
        </>
      )}
      
      {taboos.length > 0 && (
        <>
          <SectionSubheader>Taboo Topics</SectionSubheader>
          <InsightList items={taboos} variant="danger" />
        </>
      )}
    </div>
  );
}

// Reality Testing Vulnerability
function RealityTesting({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'realityTesting') || data.realityTestingData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No reality testing data</p>;
  
  const rt = extractResult(rawData as Record<string, unknown>);
  const vulnerabilities = rt.reality_vulnerabilities as string[] || rt.vulnerabilities as string[] || [];

  return (
    <div className="space-y-4">
      <MetricCard 
        label="Reality Testing Score" 
        value={`${((rt.reality_testing_score || rt.score || 0) as number * 100).toFixed(0)}%`}
      />
      
      {vulnerabilities.length > 0 && (
        <>
          <SectionSubheader>Identified Vulnerabilities</SectionSubheader>
          <InsightList items={vulnerabilities} variant="warning" />
        </>
      )}
    </div>
  );
}

// Identity Destabilization
function IdentityDestab({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'identityDestab') || data.identityDestabData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No identity destabilization data</p>;
  
  const id = extractResult(rawData as Record<string, unknown>);
  const vectors = id.destabilization_vectors as string[] || id.attack_vectors as string[] || [];

  return (
    <div className="space-y-4">
      <MetricCard 
        label="Identity Stability" 
        value={`${((id.stability_score || id.identity_stability || 0) as number * 100).toFixed(0)}%`}
      />
      
      {vectors.length > 0 && (
        <>
          <SectionSubheader>Destabilization Vectors</SectionSubheader>
          <InsightList items={vectors} variant="danger" />
        </>
      )}
    </div>
  );
}

// Influence Vectors
function Influence({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'influence') || data.influenceVectorData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No influence vectors data</p>;
  
  const inf = extractResult(rawData as Record<string, unknown>);
  const vectors = inf.influence_vectors as string[] || inf.vectors as string[] || [];

  return (
    <div className="space-y-4">
      {vectors.length > 0 && (
        <>
          <SectionSubheader>Active Influence Vectors</SectionSubheader>
          <TagList tags={vectors} />
        </>
      )}
      
      {inf.primary_channel && (
        <DataBox variant="info" title="Primary Channel">
          <p>{String(inf.primary_channel)}</p>
        </DataBox>
      )}
    </div>
  );
}

// Trauma & Vulnerability Windows
function Trauma({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'trauma') || data.traumaData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No trauma analysis data</p>;
  
  const trauma = extractResult(rawData as Record<string, unknown>);
  const indicators = trauma.trauma_indicators as string[] || trauma.indicators as string[] || [];
  const windows = trauma.vulnerability_windows as any[] || [];

  return (
    <div className="space-y-4">
      <MetricCard 
        label="Trauma Severity" 
        value={String(trauma.severity_level || trauma.severity || 'Unknown')}
        variant={trauma.severity_level === 'high' ? 'danger' : 'warning'}
      />
      
      {indicators.length > 0 && (
        <>
          <SectionSubheader>Trauma Indicators</SectionSubheader>
          <InsightList items={indicators} variant="warning" />
        </>
      )}
      
      {windows.length > 0 && (
        <>
          <SectionSubheader>Vulnerability Windows</SectionSubheader>
          <div className="space-y-2">
            {windows.slice(0, 5).map((w: any, i: number) => (
              <Badge key={i} variant="outline">{typeof w === 'string' ? w : w.window || w.time || 'Window'}</Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Generic section renderer for remaining warfare sections
function createGenericWarfareSection(sectionKey: string, title: string) {
  return function GenericSection({ data }: { data: ExtendedDossierData }) {
    const rawData = getAnalysisForSection(data, sectionKey) || (data as any)[`${sectionKey}Data`]?.[0];
    if (!rawData) return <p className="text-muted-foreground">No {title.toLowerCase()} data</p>;
    
    const result = extractResult(rawData as Record<string, unknown>);
    const keys = Object.keys(result).filter(k => !['id', 'user_id', 'profile_id', 'created_at', 'updated_at'].includes(k));
    
    return (
      <div className="space-y-3">
        {keys.slice(0, 8).map(key => {
          const value = result[key];
          if (Array.isArray(value)) {
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

// Export all warfare sections
export const WarfareSections = {
  MICE,
  Cialdini,
  SacredValues,
  RealityTesting,
  IdentityDestab,
  Influence,
  Trauma,
  SemanticWarfare: createGenericWarfareSection('semanticWarfare', 'Semantic Warfare'),
  MemeticPropagation: createGenericWarfareSection('memeticPropagation', 'Memetic Propagation'),
  FutureModeling: createGenericWarfareSection('futureModeling', 'Future Modeling'),
  Precognitive: createGenericWarfareSection('precognitive', 'Precognitive Patterns'),
  CrossModal: createGenericWarfareSection('crossModal', 'Cross-Modal Deception'),
  ChoiceArchitecture: createGenericWarfareSection('choiceArchitecture', 'Choice Architecture'),
  Betrayal: createGenericWarfareSection('betrayal', 'Betrayal Prediction'),
  InfluenceOps: createGenericWarfareSection('influenceOps', 'Influence Operations'),
  ThreatActor: createGenericWarfareSection('threatActor', 'Threat Assessment'),
  CognitiveWarfare: createGenericWarfareSection('cognitiveWarfare', 'Cognitive Warfare'),
  DeceptionOps: createGenericWarfareSection('deceptionOps', 'Deception Operations'),
  VulnerabilityWindows: createGenericWarfareSection('vulnerabilityWindows', 'Vulnerability Windows'),
  ActiveDefense: createGenericWarfareSection('activeDefense', 'Active Defense'),
  TrustTrajectory: createGenericWarfareSection('trustTrajectory', 'Trust Trajectory'),
  MosaicFusion: createGenericWarfareSection('mosaicFusion', 'Mosaic Fusion'),
  DarkTetrad: createGenericWarfareSection('darkTetrad', 'Dark Tetrad'),
  ShadowNetwork: createGenericWarfareSection('shadowNetwork', 'Shadow Network'),
  SentimentCascade: createGenericWarfareSection('sentimentCascade', 'Sentiment Cascade'),
  OpsecAssessment: createGenericWarfareSection('opsecAssessment', 'OPSEC Assessment'),
  SocialEngineering: createGenericWarfareSection('socialEngineering', 'Social Engineering'),
  CrisisResponse: createGenericWarfareSection('crisisResponse', 'Crisis Response'),
  LawfareDefense: createGenericWarfareSection('lawfareDefense', 'Lawfare Defense'),
  ReputationDefense: createGenericWarfareSection('reputationDefense', 'Reputation Defense'),
  FamilyProtection: createGenericWarfareSection('familyProtection', 'Family Protection'),
  EconomicWarfare: createGenericWarfareSection('economicWarfare', 'Economic Warfare'),
  TscmSweep: createGenericWarfareSection('tscmSweep', 'TSCM Sweep'),
  DigitalFootprint: createGenericWarfareSection('digitalFootprint', 'Digital Footprint'),
  BehavioralBaseline: createGenericWarfareSection('behavioralBaseline', 'Behavioral Baseline'),
};
