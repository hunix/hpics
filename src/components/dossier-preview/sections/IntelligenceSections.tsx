/**
 * Intelligence Sections HTML Renderers (v3.9.34)
 * React components for psychological, quantum cognition, playbook, elicitation, etc.
 */

import { Badge } from '@/components/ui/badge';
import { getAnalysisForSection, extractResult } from '@/components/reports/utils/sectionDataCheck';
import type { ExtendedDossierData } from '../utils/computeExtendedData';
import {
  MetricCard,
  MetricGrid,
  InsightList,
  KeyValueRow,
  DataBox,
  SectionSubheader,
  ScoreBar,
  TagList,
} from './shared/DisplayComponents';

// Psychological Profile
function PsychologicalProfile({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'psychological') || data.psychData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No psychological profile data</p>;
  
  const psych = extractResult(rawData as Record<string, unknown>);
  const traits = psych.personality_traits as Record<string, number> || {};
  const attachment = psych.attachment_style as Record<string, unknown> || {};

  return (
    <div className="space-y-4">
      {Object.keys(traits).length > 0 && (
        <>
          <SectionSubheader>Personality Traits (Big Five)</SectionSubheader>
          <div className="space-y-2">
            {Object.entries(traits).slice(0, 5).map(([trait, score]) => (
              <ScoreBar key={trait} label={trait} value={Number(score)} />
            ))}
          </div>
        </>
      )}
      
      {attachment.primary_style && (
        <DataBox variant="info" title="Attachment Style">
          <KeyValueRow label="Primary Style" value={String(attachment.primary_style)} variant="bold" />
          <KeyValueRow label="Anxiety Score" value={`${attachment.anxiety_score || 0}%`} />
          <KeyValueRow label="Avoidance Score" value={`${attachment.avoidance_score || 0}%`} />
        </DataBox>
      )}
    </div>
  );
}

// Quantum Cognition
function QuantumCognition({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'quantumCognition') || data.cognitiveSuperpositions?.[0];
  if (!rawData) return <p className="text-muted-foreground">No quantum cognition data</p>;
  
  const quantum = extractResult(rawData as Record<string, unknown>);
  const states = quantum.superposition_states as any[] || [];
  const signature = quantum.quantum_signature as string || '';

  return (
    <div className="space-y-4">
      {signature && (
        <DataBox variant="muted">
          <p className="font-mono text-xs">{signature}</p>
        </DataBox>
      )}
      
      {states.length > 0 && (
        <>
          <SectionSubheader>Cognitive Superpositions</SectionSubheader>
          <div className="space-y-2">
            {states.slice(0, 5).map((state, i) => (
              <div key={i} className="p-2 rounded bg-muted/50 text-sm">
                {typeof state === 'object' ? JSON.stringify(state) : String(state)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Relationship Intelligence
function Relationship({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'relationship') || data.relationshipAnalysis;
  if (!rawData) return <p className="text-muted-foreground">No relationship intelligence data</p>;
  
  const rel = extractResult(rawData as Record<string, unknown>);

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Relationship Score', value: `${rel.score || rel.relationship_score || 0}/100` },
        { label: 'Grade', value: String(rel.grade || rel.relationship_grade || 'N/A') },
        { label: 'Trajectory', value: String(rel.trajectory || 'Stable') },
      ]} columns={3} />
      
      {rel.recommendations && (
        <>
          <SectionSubheader>Recommendations</SectionSubheader>
          <InsightList items={rel.recommendations as string[]} />
        </>
      )}
    </div>
  );
}

// Engagement Playbook
function Playbook({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'playbook') || data.playbookData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No playbook data</p>;
  
  const playbook = extractResult(rawData as Record<string, unknown>);
  const strategies = playbook.engagement_strategies as string[] || playbook.strategies as string[] || [];
  const tactics = playbook.recommended_tactics as string[] || playbook.tactics as string[] || [];

  return (
    <div className="space-y-4">
      {strategies.length > 0 && (
        <>
          <SectionSubheader>Engagement Strategies</SectionSubheader>
          <InsightList items={strategies} variant="success" />
        </>
      )}
      
      {tactics.length > 0 && (
        <>
          <SectionSubheader>Recommended Tactics</SectionSubheader>
          <InsightList items={tactics} />
        </>
      )}
    </div>
  );
}

// Hypnotic Patterns
function HypnoticPatterns({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'hypnoticPatterns') || data.hypnoticPatternsData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No hypnotic patterns data</p>;
  
  const patterns = extractResult(rawData as Record<string, unknown>);
  const languagePatterns = patterns.language_patterns as string[] || patterns.patterns as string[] || [];
  const susceptibility = patterns.susceptibility_score as number || 0;

  return (
    <div className="space-y-4">
      <MetricCard label="Susceptibility Score" value={`${(susceptibility * 100).toFixed(0)}%`} />
      
      {languagePatterns.length > 0 && (
        <>
          <SectionSubheader>Effective Language Patterns</SectionSubheader>
          <TagList tags={languagePatterns} />
        </>
      )}
    </div>
  );
}

// Elicitation Techniques
function Elicitation({ data }: { data: ExtendedDossierData }) {
  const sessions = data.elicitationData || data.elicitationSessions || [];
  if (sessions.length === 0) return <p className="text-muted-foreground">No elicitation data</p>;
  
  const latest = sessions[0] as Record<string, unknown>;
  const techniques = latest.techniques_used as string[] || [];
  const effectiveness = latest.effectiveness_score as number || 0;

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Sessions', value: sessions.length },
        { label: 'Effectiveness', value: `${(effectiveness * 100).toFixed(0)}%` },
      ]} columns={2} />
      
      {techniques.length > 0 && (
        <>
          <SectionSubheader>Techniques Used</SectionSubheader>
          <TagList tags={techniques} />
        </>
      )}
    </div>
  );
}

// Cognitive Load Exploitation
function CognitiveLoad({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'cognitiveLoad') || data.cognitiveLoadData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No cognitive load data</p>;
  
  const cog = extractResult(rawData as Record<string, unknown>);
  const loadPoints = cog.exploitation_points as string[] || cog.vulnerabilities as string[] || [];
  const threshold = cog.cognitive_threshold as number || cog.load_threshold as number || 0;

  return (
    <div className="space-y-4">
      <MetricCard label="Cognitive Threshold" value={`${(threshold * 100).toFixed(0)}%`} />
      
      {loadPoints.length > 0 && (
        <>
          <SectionSubheader>Exploitation Points</SectionSubheader>
          <InsightList items={loadPoints} variant="warning" />
        </>
      )}
    </div>
  );
}

// Media Intelligence
function MediaIntel({ data }: { data: ExtendedDossierData }) {
  const mediaCount = data.totalMediaAnalyzed;
  const analyses = data.mediaAnalyses || [];
  
  if (mediaCount === 0 && analyses.length === 0) {
    return <p className="text-muted-foreground">No media intelligence data</p>;
  }

  return (
    <div className="space-y-4">
      <MetricGrid metrics={[
        { label: 'Media Analyzed', value: mediaCount },
        { label: 'Analyses', value: analyses.length },
      ]} columns={2} />
      
      {analyses.length > 0 && (
        <>
          <SectionSubheader>Recent Analyses</SectionSubheader>
          <div className="space-y-2">
            {analyses.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="p-2 rounded bg-muted/50 text-sm">
                {a.analysis_type || 'Analysis'} - {new Date(a.created_at).toLocaleDateString()}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Voice Intelligence
function VoiceIntel({ data }: { data: ExtendedDossierData }) {
  const sessions = data.totalVoiceSessions;
  const voiceData = data.voiceData || [];
  
  if (sessions === 0) return <p className="text-muted-foreground">No voice intelligence data</p>;

  return (
    <div className="space-y-4">
      <MetricCard label="Voice Sessions" value={sessions} />
      
      {voiceData.length > 0 && (
        <>
          <SectionSubheader>Recent Sessions</SectionSubheader>
          <div className="space-y-2">
            {voiceData.slice(0, 5).map((v: any, i: number) => (
              <div key={i} className="p-2 rounded bg-muted/50 text-sm flex justify-between">
                <span>{v.session_type || 'Voice Session'}</span>
                <span className="text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Deception Analysis
function DeceptionAnalysis({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'deceptionAnalysis') || data.deceptionAnalysisData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No deception analysis data</p>;
  
  const deception = extractResult(rawData as Record<string, unknown>);
  const indicators = deception.deception_indicators as string[] || deception.indicators as string[] || [];
  const score = deception.deception_likelihood as number || deception.score as number || 0;

  return (
    <div className="space-y-4">
      <MetricCard 
        label="Deception Likelihood" 
        value={`${(score * 100).toFixed(0)}%`} 
        variant={score > 0.7 ? 'danger' : score > 0.4 ? 'warning' : 'success'}
      />
      
      {indicators.length > 0 && (
        <>
          <SectionSubheader>Detected Indicators</SectionSubheader>
          <InsightList items={indicators} variant={score > 0.5 ? 'warning' : 'default'} />
        </>
      )}
    </div>
  );
}

// Strategic Action Plans
function ActionPlans({ data }: { data: ExtendedDossierData }) {
  const plans = data.actionPlansData || [];
  if (plans.length === 0) return <p className="text-muted-foreground">No action plans data</p>;

  return (
    <div className="space-y-3">
      {plans.slice(0, 5).map((plan: any, i: number) => (
        <DataBox key={i} variant="info">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="font-medium">{plan.title || 'Action Plan'}</h5>
              <p className="text-sm text-muted-foreground">{plan.description || plan.suggested_action}</p>
            </div>
            <Badge variant={plan.status === 'completed' ? 'default' : 'secondary'}>
              {plan.status || 'pending'}
            </Badge>
          </div>
        </DataBox>
      ))}
    </div>
  );
}

export const IntelligenceSections = {
  PsychologicalProfile,
  QuantumCognition,
  Relationship,
  Playbook,
  HypnoticPatterns,
  Elicitation,
  CognitiveLoad,
  MediaIntel,
  VoiceIntel,
  DeceptionAnalysis,
  ActionPlans,
};
