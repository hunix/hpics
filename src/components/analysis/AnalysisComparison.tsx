import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GitCompare, Calendar, Brain, Eye, Activity, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Json } from '@/types/database-helpers';

interface AnalysisComparisonProps {
  profileId: string;
  profileName: string;
}

type AnalysisType = 'behavioral' | 'facial' | 'body_language' | 'vocal';

interface AnalysisRecord {
  id: string;
  created_at: string;
  confidence_score: number | null;
  raw_analysis: Json;
  ai_model_used: string | null;
}

export function AnalysisComparison({ profileId, profileName }: AnalysisComparisonProps) {
  const [selectedType, setSelectedType] = useState<AnalysisType>('behavioral');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const analysisTypes = [
    { id: 'behavioral' as AnalysisType, label: 'Behavioral', icon: Brain, table: 'behavioral_analyses' },
    { id: 'facial' as AnalysisType, label: 'Facial', icon: Eye, table: 'facial_analyses' },
    { id: 'body_language' as AnalysisType, label: 'Body Language', icon: Activity, table: 'body_language_analyses' },
    { id: 'vocal' as AnalysisType, label: 'Vocal', icon: Volume2, table: 'vocal_analyses' },
  ];

  const currentType = analysisTypes.find(t => t.id === selectedType)!;

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analysis-comparison', profileId, selectedType],
    queryFn: async (): Promise<AnalysisRecord[]> => {
      let query;
      switch (selectedType) {
        case 'behavioral':
          query = supabase.from('behavioral_analyses').select('id, created_at, confidence_score, raw_analysis, ai_model_used');
          break;
        case 'facial':
          query = supabase.from('facial_analyses').select('id, created_at, confidence_score, raw_analysis, ai_model_used');
          break;
        case 'body_language':
          query = supabase.from('body_language_analyses').select('id, created_at, confidence_score, raw_analysis, ai_model_used');
          break;
        case 'vocal':
          query = supabase.from('vocal_analyses').select('id, created_at, confidence_score, raw_analysis, ai_model_used');
          break;
        default:
          query = supabase.from('behavioral_analyses').select('id, created_at, confidence_score, raw_analysis, ai_model_used');
      }
      
      const { data, error } = await query
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as AnalysisRecord[];
    },
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : prev.length < 3 
          ? [...prev, id]
          : prev
    );
  };

  const selectedAnalyses = analyses?.filter(a => selectedIds.includes(a.id)) ?? [];

  const extractKeyMetrics = (analysis: AnalysisRecord): Record<string, any> => {
    const raw = analysis.raw_analysis as Record<string, any> | null;
    if (!raw) return {};
    
    // Extract common metrics based on analysis type
    switch (selectedType) {
      case 'behavioral':
        return {
          'Confidence': analysis.confidence_score,
          'Patterns': raw.behavioral_patterns?.length ?? 0,
          'Personality Indicators': raw.personality_indicators?.length ?? 0,
        };
      case 'facial':
        return {
          'Confidence': analysis.confidence_score,
          'Micro-expressions': raw.micro_expressions?.length ?? 0,
          'Stress Level': raw.stress_indicators?.overall ?? 'N/A',
        };
      case 'body_language':
        return {
          'Confidence': analysis.confidence_score,
          'Posture Score': raw.posture_analysis?.score ?? 'N/A',
          'Comfort Level': raw.comfort_indicators?.level ?? 'N/A',
        };
      case 'vocal':
        return {
          'Confidence': analysis.confidence_score,
          'Speech Patterns': raw.speech_patterns?.length ?? 0,
          'Stress Points': raw.stress_points?.length ?? 0,
        };
      default:
        return { 'Confidence': analysis.confidence_score };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Compare Analyses Over Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Selector */}
        <div className="flex flex-wrap gap-2">
          {analysisTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedType(type.id);
                setSelectedIds([]);
              }}
            >
              <type.icon className="h-4 w-4 mr-1" />
              {type.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : analyses && analyses.length > 0 ? (
          <>
            {/* Analysis List */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select up to 3 analyses to compare:</p>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIds.includes(analysis.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleSelection(analysis.id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(analysis.id)}
                        disabled={!selectedIds.includes(analysis.id) && selectedIds.length >= 3}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(analysis.created_at), 'PPp')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {analysis.confidence_score && (
                            <Badge variant="secondary">
                              {(analysis.confidence_score * 100).toFixed(0)}% confidence
                            </Badge>
                          )}
                          {analysis.ai_model_used && (
                            <Badge variant="outline" className="text-xs">
                              {analysis.ai_model_used}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Comparison View */}
            {selectedAnalyses.length >= 2 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Metric</th>
                        {selectedAnalyses.map((a) => (
                          <th key={a.id} className="text-left py-2 px-2">
                            {format(new Date(a.created_at), 'MMM d, yyyy')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(extractKeyMetrics(selectedAnalyses[0])).map((metric) => (
                        <tr key={metric} className="border-b">
                          <td className="py-2 pr-4 font-medium">{metric}</td>
                          {selectedAnalyses.map((a) => {
                            const value = extractKeyMetrics(a)[metric];
                            return (
                              <td key={a.id} className="py-2 px-2">
                                {typeof value === 'number' && value <= 1 
                                  ? `${(value * 100).toFixed(0)}%`
                                  : value ?? 'N/A'
                                }
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedAnalyses.length === 1 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select at least 2 analyses to compare
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No {currentType.label.toLowerCase()} analyses found for {profileName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
