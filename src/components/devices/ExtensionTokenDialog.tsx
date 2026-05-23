import React, { useState, useEffect } from 'react';
import { Key, Copy, Eye, EyeOff, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getExtensionSession } from '@/hooks/devices/useExtensionSession';

interface ExtensionTokenDialogProps {
  children?: React.ReactNode;
}

interface TokenData {
  token: string;
  expiresAt: Date;
  endpoint: string;
}

export function ExtensionTokenDialog({ children }: ExtensionTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedField, setCopiedField] = useState<'endpoint' | 'token' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchToken = async () => {
    setIsLoading(true);
    try {
      const session = await getExtensionSession();
      if (!session) {
        toast({
          title: "Not signed in",
          description: "Please sign in to get your extension token",
          variant: "destructive",
        });
        return;
      }
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chrome-extension-bridge`;
      setTokenData({
        token: session.token,
        expiresAt: session.expiresAt,
        endpoint,
      });
    } catch (error) {
      console.error('Failed to get session:', error);
      toast({
        title: "Failed to get token",
        description: "Could not retrieve your session token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchToken();
    }
  }, [open, user]);

  const copyToClipboard = async (text: string, field: 'endpoint' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field === 'endpoint' ? 'API Endpoint' : 'Token'} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = () => {
    if (!tokenData) return null;
    const now = new Date();
    const diff = tokenData.expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (diff <= 0) return { text: 'Expired', isExpired: true, isWarning: true };
    if (minutes < 5) return { text: `${minutes}m`, isExpired: false, isWarning: true };
    if (hours > 0) return { text: `${hours}h ${minutes % 60}m`, isExpired: false, isWarning: false };
    return { text: `${minutes}m`, isExpired: false, isWarning: minutes < 30 };
  };

  const timeRemaining = getTimeRemaining();

  const maskToken = (token: string) => {
    if (!token) return '';
    return `${token.slice(0, 20)}${'•'.repeat(30)}${token.slice(-10)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Key className="h-4 w-4 mr-2" />
            Configure Extension
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Chrome Extension Configuration
          </DialogTitle>
          <DialogDescription>
            Use these credentials to connect your Chrome extension
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-6 text-center space-y-3">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
            <div>
              <p className="font-medium">Not Signed In</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please sign in to your account to get your extension token
              </p>
            </div>
            <Button 
              variant="default" 
              onClick={() => {
                setOpen(false);
                window.location.href = '/auth';
              }}
            >
              Go to Sign In
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading credentials...</p>
          </div>
        ) : tokenData ? (
          <div className="space-y-4">
            {/* API Endpoint */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Endpoint</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={tokenData.endpoint}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(tokenData.endpoint, 'endpoint')}
                >
                  {copiedField === 'endpoint' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Auth Token */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Auth Token</Label>
                {timeRemaining && (
                  <Badge 
                    variant={timeRemaining.isExpired ? "destructive" : timeRemaining.isWarning ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {timeRemaining.isExpired ? 'Expired' : `Expires in ${timeRemaining.text}`}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    value={showToken ? tokenData.token : maskToken(tokenData.token)}
                    className="font-mono text-xs pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(tokenData.token, 'token')}
                >
                  {copiedField === 'token' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Refresh Token Button */}
            {timeRemaining?.isWarning && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={fetchToken}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Token
              </Button>
            )}

            <Separator />

            {/* Security Warning */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Keep this token secure. Never share it with others. It provides access to your account.
                </p>
              </div>
            </div>

            <Separator />

            {/* Quick Setup Guide */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Setup</p>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Open the Chrome extension popup</li>
                <li>Paste the <strong>API Endpoint</strong> in the endpoint field</li>
                <li>Paste the <strong>Auth Token</strong> in the token field</li>
                <li>Click <strong>"Save Configuration"</strong></li>
                <li>Test the connection to verify setup</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium">Failed to Load Token</p>
              <p className="text-sm text-muted-foreground mt-1">
                Could not retrieve your session token
              </p>
            </div>
            <Button variant="outline" onClick={fetchToken}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExtensionTokenDialog;
