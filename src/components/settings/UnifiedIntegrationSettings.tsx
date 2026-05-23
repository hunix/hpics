/**
 * @fileoverview Unified Integration Settings Panel
 * Master panel for all external integrations with status, configuration, and management
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  INTEGRATIONS, 
  CATEGORY_INFO, 
  CATEGORY_ORDER,
  getAllSecretKeys,
  getIntegrationsByCategory,
  type IntegrationDefinition,
  type IntegrationCategory,
} from '@/lib/integrations/registry';
import { 
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, 
  ExternalLink, Key, ChevronDown, Shield, Zap,
  AlertTriangle, Info, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntegrationHelpModal } from './IntegrationHelpModal';
import { useTestIntegration } from '@/hooks/useTestIntegration';
import { invokeFunction } from '@/lib/api';

// ============================================================================
// INTELLIGENCE READINESS SCORE
// ============================================================================

function IntelligenceReadinessScore({ 
  configuredCount, 
  totalCount 
}: { 
  configuredCount: number; 
  totalCount: number;
}) {
  const percentage = Math.round((configuredCount / totalCount) * 100);
  
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };
  
  const getScoreLabel = () => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 50) return 'Good';
    if (percentage >= 25) return 'Basic';
    return 'Limited';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Intelligence Readiness</h3>
            <p className="text-sm text-muted-foreground">
              {configuredCount} of {totalCount} integrations configured
            </p>
          </div>
          <div className="text-right">
            <div className={cn("text-3xl font-bold", getScoreColor())}>
              {percentage}%
            </div>
            <Badge variant="outline" className={getScoreColor()}>
              {getScoreLabel()}
            </Badge>
          </div>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-3">
          Configure more integrations to unlock additional intelligence capabilities
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// INTEGRATION CARD
// ============================================================================

interface IntegrationCardProps {
  integration: IntegrationDefinition;
  status: {
    configured: boolean;
    enabled: boolean;
    secretsStatus: Record<string, boolean>;
  };
  onToggle: (enabled: boolean) => void;
  onSaveSecret: (secretKey: string, value: string) => Promise<void>;
  onOpenHelp: (secretKey: string) => void;
  isSaving: boolean;
}

function IntegrationCard({ 
  integration, 
  status, 
  onToggle, 
  onSaveSecret,
  onOpenHelp,
  isSaving 
}: IntegrationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<string | null>(null);
  const [secretValue, setSecretValue] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const testMutation = useTestIntegration();
  
  const Icon = integration.icon;
  const allSecretsConfigured = integration.secrets.every(
    s => status.secretsStatus[s.key] || s.isOptional
  );
  const someSecretsConfigured = integration.secrets.some(
    s => status.secretsStatus[s.key]
  );
  
  const handleSaveSecret = async () => {
    if (!editingSecret || !secretValue.trim()) return;
    await onSaveSecret(editingSecret, secretValue.trim());
    setEditingSecret(null);
    setSecretValue('');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "border rounded-lg transition-all duration-200",
        isOpen && "ring-1 ring-primary/20",
        status.configured ? "border-border" : "border-border/50"
      )}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-start gap-4 text-left hover:bg-accent/30 transition-colors rounded-t-lg">
            <div className={cn(
              "p-2.5 rounded-lg shrink-0 transition-colors",
              status.configured ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                status.configured ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{integration.name}</h4>
                {integration.isConnector && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Zap className="h-3 w-3" />
                    Connector
                  </Badge>
                )}
                {allSecretsConfigured ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                ) : someSecretsConfigured ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-600/30 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Partial
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    <XCircle className="h-3 w-3" />
                    Not configured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {integration.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {integration.features.slice(0, 3).map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs font-normal">
                    {feature}
                  </Badge>
                ))}
                {integration.features.length > 3 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    +{integration.features.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {status.configured && (
                <Switch
                  checked={status.enabled}
                  onCheckedChange={onToggle}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>
        
        {/* Expandable Content */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/50">
            {/* Secret Configuration - Always show for connectors with secrets */}
            {integration.secrets.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Keys
                </Label>
                
                {integration.secrets.map((secret) => {
                  const isConfigured = status.secretsStatus[secret.key];
                  const isEditing = editingSecret === secret.key;
                  
                  return (
                    <div key={secret.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {secret.label}
                          {secret.isOptional && (
                            <span className="text-muted-foreground ml-1">(optional)</span>
                          )}
                        </span>
                        {isConfigured ? (
                          <Badge variant="outline" className="text-emerald-600 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {integration.isConnector ? 'Connected' : 'Set'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            Not set
                          </Badge>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type={showSecret ? 'text' : 'password'}
                                value={secretValue}
                                onChange={(e) => setSecretValue(e.target.value)}
                                placeholder={secret.placeholder || `Enter ${secret.label}`}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowSecret(!showSecret)}
                              >
                                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testMutation.mutate({ integrationId: secret.key, apiKey: secretValue })}
                              disabled={testMutation.isPending || !secretValue.trim()}
                              className="gap-1"
                            >
                              {testMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                              Test
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveSecret}
                              disabled={isSaving || !secretValue.trim()}
                              size="sm"
                              className="flex-1"
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingSecret(null); setSecretValue(''); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSecret(secret.key)}
                            className="flex-1 justify-start"
                          >
                            <Key className="h-4 w-4 mr-2" />
                            {isConfigured ? 'Update' : 'Add'} {secret.label}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenHelp(secret.key)}
                            className="px-2"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Connector Info - Show additional context for connectors */}
            {integration.isConnector && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">
                      Lovable Connector
                    </p>
                    <p className="text-muted-foreground mt-1">
                      This integration was set up via Lovable Connectors. You can update the API key above if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Documentation Link */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View documentation
                <ExternalLink className="h-3 w-3" />
              </a>
              
              {integration.edgeFunctions && integration.edgeFunctions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Used by: {integration.edgeFunctions.slice(0, 2).join(', ')}
                  {integration.edgeFunctions.length > 2 && ` +${integration.edgeFunctions.length - 2}`}
                </span>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedIntegrationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory>('connectors');
  const [helpModalKey, setHelpModalKey] = useState<string | null>(null);

  // Fetch integration configs
  const { data: configs } = useQuery({
    queryKey: ['integration-configs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch secret status
  const { data: secretStatus, isLoading: isLoadingSecrets } = useQuery({
    queryKey: ['secret-status', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('check-secrets', { secrets: getAllSecretKeys() });
      if (error) {
        console.warn('Could not check secret status:', error);
        return {};
      }
      return data?.status || {};
    },
    enabled: !!user,
    retry: false,
    staleTime: 30000,
  });

  // Toggle integration mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ integrationId, enabled }: { integrationId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('integration_configs')
        .upsert({
          user_id: user!.id,
          integration_type: integrationId,
          is_enabled: enabled,
        }, { onConflict: 'user_id,integration_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-configs'] });
      toast.success('Integration updated');
    },
    onError: (error) => {
      toast.error('Failed to update', { description: error.message });
    },
  });

  // Save secret mutation
  const saveSecret = async (secretKey: string, value: string) => {
    setSavingKey(secretKey);
    try {
      const { error } = await invokeFunction('save-integration-secret', { secretName: secretKey, secretValue: value });
      if (error) throw error;
      
      toast.success('Configuration saved', {
        description: 'Add the secret via Lovable Cloud settings to complete setup.'
      });
      queryClient.invalidateQueries({ queryKey: ['secret-status'] });
    } catch (error) {
      toast.error('Failed to save', { 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Get status for an integration
  const getIntegrationStatus = (integration: IntegrationDefinition) => {
    const config = configs?.find(c => c.integration_type === integration.id);
    const secretsStatus: Record<string, boolean> = {};
    
    for (const secret of integration.secrets) {
      secretsStatus[secret.key] = secretStatus?.[secret.key] ?? false;
    }
    
    const allConfigured = integration.secrets.every(
      s => secretsStatus[s.key] || s.isOptional
    );
    
    return {
      configured: integration.isConnector || allConfigured,
      enabled: config?.is_enabled ?? integration.isConnector ?? false,
      secretsStatus,
    };
  };

  // Group integrations by category
  const integrationsByCategory = useMemo(() => getIntegrationsByCategory(), []);
  
  // Calculate readiness
  const { configuredCount, totalCount } = useMemo(() => {
    let configured = 0;
    for (const integration of INTEGRATIONS) {
      const status = getIntegrationStatus(integration);
      if (status.configured) configured++;
    }
    return { configuredCount: configured, totalCount: INTEGRATIONS.length };
  }, [configs, secretStatus]);

  // Filter out empty categories
  const visibleCategories = CATEGORY_ORDER.filter(
    cat => integrationsByCategory[cat]?.length > 0
  );

  if (isLoadingSecrets) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intelligence Readiness Score */}
      <IntelligenceReadinessScore 
        configuredCount={configuredCount} 
        totalCount={totalCount} 
      />
      
      {/* Category Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Integration Hub
          </CardTitle>
          <CardDescription>
            Configure external APIs and services. All credentials are encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as IntegrationCategory)}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {visibleCategories.map((category) => {
                const info = CATEGORY_INFO[category];
                const Icon = info.icon;
                const count = integrationsByCategory[category]?.length || 0;
                
                return (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{info.label}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {visibleCategories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Info className="h-4 w-4" />
                  {CATEGORY_INFO[category].description}
                </div>
                
                <div className="space-y-3">
                  {integrationsByCategory[category]?.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      status={getIntegrationStatus(integration)}
                      onToggle={(enabled) => 
                        toggleMutation.mutate({ integrationId: integration.id, enabled })
                      }
                      onSaveSecret={saveSecret}
                      isSaving={savingKey !== null}
                      onOpenHelp={(secretKey) => setHelpModalKey(secretKey)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Security Notice */}
      <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Security & Privacy</h4>
            <p className="text-xs text-muted-foreground mt-1">
              All API keys are stored as encrypted secrets and are only accessible to edge functions 
              running on the server. They are never sent to the browser or exposed in network requests.
              To complete setup for non-connector integrations, add the secret via Lovable Cloud settings.
            </p>
          </div>
        </div>
      </div>
      
      {/* Integration Help Modal */}
      <IntegrationHelpModal
        integrationId={helpModalKey}
        isOpen={!!helpModalKey}
        onClose={() => setHelpModalKey(null)}
      />
    </div>
  );
}
