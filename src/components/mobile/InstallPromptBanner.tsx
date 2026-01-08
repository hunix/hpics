import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { hapticFeedback, promptInstall, isAppInstalled, canInstallPWA, captureInstallPrompt } from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';

interface InstallPromptBannerProps {
  className?: string;
}

export function InstallPromptBanner({ className }: InstallPromptBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Capture the install prompt
    captureInstallPrompt();
    
    // Check if can show install prompt
    const installed = isAppInstalled();
    const dismissed = localStorage.getItem('install-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Show if not installed, not recently dismissed, and can install
    if (!installed && dismissedTime < weekAgo) {
      // Check after a delay to allow install prompt to be captured
      const timer = setTimeout(() => {
        setCanInstall(canInstallPWA());
        setIsVisible(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    await hapticFeedback('medium');
    
    const installed = await promptInstall();
    if (installed) {
      setIsVisible(false);
    }
  };

  const handleDismiss = async () => {
    await hapticFeedback('light');
    localStorage.setItem('install-banner-dismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible || isAppInstalled()) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bottom-20 left-4 right-4 z-40 p-4 md:hidden",
      "animate-in slide-in-from-bottom-4 duration-300",
      "shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Install PICS App</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add to your home screen for faster access and offline support
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mt-1 -mr-1"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleDismiss}
        >
          Maybe later
        </Button>
        {canInstall ? (
          <Button
            size="sm"
            className="flex-1"
            onClick={handleInstall}
          >
            <Download className="h-4 w-4 mr-1" />
            Install
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            asChild
          >
            <a href="/install">
              <Download className="h-4 w-4 mr-1" />
              Learn How
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
