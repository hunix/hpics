/**
 * @fileoverview Downloads Hub Page
 * Unified download center for Desktop App, Chrome Extension, and Mobile PWA
 */

import React, { useState, useEffect } from 'react';
import { 
  Monitor, Chrome, Smartphone, Download, CheckCircle2, 
  ExternalLink, Package, Shield, Zap, Globe, Apple, 
  Play, Info, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/shared/PageHeader';
import { Section, SectionHeader } from '@/components/shared/Section';
import { DataCard, DataCardHeader, DataCardContent } from '@/components/shared/DataCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import { 
  captureInstallPrompt, 
  promptInstall, 
  isAppInstalled, 
  getInstallInstructions,
  detectBrowser,
  hasInstallPrompt,
} from '@/lib/nativeFeatures';
import { useToast } from '@/hooks/use-toast';

// Version info
const VERSIONS = {
  desktop: '1.2.0',
  extension: '2.1.3',
  pwa: '3.0.0',
};

// Platform detection
const getPlatform = () => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  return 'unknown';
};

interface DownloadCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor?: string;
  version: string;
  status: 'available' | 'installed' | 'coming-soon';
  features: string[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  instructions?: string[];
  badge?: string;
  platform?: string;
}

function DownloadCard({
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  version,
  status,
  features,
  primaryAction,
  secondaryAction,
  instructions,
  badge,
  platform,
}: DownloadCardProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <DataCard className="h-full">
      {/* Custom header to support React.ElementType icons */}
      <div className="flex items-start justify-between gap-4 px-4 py-3 border-b">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn(
            'p-3 rounded-xl bg-primary/10 shrink-0',
            status === 'installed' && 'bg-green-500/10',
            status === 'coming-soon' && 'bg-muted'
          )}>
            <Icon className={cn('w-6 h-6', iconColor, status === 'coming-soon' && 'text-muted-foreground')} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
          </div>
        </div>
        <StatusBadge
          status={
            status === 'installed' ? 'success' :
            status === 'coming-soon' ? 'warning' : 'info'
          }
          label={status === 'installed' ? 'Installed' :
                 status === 'coming-soon' ? 'Coming Soon' : `v${version}`}
        />
      </div>
      
      <DataCardContent className="space-y-4">
        {/* Features */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Platform info */}
        {platform && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span>{platform}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || status === 'coming-soon'}
              className="flex-1 min-w-[120px]"
            >
              <Download className="w-4 h-4 mr-2" />
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              variant="outline" 
              onClick={secondaryAction.onClick}
              className="flex-1 min-w-[120px]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {secondaryAction.label}
            </Button>
          )}
        </div>

        {/* Collapsible Instructions */}
        {instructions && instructions.length > 0 && (
          <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Installation Instructions
                </span>
                {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  {instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </DataCardContent>
    </DataCard>
  );
}

export default function Downloads() {
  const { toast } = useToast();
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const platform = getPlatform();
  const browser = detectBrowser();
  const pwaInstructions = getInstallInstructions();

  useEffect(() => {
    const cleanupInstallPrompt = captureInstallPrompt();
    setPwaInstalled(isAppInstalled());

    const checkPrompt = setInterval(() => {
      if (hasInstallPrompt()) {
        setCanInstallPwa(true);
      }
    }, 1000);

    setTimeout(() => clearInterval(checkPrompt), 5000);
    return () => {
      clearInterval(checkPrompt);
      if (cleanupInstallPrompt) cleanupInstallPrompt();
    };
  }, []);

  const handlePwaInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setPwaInstalled(true);
      toast({
        title: 'App Installed',
        description: 'PICS has been installed on your device.',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Command copied to clipboard',
    });
  };

  const desktopDownloadUrl = () => {
    if (platform === 'windows') return '/downloads/PICS-Setup-win.exe';
    if (platform === 'macos') return '/downloads/PICS-Setup-mac.dmg';
    if (platform === 'linux') return '/downloads/PICS-Setup-linux.AppImage';
    return '/downloads/PICS-Setup-win.exe';
  };

  return (
    <AppLayout title="Downloads">
      <div className="space-y-8">
        <PageHeader
          title="Download PICS"
          description="Get PICS on all your devices. Choose the platform that works best for you."
          icon={Package}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-4 text-center">
              <Monitor className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Desktop</p>
              <p className="text-xs text-muted-foreground">Win, Mac, Linux</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="pt-4 text-center">
              <Chrome className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-sm font-medium">Extension</p>
              <p className="text-xs text-muted-foreground">Chrome, Edge</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="pt-4 text-center">
              <Smartphone className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm font-medium">Mobile</p>
              <p className="text-xs text-muted-foreground">iOS, Android</p>
            </CardContent>
          </Card>
        </div>

        {/* Download Cards */}
        <Section>
          <SectionHeader 
            title="Available Downloads" 
            subtitle="Choose the version for your platform"
          />
          
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Desktop App */}
            <DownloadCard
              title="Desktop App"
              description="Native desktop application with system integration"
              icon={Monitor}
              iconColor="text-primary"
              version={VERSIONS.desktop}
              status="available"
              badge="Recommended"
              platform={
                platform === 'windows' ? 'Windows 10/11' :
                platform === 'macos' ? 'macOS 11+' :
                platform === 'linux' ? 'Linux' : 'All Platforms'
              }
              features={[
                'System tray integration',
                'Global hotkeys (Ctrl+Shift+I)',
                'Background sync',
                'Native notifications',
                'Offline mode',
                'Auto-updates',
              ]}
              primaryAction={{
                label: platform === 'windows' ? 'Download .exe' :
                       platform === 'macos' ? 'Download .dmg' :
                       platform === 'linux' ? 'Download .AppImage' : 'Download',
                onClick: () => window.open(desktopDownloadUrl(), '_blank'),
              }}
              secondaryAction={{
                label: 'View on GitHub',
                onClick: () => window.open('https://github.com/your-repo/pics-desktop/releases', '_blank'),
              }}
              instructions={[
                'Download the installer for your platform',
                'Run the installer and follow the prompts',
                'Sign in with your PICS account',
                'Enable system tray for background sync',
              ]}
            />

            {/* Chrome Extension */}
            <DownloadCard
              title="Chrome Extension"
              description="Capture profiles from 15+ social platforms"
              icon={Chrome}
              iconColor="text-amber-500"
              version={VERSIONS.extension}
              status="available"
              platform="Chrome, Edge, Brave"
              features={[
                'One-click profile capture',
                '15+ platforms supported',
                'Auto-detect profiles',
                'Bulk import',
                'Cross-platform identity linking',
                'Privacy-first design',
              ]}
              primaryAction={{
                label: 'Add to Chrome',
                onClick: () => window.open('https://chrome.google.com/webstore/detail/your-extension-id', '_blank'),
              }}
              secondaryAction={{
                label: 'Manual Install',
                onClick: () => window.open('/downloads/pics-extension.zip', '_blank'),
              }}
              instructions={[
                'Click "Add to Chrome" to install from Web Store',
                'Pin the extension to your toolbar',
                'Click the extension icon and sign in',
                'Visit any supported social profile to capture',
              ]}
            />

            {/* Mobile PWA */}
            <DownloadCard
              title="Mobile App (PWA)"
              description="Progressive Web App for mobile devices"
              icon={Smartphone}
              iconColor="text-green-500"
              version={VERSIONS.pwa}
              status={pwaInstalled ? 'installed' : 'available'}
              platform={
                platform === 'ios' ? 'iOS Safari' :
                platform === 'android' ? 'Android Chrome' : 'All Mobile Browsers'
              }
              features={[
                'Works offline',
                'Push notifications',
                'Home screen access',
                'Native-like experience',
                'Auto-updates',
                'No app store required',
              ]}
              primaryAction={{
                label: pwaInstalled ? 'Already Installed' : 
                       canInstallPwa ? 'Install Now' : 'How to Install',
                onClick: canInstallPwa ? handlePwaInstall : () => {},
                disabled: pwaInstalled,
              }}
              instructions={pwaInstructions.steps}
            />
          </div>
        </Section>

        {/* Platform-Specific Instructions */}
        <Section>
          <SectionHeader title="Installation Guides" subtitle="Detailed setup instructions by platform" />
          
          <Tabs defaultValue={platform === 'windows' ? 'windows' : platform === 'macos' ? 'macos' : 'linux'}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="windows" className="gap-2">
                <Monitor className="w-4 h-4" />
                Windows
              </TabsTrigger>
              <TabsTrigger value="macos" className="gap-2">
                <Apple className="w-4 h-4" />
                macOS
              </TabsTrigger>
              <TabsTrigger value="linux" className="gap-2">
                <Monitor className="w-4 h-4" />
                Linux
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="windows" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Windows Installation</CardTitle>
                  <CardDescription>Install PICS on Windows 10/11</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>Download <code className="px-1.5 py-0.5 bg-muted rounded text-xs">PICS-Setup-win.exe</code></li>
                    <li>Run the installer (right-click → "Run as administrator" if needed)</li>
                    <li>Follow the installation wizard</li>
                    <li>Launch PICS from the Start Menu or Desktop shortcut</li>
                    <li>Sign in with your account to enable sync</li>
                  </ol>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Or install via Winget:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background px-3 py-2 rounded border">
                        winget install PICS.Desktop
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('winget install PICS.Desktop')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="macos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">macOS Installation</CardTitle>
                  <CardDescription>Install PICS on macOS 11 Big Sur or later</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>Download <code className="px-1.5 py-0.5 bg-muted rounded text-xs">PICS-Setup-mac.dmg</code></li>
                    <li>Open the .dmg file</li>
                    <li>Drag PICS to the Applications folder</li>
                    <li>Right-click PICS and select "Open" (first time only)</li>
                    <li>Grant necessary permissions when prompted</li>
                  </ol>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Or install via Homebrew:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background px-3 py-2 rounded border">
                        brew install --cask pics
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('brew install --cask pics')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linux" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Linux Installation</CardTitle>
                  <CardDescription>Install PICS on Ubuntu, Fedora, or other distributions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>Download <code className="px-1.5 py-0.5 bg-muted rounded text-xs">PICS-Setup-linux.AppImage</code></li>
                    <li>Make the file executable: <code className="px-1.5 py-0.5 bg-muted rounded text-xs">chmod +x PICS*.AppImage</code></li>
                    <li>Run the AppImage</li>
                    <li>Optional: Use AppImageLauncher for integration</li>
                  </ol>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground">Or install via Snap:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background px-3 py-2 rounded border">
                        sudo snap install pics
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('sudo snap install pics')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mobile" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Apple className="w-5 h-5" />
                      iOS (iPhone/iPad)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Open this page in Safari</li>
                      <li>Tap the Share button (square with arrow)</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Android
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Open this page in Chrome</li>
                      <li>Tap the menu (three dots)</li>
                      <li>Tap "Add to Home screen" or "Install app"</li>
                      <li>Tap "Install" to confirm</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Section>

        {/* System Requirements */}
        <Section>
          <SectionHeader title="System Requirements" />
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Desktop App
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Windows 10/11 (64-bit)</p>
                <p>• macOS 11+ (Intel/Apple Silicon)</p>
                <p>• Ubuntu 20.04+ / Fedora 34+</p>
                <p>• 4GB RAM minimum</p>
                <p>• 200MB disk space</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Chrome className="w-4 h-4" />
                  Chrome Extension
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Chrome 90+</p>
                <p>• Microsoft Edge 90+</p>
                <p>• Brave Browser</p>
                <p>• Opera (Chromium-based)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Mobile PWA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• iOS 14+ (Safari)</p>
                <p>• Android 8+ (Chrome)</p>
                <p>• Modern mobile browser</p>
                <p>• Internet connection for sync</p>
              </CardContent>
            </Card>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
