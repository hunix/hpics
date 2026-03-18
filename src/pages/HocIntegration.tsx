/**
 * @fileoverview HoC Republic Integration Hub
 * Centralized setup guide for connecting HoC Republic to HPICS
 */

import { useState, useCallback } from 'react';
import { 
  Copy, CheckCircle2, AlertTriangle, Loader2, ExternalLink, 
  Zap, Key, Server, Workflow, Layers, Terminal, Shield,
  Activity, ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InboundApiKeys } from '@/components/settings/InboundApiKeys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const GATEWAY_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/hoc-gateway`;

const WORKFLOWS = [
  { id: 'full-intelligence', label: 'Full Intelligence', desc: 'Complete intelligence pipeline across all phases' },
  { id: 'generate-dossier', label: 'Generate Dossier', desc: '64-section warfare dossier generation' },
  { id: 'track-contact', label: 'Track Contact', desc: 'Continuous contact monitoring & alerts' },
  { id: 'counter-intel-scan', label: 'Counter-Intel Scan', desc: 'Adversary detection & OPSEC audit' },
  { id: 'quick-profile', label: 'Quick Profile', desc: 'Fast profile enrichment & scoring' },
  { id: 'verified-dossier', label: 'Verified Dossier', desc: 'Multi-source verified intelligence report' },
  { id: 'deep-research', label: 'Deep Research', desc: 'Deep OSINT & behavioral analysis' },
  { id: 'adversarial-assessment', label: 'Adversarial Assessment', desc: 'Threat modeling & vulnerability mapping' },
  { id: 'vulnerability-defense', label: 'Vulnerability Defense', desc: 'Defensive posture & patch generation' },
];

const TOOL_CATEGORIES = [
  { name: 'Profile & Contact', count: 45, emoji: '👤' },
  { name: 'Intelligence & Analysis', count: 38, emoji: '🧠' },
  { name: 'Behavioral & Psychology', count: 42, emoji: '🔬' },
  { name: 'Network & Graph', count: 28, emoji: '🕸️' },
  { name: 'Communication & SIGINT', count: 22, emoji: '📡' },
  { name: 'Warfare & Tactics', count: 35, emoji: '⚔️' },
  { name: 'Deception & Counter-Intel', count: 18, emoji: '🎭' },
  { name: 'Biometric & Forensics', count: 24, emoji: '🔍' },
  { name: 'Financial & Economic', count: 16, emoji: '💰' },
  { name: 'Social & OSINT', count: 30, emoji: '🌐' },
  { name: 'Fusion & Synthesis', count: 20, emoji: '⚡' },
  { name: 'Autonomous & Agents', count: 26, emoji: '🤖' },
  { name: 'Hardware & Sensors', count: 15, emoji: '📱' },
  { name: 'Reasoning & Cognitive', count: 32, emoji: '💡' },
  { name: 'Storage & Data', count: 12, emoji: '💾' },
];

const totalTools = TOOL_CATEGORIES.reduce((sum, c) => sum + c.count, 0);

export default function HocIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [healthMessage, setHealthMessage] = useState('');
  const [showCurl, setShowCurl] = useState(false);
  const [showJs, setShowJs] = useState(false);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  }, [toast]);

  const testConnection = useCallback(async () => {
    setHealthStatus('loading');
    try {
      const res = await fetch(`${GATEWAY_URL}?healthCheck=1`);
      const data = await res.json();
      if (data.ok) {
        setHealthStatus('ok');
        setHealthMessage(`Gateway online — ${new Date(data.timestamp).toLocaleTimeString()}`);
      } else {
        setHealthStatus('error');
        setHealthMessage('Gateway returned unexpected response');
      }
    } catch (err) {
      setHealthStatus('error');
      setHealthMessage(err instanceof Error ? err.message : 'Connection failed');
    }
  }, []);

  const curlExample = `curl -X POST "${GATEWAY_URL}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "list-workflows"
  }'`;

  const jsExample = `const response = await fetch("${GATEWAY_URL}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    action: "run-workflow",
    workflow: "full-intelligence",
    params: { contactName: "John Doe" }
  })
});
const result = await response.json();`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HoC Republic Integration</h1>
          <p className="text-sm text-muted-foreground">
            Connect your HoC Republic agent to HPICS — {totalTools}+ tools, {WORKFLOWS.length} workflows
          </p>
        </div>
      </div>

      {/* Step 1: Gateway URL */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 1</Badge>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-4 w-4" /> Gateway Endpoint
            </CardTitle>
          </div>
          <CardDescription>Add this URL to your HoC Republic configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono break-all">
              {GATEWAY_URL}
            </code>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => copyToClipboard(GATEWAY_URL, 'Gateway URL')}
            >
              {copied === 'Gateway URL' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Connection Test */}
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={testConnection} disabled={healthStatus === 'loading'}>
              {healthStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Activity className="h-4 w-4 mr-1" />
              )}
              Test Connection
            </Button>
            {healthStatus === 'ok' && (
              <span className="text-sm text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {healthMessage}
              </span>
            )}
            {healthStatus === 'error' && (
              <span className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {healthMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: API Key */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 2</Badge>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-4 w-4" /> API Key
            </CardTitle>
          </div>
          <CardDescription>
            Generate a Bearer token for HoC to authenticate with the gateway
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <InboundApiKeys />
          ) : (
            <Alert>
              <AlertDescription>Sign in to generate API keys</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Requirements Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Step 3</Badge>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" /> Connection Checklist
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Gateway URL configured in HoC settings</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>API Key added as <code className="bg-muted px-1 rounded text-xs">Bearer</code> token in Authorization header</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Actions available: <code className="bg-muted px-1 rounded text-xs">run-workflow</code>, <code className="bg-muted px-1 rounded text-xs">resolve-contact</code>, <code className="bg-muted px-1 rounded text-xs">list-workflows</code>, + {totalTools}+ individual tools</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Workflows */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Workflow className="h-4 w-4" /> Available Workflows
          </CardTitle>
          <CardDescription>{WORKFLOWS.length} autonomous DAG-based pipelines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {WORKFLOWS.map(w => (
              <div key={w.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card/50">
                <div className="flex items-center gap-3">
                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{w.id}</code>
                  <span className="text-sm font-medium">{w.label}</span>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{w.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-4 w-4" /> Tool Categories
          </CardTitle>
          <CardDescription>{totalTools}+ individual tools across {TOOL_CATEGORIES.length} categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TOOL_CATEGORIES.map(cat => (
              <div key={cat.name} className="flex items-center gap-2 p-2 rounded-lg border border-border/30">
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-sm flex-1">{cat.name}</span>
                <Badge variant="secondary" className="text-xs">{cat.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="h-4 w-4" /> Code Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Collapsible open={showCurl} onOpenChange={setShowCurl}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">cURL Example</span>
                {showCurl ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="relative mt-2">
                <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">{curlExample}</pre>
                <Button 
                  size="icon" variant="ghost" 
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => copyToClipboard(curlExample, 'cURL')}
                >
                  {copied === 'cURL' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={showJs} onOpenChange={setShowJs}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">JavaScript Example</span>
                {showJs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="relative mt-2">
                <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">{jsExample}</pre>
                <Button 
                  size="icon" variant="ghost" 
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => copyToClipboard(jsExample, 'JS')}
                >
                  {copied === 'JS' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
