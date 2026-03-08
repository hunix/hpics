import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Sparkles, Shield, Target, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RomanticIntelligencePanelProps {
  profileId: string;
  profileName?: string;
}

interface AttachmentStyle {
  primary: string;
  secondary?: string;
  security: number;
  anxiety: number;
  avoidance: number;
}

interface LoveLanguage {
  language: string;
  intensity: number;
  expression: string;
}

interface RomanticAnalysis {
  attachmentProfile: AttachmentStyle;
  loveLanguages: LoveLanguage[];
  romanticCompatibility: {
    overallScore: number;
    strengthAreas: string[];
    challengeAreas: string[];
  };
  courtshipPatterns: {
    preferredPace: string;
    communicationStyle: string;
    romanticGestures: string[];
  };
  commitmentReadiness: {
    score: number;
    timeline: string;
    blockers: string[];
  };
  relationshipRisks: {
    jealousyRisk: number;
    conflictStyle: string;
    dealBreakers: string[];
  };
}

export function RomanticIntelligencePanel({ profileId, profileName }: RomanticIntelligencePanelProps) {
  const [analysis, setAnalysis] = useState<RomanticAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('analyze-romantic-intelligence', {
        body: { profileId, userId: user.id, depth: 'deep' }
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      toast.success('Romantic intelligence analysis complete');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getAttachmentColor = (style: string) => {
    const colors: Record<string, string> = {
      'secure': 'bg-green-500',
      'anxious': 'bg-amber-500',
      'avoidant': 'bg-blue-500',
      'fearful-avoidant': 'bg-red-500'
    };
    return colors[style.toLowerCase()] || 'bg-muted';
  };

  return (
    <Card className="border-pink-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-pink-500" />
            Romantic Intelligence
          </CardTitle>
          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-rose-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analyze
          </Button>
        </div>
        {profileName && <p className="text-sm text-muted-foreground">Analysis for {profileName}</p>}
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Run romantic intelligence analysis to reveal attachment styles, love languages, and compatibility insights.</p>
          </div>
        ) : (
          <Tabs defaultValue="attachment" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="attachment">Attachment</TabsTrigger>
              <TabsTrigger value="languages">Love Languages</TabsTrigger>
              <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
            </TabsList>

            <TabsContent value="attachment" className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Badge className={`${getAttachmentColor(analysis.attachmentProfile.primary)} text-white`}>
                  {analysis.attachmentProfile.primary}
                </Badge>
                {analysis.attachmentProfile.secondary && (
                  <Badge variant="outline">{analysis.attachmentProfile.secondary}</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Security</span>
                    <span>{analysis.attachmentProfile.security}%</span>
                  </div>
                  <Progress value={analysis.attachmentProfile.security} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Anxiety</span>
                    <span>{analysis.attachmentProfile.anxiety}%</span>
                  </div>
                  <Progress value={analysis.attachmentProfile.anxiety} className="h-2 [&>div]:bg-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Avoidance</span>
                    <span>{analysis.attachmentProfile.avoidance}%</span>
                  </div>
                  <Progress value={analysis.attachmentProfile.avoidance} className="h-2 [&>div]:bg-blue-500" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="languages" className="space-y-3 mt-4">
              {analysis.loveLanguages.map((lang, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{lang.language}</span>
                    <Badge variant="secondary">{lang.intensity}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{lang.expression}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="compatibility" className="space-y-4 mt-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10">
                <div className="text-4xl font-bold text-pink-500">
                  {analysis.romanticCompatibility.overallScore}%
                </div>
                <p className="text-sm text-muted-foreground">Compatibility Score</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" /> Strengths
                  </h4>
                  {analysis.romanticCompatibility.strengthAreas.map((s, i) => (
                    <Badge key={i} variant="outline" className="mr-1 mb-1">{s}</Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Challenges
                  </h4>
                  {analysis.romanticCompatibility.challengeAreas.map((c, i) => (
                    <Badge key={i} variant="outline" className="mr-1 mb-1">{c}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Jealousy Risk</span>
                  <Badge variant={analysis.relationshipRisks.jealousyRisk > 70 ? 'destructive' : 'secondary'}>
                    {analysis.relationshipRisks.jealousyRisk}%
                  </Badge>
                </div>
                <Progress 
                  value={analysis.relationshipRisks.jealousyRisk} 
                  className="h-2 [&>div]:bg-red-500" 
                />
              </div>
              
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Conflict Style</h4>
                <p className="text-sm text-muted-foreground">{analysis.relationshipRisks.conflictStyle}</p>
              </div>

              {analysis.relationshipRisks.dealBreakers.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" /> Deal Breakers
                  </h4>
                  <ul className="text-sm space-y-1">
                    {analysis.relationshipRisks.dealBreakers.map((db, i) => (
                      <li key={i} className="text-muted-foreground">• {db}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
