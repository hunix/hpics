import React, { useState, useEffect, useCallback } from 'react';
import { Chrome, Download, Link2, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ChromeExtensionBridgeProps {
  profileId?: string;
  onDataReceived?: (captureId: string, data: any) => void;
  className?: string;
}

interface ExtensionCapture {
  id: string;
  capture_type: string;
  device_source?: string;
  extracted_data: any;
  created_at: string;
  status: string;
}

export function ChromeExtensionBridge({ profileId, onDataReceived, className }: ChromeExtensionBridgeProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [extensionId, setExtensionId] = useState('');
  const [recentCaptures, setRecentCaptures] = useState<ExtensionCapture[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate connection token for extension
  const [connectionToken, setConnectionToken] = useState<string | null>(null);

  const generateConnectionToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      setConnectionToken(session.access_token);
    }
  }, []);

  useEffect(() => {
    generateConnectionToken();
    loadRecentCaptures();
  }, [generateConnectionToken]);

  const loadRecentCaptures = async () => {
    setIsLoading(true);
    try {
      // Try direct REST API call for device_captures
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/device_captures?device_type=eq.chrome_extension&order=created_at.desc&limit=10`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token || ''}`,
          },
        }
      );
      
      if (response.ok) {
        const records = await response.json();
        const captures: ExtensionCapture[] = (records || []).map((d: any) => ({
          id: d.id,
          capture_type: d.capture_type,
          device_source: d.device_source,
          extracted_data: d.extracted_data,
          created_at: d.created_at,
          status: d.status,
        }));
        setRecentCaptures(captures);
        if (captures.length > 0) setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to load captures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (connectionToken) {
      navigator.clipboard.writeText(connectionToken);
      toast({
        title: 'Token Copied',
        description: 'Paste this in the Chrome extension settings',
      });
    }
  };

  const copyEndpoint = () => {
    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chrome-extension-bridge`;
    navigator.clipboard.writeText(endpoint);
    toast({
      title: 'Endpoint Copied',
      description: 'Paste this in the Chrome extension settings',
    });
  };

  const formatCaptureType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Chrome className="h-5 w-5 text-primary" />
          Chrome Extension Bridge
        </CardTitle>
        <CardDescription>
          Scrape private Instagram, Threads, and other social profiles directly from your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Extension Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Extension Not Connected</span>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={loadRecentCaptures} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-4">
          <h4 className="font-medium">Setup Instructions</h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">1</Badge>
              <div>
                <p className="font-medium">Install Chrome Extension</p>
                <p className="text-muted-foreground">Download and install from Chrome Web Store or load unpacked</p>
                <Button variant="link" size="sm" className="h-auto p-0 mt-1" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3 mr-1" />
                    Download Extension
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">2</Badge>
              <div className="flex-1">
                <p className="font-medium">Configure API Endpoint</p>
                <p className="text-muted-foreground mb-2">Copy and paste into extension settings</p>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chrome-extension-bridge`}
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={copyEndpoint}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">3</Badge>
              <div className="flex-1">
                <p className="font-medium">Add Authentication Token</p>
                <p className="text-muted-foreground mb-2">This connects the extension to your account</p>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    type="password"
                    value={connectionToken ? '••••••••••••••••••••' : 'Generating...'}
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={copyToken} disabled={!connectionToken}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* How to Use */}
        <div className="space-y-3">
          <h4 className="font-medium">How to Scrape Private Profiles</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
              <span className="font-mono text-primary">1.</span>
              <span>Open Instagram/Threads in Chrome and log in to your account</span>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
              <span className="font-mono text-primary">2.</span>
              <span>Navigate to the profile you want to capture</span>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
              <span className="font-mono text-primary">3.</span>
              <span>Click the extension icon and choose what to scrape (profile, posts, stories, etc.)</span>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
              <span className="font-mono text-primary">4.</span>
              <span>Data is automatically sent here and linked to your contact</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Recent Captures */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Recent Captures</h4>
            <Badge variant="secondary">{recentCaptures.length}</Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentCaptures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Chrome className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No captures yet</p>
              <p className="text-xs mt-1">Install the extension and start scraping</p>
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {recentCaptures.map((capture) => (
                  <div 
                    key={capture.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Link2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {formatCaptureType(capture.capture_type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {capture.device_source || 'chrome'} · {new Date(capture.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={capture.status === 'completed' ? 'secondary' : 'outline'}>
                      {capture.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Apply to Contact Button */}
        {profileId && recentCaptures.length > 0 && (
          <Button className="w-full" variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Apply Latest Capture to Contact
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ChromeExtensionBridge;
