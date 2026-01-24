/**
 * Core Sections HTML Renderers (v3.9.34)
 * React components for: Executive, Source Dashboard, Overview, Behavioral DNA, Timeline, etc.
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CIALDINI_PRINCIPLES } from '@/components/reports/sections/types';
import { getAnalysisForSection, extractResult } from '@/components/reports/utils/sectionDataCheck';
import type { ExtendedDossierData } from '../utils/computeExtendedData';
import {
  MetricCard,
  MetricGrid,
  InsightList,
  KeyValueRow,
  DataBox,
  SectionSubheader,
} from './shared/DisplayComponents';

// Executive Brief
function ExecutiveBrief({ data }: { data: ExtendedDossierData }) {
  const psych = data.psychData?.[0] as Record<string, unknown> | undefined;
  const attachmentStyle = psych?.attachment_style as Record<string, unknown> | undefined;
  const riskLevel = data.totalAnomalies > 2 ? 'HIGH' : data.totalAnomalies > 0 ? 'MEDIUM' : 'LOW';
  const riskColor = riskLevel === 'HIGH' ? 'destructive' : riskLevel === 'MEDIUM' ? 'secondary' : 'default';

  const miceRaw = getAnalysisForSection(data, 'mice') || data.miceData?.[0];
  const mice = miceRaw ? extractResult(miceRaw as Record<string, unknown>) : null;

  const insights: string[] = [];
  
  if (attachmentStyle?.primary_style) {
    insights.push(`Attachment Pattern: ${attachmentStyle.primary_style} (Anxiety: ${attachmentStyle.anxiety_score || 0}%, Avoidance: ${attachmentStyle.avoidance_score || 0}%)`);
  }
  
  if (data.trustData?.[0]) {
    const trust = data.trustData[0] as Record<string, unknown>;
    insights.push(`Trust Level: ${trust.overall_trust_score || 0}% (${trust.trust_trajectory || 'stable'})`);
  }
  
  if (mice?.primary_vulnerability) {
    insights.push(`Primary MICE Vulnerability: ${mice.primary_vulnerability} (${((mice.recruitment_likelihood as number) * 100 || 0).toFixed(0)}% recruitability)`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={riskColor as any} className="text-sm px-3 py-1">
          SUBJECT CLASSIFICATION: {riskLevel} PRIORITY
        </Badge>
      </div>
      
      <SectionSubheader>Strategic Assessment</SectionSubheader>
      <InsightList items={insights} />
    </div>
  );
}

// Source Dashboard
function SourceDashboard({ data }: { data: ExtendedDossierData }) {
  const sources = [
    { label: 'Visual Media Intelligence', count: data.totalMediaAnalyzed, hasData: data.totalMediaAnalyzed > 0 },
    { label: 'Voice Pattern Analysis', count: data.totalVoiceSessions, hasData: data.totalVoiceSessions > 0 },
    { label: 'Psychological Profile', count: data.psychData?.length || 0, hasData: (data.psychData?.length || 0) > 0 },
    { label: 'MICE Assessment', count: data.miceData?.length || 0, hasData: (data.miceData?.length || 0) > 0 },
    { label: 'Influence Profile', count: data.influenceData ? 1 : 0, hasData: !!data.influenceData },
    { label: 'Behavioral DNA', count: data.behavioralDnaAnalysis ? 1 : 0, hasData: !!data.behavioralDnaAnalysis },
    { label: 'AI Analyses', count: data.allAnalyses?.length || 0, hasData: (data.allAnalyses?.length || 0) > 0 },
  ];

  return (
    <div className="space-y-4">
      <DataBox variant="info">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Intelligence Completeness</span>
          <span className={cn(
            'font-bold text-lg',
            data.intelligenceCompleteness >= 80 ? 'text-emerald-500' :
            data.intelligenceCompleteness >= 50 ? 'text-amber-500' : 'text-rose-500'
          )}>
            {data.intelligenceCompleteness}%
          </span>
        </div>
        <Progress value={data.intelligenceCompleteness} className="h-2" />
      </DataBox>
      
      <SectionSubheader>Source Breakdown</SectionSubheader>
      <div className="grid grid-cols-2 gap-2">
        {sources.map(source => (
          <div key={source.label} className="flex items-center gap-2 text-sm">
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-xs',
              source.hasData ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
            )}>
              {source.hasData ? '✓' : '○'}
            </span>
            <span>{source.label}: {source.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Contact Overview
function ContactOverview({ data }: { data: ExtendedDossierData }) {
  const profile = data.profile;
  if (!profile) return <p className="text-muted-foreground">No profile data</p>;

  return (
    <div className="space-y-3">
      <KeyValueRow label="Full Name" value={data.contactName} />
      <KeyValueRow label="Organization" value={profile.organization || 'Unknown'} />
      <KeyValueRow label="Job Title" value={profile.job_title || 'Unknown'} />
      <KeyValueRow label="Location" value={[profile.city, profile.country].filter(Boolean).join(', ') || 'Unknown'} />
      {profile.notes && (
        <DataBox variant="muted">
          <p className="text-sm">{profile.notes}</p>
        </DataBox>
      )}
    </div>
  );
}

// Behavioral DNA
function BehavioralDNA({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'behavioralDna') || data.behavioralDnaAnalysis;
  if (!rawData) return <p className="text-muted-foreground">No behavioral DNA data</p>;
  
  const dna = extractResult(rawData as Record<string, unknown>);
  
  const traits = dna.personality_traits as string[] || dna.core_traits as string[] || [];
  const patterns = dna.behavioral_patterns as string[] || [];
  const predictability = dna.predictability_score as number || dna.consistency_score as number || 0;

  return (
    <div className="space-y-4">
      {predictability > 0 && (
        <MetricCard label="Predictability Score" value={`${(predictability * 100).toFixed(0)}%`} />
      )}
      
      {traits.length > 0 && (
        <>
          <SectionSubheader>Core Personality Traits</SectionSubheader>
          <div className="flex flex-wrap gap-2">
            {traits.map((trait, i) => (
              <Badge key={i} variant="outline">{trait}</Badge>
            ))}
          </div>
        </>
      )}
      
      {patterns.length > 0 && (
        <>
          <SectionSubheader>Behavioral Patterns</SectionSubheader>
          <InsightList items={patterns} />
        </>
      )}
    </div>
  );
}

// Pattern of Life
function PatternOfLife({ data }: { data: ExtendedDossierData }) {
  const rawData = getAnalysisForSection(data, 'patternOfLife') || data.patternOfLifeData?.[0];
  if (!rawData) return <p className="text-muted-foreground">No pattern of life data</p>;
  
  const pol = extractResult(rawData as Record<string, unknown>);
  
  const routines = pol.daily_routines as string[] || pol.patterns as string[] || [];
  const locations = pol.frequent_locations as string[] || [];

  return (
    <div className="space-y-4">
      {routines.length > 0 && (
        <>
          <SectionSubheader>Daily Routines</SectionSubheader>
          <InsightList items={routines} />
        </>
      )}
      
      {locations.length > 0 && (
        <>
          <SectionSubheader>Frequent Locations</SectionSubheader>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc, i) => (
              <Badge key={i} variant="secondary">{loc}</Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Relationship Ecosystem
function RelationshipEcosystem({ data }: { data: ExtendedDossierData }) {
  const relationships = data.relationshipsData || [];
  if (relationships.length === 0) return <p className="text-muted-foreground">No relationship data</p>;

  return (
    <div className="space-y-3">
      <MetricCard label="Total Relationships" value={relationships.length.toString()} />
      
      <SectionSubheader>Key Connections</SectionSubheader>
      <div className="space-y-2">
        {relationships.slice(0, 10).map((rel: any, i: number) => {
          const related = rel.to_profile || rel.related_profile || {};
          const name = [related.first_name, related.last_name].filter(Boolean).join(' ') || 'Unknown';
          return (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="font-medium">{name}</span>
              <Badge variant="outline">{rel.relationship_type || 'Connection'}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Timeline
function Timeline({ data }: { data: ExtendedDossierData }) {
  const comms = data.commData || [];
  const observations = data.observationsData || [];
  
  if (comms.length === 0 && observations.length === 0) {
    return <p className="text-muted-foreground">No timeline data</p>;
  }

  // Combine and sort by date
  const timelineItems = [
    ...comms.map((c: any) => ({ type: 'communication', date: c.communication_date, content: c.summary || c.subject || 'Communication' })),
    ...observations.map((o: any) => ({ type: 'observation', date: o.observation_date || o.created_at, content: o.observation_text || o.content || 'Observation' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

  return (
    <div className="space-y-2">
      {timelineItems.map((item, i) => (
        <div key={i} className="flex gap-3 text-sm border-l-2 border-muted pl-3 py-2">
          <span className="text-muted-foreground whitespace-nowrap">
            {new Date(item.date).toLocaleDateString()}
          </span>
          <Badge variant={item.type === 'communication' ? 'default' : 'secondary'} className="h-5">
            {item.type}
          </Badge>
          <span className="flex-1 truncate">{item.content}</span>
        </div>
      ))}
    </div>
  );
}

export const CoreSections = {
  ExecutiveBrief,
  SourceDashboard,
  ContactOverview,
  BehavioralDNA,
  PatternOfLife,
  RelationshipEcosystem,
  Timeline,
};
