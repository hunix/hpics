import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';

interface PushNotificationBannerProps {
  onEnable?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function PushNotificationBanner({ onEnable, onDismiss, className }: PushNotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // Show banner if permission hasn't been asked yet
      const dismissed = localStorage.getItem('push-banner-dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        // Delay showing banner to not be intrusive
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnable = async () => {
    await hapticFeedback('medium');
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        onEnable?.();
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  const handleDismiss = async () => {
    await hapticFeedback('light');
    localStorage.setItem('push-banner-dismissed', 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isSupported || !isVisible || permission !== 'default') {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bottom-20 left-4 right-4 z-40 p-4 md:hidden",
      "animate-in slide-in-from-bottom-4 duration-300",
      "shadow-lg border-primary/20",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Enable Notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get reminders for follow-ups, events, and relationship decay alerts
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
          Not now
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={handleEnable}
        >
          <Check className="h-4 w-4 mr-1" />
          Enable
        </Button>
      </div>
    </Card>
  );
}
