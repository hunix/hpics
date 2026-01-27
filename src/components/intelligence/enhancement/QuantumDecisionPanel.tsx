/**
 * Quantum Decision Panel (v9.0)
 * 
 * Quantum-like cognition modeling and mental entanglement detection.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Atom, 
  Waves, 
  Link2, 
  Sparkles,
  Loader2,
  Zap,
  Target
} from 'lucide-react';
import { useQuantumCognition } from '@/hooks/intelligence/useQuantumCognition';

interface QuantumDecisionPanelProps {
  profileId?: string;
}

export function QuantumDecisionPanel({ profileId }: QuantumDecisionPanelProps) {
  const {
    decisionStates,
    superpositions,
    entanglements,
    strongEntanglements,
    quantumLikeDeciders,
    isLoading,
    modelQuantumState,
    detectEntanglement,
    isModeling,
    isDetectingEntanglement
  } = useQuantumCognition(profileId);

  if (isLoading) {
    return (
      <Card className="border-violet-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/20 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Atom className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <CardTitle>Quantum Decision Modeling</CardTitle>
              <CardDescription>Non-classical decision patterns & mental entanglement</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-violet-500/50 text-violet-400">
              {superpositions?.length || 0} States
            </Badge>
            <Badge variant="outline" className="border-pink-500/50 text-pink-400">
              {strongEntanglements.length} Entangled
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-violet-500/20">
            <CardContent className="pt-4 text-center">
              <Atom className="h-8 w-8 mx-auto text-violet-500/50 mb-2" />
              <p className="text-2xl font-bold text-violet-400">{superpositions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Superposition States</p>
            </CardContent>
          </Card>
          <Card className="border-pink-500/20">
            <CardContent className="pt-4 text-center">
              <Link2 className="h-8 w-8 mx-auto text-pink-500/50 mb-2" />
              <p className="text-2xl font-bold text-pink-400">{entanglements?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Entanglements</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="pt-4 text-center">
              <Waves className="h-8 w-8 mx-auto text-blue-500/50 mb-2" />
              <p className="text-2xl font-bold text-blue-400">{quantumLikeDeciders.length}</p>
              <p className="text-xs text-muted-foreground">Interference Effects</p>
            </CardContent>
          </Card>
        </div>

        {/* Quantum States */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Quantum Decision States</h3>
            <Button 
              size="sm"
              variant="outline"
              disabled={!profileId || isModeling}
              onClick={() => profileId && modelQuantumState({ 
                profileId, 
                decisionContext: 'general_analysis' 
              })}
            >
              {isModeling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4 mr-1" />}
              Model
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {superpositions?.map((state: { id: string; analysisType: string; collapseProbability: number; quantumSignature: string }) => (
                <div 
                  key={state.id}
                  className="p-3 rounded-lg border border-violet-500/20 bg-violet-950/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      <span className="font-medium capitalize">{state.analysisType}</span>
                    </div>
                    <Badge variant="outline" className="border-violet-500/30">
                      Collapse: {Math.round(state.collapseProbability * 100)}%
                    </Badge>
                  </div>
                  {state.quantumSignature && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Signature: {state.quantumSignature}
                    </p>
                  )}
                </div>
              ))}
              {(!superpositions || superpositions.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Atom className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No quantum states modeled</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Entanglements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Mental Entanglements</h3>
            <Button 
              size="sm"
              variant="ghost"
              disabled={isDetectingEntanglement}
              onClick={() => detectEntanglement({ profileIds: [] })}
            >
              {isDetectingEntanglement ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Detect'}
            </Button>
          </div>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {entanglements?.map(ent => (
                <div 
                  key={ent.id}
                  className="p-3 rounded-lg border border-pink-500/20 bg-pink-950/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-pink-400" />
                      <span className="text-sm">
                        {ent.profileIds.length} profiles entangled
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={ent.bellInequalityViolation > 2 
                          ? 'border-red-500/30 text-red-400' 
                          : 'border-pink-500/30 text-pink-400'
                        }
                      >
                        Bell: {ent.bellInequalityViolation.toFixed(2)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Correlation: {Math.round(ent.correlationStrength * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!entanglements || entanglements.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Link2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No entanglements detected</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
