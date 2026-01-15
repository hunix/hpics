/**
 * Universal Data Fusion Hub
 * AGIS Phase 4 - Ultimate Dominion
 * Centralizes 25+ data sources into unified vulnerability scoring
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Layers, Brain, Activity, Eye, MessageSquare, DollarSign,
  MapPin, Users, Smartphone, Heart, Shield, Target,
  Fingerprint, Volume2, FileText, Calendar, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Zap, Network
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UniversalDataFusionHubProps {
  profileId: string;
}

const DATA_SOURCES = [
  // Biometrics
  { id: 'voice', category: 'biometrics', label: 'Voice Analysis', icon: Volume2, connected: true, dataPoints: 847 },
  { id: 'face', category: 'biometrics', label: 'Facial Recognition', icon: Eye, connected: true, dataPoints: 1234 },
  { id: 'gait', category: 'biometrics', label: 'Gait Analysis', icon: Activity, connected: false, dataPoints: 0 },
  { id: 'typing', category: 'biometrics', label: 'Keystroke Dynamics', icon: Fingerprint, connected: true, dataPoints: 2341 },
  { id: 'hrv', category: 'biometrics', label: 'HRV/Stress', icon: Heart, connected: false, dataPoints: 0 },
  
  // Communications
  { id: 'messages', category: 'communications', label: 'Text Messages', icon: MessageSquare, connected: true, dataPoints: 15678 },
  { id: 'calls', category: 'communications', label: 'Phone Calls', icon: Smartphone, connected: true, dataPoints: 234 },
  { id: 'emails', category: 'communications', label: 'Emails', icon: FileText, connected: true, dataPoints: 4521 },
  { id: 'social', category: 'communications', label: 'Social Media', icon: Users, connected: true, dataPoints: 8923 },
  
  // Intelligence
  { id: 'psychology', category: 'intelligence', label: 'Psychology Profile', icon: Brain, connected: true, dataPoints: 156 },
  { id: 'dark_triad', category: 'intelligence', label: 'Dark Triad', icon: AlertTriangle, connected: true, dataPoints: 48 },
  { id: 'attachment', category: 'intelligence', label: 'Attachment Style', icon: Heart, connected: true, dataPoints: 32 },
  { id: 'mice', category: 'intelligence', label: 'MICE Assessment', icon: Target, connected: true, dataPoints: 24 },
  { id: 'betrayal', category: 'intelligence', label: 'Betrayal Risk', icon: Shield, connected: true, dataPoints: 18 },
  
  // Financial
  { id: 'transactions', category: 'financial', label: 'Transactions', icon: DollarSign, connected: false, dataPoints: 0 },
  { id: 'assets', category: 'financial', label: 'Asset Records', icon: FileText, connected: false, dataPoints: 0 },
  
  // Location
  { id: 'gps', category: 'location', label: 'GPS History', icon: MapPin, connected: true, dataPoints: 45678 },
  { id: 'places', category: 'location', label: 'Frequent Places', icon: MapPin, connected: true, dataPoints: 87 },
  
  // Temporal
  { id: 'calendar', category: 'temporal', label: 'Calendar Events', icon: Calendar, connected: true, dataPoints: 234 },
  { id: 'patterns', category: 'temporal', label: 'Behavioral Patterns', icon: Clock, connected: true, dataPoints: 567 },
  
  // Network
  { id: 'connections', category: 'network', label: 'Social Connections', icon: Network, connected: true, dataPoints: 342 },
  { id: 'influence', category: 'network', label: 'Influence Map', icon: Users, connected: true, dataPoints: 89 },
];

const CATEGORIES = [
  { id: 'biometrics', label: 'Biometrics', color: 'text-purple-400' },
  { id: 'communications', label: 'Communications', color: 'text-blue-400' },
  { id: 'intelligence', label: 'Intelligence', color: 'text-red-400' },
  { id: 'financial', label: 'Financial', color: 'text-green-400' },
  { id: 'location', label: 'Location', color: 'text-orange-400' },
  { id: 'temporal', label: 'Temporal', color: 'text-yellow-400' },
  { id: 'network', label: 'Network', color: 'text-cyan-400' },
];

export function UniversalDataFusionHub({ profileId }: UniversalDataFusionHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const stats = useMemo(() => {
    const connected = DATA_SOURCES.filter(s => s.connected).length;
    const total = DATA_SOURCES.length;
    const totalDataPoints = DATA_SOURCES.reduce((acc, s) => acc + s.dataPoints, 0);
    
    return {
      connected,
      total,
      completeness: Math.round((connected / total) * 100),
      totalDataPoints,
    };
  }, []);

  const vulnerabilityScore = useMemo(() => {
    // Calculate unified vulnerability score from all sources
    const baseScore = 0.72; // Would be calculated from actual data
    return baseScore;
  }, []);

  const getVulnerabilityLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Extreme', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    if (score >= 0.6) return { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
    if (score >= 0.4) return { label: 'Moderate', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    return { label: 'Low', color: 'text-green-500', bgColor: 'bg-green-500/20' };
  };

  const vulnLevel = getVulnerabilityLevel(vulnerabilityScore);

  return (
    <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-violet-400">
            <Layers className="h-5 w-5" />
            Universal Data Fusion Hub
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-violet-500/50 text-violet-400">
              {stats.connected}/{stats.total} Sources
            </Badge>
            <Badge variant="outline" className={`${vulnLevel.color} border-current`}>
              {vulnLevel.label} Vulnerability
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Unified Scores */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/30">
            <div className="text-2xl font-bold text-violet-400">{Math.round(vulnerabilityScore * 100)}%</div>
            <div className="text-xs text-muted-foreground">Unified Vulnerability</div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{stats.completeness}%</div>
            <div className="text-xs text-muted-foreground">Data Completeness</div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{(stats.totalDataPoints / 1000).toFixed(1)}K</div>
            <div className="text-xs text-muted-foreground">Data Points</div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30">
            <div className="text-2xl font-bold text-orange-400">87</div>
            <div className="text-xs text-muted-foreground">Correlations Found</div>
          </div>
        </div>

        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-muted/30">
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="mt-4">
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="outline"
                  className={`cursor-pointer ${!selectedCategory ? 'bg-violet-500/20 text-violet-400' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Badge>
                {CATEGORIES.map((cat) => (
                  <Badge 
                    key={cat.id}
                    variant="outline"
                    className={`cursor-pointer ${selectedCategory === cat.id ? 'bg-violet-500/20' : ''} ${cat.color}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>

              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-2 gap-2">
                  {DATA_SOURCES
                    .filter(s => !selectedCategory || s.category === selectedCategory)
                    .map((source, index) => (
                      <motion.div
                        key={source.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={`p-3 rounded-lg border ${
                          source.connected 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-border/30 bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <source.icon className={`h-4 w-4 ${source.connected ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">{source.label}</span>
                          </div>
                          {source.connected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {source.connected 
                            ? `${source.dataPoints.toLocaleString()} data points`
                            : 'Not connected'}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="mt-4">
            <ScrollArea className="h-[340px]">
              <div className="space-y-3">
                {[
                  { source1: 'Voice Stress', source2: 'MICE Assessment', correlation: 0.87, insight: 'High voice stress correlates with ego vulnerability' },
                  { source1: 'Location Patterns', source2: 'Social Connections', correlation: 0.72, insight: 'Isolation increasing based on location data' },
                  { source1: 'Message Sentiment', source2: 'Betrayal Risk', correlation: 0.68, insight: 'Negative sentiment spike precedes betrayal indicators' },
                  { source1: 'Financial Activity', source2: 'Stress Levels', correlation: 0.81, insight: 'Financial pressure increases psychological vulnerability' },
                  { source1: 'Sleep Patterns', source2: 'Decision Quality', correlation: 0.76, insight: 'Poor sleep windows optimal for influence' },
                  { source1: 'Social Media', source2: 'Emotional State', correlation: 0.65, insight: 'Public posts reveal internal emotional shifts' },
                ].map((corr, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg border border-border/30 bg-muted/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{corr.source1}</span>
                        <Zap className="h-3 w-3 text-yellow-400" />
                        <span className="text-sm font-medium">{corr.source2}</span>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          corr.correlation >= 0.8 ? 'text-red-400 border-red-500/50' :
                          corr.correlation >= 0.6 ? 'text-orange-400 border-orange-500/50' :
                          'text-yellow-400 border-yellow-500/50'
                        }
                      >
                        {Math.round(corr.correlation * 100)}% correlation
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{corr.insight}</p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-red-400">
                  <Target className="h-4 w-4" />
                  Critical Vulnerability Windows
                </h4>
                
                <div className="space-y-2">
                  {[
                    { window: 'Sunday evenings', reason: 'Peak loneliness + low social activity', score: 92 },
                    { window: 'Month-end', reason: 'Financial stress + payment anxiety', score: 85 },
                    { window: 'After 11 PM', reason: 'Reduced cognitive function + emotional vulnerability', score: 78 },
                  ].map((window, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div>
                        <div className="text-sm font-medium">{window.window}</div>
                        <div className="text-xs text-muted-foreground">{window.reason}</div>
                      </div>
                      <Badge variant="outline" className="text-red-400 border-red-500/50">
                        {window.score}% vulnerable
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-400" />
                  Unified Intelligence Summary
                </h4>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Cross-domain analysis reveals <span className="text-violet-400 font-medium">87 significant correlations</span> across data sources</p>
                  <p>• Primary vulnerability vector: <span className="text-red-400 font-medium">Emotional + Financial</span> combination</p>
                  <p>• Optimal influence timing: <span className="text-orange-400 font-medium">Late evening, financial stress periods</span></p>
                  <p>• Network isolation: <span className="text-yellow-400 font-medium">Increasing</span> - social connections declining 12% monthly</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
