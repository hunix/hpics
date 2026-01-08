import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Users, Lightbulb, Link2, Building, Globe } from 'lucide-react';

interface NetworkMetrics {
  totalContacts: number;
  industryDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  relationshipTypes: Record<string, number>;
  networkDiversity: number;
  networkResilience: number;
  growthPotential: number;
}

interface GrowthSuggestion {
  id: string;
  type: 'industry' | 'role' | 'geographic' | 'relationship';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  currentGap: number;
}

export function NetworkGrowthOptimizer() {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['network-metrics', user?.id],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, current_company, current_location');

      if (error) throw error;

      // Calculate distributions
      const industryDistribution: Record<string, number> = {};
      const geographicDistribution: Record<string, number> = {};
      const relationshipTypes: Record<string, number> = {};

      profiles?.forEach(p => {
        // Industry (using company as proxy)
        const industry = p.current_company || 'Unknown';
        industryDistribution[industry] = (industryDistribution[industry] || 0) + 1;

        // Geographic
        const location = p.current_location?.split(',')[0]?.trim() || 'Unknown';
        geographicDistribution[location] = (geographicDistribution[location] || 0) + 1;

        // Relationship type - default distribution
        const relType = 'professional';
        relationshipTypes[relType] = (relationshipTypes[relType] || 0) + 1;
      });

      // Calculate diversity score (0-100)
      const totalContacts = profiles?.length || 0;
      const uniqueIndustries = Object.keys(industryDistribution).length;
      const uniqueLocations = Object.keys(geographicDistribution).length;
      const networkDiversity = Math.min(100, (uniqueIndustries * 5 + uniqueLocations * 3));

      // Calculate resilience (based on not having too many single points of failure)
      const maxIndustryConcentration = Math.max(...Object.values(industryDistribution)) / totalContacts * 100;
      const networkResilience = Math.max(0, 100 - maxIndustryConcentration);

      // Growth potential
      const growthPotential = Math.min(100, (100 - networkDiversity) * 0.6 + (100 - networkResilience) * 0.4);

      return {
        totalContacts,
        industryDistribution,
        geographicDistribution,
        relationshipTypes,
        networkDiversity,
        networkResilience,
        growthPotential,
      } as NetworkMetrics;
    },
    enabled: !!user,
  });

  // Generate growth suggestions
  const suggestions: GrowthSuggestion[] = [];

  if (metrics) {
    // Check for missing relationship types
    const expectedTypes = ['professional', 'personal', 'mentor', 'mentee', 'investor', 'partner'];
    expectedTypes.forEach(type => {
      if (!metrics.relationshipTypes[type] || metrics.relationshipTypes[type] < 2) {
        suggestions.push({
          id: `rel-${type}`,
          type: 'relationship',
          title: `Add ${type} connections`,
          description: `You have few ${type} relationships. Diversifying strengthens your network.`,
          impact: type === 'mentor' || type === 'investor' ? 'high' : 'medium',
          currentGap: 100 - (metrics.relationshipTypes[type] || 0) * 10,
        });
      }
    });

    // Check geographic diversity
    if (Object.keys(metrics.geographicDistribution).length < 5) {
      suggestions.push({
        id: 'geo-diversity',
        type: 'geographic',
        title: 'Expand geographic reach',
        description: 'Your network is concentrated in few locations. Consider connecting with people from other regions.',
        impact: 'medium',
        currentGap: (5 - Object.keys(metrics.geographicDistribution).length) * 20,
      });
    }

    // Check industry diversity
    const topIndustry = Object.entries(metrics.industryDistribution)
      .sort((a, b) => b[1] - a[1])[0];
    if (topIndustry && topIndustry[1] / metrics.totalContacts > 0.5) {
      suggestions.push({
        id: 'industry-diversity',
        type: 'industry',
        title: 'Diversify industry connections',
        description: `${Math.round(topIndustry[1] / metrics.totalContacts * 100)}% of your contacts are in ${topIndustry[0]}. Consider branching out.`,
        impact: 'high',
        currentGap: (topIndustry[1] / metrics.totalContacts * 100) - 50,
      });
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-500/10';
      case 'medium': return 'text-amber-600 bg-amber-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Network Growth Optimizer
        </CardTitle>
        <CardDescription>
          Identify gaps and opportunities to strengthen your network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
            <TabsTrigger value="suggestions">Growth Suggestions</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total Contacts</span>
                </div>
                <div className="text-3xl font-bold">{metrics?.totalContacts || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Growth Potential</span>
                </div>
                <div className="text-3xl font-bold">{Math.round(metrics?.growthPotential || 0)}%</div>
              </div>
            </div>

            {/* Diversity Score */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Network Diversity</span>
                  <span className="text-sm text-muted-foreground">{Math.round(metrics?.networkDiversity || 0)}%</span>
                </div>
                <Progress value={metrics?.networkDiversity || 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  How varied your connections are across industries and locations
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Network Resilience</span>
                  <span className="text-sm text-muted-foreground">{Math.round(metrics?.networkResilience || 0)}%</span>
                </div>
                <Progress value={metrics?.networkResilience || 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  How protected you are from losing key connections
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-3">
            {suggestions.length > 0 ? (
              suggestions.slice(0, 5).map(suggestion => (
                <div key={suggestion.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{suggestion.title}</span>
                        <Badge className={getImpactColor(suggestion.impact)}>
                          {suggestion.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      <div className="mt-2">
                        <Progress value={100 - suggestion.currentGap} className="h-1" />
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Your network is well-optimized!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            {/* Industry Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Top Industries
              </h4>
              <div className="space-y-2">
                {metrics && Object.entries(metrics.industryDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([industry, count]) => (
                    <div key={industry} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate">{industry}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={(count / metrics.totalContacts) * 100} className="h-1" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Top Locations
              </h4>
              <div className="space-y-2">
                {metrics && Object.entries(metrics.geographicDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([location, count]) => (
                    <div key={location} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate">{location}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={(count / metrics.totalContacts) * 100} className="h-1" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
