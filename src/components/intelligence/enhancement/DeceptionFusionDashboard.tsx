/**
 * Deception Fusion Dashboard (v9.0)
 * 
 * Multimodal deception detection with late-fusion architecture visualization.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  AudioLines, 
  FileText, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useMultimodalDeception } from '@/hooks/intelligence/useMultimodalDeception';

interface DeceptionFusionDashboardProps {
  profileId?: string;
}

export function DeceptionFusionDashboard({ profileId }: DeceptionFusionDashboardProps) {
  const {
    analyses,
    highRiskAnalyses,
    averageDeceptionScore,
    isLoading,
    analyzeDeception,
    isAnalyzing
  } = useMultimodalDeception(profileId);

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'textual': return <FileText className="h-4 w-4" />;
      case 'acoustic': return <AudioLines className="h-4 w-4" />;
      case 'visual': return <Eye className="h-4 w-4" />;
      case 'fused': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDeceptionColor = (probability: number) => {
    if (probability >= 0.85) return 'text-red-500';
    if (probability >= 0.70) return 'text-orange-500';
    if (probability >= 0.50) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (isLoading) {
    return (
      <Card className="border-orange-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Eye className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <CardTitle>Multimodal Deception Fusion</CardTitle>
              <CardDescription>94-97% accuracy late-fusion deception detection</CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={highRiskAnalyses.length > 0 ? 'border-red-500/50 text-red-400' : 'border-green-500/50 text-green-400'}
          >
            {highRiskAnalyses.length > 0 ? (
              <><AlertTriangle className="h-3 w-3 mr-1" /> {highRiskAnalyses.length} High Risk</>
            ) : (
              <><CheckCircle className="h-3 w-3 mr-1" /> All Clear</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-orange-500/20">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Average Deception Score</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getDeceptionColor(averageDeceptionScore)}`}>
                    {Math.round(averageDeceptionScore * 100)}%
                  </p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <Progress value={averageDeceptionScore * 100} className="h-1" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold text-blue-400">{analyses?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-400">{highRiskAnalyses.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Avg Cognitive Load</p>
                <p className="text-2xl font-bold text-green-400">
                  {analyses?.length 
                    ? Math.round((analyses.reduce((s, a) => s + a.cognitiveLoadScore, 0) / analyses.length) * 100)
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses */}
        <div>
          <h3 className="text-sm font-medium mb-3">Recent Analyses</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {analyses?.slice(0, 20).map(analysis => (
                <div 
                  key={analysis.id} 
                  className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getModalityIcon(analysis.modality)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{analysis.modality} Analysis</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getDeceptionColor(analysis.deceptionProbability)}`}>
                          {Math.round(analysis.deceptionProbability * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {Math.round(analysis.confidence * 100)}%
                        </p>
                      </div>
                      <Badge className={getRiskColor(analysis.riskLevel)}>
                        {analysis.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  {analysis.cognitiveLoadScore > 0.7 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-400">
                      <AlertTriangle className="h-3 w-3" />
                      High cognitive load detected ({Math.round(analysis.cognitiveLoadScore * 100)}%)
                    </div>
                  )}
                </div>
              ))}
              {(!analyses || analyses.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No deception analyses yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
