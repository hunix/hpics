/**
 * Tactical Negotiation Panel
 * FBI-inspired negotiation strategy and tactic generation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, MessageSquare, Shield, Zap, Brain,
  ChevronRight, Play, Pause, CheckCircle, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTacticalNegotiation, NegotiationTactic } from '@/hooks/intelligence/useTacticalNegotiation';

interface TacticalNegotiationPanelProps {
  profileId: string;
  profileName?: string;
}

const TACTIC_ICONS: Record<NegotiationTactic['type'], React.ReactNode> = {
  mirror: <MessageSquare className="h-4 w-4" />,
  label: <Brain className="h-4 w-4" />,
  calibrated_question: <Target className="h-4 w-4" />,
  accusation_audit: <Shield className="h-4 w-4" />,
  tactical_empathy: <Zap className="h-4 w-4" />
};

const NEGOTIATION_TYPES = [
  { value: 'salary', label: 'Salary Negotiation' },
  { value: 'contract', label: 'Contract Terms' },
  { value: 'conflict', label: 'Conflict Resolution' },
  { value: 'persuasion', label: 'Persuasion/Influence' },
  { value: 'deal', label: 'Business Deal' },
  { value: 'personal', label: 'Personal Request' }
];

export function TacticalNegotiationPanel({ profileId, profileName }: TacticalNegotiationPanelProps) {
  const {
    isAnalyzing,
    currentSession,
    sessions,
    generateStrategy,
    updateSessionStatus,
    loadSessions
  } = useTacticalNegotiation();

  const [negotiationType, setNegotiationType] = useState('');
  const [stakes, setStakes] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleGenerateStrategy = async () => {
    if (!negotiationType) return;
    
    await generateStrategy(profileId, negotiationType, {
      stakes,
      relationship
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Target className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Tactical Negotiation Engine</CardTitle>
              <p className="text-sm text-muted-foreground">
                FBI-inspired tactics for {profileName || 'contact'}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="tactics">Tactics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="space-y-4">
          {/* Strategy Generator */}
          {!currentSession ? (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Generate Negotiation Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Negotiation Type
                  </label>
                  <Select value={negotiationType} onValueChange={setNegotiationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select negotiation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEGOTIATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Stakes (optional)
                  </label>
                  <Input
                    value={stakes}
                    onChange={(e) => setStakes(e.target.value)}
                    placeholder="e.g., $50,000 raise, partnership terms"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Relationship Context (optional)
                  </label>
                  <Textarea
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Describe your relationship and history..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleGenerateStrategy}
                  disabled={!negotiationType || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>Analyzing...</>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Strategy
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Strategy Overview */}
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Active Strategy</CardTitle>
                    <Badge variant="outline" className="text-green-400 border-green-400/30">
                      {currentSession.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-1">Overall Approach</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentSession.strategy.overallStrategy}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h4 className="text-sm font-medium text-blue-400 mb-1">Opening Move</h4>
                        <p className="text-xs text-muted-foreground">
                          {currentSession.strategy.openingMove}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <h4 className="text-sm font-medium text-red-400 mb-1">Walk-Away Point</h4>
                        <p className="text-xs text-muted-foreground">
                          {currentSession.strategy.walkAwayPoint}
                        </p>
                      </div>
                    </div>

                    {/* Psychological Profile */}
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <h4 className="text-sm font-medium text-purple-400 mb-2">
                        Target's Negotiation Profile
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Style:</span>
                          <span>{currentSession.strategy.psychologicalProfile.negotiationStyle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Decision Pattern:</span>
                          <span>{currentSession.strategy.psychologicalProfile.decisionMakingPattern}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pressure Points:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentSession.strategy.psychologicalProfile.pressurePoints.map((point, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {point}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className={`p-3 rounded-lg border ${
                      currentSession.strategy.riskAssessment.level === 'high' 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : 'bg-yellow-500/10 border-yellow-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`h-4 w-4 ${
                          currentSession.strategy.riskAssessment.level === 'high' 
                            ? 'text-red-400' 
                            : 'text-yellow-400'
                        }`} />
                        <h4 className="text-sm font-medium">
                          Risk Level: {currentSession.strategy.riskAssessment.level.toUpperCase()}
                        </h4>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {currentSession.strategy.riskAssessment.factors.map((factor, i) => (
                          <li key={i}>• {factor}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSessionStatus(currentSession.id, 'active')}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSessionStatus(currentSession.id, 'completed', {
                          success: true,
                          result: 'Completed',
                          lessonsLearned: []
                        })}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="tactics" className="space-y-4">
          {currentSession?.strategy.tactics ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {currentSession.strategy.tactics.map((tactic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {TACTIC_ICONS[tactic.type]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{tactic.technique}</h4>
                              <Badge variant="outline" className="text-xs">
                                {tactic.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {tactic.timing}
                            </p>
                            <div className="p-2 rounded bg-muted/50">
                              <p className="text-xs italic">"{tactic.example}"</p>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Effectiveness:</span>
                              <Progress value={tactic.effectiveness * 100} className="h-1.5 flex-1" />
                              <span className="text-xs">{Math.round(tactic.effectiveness * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                Generate a strategy first to see recommended tactics
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Button variant="outline" onClick={() => loadSessions(profileId)} className="w-full">
            Load Session History
          </Button>
          
          <ScrollArea className="h-[350px]">
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card key={session.id} className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{session.negotiationType}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          session.status === 'completed' ? 'text-green-400' :
                          session.status === 'active' ? 'text-blue-400' :
                          'text-muted-foreground'
                        }>
                          {session.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
