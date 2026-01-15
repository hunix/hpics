/**
 * Network Brokerage Analysis Panel
 * Structural holes and brokerage opportunity visualization
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Network, Users, Zap, Target, TrendingUp,
  Circle, Link2, AlertCircle, ChevronRight, Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNetworkBrokerage, BrokerageOpportunity } from '@/hooks/intelligence/useNetworkBrokerage';

interface NetworkBrokeragePanelProps {
  profileId: string;
  profileName?: string;
}

const BROKERAGE_TYPES: Record<BrokerageOpportunity['type'], { label: string; description: string; color: string }> = {
  coordinator: {
    label: 'Coordinator',
    description: 'Connects people within same group',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  },
  gatekeeper: {
    label: 'Gatekeeper',
    description: 'Controls information flow into group',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  },
  representative: {
    label: 'Representative',
    description: 'Speaks for group to outsiders',
    color: 'text-green-400 bg-green-500/10 border-green-500/20'
  },
  consultant: {
    label: 'Consultant',
    description: 'Connects outsiders to each other',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  },
  liaison: {
    label: 'Liaison',
    description: 'Connects different groups',
    color: 'text-red-400 bg-red-500/10 border-red-500/20'
  }
};

export function NetworkBrokeragePanel({ profileId, profileName }: NetworkBrokeragePanelProps) {
  const {
    isAnalyzing,
    positions,
    networkOpportunities,
    analyzePosition,
    findStructuralHoles,
    getBrokerageOpportunities,
    loadPosition
  } = useNetworkBrokerage();

  const position = positions.get(profileId);

  useEffect(() => {
    loadPosition(profileId);
  }, [profileId, loadPosition]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border-violet-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Network className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Network Brokerage</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Structural analysis for {profileName || 'contact'}
                </p>
              </div>
            </div>
            
            {position && position.constraint < 0.3 && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Crown className="h-3 w-3 mr-1" />
                High Broker Potential
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {!position ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-8 text-center">
            <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Network Position Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze network position to find brokerage opportunities
            </p>
            <Button onClick={() => analyzePosition(profileId)} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Position'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="holes">Structural Holes</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="tertius">Tertius</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-violet-400">
                    {position.constraint.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Constraint</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {position.constraint < 0.3 ? '🟢 Low' : position.constraint < 0.6 ? '🟡 Med' : '🔴 High'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {position.efficiency.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Efficiency</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {position.effectiveSize.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Effective Size</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {(position.betweennessCentrality * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Betweenness</div>
                </CardContent>
              </Card>
            </div>

            {/* Centrality Metrics */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Centrality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Betweenness Centrality', value: position.betweennessCentrality, color: 'bg-violet-500' },
                  { label: 'Closeness Centrality', value: position.closenessCentrality, color: 'bg-blue-500' },
                  { label: 'Eigenvector Centrality', value: position.eigenvectorCentrality, color: 'bg-green-500' }
                ].map((metric, index) => (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span>{(metric.value * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${metric.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value * 100}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Brokerage Role Scores */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Brokerage Role Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(position.brokerageScores).map(([role, score]) => (
                    <div key={role} className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold">{(score * 100).toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground capitalize">{role}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Position Assessment */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Position Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-muted/50 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{position.positionAssessment.role}</span>
                    <div className="flex gap-4">
                      <span className="text-xs">
                        Influence: <span className="text-green-400">{Math.round(position.positionAssessment.influence * 100)}%</span>
                      </span>
                      <span className="text-xs">
                        Vulnerability: <span className="text-red-400">{Math.round(position.positionAssessment.vulnerability * 100)}%</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Recommendations:</span>
                  <ul className="mt-2 space-y-1">
                    {position.positionAssessment.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holes" className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {position.structuralHoles.map((hole, index) => (
                  <motion.div
                    key={hole.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-violet-500/10">
                            <Link2 className="h-4 w-4 text-violet-400" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{hole.betweenGroups[0]}</Badge>
                            <span className="text-muted-foreground">↔</span>
                            <Badge variant="outline">{hole.betweenGroups[1]}</Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-400">
                              {Math.round(hole.bridgePotential * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Bridge Potential</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-400">
                              {Math.round(hole.informationArbitrage * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Info Arbitrage</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-yellow-400">
                              {Math.round(hole.controlPotential * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Control Potential</div>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-xs text-primary">Strategy: </span>
                          <span className="text-xs text-muted-foreground">{hole.optimalBridgingStrategy}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => getBrokerageOpportunities()} 
              className="w-full"
            >
              Refresh Opportunities
            </Button>

            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {position.opportunities.map((opp, index) => {
                  const typeConfig = BROKERAGE_TYPES[opp.type];
                  return (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`border ${typeConfig.color}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className={typeConfig.color}>
                                {typeConfig.label}
                              </Badge>
                              <h4 className="font-medium mt-2">{opp.description}</h4>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{Math.round(opp.value * 100)}%</div>
                              <div className="text-xs text-muted-foreground">Value</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {opp.parties.map((party, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {party}
                              </Badge>
                            ))}
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="p-2 rounded bg-muted/50">
                              <span className="text-primary">Action: </span>
                              {opp.actionRequired}
                            </div>
                            <div className="p-2 rounded bg-green-500/10">
                              <span className="text-green-400">Outcome: </span>
                              {opp.potentialOutcome}
                            </div>
                          </div>

                          {opp.risks.length > 0 && (
                            <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                              <div className="flex items-center gap-1 text-red-400 text-xs mb-1">
                                <AlertCircle className="h-3 w-3" />
                                Risks
                              </div>
                              <ul className="text-xs text-muted-foreground">
                                {opp.risks.map((risk, i) => (
                                  <li key={i}>• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tertius" className="space-y-4">
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-1">Tertius Gaudens</h4>
                    <p className="text-sm text-muted-foreground">
                      "The third who benefits" - Opportunities to profit from conflicts between others.
                      Use with extreme caution and ethical consideration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {position.tertiusGaudensOpportunities.map((opp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">{opp.parties[0]}</Badge>
                          <Zap className="h-4 w-4 text-yellow-400" />
                          <Badge variant="outline">{opp.parties[1]}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="p-2 rounded bg-muted/50">
                            <span className="text-xs text-muted-foreground">Conflict: </span>
                            <span className="text-sm">{opp.conflict}</span>
                          </div>
                          <div className="p-2 rounded bg-blue-500/10">
                            <span className="text-xs text-blue-400">Strategy: </span>
                            <span className="text-sm">{opp.exploitationStrategy}</span>
                          </div>
                          <div className="p-2 rounded bg-green-500/10">
                            <span className="text-xs text-green-400">Expected Benefit: </span>
                            <span className="text-sm">{opp.expectedBenefit}</span>
                          </div>
                        </div>

                        <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                          <span className="text-xs text-red-400">Ethical Considerations:</span>
                          <ul className="text-xs text-muted-foreground mt-1">
                            {opp.ethicalConsiderations.map((consideration, i) => (
                              <li key={i}>• {consideration}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
