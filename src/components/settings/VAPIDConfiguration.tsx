import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Eye, EyeOff, ExternalLink, Shield, Info, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface VAPIDConfigurationProps {
  isConfigured: boolean;
  onSave: (publicKey: string) => void;
}

export function VAPIDConfiguration({ isConfigured, onSave }: VAPIDConfigurationProps) {
  const [publicKey, setPublicKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    if (!publicKey.trim()) {
      toast.error('Please enter a VAPID public key');
      return;
    }

    if (publicKey.length < 65) {
      toast.warning('VAPID public keys are typically 65+ characters (base64url encoded)');
    }

    onSave(publicKey);
    toast.info('VAPID public key saved. The private key must be added as a secret.');
  };

  const copyExample = () => {
    navigator.clipboard.writeText('npx web-push generate-vapid-keys');
    setCopied(true);
    toast.success('Command copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Web Push VAPID Keys</CardTitle>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configured
              </span>
            ) : (
              "Not configured"
            )}
          </Badge>
        </div>
        <CardDescription>
          Configure VAPID keys for production web push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            VAPID (Voluntary Application Server Identification) keys are required for secure 
            web push notifications in production. Without them, push notifications use demo mode.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vapid-public">Public Key (applicationServerKey)</Label>
            <div className="relative">
              <Input
                id="vapid-public"
                type={showKey ? "text" : "password"}
                placeholder={isConfigured ? "••••••••••••••••" : "BEl62..."}
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This key is safe to store publicly - it's used by browsers to encrypt messages.
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Private Key (Secret)
            </p>
            <p className="text-sm text-muted-foreground">
              The VAPID private key must be added as a secret named <code className="bg-muted px-1 rounded">VAPID_PRIVATE_KEY</code>. 
              This key is used server-side to sign push messages.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground border-t pt-4">
          <p className="font-medium text-foreground">How to generate VAPID keys:</p>
          
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <code className="flex-1 text-xs">npx web-push generate-vapid-keys</code>
            <Button variant="ghost" size="sm" onClick={copyExample}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Run the command above in your terminal</li>
            <li>Copy the Public Key here</li>
            <li>Add the Private Key as a secret (Settings → Secrets)</li>
          </ol>
          
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Push_API"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Learn more about Web Push API
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <Button onClick={handleSave} disabled={!publicKey.trim()}>
          Save Public Key
        </Button>
      </CardContent>
    </Card>
  );
}
