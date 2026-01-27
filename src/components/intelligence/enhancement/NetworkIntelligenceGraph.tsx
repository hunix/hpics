/**
 * Network Intelligence Graph (v9.0)
 * 
 * TAS-Com community detection and influence analysis visualization.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Network, 
  Users, 
  Target,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useNetworkIntelligence } from '@/hooks/intelligence/useNetworkIntelligence';

export function NetworkIntelligenceGraph() {
  const {
    networkIntel,
    allCommunities,
    covertCommunities,
    topInfluencers,
    isLoading,
    detectCommunities,
    identifyInfluencers,
    detectPropaganda,
    isDetectingCommunities,
    isIdentifyingInfluencers
  } = useNetworkIntelligence();

  if (isLoading) {
    return (
      <Card className="border-emerald-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Network className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle>Network Intelligence</CardTitle>
              <CardDescription>TAS-Com community detection & influence analysis</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              {allCommunities.length} Communities
            </Badge>
            {covertCommunities.length > 0 && (
              <Badge variant="outline" className="border-red-500/50 text-red-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {covertCommunities.length} Covert
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-emerald-500/20">
            <CardContent className="pt-4 text-center">
              <Users className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
              <p className="text-2xl font-bold text-emerald-400">{allCommunities.length}</p>
              <p className="text-xs text-muted-foreground">Communities</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20">
            <CardContent className="pt-4 text-center">
              <Target className="h-8 w-8 mx-auto text-yellow-500/50 mb-2" />
              <p className="text-2xl font-bold text-yellow-400">{topInfluencers.length}</p>
              <p className="text-xs text-muted-foreground">Top Influencers</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardContent className="pt-4 text-center">
              <Eye className="h-8 w-8 mx-auto text-red-500/50 mb-2" />
              <p className="text-2xl font-bold text-red-400">{covertCommunities.length}</p>
              <p className="text-xs text-muted-foreground">Covert Cells</p>
            </CardContent>
          </Card>
        </div>

        {/* Communities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Detected Communities</h3>
            <Button 
              size="sm"
              variant="outline"
              disabled={isDetectingCommunities}
              onClick={() => detectCommunities({ networkId: 'default', algorithm: 'TAS-Com' })}
            >
              {isDetectingCommunities ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4 mr-1" />}
              Detect
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {allCommunities.slice(0, 20).map(community => (
                <div 
                  key={community.id}
                  className={`p-3 rounded-lg border ${
                    community.covertIndicators > 0.5 
                      ? 'border-red-500/30 bg-red-950/20' 
                      : 'border-emerald-500/20 bg-emerald-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className={`h-4 w-4 ${community.covertIndicators > 0.5 ? 'text-red-400' : 'text-emerald-400'}`} />
                      <span className="font-medium">{community.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Cohesion: {Math.round(community.cohesionScore * 100)}%
                      </Badge>
                      {community.covertIndicators > 0.5 && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                          Covert
                        </Badge>
                      )}
                    </div>
                  </div>
                  {community.dominantAttributes.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Attributes: {community.dominantAttributes.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
              ))}
              {allCommunities.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Network className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No communities detected</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Top Influencers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Top Influencers</h3>
            <Button 
              size="sm"
              variant="ghost"
              disabled={isIdentifyingInfluencers}
              onClick={() => identifyInfluencers({ networkId: 'default', topK: 10 })}
            >
              {isIdentifyingInfluencers ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Identify'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topInfluencers.slice(0, 10).map((influencer, idx) => (
              <Badge key={influencer} variant="outline" className="border-yellow-500/30 text-yellow-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                #{idx + 1} {influencer.slice(0, 8)}...
              </Badge>
            ))}
            {topInfluencers.length === 0 && (
              <p className="text-sm text-muted-foreground">No influencers identified</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
