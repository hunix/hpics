import React, { useState } from 'react';
import { Plus, Camera, Globe, Mic, Chrome, Link, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';

interface QuickCaptureProps {
  profileId?: string;
  onCaptureComplete?: (captureId: string, data: any) => void;
  className?: string;
  variant?: 'fab' | 'button' | 'inline';
}

export function QuickCapture({ profileId, onCaptureComplete, className, variant = 'fab' }: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'url' | 'screenshot' | 'voice' | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleQuickScrape = async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    try {
      let profileUrl = url.trim();
      if (!profileUrl.startsWith('http://') && !profileUrl.startsWith('https://')) {
        profileUrl = `https://${profileUrl}`;
      }

      const { data, error } = await invokeFunction('scrape-social-profile', {
          profileUrl,
          profileId,
          includeRecentPosts: true,
          maxPosts: 5,
        },);

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Profile Captured!',
        description: `Found ${data.data?.username || 'profile'} on ${data.platform}`,
      });

      onCaptureComplete?.(data.captureId, data.data);
      setUrl('');
      setActiveMode(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Quick scrape error:', error);
      toast({
        title: 'Capture Failed',
        description: error instanceof Error ? error.message : 'Failed to scrape profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const captureOptions = [
    { id: 'url', icon: Globe, label: 'Scrape URL', description: 'Enter a social profile URL' },
    { id: 'screenshot', icon: Camera, label: 'Screenshot', description: 'Import from phone/desktop' },
    { id: 'voice', icon: Mic, label: 'Voice Note', description: 'Record audio for analysis' },
    { id: 'extension', icon: Chrome, label: 'Extension', description: 'Private profile scraping' },
  ];

  const content = (
    <div className="space-y-4">
      {!activeMode ? (
        <div className="grid grid-cols-2 gap-2">
          {captureOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="h-auto flex-col items-center gap-2 p-4"
              onClick={() => setActiveMode(option.id as any)}
            >
              <option.icon className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
      ) : activeMode === 'url' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Quick URL Scrape</Label>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveMode(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="instagram.com/username"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickScrape()}
              disabled={isLoading}
              autoFocus
            />
            <Button onClick={handleQuickScrape} disabled={!url.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Instagram, Twitter, LinkedIn, Threads, TikTok, etc.
          </p>
        </div>
      ) : (
        <div className="text-center py-4">
          <Button variant="ghost" size="sm" onClick={() => setActiveMode(null)}>
            ← Back to options
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Use the full capture panel for {activeMode} capture
          </p>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return <div className={className}>{content}</div>;
  }

  if (variant === 'button') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className={className}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Capture
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Capture</DialogTitle>
            <DialogDescription>
              Quickly capture intelligence from any source
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // FAB variant (default)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="lg"
          className={cn(
            'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
            'hover:scale-105 transition-transform',
            className
          )}
        >
          <Plus className={cn('h-6 w-6 transition-transform', isOpen && 'rotate-45')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" side="top" sideOffset={16}>
        <div className="space-y-2">
          <h4 className="font-medium">Quick Capture</h4>
          <p className="text-xs text-muted-foreground">Capture intelligence instantly</p>
        </div>
        <div className="mt-4">{content}</div>
      </PopoverContent>
    </Popover>
  );
}

export default QuickCapture;
