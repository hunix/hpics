/**
 * Cult Tactics Panel
 * AGIS Phase 4 - Ultimate Dominion
 * BITE model implementation and thought control metrics
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Brain, Eye, Heart, Lock, Target,
  AlertTriangle, ChevronRight, Zap, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CultTacticsPanelProps {
  profileId: string;
}

const BITE_CATEGORIES = [
  { 
    id: 'behavior', 
    label: 'Behavior Control', 
    icon: Lock, 
    color: 'text-red-400',
    tactics: [
      'Regulate diet, sleep, and financial resources',
      'Dictate where and with whom member lives',
      'Control personal appearance (clothing, hairstyle)',
      'Impose rigid rules and regulations',
      'Instill dependency and obedience',
    ]
  },
  { 
    id: 'information', 
    label: 'Information Control', 
    icon: Eye, 
    color: 'text-blue-400',
    tactics: [
      'Restrict access to non-cult sources',
      'Compartmentalize information',
      'Discourage questions and critical thinking',
      'Generate propaganda and controlled narratives',
      'Spy on members and encourage reporting',
    ]
  },
  { 
    id: 'thought', 
    label: 'Thought Control', 
    icon: Brain, 
    color: 'text-purple-400',
    tactics: [
      'Require internalization of group doctrine',
      'Use loaded language and thought-terminating clichés',
      'Discourage analytical thinking',
      'Allow only positive thoughts about leadership',
      'Chanting, meditation, and repetitive activities',
    ]
  },
  { 
    id: 'emotional', 
    label: 'Emotional Control', 
    icon: Heart, 
    color: 'text-pink-400',
    tactics: [
      'Instill irrational fears about leaving',
      'Label emotions as selfish or wrong',
      'Use excessive praise and punishment',
      'Promote feelings of guilt and unworthiness',
      'Shunning for questioning or leaving',
    ]
  },
];

export function CultTacticsPanel({ profileId }: CultTacticsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState('behavior');

  // Simulated metrics - would come from database in production
  const biteScores = {
    behavior: 0.65,
    information: 0.72,
    thought: 0.58,
    emotional: 0.80,
  };

  const overallControl = Object.values(biteScores).reduce((a, b) => a + b, 0) / 4;

  const getControlLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Total Control', color: 'text-red-500' };
    if (score >= 0.6) return { label: 'High Control', color: 'text-orange-500' };
    if (score >= 0.4) return { label: 'Moderate Control', color: 'text-yellow-500' };
    if (score >= 0.2) return { label: 'Developing', color: 'text-blue-500' };
    return { label: 'Minimal', color: 'text-green-500' };
  };

  const controlLevel = getControlLevel(overallControl);

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Users className="h-5 w-5" />
            BITE Model Control Framework
          </CardTitle>
          <Badge variant="outline" className={`${controlLevel.color} border-current`}>
            {controlLevel.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall BITE Score */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">Total BITE Control Index</div>
              <div className="text-xs text-muted-foreground">
                Behavior, Information, Thought, Emotional Control
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {Math.round(overallControl * 100)}%
            </div>
          </div>
          <Progress value={overallControl * 100} className="h-2" />
        </div>

        {/* BITE Category Grid */}
        <div className="grid grid-cols-4 gap-2">
          {BITE_CATEGORIES.map((category) => {
            const score = biteScores[category.id as keyof typeof biteScores];
            
            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedCategory === category.id 
                    ? 'border-orange-500/50 bg-orange-500/10' 
                    : 'border-border/30 bg-muted/20 hover:bg-muted/30'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <category.icon className={`h-4 w-4 ${category.color} mb-2`} />
                <div className="text-xs font-medium mb-1">{category.id.charAt(0).toUpperCase()}</div>
                <div className="text-lg font-bold">{Math.round(score * 100)}%</div>
                <Progress value={score * 100} className="h-1 mt-1" />
              </motion.div>
            );
          })}
        </div>

        <Tabs defaultValue="tactics" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-muted/30">
            <TabsTrigger value="tactics">Active Tactics</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="resistance">Resistance</TabsTrigger>
          </TabsList>

          <TabsContent value="tactics" className="mt-4">
            <ScrollArea className="h-[280px]">
              <div className="space-y-4">
                {BITE_CATEGORIES.map((category) => (
                  <div 
                    key={category.id} 
                    className={`p-4 rounded-lg border ${
                      selectedCategory === category.id 
                        ? 'border-orange-500/30 bg-orange-500/5' 
                        : 'border-border/30 bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <category.icon className={`h-4 w-4 ${category.color}`} />
                      <span className="font-medium text-sm">{category.label}</span>
                      <Badge variant="outline" className="ml-auto">
                        {Math.round(biteScores[category.id as keyof typeof biteScores] * 100)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      {category.tactics.map((tactic, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            Math.random() > 0.3 ? 'bg-green-500' : 'bg-muted'
                          }`} />
                          <span>{tactic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="deployment" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-400" />
                  Deployment Recommendations
                </h4>
                
                <div className="space-y-2">
                  {[
                    { action: 'Increase information isolation', priority: 'high', impact: '+15% control' },
                    { action: 'Deploy thought-stopping phrases', priority: 'medium', impact: '+10% control' },
                    { action: 'Escalate guilt induction', priority: 'high', impact: '+12% control' },
                    { action: 'Tighten behavior regulations', priority: 'low', impact: '+5% control' },
                  ].map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 text-orange-400" />
                        <span className="text-sm">{rec.action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400">{rec.impact}</span>
                        <Badge 
                          variant="outline"
                          className={
                            rec.priority === 'high' ? 'text-red-400 border-red-500/50' :
                            rec.priority === 'medium' ? 'text-yellow-400 border-yellow-500/50' :
                            'text-blue-400 border-blue-500/50'
                          }
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Thought-Stopping Phrases
                </h4>
                
                <div className="space-y-2 text-sm">
                  {[
                    '"Don\'t let negativity in"',
                    '"Trust the process"',
                    '"The world doesn\'t understand"',
                    '"We\'re special/chosen"',
                    '"Doubts are attacks"',
                  ].map((phrase, index) => (
                    <div key={index} className="p-2 rounded bg-background/50 italic text-muted-foreground">
                      {phrase}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resistance" className="mt-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-400" />
                Resistance Detection
              </h4>
              
              <div className="space-y-3">
                {[
                  { behavior: 'Questioning doctrine', severity: 'low', lastDetected: '3 days ago' },
                  { behavior: 'External information seeking', severity: 'medium', lastDetected: '1 week ago' },
                  { behavior: 'Reconnection attempts', severity: 'high', lastDetected: 'Not detected' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                    <div>
                      <div className="text-sm">{item.behavior}</div>
                      <div className="text-xs text-muted-foreground">{item.lastDetected}</div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={
                        item.severity === 'high' ? 'text-red-400 border-red-500/50' :
                        item.severity === 'medium' ? 'text-yellow-400 border-yellow-500/50' :
                        'text-green-400 border-green-500/50'
                      }
                    >
                      {item.severity} risk
                    </Badge>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4 border-orange-500/30 text-orange-400"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Deploy Counter-Measures
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
