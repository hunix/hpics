import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Network, AlertTriangle, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShadowNetworkGraphProps {
  userId: string;
  profileId?: string;
}

interface HiddenConnection {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  connectionType: string;
  confidence: number;
  evidence: string[];
  riskLevel: string;
}

interface ShadowNetworkData {
  hiddenConnections: HiddenConnection[];
  influenceChains: Array<{
    chain: string[];
    influence: string;
    strength: number;
  }>;
  parallelIdentities: Array<{
    profileId: string;
    aliases: string[];
    platforms: string[];
    confidence: number;
  }>;
  communicationClusters: Array<{
    members: string[];
    pattern: string;
    frequency: string;
  }>;
}

export function ShadowNetworkGraph({ userId, profileId }: ShadowNetworkGraphProps) {
  const [data, setData] = useState<ShadowNetworkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const detectShadowNetworks = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('detect-shadow-networks', {
        body: { userId, profileId, analysisDepth: 'deep' }
      });

      if (!isMountedRef.current) return;
      if (error) throw error;
      setData(result.analysis);
      toast.success('Shadow network detection complete');
    } catch (error) {
      if (isMountedRef.current) {
        toast.error(error instanceof Error ? error.message : 'Detection failed');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      'critical': 'text-red-500 bg-red-500/10',
      'high': 'text-orange-500 bg-orange-500/10',
      'medium': 'text-amber-500 bg-amber-500/10',
      'low': 'text-green-500 bg-green-500/10'
    };
    return colors[risk.toLowerCase()] || 'text-muted-foreground bg-muted';
  };

  return (
    <Card className="border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Network className="h-5 w-5 text-purple-500" />
            Shadow Network Detection
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              onClick={detectShadowNetworks} 
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-violet-500"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Detect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="text-center py-8 text-muted-foreground">
            <EyeOff className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Run shadow network detection to reveal hidden connections, parallel identities, and covert influence chains.</p>
          </div>
        ) : (
          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connections">Hidden Links</TabsTrigger>
              <TabsTrigger value="influence">Influence Chains</TabsTrigger>
              <TabsTrigger value="identities">Parallel IDs</TabsTrigger>
              <TabsTrigger value="clusters">Clusters</TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.hiddenConnections.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No hidden connections detected</p>
                ) : (
                  data.hiddenConnections.map((conn, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conn.sourceName}</span>
                          <span className="text-muted-foreground">↔</span>
                          <span className="font-medium">{conn.targetName}</span>
                        </div>
                        <Badge className={getRiskColor(conn.riskLevel)}>{conn.riskLevel}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline">{conn.connectionType}</Badge>
                        <span>{Math.round(conn.confidence * 100)}% confidence</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Evidence: {conn.evidence.slice(0, 2).join(', ')}
                        {conn.evidence.length > 2 && ` +${conn.evidence.length - 2} more`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="influence" className="mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.influenceChains.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No influence chains detected</p>
                ) : (
                  data.influenceChains.map((chain, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2 overflow-x-auto">
                        {chain.chain.map((node, j) => (
                          <React.Fragment key={j}>
                            <Badge variant="secondary">{node}</Badge>
                            {j < chain.chain.length - 1 && (
                              <span className="text-purple-500">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{chain.influence}</span>
                        <Badge variant="outline">Strength: {chain.strength}%</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="identities" className="mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.parallelIdentities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No parallel identities detected</p>
                ) : (
                  data.parallelIdentities.map((identity, i) => (
                    <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">Potential Aliases</span>
                        </div>
                        <Badge variant="outline">{Math.round(identity.confidence * 100)}%</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {identity.aliases.map((alias, j) => (
                          <Badge key={j} variant="secondary">{alias}</Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Platforms: {identity.platforms.join(', ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="clusters" className="mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.communicationClusters.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No communication clusters detected</p>
                ) : (
                  data.communicationClusters.map((cluster, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {cluster.members.map((member, j) => (
                          <Badge key={j} variant="outline">{member}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cluster.pattern}</span>
                        <Badge variant="secondary">{cluster.frequency}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
