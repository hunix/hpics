import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Shield, Key, FileText, User, Eye, AlertTriangle, 
  Plus, Trash2, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

interface DeceptionAsset {
  id: string;
  assetType: 'honey_credential' | 'honeytoken' | 'synthetic_persona' | 'canary_document';
  name: string;
  status: 'active' | 'triggered' | 'expired';
  createdAt: string;
  triggeredAt?: string;
  triggerDetails?: {
    sourceIp?: string;
    userAgent?: string;
    location?: string;
  };
}

export function DeceptionOperationsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<DeceptionAsset['assetType']>('honey_credential');

  // Fetch deception assets (placeholder - table will be created via migration)
  const { data: assets, isLoading } = useQuery({
    queryKey: ['deception-assets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as DeceptionAsset[];
      // Table will be created via database migration
      return [] as DeceptionAsset[];
    },
    enabled: !!user?.id,
  });

  // Create new deception asset
  const createAssetMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('active-defense-orchestrator', {
          action: 'create_deception_asset',
          assetType: newAssetType,
          assetName: newAssetName,
        },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Deception asset created');
      queryClient.invalidateQueries({ queryKey: ['deception-assets'] });
      setNewAssetName('');
    },
    onError: (error) => {
      toast.error('Failed to create asset', { description: error instanceof Error ? error.message : 'Unknown error' });
    },
  });

  // Counter-surveillance check
  const counterSurveillanceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('active-defense-orchestrator', {
          action: 'counter_surveillance_scan',
        },);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.threatsDetected > 0) {
        toast.warning(`${data.threatsDetected} surveillance indicators detected`, {
          description: 'Review counter-intelligence report',
        });
      } else {
        toast.success('No surveillance indicators detected');
      }
    },
  });

  const assetTypeConfig = {
    honey_credential: { icon: Key, color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Honey Credential' },
    honeytoken: { icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Honeytoken' },
    synthetic_persona: { icon: User, color: 'text-violet-400', bgColor: 'bg-violet-500/20', label: 'Synthetic Persona' },
    canary_document: { icon: FileText, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Canary Document' },
  };

  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-emerald-400', label: 'Active' },
    triggered: { icon: AlertTriangle, color: 'text-red-400', label: 'TRIGGERED' },
    expired: { icon: XCircle, color: 'text-muted-foreground', label: 'Expired' },
  };

  const activeAssets = assets?.filter(a => a.status === 'active') || [];
  const triggeredAssets = assets?.filter(a => a.status === 'triggered') || [];

  return (
    <Card className="border-amber-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            <CardTitle>Deception Operations Center</CardTitle>
            <Badge variant="outline" className="text-amber-400 border-amber-400/50">MITRE Engage</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => counterSurveillanceMutation.mutate()}
            disabled={counterSurveillanceMutation.isPending}
          >
            <Eye className="h-4 w-4 mr-2" />
            Counter-Surveillance Scan
          </Button>
        </div>
        <CardDescription>
          Honeypots • Honeytokens • Synthetic Personas • Counter-Surveillance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assets">Active Assets</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alerts
              {triggeredAssets.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                  {triggeredAssets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="create">Deploy New</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(assetTypeConfig).map(([type, config]) => {
                const count = assets?.filter(a => a.assetType === type).length || 0;
                return (
                  <Card key={type} className="bg-background/50">
                    <CardContent className="p-3 text-center">
                      <config.icon className={`h-5 w-5 mx-auto mb-1 ${config.color}`} />
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-[10px] text-muted-foreground">{config.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Asset List */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading assets...</div>
            ) : activeAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active deception assets. Deploy some to enhance defensive posture.
              </div>
            ) : (
              <div className="space-y-2">
                {activeAssets.map((asset) => {
                  const typeConfig = assetTypeConfig[asset.assetType];
                  const TypeIcon = typeConfig.icon;
                  return (
                    <Card key={asset.id} className="bg-background/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${typeConfig.bgColor}`}>
                              <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{asset.name}</div>
                              <div className="text-xs text-muted-foreground">{typeConfig.label}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {triggeredAssets.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                <p className="text-muted-foreground">No triggered assets</p>
                <p className="text-xs text-muted-foreground mt-1">Your deception assets have not detected any intrusion attempts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {triggeredAssets.map((asset) => {
                  const typeConfig = assetTypeConfig[asset.assetType];
                  return (
                    <Card key={asset.id} className="bg-red-500/10 border-red-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            <span className="font-medium">ASSET TRIGGERED</span>
                          </div>
                          <Badge className="bg-red-500/20 text-red-400">
                            {asset.triggeredAt ? new Date(asset.triggeredAt).toLocaleString() : 'Unknown time'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <typeConfig.icon className={`h-4 w-4 ${typeConfig.color}`} />
                            <span className="text-sm">{asset.name}</span>
                          </div>
                          {asset.triggerDetails && (
                            <div className="p-2 rounded bg-background/50 text-xs space-y-1">
                              {asset.triggerDetails.sourceIp && (
                                <div>Source IP: <code className="text-red-400">{asset.triggerDetails.sourceIp}</code></div>
                              )}
                              {asset.triggerDetails.userAgent && (
                                <div>User Agent: <code className="text-amber-400">{asset.triggerDetails.userAgent}</code></div>
                              )}
                              {asset.triggerDetails.location && (
                                <div>Location: <code className="text-blue-400">{asset.triggerDetails.location}</code></div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1">
                            Investigate
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400">
                            Dismiss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(assetTypeConfig).map(([type, config]) => (
                <Card 
                  key={type} 
                  className={`bg-background/50 cursor-pointer transition-all ${
                    newAssetType === type ? 'ring-2 ring-primary' : 'hover:bg-background/70'
                  }`}
                  onClick={() => setNewAssetType(type as DeceptionAsset['assetType'])}
                >
                  <CardContent className="p-4 text-center">
                    <config.icon className={`h-8 w-8 mx-auto mb-2 ${config.color}`} />
                    <div className="font-medium text-sm">{config.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Asset Name</label>
                <Input
                  placeholder="e.g., admin_backup_key, financial_report_2024"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full"
                onClick={() => createAssetMutation.mutate()}
                disabled={!newAssetName || createAssetMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createAssetMutation.isPending ? 'Deploying...' : 'Deploy Deception Asset'}
              </Button>
            </div>

            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-amber-400">Operational Security:</strong> Deception assets are designed 
                  to detect unauthorized access. Any legitimate access should be documented.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
