import { useState, useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, Brain, Shield } from 'lucide-react';
import type { PsychologicalProfile } from '@/lib/psychologicalAnalysis';
import { formatTraitScore } from '@/lib/psychologicalAnalysis';
import { oceanAiEngine, type OceanScores } from '@/lib/ml/oceanAiPersonality';
import { darkTriadDetector, type DarkTriadAnalysis } from '@/lib/ml/darkTriadDetector';

interface PersonalityRadarChartProps {
  profile: PsychologicalProfile;
}

export function PersonalityRadarChart({ profile }: PersonalityRadarChartProps) {
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);
  
  const ocean = profile.personality_ocean as any;
  const darkTriad = profile.dark_triad as any;
  const valuesProfile = profile.values_profile as any;

  // Run enhanced OCEAN-AI analysis on existing data
  const enhancedOcean = useMemo(() => {
    if (!ocean) return null;
    try {
      const textSignals = [
        ocean.openness?.evidence?.join('. ') || '',
        ocean.conscientiousness?.evidence?.join('. ') || '',
        ocean.extraversion?.evidence?.join('. ') || '',
        ocean.agreeableness?.evidence?.join('. ') || '',
        ocean.neuroticism?.evidence?.join('. ') || '',
      ].filter(Boolean).join('. ');
      
      if (!textSignals) return null;
      return oceanAiEngine.assessFromText(textSignals);
    } catch (e) {
      if (e instanceof Error) console.warn('[OCEAN-AI] Enhancement failed:', e.message);
      return null;
    }
  }, [ocean]);

  // Run enhanced Dark Triad detection
  const enhancedDarkTriad = useMemo((): DarkTriadAnalysis | null => {
    if (!darkTriad) return null;
    try {
      const evidence = [
        ...(darkTriad.narcissism?.indicators || []),
        ...(darkTriad.machiavellianism?.indicators || []),
        ...(darkTriad.psychopathy?.indicators || []),
      ];
      if (evidence.length === 0) return null;
      return darkTriadDetector.analyzeText(evidence.join('. '));
    } catch (e) {
      if (e instanceof Error) console.warn('[DarkTriad] Enhancement failed:', e.message);
      return null;
    }
  }, [darkTriad]);

  if (!ocean) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No personality data available yet.</p>
        <p className="text-sm mt-1">Run a deep analysis to generate personality insights.</p>
      </div>
    );
  }

  const oceanData = [
    { trait: 'Openness', score: ocean.openness?.score || 0, enhanced: enhancedOcean?.openness || 0, fullMark: 100 },
    { trait: 'Conscientiousness', score: ocean.conscientiousness?.score || 0, enhanced: enhancedOcean?.conscientiousness || 0, fullMark: 100 },
    { trait: 'Extraversion', score: ocean.extraversion?.score || 0, enhanced: enhancedOcean?.extraversion || 0, fullMark: 100 },
    { trait: 'Agreeableness', score: ocean.agreeableness?.score || 0, enhanced: enhancedOcean?.agreeableness || 0, fullMark: 100 },
    { trait: 'Neuroticism', score: ocean.neuroticism?.score || 0, enhanced: enhancedOcean?.neuroticism || 0, fullMark: 100 },
  ];

  const traitDetails = [
    { key: 'openness', name: 'Openness', data: ocean.openness, description: 'Intellectual curiosity, creativity, and openness to new experiences' },
    { key: 'conscientiousness', name: 'Conscientiousness', data: ocean.conscientiousness, description: 'Organization, dependability, and self-discipline' },
    { key: 'extraversion', name: 'Extraversion', data: ocean.extraversion, description: 'Energy, sociability, and positive emotions' },
    { key: 'agreeableness', name: 'Agreeableness', data: ocean.agreeableness, description: 'Compassion, cooperation, and trust' },
    { key: 'neuroticism', name: 'Neuroticism', data: ocean.neuroticism, description: 'Tendency toward negative emotions and emotional instability' },
  ];

  const dtAnalysis = enhancedDarkTriad;

  return (
    <div className="space-y-4">
      {/* Enhanced Engine Badge */}
      {enhancedOcean && (
        <div className="flex items-center gap-2 p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
          <Brain className="h-4 w-4 text-violet-500" />
          <span className="text-xs text-violet-600 dark:text-violet-400">
            Enhanced with OCEAN-AI multimodal personality engine (Interspeech 2024)
          </span>
        </div>
      )}

      {/* Big Five Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={oceanData}>
            <PolarGrid stroke="hsl(var(--muted-foreground) / 0.3)" />
            <PolarAngleAxis 
              dataKey="trait" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <Radar name="AI Analysis" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
            {enhancedOcean && (
              <Radar name="OCEAN-AI" dataKey="enhanced" stroke="hsl(270, 70%, 60%)" fill="hsl(270, 70%, 60%)" fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" />
            )}
            {enhancedOcean && <Legend />}
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
                  {enhancedOcean && (
                    <Badge variant="secondary" className="text-xs bg-violet-500/10 text-violet-600">
                      OCEAN-AI: {(enhancedOcean as any)[trait.key]?.toFixed(0) || '?'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{trait.data?.confidence || 0}% conf</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedTrait === trait.key ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-3">
                <p className="text-xs text-muted-foreground">{trait.description}</p>
                {trait.data?.sub_facets && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium">Sub-facets:</span>
                    {Object.entries(trait.data.sub_facets).map(([facetKey, facet]: [string, any]) => (
                      <div key={facetKey} className="flex items-center gap-2 text-xs">
                        <span className="w-28 text-muted-foreground capitalize">{facetKey.replace(/_/g, ' ')}</span>
                        <Progress value={facet.score || 0} className="flex-1 h-1.5" />
                        <span className="w-6 text-right">{facet.score || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Enhanced Dark Triad */}
      {(darkTriad || dtAnalysis) && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-medium">Dark Triad Indicators</h4>
            {dtAnalysis && (
              <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600">
                <Shield className="h-3 w-3 mr-1" />
                BERT-Enhanced
              </Badge>
            )}
            <Badge 
              variant={
                (dtAnalysis?.riskLevel || darkTriad?.overall_risk_level) === 'low' ? 'outline' :
                (dtAnalysis?.riskLevel || darkTriad?.overall_risk_level) === 'moderate' ? 'secondary' :
                'destructive'
              }
              className="text-xs"
            >
              {dtAnalysis?.riskLevel || darkTriad?.overall_risk_level || 'unknown'} risk
            </Badge>
          </div>
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            {['narcissism', 'machiavellianism', 'psychopathy'].map((trait) => {
              const legacyData = darkTriad?.[trait];
              const enhancedData = dtAnalysis?.scores?.[trait as keyof typeof dtAnalysis.scores];
              const score = enhancedData || legacyData?.score || 0;
              const indicators = dtAnalysis?.indicators?.[trait as keyof typeof dtAnalysis.indicators] || legacyData?.indicators || [];
              
              return (
                <div key={trait} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{trait}</span>
                    <span className="text-muted-foreground">{typeof score === 'number' ? score.toFixed(0) : score}/100</span>
                  </div>
                  <Progress value={typeof score === 'number' ? score : 0} className="h-1.5" />
                  {indicators?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {Array.isArray(indicators) ? indicators[0] : ''}
                    </p>
                  )}
                </div>
              );
            })}
            
            {/* Enhanced manipulation risk */}
            {dtAnalysis && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Manipulation Risk</span>
                  <Badge variant={dtAnalysis.manipulationRisk > 60 ? 'destructive' : 'outline'} className="text-xs">
                    {dtAnalysis.manipulationRisk.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Values Profile Summary */}
      {valuesProfile?.core_values_summary?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Core Values</h4>
          <div className="flex flex-wrap gap-1.5">
            {valuesProfile.core_values_summary.slice(0, 6).map((value: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">{value}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}