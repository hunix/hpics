import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Swords, 
  BookOpen, 
  Users, 
  AlertTriangle, 
  Heart, 
  Sparkles,
  Shield,
  Brain
} from 'lucide-react';
import {
  SemanticWarfarePanel,
  MICERecruitmentPanel,
  BetrayalRiskPanel,
  SacredValuesPanel,
  MemeticEngineeringPanel,
  SyntheticConsensusPanel,
} from '@/components/intelligence/warfare';

export default function CognitiveWarfarePage() {
  const [activeTab, setActiveTab] = useState('overview');

  const modules = [
    {
      id: 'semantic',
      name: 'Semantic Warfare',
      icon: BookOpen,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
      description: 'Control meaning through term redefinition',
    },
    {
      id: 'mice',
      name: 'MICE Analysis',
      icon: Users,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      description: 'Recruitment vulnerability assessment',
    },
    {
      id: 'betrayal',
      name: 'Betrayal Prediction',
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      description: 'Trust network and defection risk',
    },
    {
      id: 'sacred',
      name: 'Sacred Values',
      icon: Heart,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
      description: 'Non-negotiable beliefs mapping',
    },
    {
      id: 'memetic',
      name: 'Memetic Engineering',
      icon: Sparkles,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
      description: 'Viral idea propagation',
    },
    {
      id: 'consensus',
      name: 'Synthetic Consensus',
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      description: 'Manufactured agreement campaigns',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-red-500/20">
            <Swords className="h-8 w-8 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cognitive Warfare Command</h1>
            <p className="text-muted-foreground">
              AGIS Phase 3 • Information Dominance & Psychological Operations
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-violet-500/50 px-3 py-1">
          <Brain className="h-4 w-4 mr-2" />
          6 Active Modules
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 h-auto p-1">
          <TabsTrigger value="overview" className="py-2">Overview</TabsTrigger>
          {modules.map((module) => (
            <TabsTrigger key={module.id} value={module.id} className="py-2">
              <module.icon className={`h-4 w-4 mr-2 ${module.color}`} />
              <span className="hidden lg:inline">{module.name.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <Card 
                key={module.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab(module.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.bgColor}`}>
                      <module.icon className={`h-5 w-5 ${module.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-violet-500/10 border-violet-500/30">
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-violet-400" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Semantic Ops</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-amber-400" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">MICE Profiles</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-400" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Risk Alerts</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4 text-center">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Individual Module Tabs */}
        <TabsContent value="semantic">
          <SemanticWarfarePanel />
        </TabsContent>

        <TabsContent value="mice">
          <MICERecruitmentPanel />
        </TabsContent>

        <TabsContent value="betrayal">
          <BetrayalRiskPanel />
        </TabsContent>

        <TabsContent value="sacred">
          <SacredValuesPanel />
        </TabsContent>

        <TabsContent value="memetic">
          <MemeticEngineeringPanel />
        </TabsContent>

        <TabsContent value="consensus">
          <SyntheticConsensusPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
