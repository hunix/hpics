import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Check, Share, Plus } from "lucide-react";
import { captureInstallPrompt, promptInstall, isAppInstalled, getPlatform } from "@/lib/nativeFeatures";

const Install = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    captureInstallPrompt();
    setIsInstalled(isAppInstalled());
    setPlatform(getPlatform());

    const handleInstallPrompt = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
          {canInstall && (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Install Now
            </Button>
          )}

          {!canInstall && platform === 'web' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4" />
                  Desktop (Chrome/Edge)
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Click the install icon in the address bar</li>
                  <li>Or click the menu (⋮) → "Install PICS"</li>
                </ol>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4" />
                  iOS (Safari)
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Tap the Share button <Share className="inline h-3 w-3" /></li>
                  <li>Scroll and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4" />
                  Android (Chrome)
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Tap the menu (⋮)</li>
                  <li>Tap "Add to Home screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Benefits of Installing</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Quick access from home screen
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Works offline
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Push notifications
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Full-screen experience
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
