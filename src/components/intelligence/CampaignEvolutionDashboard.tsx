import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dna, 
  TrendingUp, 
  Shield, 
  Swords,
  RefreshCw,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap
} from "lucide-react";
import { useCampaignEvolution } from "@/hooks/intelligence/useCampaignEvolution";

interface CampaignEvolutionDashboardProps {
  profileId?: string;
}

export function CampaignEvolutionDashboard({ profileId }: CampaignEvolutionDashboardProps) {
  const [activeTab, setActiveTab] = useState("genomes");
  const { 
    genomes, 
    evolutions, 
    counterOps, 
    isLoading, 
    evolveGenome,
    detectCounterOps 
  } = useCampaignEvolution(profileId);

  const getFitnessColor = (fitness: number) => {
    if (fitness >= 0.8) return "text-green-500";
    if (fitness >= 0.6) return "text-yellow-500";
    if (fitness >= 0.4) return "text-orange-500";
    return "text-red-500";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-4 w-4 text-green-500" />;
      case "paused": return <Pause className="h-4 w-4 text-yellow-500" />;
      case "evolved": return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "terminated": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Campaign Evolution Engine</h2>
            <p className="text-sm text-muted-foreground">
              Genetic algorithm optimization • Self-evolving strategies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => detectCounterOps()}
            disabled={isLoading}
          >
            <Shield className="h-4 w-4 mr-2" />
            Scan for Counter-Ops
          </Button>
        </div>
      </div>

      {/* Counter-Ops Alert */}
      {counterOps.filter(op => op.threat_level === 'critical').length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-500">Active Counter-Operations Detected</p>
                <p className="text-sm text-muted-foreground">
                  {counterOps.filter(op => op.threat_level === 'critical').length} adversarial 
                  campaigns targeting your influence operations
                </p>
              </div>
              <Button variant="destructive" size="sm" className="ml-auto">
                Neutralize
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="genomes" className="flex items-center gap-2">
            <Dna className="h-4 w-4" />
            Campaign Genomes
          </TabsTrigger>
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolution History
          </TabsTrigger>
          <TabsTrigger value="counter-ops" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Counter-Operations
            {counterOps.length > 0 && (
              <Badge variant="destructive" className="ml-1">{counterOps.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genomes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {genomes.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Dna className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No campaign genomes created yet</p>
                  <p className="text-sm">Create a campaign to start evolution</p>
                </CardContent>
              </Card>
            ) : (
              genomes.map((genome) => (
                <Card key={genome.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{genome.genome_name}</CardTitle>
                      {getStatusIcon(genome.status || 'active')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Fitness Score</span>
                          <span className={`font-bold ${getFitnessColor(genome.fitness_score)}`}>
                            {Math.round(genome.fitness_score * 100)}%
                          </span>
                        </div>
                        <Progress value={genome.fitness_score * 100} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Generation:</span>
                          <span className="ml-1 font-medium">{genome.generation}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mutations:</span>
                          <span className="ml-1 font-medium">{genome.mutation_count}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(genome.active_traits as string[] || []).slice(0, 3).map((trait, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                        {(genome.active_traits as string[] || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(genome.active_traits as string[]).length - 3}
                          </Badge>
                        )}
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => evolveGenome(genome.id)}
                        disabled={isLoading}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Evolve to Gen {genome.generation + 1}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="evolution" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolution Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {evolutions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No evolution history yet</p>
                    </div>
                  ) : (
                    evolutions.map((evolution) => (
                      <div 
                        key={evolution.id}
                        className="p-4 rounded-lg bg-muted/30 border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Gen {evolution.generation}</Badge>
                            <span className="text-sm font-medium">
                              Fitness: {Math.round(evolution.fitness_score * 100)}%
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {evolution.evolved_at && new Date(evolution.evolved_at).toLocaleDateString()}
                          </span>
                        </div>
                        {evolution.winning_traits && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(evolution.winning_traits as string[]).map((trait, i) => (
                              <Badge key={i} className="text-xs bg-green-500/20 text-green-500">
                                ✓ {trait}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counter-ops" className="mt-6">
          <div className="space-y-4">
            {counterOps.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No counter-operations detected</p>
                  <p className="text-sm">Your influence operations appear secure</p>
                </CardContent>
              </Card>
            ) : (
              counterOps.map((op) => (
                <Card 
                  key={op.id}
                  className={`${
                    op.threat_level === 'critical' 
                      ? 'border-red-500/50' 
                      : op.threat_level === 'high'
                      ? 'border-orange-500/50'
                      : 'border-yellow-500/50'
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Swords className={`h-5 w-5 ${
                            op.threat_level === 'critical' ? 'text-red-500' : 
                            op.threat_level === 'high' ? 'text-orange-500' : 'text-yellow-500'
                          }`} />
                          <Badge 
                            variant={op.threat_level === 'critical' ? 'destructive' : 'outline'}
                            className="capitalize"
                          >
                            {op.threat_level} Threat
                          </Badge>
                          <Badge variant="secondary">{op.operation_type}</Badge>
                        </div>
                        <p className="font-medium">{op.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Source: {op.source_identifier || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Investigate
                        </Button>
                        <Button variant="destructive" size="sm">
                          Counter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{genomes.length}</p>
              <p className="text-sm text-muted-foreground">Active Genomes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">
                {genomes.reduce((acc, g) => acc + g.generation, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Generations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {genomes.length > 0 
                  ? Math.round(genomes.reduce((acc, g) => acc + g.fitness_score, 0) / genomes.length * 100)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Fitness</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{counterOps.length}</p>
              <p className="text-sm text-muted-foreground">Counter-Ops</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
