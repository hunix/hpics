/**
 * Warfare Sections HTML Renderers (v3.9.35)
 * React components for MICE, Cialdini, Trauma, Cognitive Warfare, etc.
 */

import { Badge } from '@/components/ui/badge';
import { getAnalysisForSection, extractResult, extractNestedField } from '@/components/reports/utils/sectionDataCheck';
import { CIALDINI_PRINCIPLES } from '@/components/reports/sections/types';
import type { ExtendedDossierData } from '../utils/computeExtendedData';
import { humanizeValue } from '../utils/labelFormatter';
import { formatPercent } from '../utils/formatters';
import {
  MetricCard,
  MetricGrid,
  InsightList,
  DataBox,
  SectionSubheader,
  ScoreBar,
  TagList,
} from './shared/DisplayComponents';

// MICE Vulnerability Matrix - Fixed field mapping for nested structure
function MICE({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'mice') || data.miceData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No MICE data</p>;
  
  const result = extractResult(rawData as Record<string, unknown>);
  
  // Handle nested miceProfile structure OR flat structure
  const miceProfile = result.miceProfile as Record<string, unknown> || result;
  
  // Extract scores from nested structure (e.g., miceProfile.money.vulnerabilityScore)
  // or fallback to flat keys (e.g., money_score, money)
  const getFactorScore = (factor: string): number => {
    // Try nested path first: miceProfile.{factor}.vulnerabilityScore
    const nested = miceProfile[factor] as Record<string, unknown>;
    if (nested && typeof nested === 'object') {
      const score = nested.vulnerabilityScore ?? nested.vulnerability_score ?? nested.score;
      if (typeof score === 'number') return score;
    }
    // Fallback to flat keys
    const flat = miceProfile[`${factor}_score`] ?? miceProfile[factor] ?? result[`${factor}_score`] ?? result[factor];
    if (typeof flat === 'number') return flat;
    return 0;
  };

  const factors = [
    { key: 'money', label: 'MONEY' },
    { key: 'ideology', label: 'IDEOLOGY' },
    { key: 'compromise', label: 'COMPROMISE' },
    { key: 'ego', label: 'EGO' },
  ];

  // Extract overall assessment
  const overallAssessment = result.overallAssessment as Record<string, unknown> || miceProfile.overallAssessment as Record<string, unknown> || {};
  const primaryVuln = overallAssessment.primaryVulnerability || result.primary_vulnerability || miceProfile.primary_vulnerability;
  const recruitmentLikelihood = overallAssessment.recruitmentLikelihood ?? result.recruitment_likelihood ?? miceProfile.recruitment_likelihood ?? result.overallRecruitability;
  const approachRecs = (result.approach_recommendations || result.recommendations || miceProfile.approach_recommendations || []) as string[];
  const optimalApproach = result.optimalApproach as Record<string, unknown> || {};

  return (
    <div className="space-y-4">
      <MetricGrid 
        metrics={factors.map(f => {
          const score = getFactorScore(f.key);
          // Smart normalization: values < 1 are decimals, >= 1 are already percentages
          const displayScore = score > 0 && score < 1 ? score * 100 : score;
          return {
            label: f.label,
            value: `${Math.round(displayScore)}%`,
          };
        })} 
        columns={4} 
      />
      
      {Boolean(primaryVuln) && (
        <DataBox variant="danger" title="Primary Vulnerability">
          <p className="font-medium">{humanizeValue(primaryVuln)}</p>
          {recruitmentLikelihood != null && (
            <p className="text-sm text-muted-foreground mt-1">
              Recruitment Likelihood: {formatPercent(recruitmentLikelihood)}
            </p>
          )}
        </DataBox>
      )}

      {Boolean(optimalApproach.approach) && (
        <DataBox variant="warning" title="Optimal Approach">
          <p className="font-medium">{humanizeValue(optimalApproach.approach)}</p>
          {Boolean(optimalApproach.initialPitch) && (
            <p className="text-sm text-muted-foreground mt-1">{String(optimalApproach.initialPitch)}</p>
          )}
        </DataBox>
      )}
      
      {approachRecs.length > 0 && (
        <>
          <SectionSubheader>Approach Recommendations</SectionSubheader>
          <InsightList items={approachRecs} variant="warning" />
        </>
      )}
    </div>
  );
}

// RASCLS/Cialdini Influence Profile - Fixed score normalization
function Cialdini({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'cialdini') || data.influenceData?.data;
  if (!rawData) return <p className="text-muted-foreground">No influence profile data</p>;
  
  const result = extractResult(rawData as Record<string, unknown>);
  // Handle nested susceptibility_profile structure
  const susceptibilityProfile = result.susceptibility_profile as Record<string, unknown> || result;

  return (
    <div className="space-y-4">
      <SectionSubheader>Influence Susceptibility Scores</SectionSubheader>
      <div className="space-y-2">
        {CIALDINI_PRINCIPLES.map(p => {
          // Try multiple field patterns
          const rawScore = 
            susceptibilityProfile[`${p.key}_susceptibility`] ??
            susceptibilityProfile[p.key] ??
            result[`${p.key}_susceptibility`] ??
            result[p.key] ??
            0;
          const score = typeof rawScore === 'number' ? rawScore : 0;
          
          // Smart normalization: values < 1 are decimals, values >= 1 are already in percentage scale
          const normalizedScore = score > 0 && score < 1 ? score * 100 : score;
          
          return (
            <ScoreBar 
              key={p.key} 
              label={p.label} 
              value={normalizedScore} 
              variant={normalizedScore > 70 ? 'danger' : normalizedScore > 40 ? 'warning' : 'default'}
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
      
      {Boolean(inf.primary_channel) && (
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

// Generic section renderer for remaining warfare sections - with humanization
function createGenericWarfareSection(sectionKey: string, title: string) {
  return function GenericSection({ data }: { data: ExtendedDossierData }) {
    const rawData = getAnalysisForSection(data, sectionKey) || (data as any)[`${sectionKey}Data`]?.[0];
    if (!rawData) return <p className="text-muted-foreground">No {title.toLowerCase()} data</p>;
    
    const result = extractResult(rawData as Record<string, unknown>);
    const excludeKeys = ['id', 'user_id', 'profile_id', 'created_at', 'updated_at', 'analysis_type', 'generated_at'];
    const keys = Object.keys(result).filter(k => !excludeKeys.includes(k));
    
    return (
      <div className="space-y-3">
        {keys.slice(0, 10).map(key => {
          const value = result[key];
          
          // Skip null/undefined values
          if (value === null || value === undefined) return null;
          
          if (Array.isArray(value)) {
            if (value.length === 0) return null;
            return (
              <div key={key}>
                <SectionSubheader>{key}</SectionSubheader>
                {typeof value[0] === 'string' ? (
                  <TagList tags={value.slice(0, 10) as string[]} />
                ) : (
                  <p className="text-sm text-muted-foreground">{value.length} items</p>
                )}
              </div>
            );
          } else if (typeof value === 'number') {
            // Smart normalization: values < 1 are decimals
            const normalized = value > 0 && value < 1 ? value * 100 : value;
            return (
              <ScoreBar 
                key={key} 
                label={key}
                value={normalized} 
              />
            );
          } else if (typeof value === 'string' && value.length < 200) {
            return (
              <DataBox key={key} variant="muted" title={key}>
                <p className="text-sm">{humanizeValue(value)}</p>
              </DataBox>
            );
          } else if (typeof value === 'object' && value !== null) {
            // Handle nested objects by showing key metrics
            const objKeys = Object.keys(value as Record<string, unknown>).slice(0, 3);
            if (objKeys.length === 0) return null;
            return (
              <DataBox key={key} variant="muted" title={key}>
                {objKeys.map(k => {
                  const v = (value as Record<string, unknown>)[k];
                  if (typeof v === 'number') {
                    const norm = v > 0 && v < 1 ? v * 100 : v;
                    return <p key={k} className="text-sm">{humanizeValue(k)}: {Math.round(norm)}%</p>;
                  }
                  return <p key={k} className="text-sm">{humanizeValue(k)}: {humanizeValue(v)}</p>;
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
  // v6.0 Advanced Intelligence
  RedTeamAssessment: createGenericWarfareSection('redTeamAssessment', 'Red Team Assessment'),
  MultiPartyDeception: createGenericWarfareSection('multiPartyDeception', 'Multi-Party Deception'),
  HypergameAnalysis: createGenericWarfareSection('hypergameAnalysis', 'Hypergame Analysis'),
  // v7.0 Extreme Intelligence
  IioAttribution: createGenericWarfareSection('iioAttribution', 'IIO Attribution'),
  ReflexiveControl: createGenericWarfareSection('reflexiveControl', 'Reflexive Control'),
  CognitiveEffect: createGenericWarfareSection('cognitiveEffect', 'Cognitive Effect'),
};
