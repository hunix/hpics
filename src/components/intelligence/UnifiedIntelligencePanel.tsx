import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Shield, Target, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Minus, Eye, Mic, Activity,
  User, Zap, Heart, Clock, MessageSquare, Sparkles
} from 'lucide-react';

interface UnifiedIntelligencePanelProps {
  profileId: string;
  contactName: string;
}

export function UnifiedIntelligencePanel({ profileId, contactName }: UnifiedIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState('summary');

  // Fetch psychological profile
  const { data: psychProfile } = useQuery({
    queryKey: ['psych-profile', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'psychological')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch influence profile
  const { data: influenceProfile } = useQuery({
    queryKey: ['influence-profile', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_influence_profiles')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();
      return data;
    },
  });

  // Fetch trust assessment
  const { data: trustData } = useQuery({
    queryKey: ['trust-assessment', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('trust_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .order('assessed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch behavioral baseline
  const { data: baseline } = useQuery({
    queryKey: ['behavioral-baseline', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('behavioral_baselines')
        .select('*')
        .eq('profile_id', profileId)
        .order('last_calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch biometrics summary
  const { data: biometrics } = useQuery({
    queryKey: ['biometrics-summary', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_biometrics')
        .select('facial_confidence, voice_confidence, signature_strength, identity_confidence')
        .eq('profile_id', profileId)
        .maybeSingle();
      return data;
    },
  });

  // Fetch relationship score
  const { data: relationshipScore } = useQuery({
    queryKey: ['relationship-score', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('relationship_scores')
        .select('*')
        .eq('profile_id', profileId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch AI recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['ai-recommendations', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('influence_actions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const psychResult = psychProfile?.result as any;
  const overallScore = relationshipScore?.overall_score || 0;
  const trustScore = trustData?.overall_trust_score || 0;
  
  // Calculate influence score from susceptibility factors
  const influenceScore = influenceProfile 
    ? Math.round(
        ((influenceProfile.authority_susceptibility || 0) +
        (influenceProfile.social_proof_susceptibility || 0) +
        (influenceProfile.liking_susceptibility || 0) +
        (influenceProfile.scarcity_susceptibility || 0) +
        (influenceProfile.commitment_consistency_susceptibility || 0) +
        (influenceProfile.reciprocity_susceptibility || 0)) / 6
      )
    : 0;

  // Calculate health status from score
  const healthStatus = overallScore >= 70 ? 'healthy' : overallScore >= 40 ? 'at_risk' : overallScore >= 20 ? 'declining' : 'critical';

  const getHealthColor = (status: string | null) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'growing': return 'text-green-500';
      case 'stable': return 'text-blue-500';
      case 'at_risk': return 'text-yellow-500';
      case 'declining': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthIcon = (status: string | null) => {
    switch (status) {
      case 'healthy':
      case 'growing':
        return <TrendingUp className="h-4 w-4" />;
      case 'stable':
        return <Minus className="h-4 w-4" />;
      case 'at_risk':
      case 'declining':
        return <TrendingDown className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Unified Intelligence Profile
        </CardTitle>
        <CardDescription>
          Complete AI-powered analysis of {contactName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="psychology">Psychology</TabsTrigger>
            <TabsTrigger value="influence">Influence</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 mt-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-primary">{overallScore}</div>
                <div className="text-xs text-muted-foreground">Relationship Score</div>
                <div className={`flex items-center justify-center gap-1 mt-1 ${getHealthColor(healthStatus)}`}>
                  {getHealthIcon(healthStatus)}
                  <span className="text-xs capitalize">{healthStatus}</span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-blue-500">{trustScore}</div>
                <div className="text-xs text-muted-foreground">Trust Score</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Shield className="h-3 w-3" />
                  <span className="text-xs">{trustData?.verification_status || 'Not assessed'}</span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-yellow-500">{influenceScore}</div>
                <div className="text-xs text-muted-foreground">Influence Score</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Zap className="h-3 w-3" />
                  <span className="text-xs capitalize">{influenceProfile?.attention_span || 'Unknown'}</span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-purple-500">
                  {biometrics?.identity_confidence || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Identity Confidence</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  <span className="text-xs">Biometric</span>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  Personality Traits
                </h4>
                {psychResult?.personality_traits ? (
                  <div className="flex flex-wrap gap-1">
                    {(psychResult.personality_traits as string[]).slice(0, 5).map((trait, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No psychological analysis yet</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  Influence Susceptibility
                </h4>
                {influenceProfile ? (
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      Authority: {influenceProfile.authority_susceptibility || 0}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Social: {influenceProfile.social_proof_susceptibility || 0}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Liking: {influenceProfile.liking_susceptibility || 0}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Scarcity: {influenceProfile.scarcity_susceptibility || 0}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No influence profile yet</p>
                )}
              </div>
            </div>

            {/* Biometric Verification */}
            {biometrics && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-400" />
                  Biometric Verification
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Progress value={biometrics.facial_confidence || 0} className="h-2" />
                    </div>
                    <span className="text-xs">{biometrics.facial_confidence || 0}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Progress value={biometrics.voice_confidence || 0} className="h-2" />
                    </div>
                    <span className="text-xs">{biometrics.voice_confidence || 0}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Progress value={biometrics.signature_strength || 0} className="h-2" />
                    </div>
                    <span className="text-xs">{biometrics.signature_strength || 0}%</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="psychology" className="space-y-4 mt-4">
            {psychResult ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {psychResult.summary && (
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{psychResult.summary}</p>
                    </div>
                  )}

                  {psychResult.communication_style && (
                    <div>
                      <h4 className="font-medium mb-2">Communication Style</h4>
                      <Badge variant="outline">{psychResult.communication_style}</Badge>
                    </div>
                  )}

                  {psychResult.decision_making_style && (
                    <div>
                      <h4 className="font-medium mb-2">Decision Making</h4>
                      <Badge variant="outline">{psychResult.decision_making_style}</Badge>
                    </div>
                  )}

                  {psychResult.emotional_patterns && (
                    <div>
                      <h4 className="font-medium mb-2">Emotional Patterns</h4>
                      <div className="flex flex-wrap gap-1">
                        {(psychResult.emotional_patterns as string[]).map((pattern, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {psychResult.recommendations && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        AI Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {(psychResult.recommendations as string[]).map((rec, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No psychological analysis available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Run a deep analysis to generate psychological insights
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="influence" className="space-y-4 mt-4">
            {influenceProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Attention Span</div>
                    <div className="text-lg font-medium capitalize mt-1">
                      {influenceProfile.attention_span || 'Unknown'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Reciprocity Susceptibility</div>
                    <div className="text-lg font-medium mt-1">
                      {influenceProfile.reciprocity_susceptibility || 0}%
                    </div>
                  </div>
                </div>

                {influenceProfile.power_words && (influenceProfile.power_words as string[]).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Power Words</h4>
                    <div className="flex flex-wrap gap-1">
                      {(influenceProfile.power_words as string[]).map((word, i) => (
                        <Badge key={i} className="bg-green-100 text-green-700">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {influenceProfile.avoid_words && (influenceProfile.avoid_words as string[]).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Words to Avoid</h4>
                    <div className="flex flex-wrap gap-1">
                      {(influenceProfile.avoid_words as string[]).map((word, i) => (
                        <Badge key={i} variant="destructive" className="bg-red-100 text-red-700">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {influenceProfile.channel_preferences && (
                  <div>
                    <h4 className="font-medium mb-2">Channel Preferences</h4>
                    <p className="text-sm text-muted-foreground">
                      {typeof influenceProfile.channel_preferences === 'object' 
                        ? JSON.stringify(influenceProfile.channel_preferences) 
                        : String(influenceProfile.channel_preferences)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No influence profile available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate an influence analysis to see profile
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-4">
            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((action: any) => (
                  <div key={action.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium">{action.action_type}</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {action.priority}
                      </Badge>
                    </div>
                    {action.suggested_timing && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Suggested: {new Date(action.suggested_timing).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending actions</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI will suggest actions based on relationship analysis
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
