import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Monitor, Check, Share, Chrome, Globe, AlertCircle } from "lucide-react";
import { 
  captureInstallPrompt, 
  promptInstall, 
  isAppInstalled, 
  getInstallInstructions,
  detectBrowser,
  hasInstallPrompt,
  type BrowserType 
} from "@/lib/nativeFeatures";
import { cn } from "@/lib/utils";

const browserIcons: Record<BrowserType, React.ReactNode> = {
  chrome: <Chrome className="h-5 w-5" />,
  edge: <Globe className="h-5 w-5" />,
  safari: <Globe className="h-5 w-5" />,
  firefox: <Globe className="h-5 w-5" />,
  samsung: <Smartphone className="h-5 w-5" />,
  opera: <Globe className="h-5 w-5" />,
  unknown: <Globe className="h-5 w-5" />,
};

const browserNames: Record<BrowserType, string> = {
  chrome: 'Google Chrome',
  edge: 'Microsoft Edge',
  safari: 'Safari',
  firefox: 'Firefox',
  samsung: 'Samsung Internet',
  opera: 'Opera',
  unknown: 'Your Browser',
};

const Install = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [instructions, setInstructions] = useState(getInstallInstructions());

  useEffect(() => {
    captureInstallPrompt();
    setIsInstalled(isAppInstalled());

    const handleInstallPrompt = () => {
      setCanInstall(true);
      setInstructions(getInstallInstructions());
    };
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Check periodically if install prompt was captured
    const checkInterval = setInterval(() => {
      if (hasInstallPrompt()) {
        setCanInstall(true);
        setInstructions(getInstallInstructions());
      }
    }, 1000);

    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      clearInterval(checkInterval);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsInstalled(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background safe-area-inset">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>App Installed!</CardTitle>
            <CardDescription>
              PICS is installed on your device. You can access it from your home screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>
              Open Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const browser = detectBrowser();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background safe-area-inset">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Install PICS</CardTitle>
          <CardDescription>
            Install the app for a better experience with offline access and quick launch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser detection badge */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              {browserIcons[browser]}
              <span>{browserNames[browser]}</span>
            </Badge>
            {instructions.platform !== 'desktop' && (
              <Badge variant="secondary">
                {instructions.platform === 'ios' ? 'iOS' : 'Android'}
              </Badge>
            )}
          </div>

          {/* Auto-install button if available */}
          {canInstall && instructions.canAutoInstall && (
            <Button onClick={handleInstall} className="w-full touch-target" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Install Now
            </Button>
          )}

          {/* Manual instructions */}
          <div className={cn(
            "p-4 bg-muted rounded-lg space-y-3",
            canInstall && instructions.canAutoInstall && "opacity-60"
          )}>
            <h3 className="font-medium flex items-center gap-2">
              {instructions.platform === 'desktop' ? (
                <Monitor className="h-4 w-4" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              {canInstall && instructions.canAutoInstall 
                ? 'Or install manually:' 
                : `Install on ${browserNames[browser]}`}
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              {instructions.steps.map((step, index) => (
                <li key={index} className="leading-relaxed">
                  {step.includes('Share') ? (
                    <span className="inline-flex items-center gap-1">
                      {step.split('Share')[0]}
                      <Share className="inline h-4 w-4 align-middle" />
                      Share{step.split('Share')[1]}
                    </span>
                  ) : (
                    step
                  )}
                </li>
              ))}
            </ol>
            
            {/* Browser-specific note */}
            {instructions.note && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-warning/10 rounded text-xs text-warning-foreground">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                <span>{instructions.note}</span>
              </div>
            )}
          </div>

          {/* Alternative browser suggestion for Edge */}
          {browser === 'edge' && instructions.platform === 'android' && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Chrome className="h-4 w-4 text-primary" />
                Recommended: Use Chrome
              </h4>
              <p className="text-xs text-muted-foreground">
                For the best app experience, open this page in Chrome. Chrome installs 
                full PWAs while Edge creates shortcuts.
              </p>
              <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                <a href={`intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`}>
                  Open in Chrome
                </a>
              </Button>
            </div>
          )}

          {/* Benefits section */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Benefits of Installing</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                Quick access from home screen
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                Works offline
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                Push notifications
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                Full-screen experience
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                Faster loading times
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
