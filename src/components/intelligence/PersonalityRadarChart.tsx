import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { PsychologicalProfile } from '@/lib/psychologicalAnalysis';
import { formatTraitScore } from '@/lib/psychologicalAnalysis';

interface PersonalityRadarChartProps {
  profile: PsychologicalProfile;
}

export function PersonalityRadarChart({ profile }: PersonalityRadarChartProps) {
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);
  
  const ocean = profile.personality_ocean as any;
  const darkTriad = profile.dark_triad as any;
  const valuesProfile = profile.values_profile as any;

  if (!ocean) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No personality data available yet.</p>
        <p className="text-sm mt-1">Run a deep analysis to generate personality insights.</p>
      </div>
    );
  }

  // Prepare OCEAN data for radar chart
  const oceanData = [
    { trait: 'Openness', score: ocean.openness?.score || 0, fullMark: 100 },
    { trait: 'Conscientiousness', score: ocean.conscientiousness?.score || 0, fullMark: 100 },
    { trait: 'Extraversion', score: ocean.extraversion?.score || 0, fullMark: 100 },
    { trait: 'Agreeableness', score: ocean.agreeableness?.score || 0, fullMark: 100 },
    { trait: 'Neuroticism', score: ocean.neuroticism?.score || 0, fullMark: 100 },
  ];

  const traitDetails = [
    { 
      key: 'openness', 
      name: 'Openness', 
      data: ocean.openness,
      description: 'Intellectual curiosity, creativity, and openness to new experiences'
    },
    { 
      key: 'conscientiousness', 
      name: 'Conscientiousness', 
      data: ocean.conscientiousness,
      description: 'Organization, dependability, and self-discipline'
    },
    { 
      key: 'extraversion', 
      name: 'Extraversion', 
      data: ocean.extraversion,
      description: 'Energy, sociability, and positive emotions'
    },
    { 
      key: 'agreeableness', 
      name: 'Agreeableness', 
      data: ocean.agreeableness,
      description: 'Compassion, cooperation, and trust'
    },
    { 
      key: 'neuroticism', 
      name: 'Neuroticism', 
      data: ocean.neuroticism,
      description: 'Tendency toward negative emotions and emotional instability'
    },
  ];

  return (
    <div className="space-y-4">
      {/* Big Five Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={oceanData}>
            <PolarGrid stroke="hsl(var(--muted-foreground) / 0.3)" />
            <PolarAngleAxis 
              dataKey="trait" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Radar
              name="Personality"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Trait Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Big Five Traits</h4>
        {traitDetails.map((trait) => (
          <Collapsible
            key={trait.key}
            open={expandedTrait === trait.key}
            onOpenChange={() => setExpandedTrait(expandedTrait === trait.key ? null : trait.key)}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{trait.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {trait.data?.score || 0} - {formatTraitScore(trait.data?.score || 0)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {trait.data?.confidence || 0}% conf
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedTrait === trait.key ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-3">
                <p className="text-xs text-muted-foreground">{trait.description}</p>
                
                {/* Sub-facets */}
                {trait.data?.sub_facets && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium">Sub-facets:</span>
                    {Object.entries(trait.data.sub_facets).map(([facetKey, facet]: [string, any]) => (
                      <div key={facetKey} className="flex items-center gap-2 text-xs">
                        <span className="w-28 text-muted-foreground capitalize">
                          {facetKey.replace(/_/g, ' ')}
                        </span>
                        <Progress value={facet.score || 0} className="flex-1 h-1.5" />
                        <span className="w-6 text-right">{facet.score || 0}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Evidence */}
                {trait.data?.evidence?.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">Evidence:</span>
                    <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                      {trait.data.evidence.slice(0, 3).map((e: string, i: number) => (
                        <li key={i} className="truncate">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Dark Triad */}
      {darkTriad && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-medium">Dark Triad Indicators</h4>
            <Badge 
              variant={
                darkTriad.overall_risk_level === 'low' ? 'outline' :
                darkTriad.overall_risk_level === 'moderate' ? 'secondary' :
                'destructive'
              }
              className="text-xs"
            >
              {darkTriad.overall_risk_level} risk
            </Badge>
          </div>
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            {['narcissism', 'machiavellianism', 'psychopathy'].map((trait) => {
              const data = darkTriad[trait];
              if (!data) return null;
              return (
                <div key={trait} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{trait}</span>
                    <span className="text-muted-foreground">{data.score}/100</span>
                  </div>
                  <Progress 
                    value={data.score} 
                    className="h-1.5"
                  />
                  {data.indicators?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {data.indicators[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Values Profile Summary */}
      {valuesProfile?.core_values_summary?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Core Values</h4>
          <div className="flex flex-wrap gap-1.5">
            {valuesProfile.core_values_summary.slice(0, 6).map((value: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
