/**
 * @fileoverview Inbound API Key Management + Gateway URL Display
 * Allows users to generate, view, and revoke API keys for external systems.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Copy, Check, Plus, Loader2, Shield, ShieldOff,
  BarChart3, Clock, Key, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/lib/api';

const GATEWAY_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/hoc-gateway`;

interface ApiClient {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_rpm: number;
  is_active: boolean;
  last_used_at: string | null;
  total_requests: number;
  created_at: string;
  revoked_at: string | null;
}

interface UsageStats {
  last_24h: number;
  last_7d: number;
  last_30d: number;
  avg_response_ms: number;
  error_rate: number;
  top_tools: { tool: string; count: number }[];
}

export function InboundApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [generateOpen, setGenerateOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [usageClientId, setUsageClientId] = useState<string | null>(null);

  // Fetch clients via edge function to avoid types.ts issues
  const { data: clients, isLoading } = useQuery({
    queryKey: ['hpics-api-clients', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('manage-api-clients', { action: 'list' },);
      if (error) throw error;
      return (data?.data as ApiClient[]) || [];
    },
    enabled: !!user,
  });

  // Fetch usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['hpics-api-usage', user?.id, usageClientId],
    queryFn: async () => {
      const { data, error } = await invokeFunction('manage-api-clients', { action: 'usage', client_id: usageClientId },);
      if (error) throw error;
      return data?.data as UsageStats;
    },
    enabled: !!user,
  });

  // Generate key mutation
  const generateMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await invokeFunction('manage-api-clients', { action: 'generate', name },);
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate key');
      return data;
    },
    onSuccess: (data) => {
      setGeneratedKey(data.data.api_key);
      queryClient.invalidateQueries({ queryKey: ['hpics-api-clients'] });
      toast({ title: 'API Key Generated', description: 'Copy the key now — it won\'t be shown again.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { data, error } = await invokeFunction('manage-api-clients', { action: 'revoke', client_id: clientId },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hpics-api-clients'] });
      toast({ title: 'API Key Revoked' });
    },
  });

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleGenerate = () => {
    if (!clientName.trim()) return;
    generateMutation.mutate(clientName.trim());
  };

  const handleCloseGenerate = () => {
    setGenerateOpen(false);
    setClientName('');
    setGeneratedKey(null);
  };

  const activeCount = clients?.filter(c => c.is_active).length || 0;
  const totalRequests = clients?.reduce((sum, c) => sum + (c.total_requests || 0), 0) || 0;

  return (
    <div className="space-y-4">
      {/* Gateway Endpoint */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">HPICS Gateway Endpoint</CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              400+ Tools Available
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Use this URL to integrate external systems with HPICS. Authenticate using a Bearer token from the keys below.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground truncate">
              {GATEWAY_URL}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(GATEWAY_URL, 'gateway')}
            >
              {copied === 'gateway' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Key className="h-3 w-3" /> Bearer token auth
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> {activeCount} active key{activeCount !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> {totalRequests.toLocaleString()} total requests
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      {usageStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: '24h', value: usageStats.last_24h },
            { label: '7d', value: usageStats.last_7d },
            { label: '30d', value: usageStats.last_30d },
            { label: 'Avg ms', value: usageStats.avg_response_ms },
            { label: 'Err %', value: `${usageStats.error_rate}%` },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border/30 bg-card/50 p-2 text-center">
              <div className="text-lg font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Client Keys Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Issued API Keys</h3>
        <Dialog open={generateOpen} onOpenChange={(open) => {
          if (!open) handleCloseGenerate();
          else setGenerateOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> Generate Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create an API key for an external system to authenticate with HPICS Gateway.
              </DialogDescription>
            </DialogHeader>
            {generatedKey ? (
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Copy this key now. It will <strong>never</strong> be shown again.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded border border-border bg-muted px-3 py-2 text-xs font-mono break-all">
                    {generatedKey}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => handleCopy(generatedKey, 'key')}>
                    {copied === 'key' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseGenerate}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Client Name</label>
                  <Input
                    placeholder="e.g. HoC Republic, My Bot"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseGenerate}>Cancel</Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!clientName.trim() || generateMutation.isPending}
                  >
                    {generateMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                    Generate
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Client Keys Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : !clients?.length ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No API keys generated yet. Create one to integrate external systems.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Client</TableHead>
                <TableHead className="text-xs">Key</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Requests</TableHead>
                <TableHead className="text-xs">Last Used</TableHead>
                <TableHead className="text-xs">Rate Limit</TableHead>
                <TableHead className="text-xs w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="text-xs font-medium">{client.name}</TableCell>
                  <TableCell>
                    <code className="text-[10px] text-muted-foreground font-mono">
                      {client.key_prefix}...
                    </code>
                  </TableCell>
                  <TableCell>
                    {client.is_active ? (
                      <Badge variant="default" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                        <Shield className="h-2.5 w-2.5 mr-0.5" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] text-muted-foreground">
                        <ShieldOff className="h-2.5 w-2.5 mr-0.5" /> Revoked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{(client.total_requests || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {client.last_used_at
                      ? new Date(client.last_used_at).toLocaleDateString()
                      : <span className="italic">Never</span>}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{client.rate_limit_rpm}/min</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => setUsageClientId(usageClientId === client.id ? null : client.id)}
                        title="View usage"
                      >
                        <BarChart3 className="h-3 w-3" />
                      </Button>
                      {client.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => revokeMutation.mutate(client.id)}
                          disabled={revokeMutation.isPending}
                          title="Revoke key"
                        >
                          <ShieldOff className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Integration Guide */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3 w-3" />
          Integration Guide
        </summary>
        <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
          <p><strong>Authentication:</strong> Include your API key as a Bearer token in the Authorization header.</p>
          <code className="block bg-muted rounded px-2 py-1 text-[10px] font-mono">
            Authorization: Bearer hpics_your_key_here
          </code>
          <p><strong>Execute a tool:</strong></p>
          <code className="block bg-muted rounded px-2 py-1 text-[10px] font-mono whitespace-pre">{
`POST ${GATEWAY_URL}
{
  "tool": "analyze-profile",
  "params": { "profileId": "...", "userId": "..." }
}`
          }</code>
          <p><strong>List available tools:</strong></p>
          <code className="block bg-muted rounded px-2 py-1 text-[10px] font-mono whitespace-pre">{
`POST ${GATEWAY_URL}
{ "action": "list-tools" }`
          }</code>
        </div>
      </details>
    </div>
  );
}
