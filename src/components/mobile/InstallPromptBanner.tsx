import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Chrome, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  hapticFeedback, 
  promptInstall, 
  isAppInstalled, 
  hasInstallPrompt, 
  captureInstallPrompt,
  detectBrowser,
  getInstallInstructions,
  isAndroid
} from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface InstallPromptBannerProps {
  className?: string;
}

export function InstallPromptBanner({ className }: InstallPromptBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [canAutoInstall, setCanAutoInstall] = useState(false);
  const [showEdgeTip, setShowEdgeTip] = useState(false);

  useEffect(() => {
    // Capture the install prompt
    captureInstallPrompt();
    
    // Check if can show install prompt
    const installed = isAppInstalled();
    const dismissed = localStorage.getItem('install-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000; // Show again after 1 day
    
    if (installed) return;
    
    const browser = detectBrowser();
    const instructions = getInstallInstructions();
    
    // For Edge on Android, show immediately with special messaging
    if (browser === 'edge' && isAndroid()) {
      setShowEdgeTip(true);
      if (dismissedTime < dayAgo) {
        setTimeout(() => setIsVisible(true), 2000); // Show faster for Edge
      }
      return;
    }
    
    // For other browsers, wait for install prompt or show after delay
    if (dismissedTime < dayAgo) {
      const timer = setTimeout(() => {
        setCanAutoInstall(hasInstallPrompt());
        setIsVisible(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for install prompt being captured
  useEffect(() => {
    const checkPrompt = () => {
      if (hasInstallPrompt()) {
        setCanAutoInstall(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', checkPrompt);
    return () => window.removeEventListener('beforeinstallprompt', checkPrompt);
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

  const browser = detectBrowser();

  return (
    <Card className={cn(
      "fixed bottom-20 left-4 right-4 z-40 p-4 md:hidden",
      "animate-in slide-in-from-bottom-4 duration-300",
      "shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
      "safe-area-mb",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">Install PICS App</p>
            {showEdgeTip && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Edge
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {showEdgeTip 
              ? 'Add to home screen for quick access'
              : 'Get faster access and offline support'
            }
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
          className="flex-1 touch-target"
          onClick={handleDismiss}
        >
          Maybe later
        </Button>
        
        {canAutoInstall && !showEdgeTip ? (
          <Button
            size="sm"
            className="flex-1 touch-target"
            onClick={handleInstall}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Install
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 touch-target"
            asChild
          >
            <Link to="/install">
              {showEdgeTip ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  How to Install
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1.5" />
                  Learn How
                </>
              )}
            </Link>
          </Button>
        )}
      </div>

      {/* Chrome recommendation for Edge users */}
      {showEdgeTip && (
        <div className="mt-3 pt-3 border-t border-primary/10">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Chrome className="h-3.5 w-3.5 text-primary" />
            For full app experience, try opening in Chrome
          </p>
        </div>
      )}
    </Card>
  );
}
