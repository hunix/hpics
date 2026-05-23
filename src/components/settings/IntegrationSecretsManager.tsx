import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Check, X, Eye, EyeOff, Save, Trash2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { invokeFunction } from '@/lib/api';

interface IntegrationSecret {
  name: string;
  description: string;
  group: string;
  required: boolean;
  placeholder?: string;
  helpUrl?: string;
}

const INTEGRATION_SECRETS: IntegrationSecret[] = [
  // Google Gmail Integration
  {
    name: 'GOOGLE_GMAIL_CLIENT_ID',
    description: 'OAuth 2.0 Client ID for Gmail API access',
    group: 'Gmail',
    required: false,
    placeholder: 'xxxx.apps.googleusercontent.com',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    name: 'GOOGLE_GMAIL_CLIENT_SECRET',
    description: 'OAuth 2.0 Client Secret for Gmail API access',
    group: 'Gmail',
    required: false,
    placeholder: 'GOCSPX-xxxxx',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  // Google Calendar Integration
  {
    name: 'GOOGLE_CALENDAR_CLIENT_ID',
    description: 'OAuth 2.0 Client ID for Google Calendar API',
    group: 'Google Calendar',
    required: false,
    placeholder: 'xxxx.apps.googleusercontent.com',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    name: 'GOOGLE_CALENDAR_CLIENT_SECRET',
    description: 'OAuth 2.0 Client Secret for Google Calendar API',
    group: 'Google Calendar',
    required: false,
    placeholder: 'GOCSPX-xxxxx',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
];

export function IntegrationSecretsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  // Fetch configured secrets status
  const { data: configuredSecrets, isLoading } = useQuery({
    queryKey: ['integration-secrets-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .eq('user_id', user!.id)
        .like('setting_key', 'secret_configured_%');

      if (error) throw error;

      const configured: Record<string, boolean> = {};
      for (const item of data || []) {
        const secretName = item.setting_key.replace('secret_configured_', '');
        configured[secretName] = item.setting_value === 'true';
      }
      return configured;
    },
    enabled: !!user,
  });

  // Save secret mutation
  const saveSecretMutation = useMutation({
    mutationFn: async ({ secretName, secretValue }: { secretName: string; secretValue: string }) => {
      const { error } = await invokeFunction('save-integration-secret', { secretName, secretValue },);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.secretName} saved securely`);
      queryClient.invalidateQueries({ queryKey: ['integration-secrets-status'] });
      setSecretValues(prev => ({ ...prev, [variables.secretName]: '' }));
    },
    onError: (error) => {
      toast.error('Failed to save secret: ' + (error as Error).message);
    },
  });

  // Delete secret mutation
  const deleteSecretMutation = useMutation({
    mutationFn: async (secretName: string) => {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('user_id', user!.id)
        .eq('setting_key', `secret_configured_${secretName}`);
      if (error) throw error;
    },
    onSuccess: (_, secretName) => {
      toast.success(`${secretName} removed`);
      queryClient.invalidateQueries({ queryKey: ['integration-secrets-status'] });
    },
    onError: (error) => {
      toast.error('Failed to remove secret: ' + (error as Error).message);
    },
  });

  // Group secrets by integration
  const groupedSecrets = INTEGRATION_SECRETS.reduce((acc, secret) => {
    if (!acc[secret.group]) {
      acc[secret.group] = [];
    }
    acc[secret.group].push(secret);
    return acc;
  }, {} as Record<string, IntegrationSecret[]>);

  const isGroupConfigured = (group: string) => {
    const groupSecrets = groupedSecrets[group];
    return groupSecrets.every(s => configuredSecrets?.[s.name]);
  };

  const handleSaveSecret = (secretName: string) => {
    const value = secretValues[secretName];
    if (!value?.trim()) {
      toast.error('Please enter a value');
      return;
    }
    saveSecretMutation.mutate({ secretName, secretValue: value });
  };

  const handleSaveGroup = (group: string) => {
    const groupSecrets = groupedSecrets[group];
    const missingSecrets = groupSecrets.filter(s => !secretValues[s.name]?.trim());
    
    if (missingSecrets.length > 0) {
      toast.error(`Please fill in all fields: ${missingSecrets.map(s => s.name).join(', ')}`);
      return;
    }

    // Save all secrets in the group
    Promise.all(
      groupSecrets.map(s => 
        saveSecretMutation.mutateAsync({ 
          secretName: s.name, 
          secretValue: secretValues[s.name] 
        })
      )
    ).then(() => {
      setEditingGroup(null);
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Integration Credentials
        </CardTitle>
        <CardDescription>
          Configure API credentials for external integrations. Credentials are encrypted and stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2">
          {Object.entries(groupedSecrets).map(([group, secrets]) => {
            const configured = isGroupConfigured(group);
            const isEditing = editingGroup === group;

            return (
              <AccordionItem key={group} value={group} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{group}</span>
                    {configured ? (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <X className="h-3 w-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {secrets.map((secret) => {
                      const isConfigured = configuredSecrets?.[secret.name];
                      const showSecret = showSecrets[secret.name];
                      const value = secretValues[secret.name] || '';

                      return (
                        <div key={secret.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={secret.name} className="flex items-center gap-2">
                              {secret.name}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{secret.description}</p>
                                    {secret.helpUrl && (
                                      <a 
                                        href={secret.helpUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary underline block mt-1"
                                      >
                                        Get credentials →
                                      </a>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                            {isConfigured && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Set
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id={secret.name}
                                type={showSecret ? 'text' : 'password'}
                                placeholder={isConfigured ? '••••••••' : secret.placeholder}
                                value={value}
                                onChange={(e) => setSecretValues(prev => ({ 
                                  ...prev, 
                                  [secret.name]: e.target.value 
                                }))}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowSecrets(prev => ({ 
                                  ...prev, 
                                  [secret.name]: !prev[secret.name] 
                                }))}
                              >
                                {showSecret ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleSaveSecret(secret.name)}
                              disabled={!value.trim() || saveSecretMutation.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            {isConfigured && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Remove Credential</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to remove {secret.name}? This will disable the integration.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={() => deleteSecretMutation.mutate(secret.name)}
                                      disabled={deleteSecretMutation.isPending}
                                    >
                                      Remove
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {!configured && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handleSaveGroup(group)}
                          disabled={saveSecretMutation.isPending}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save All {group} Credentials
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            Security Notice
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Credentials are encrypted at rest using AES-256</li>
            <li>• Never stored in browser localStorage or cookies</li>
            <li>• Only accessible by server-side functions</li>
            <li>• Access is logged in the audit trail</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
