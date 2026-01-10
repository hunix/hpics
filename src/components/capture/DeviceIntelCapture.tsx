import React, { useState, useCallback } from 'react';
import { Camera, Globe, Mic, FileText, Link, Smartphone, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScreenshotImporter } from './ScreenshotImporter';
import { SocialProfileScraper } from './SocialProfileScraper';
import { VoiceRecorder } from './VoiceRecorder';
import { cn } from '@/lib/utils';

interface DeviceIntelCaptureProps {
  profileId?: string;
  onCaptureComplete?: (captureId: string, data: any) => void;
  className?: string;
}

type CaptureTab = 'screenshot' | 'social' | 'voice' | 'document' | 'clipboard';

const CAPTURE_TABS: { id: CaptureTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'screenshot', label: 'Screenshot', icon: Camera, description: 'Import screenshots from social profiles' },
  { id: 'social', label: 'Web Scrape', icon: Globe, description: 'Automatically fetch profile data from URL' },
  { id: 'voice', label: 'Voice', icon: Mic, description: 'Record voice for transcription & signature' },
  { id: 'document', label: 'Document', icon: FileText, description: 'Scan documents and business cards' },
  { id: 'clipboard', label: 'Clipboard', icon: Link, description: 'Paste text or images from clipboard' },
];

export function DeviceIntelCapture({ profileId, onCaptureComplete, className }: DeviceIntelCaptureProps) {
  const [activeTab, setActiveTab] = useState<CaptureTab>('social');
  const { toast } = useToast();

  const handleCaptureComplete = useCallback((captureId: string, data: any) => {
    toast({
      title: 'Capture Complete',
      description: 'Data extracted and ready for review.',
    });
    onCaptureComplete?.(captureId, data);
  }, [onCaptureComplete, toast]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          Device Intel Capture
        </CardTitle>
        <CardDescription>
          Capture data from any source using your devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CaptureTab)}>
          <TabsList className="grid w-full grid-cols-5 h-auto">
            {CAPTURE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col gap-1 py-2 px-1 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-xs">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="screenshot" className="m-0">
              <ScreenshotImporter 
                profileId={profileId}
                onComplete={handleCaptureComplete}
              />
            </TabsContent>

            <TabsContent value="social" className="m-0">
              <SocialProfileScraper
                profileId={profileId}
                onComplete={handleCaptureComplete}
              />
            </TabsContent>

            <TabsContent value="voice" className="m-0">
              <VoiceRecorder
                profileId={profileId}
                onComplete={handleCaptureComplete}
              />
            </TabsContent>

            <TabsContent value="document" className="m-0">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Document scanning coming soon</p>
                <p className="text-sm mt-1">Use the Screenshot tab for now</p>
              </div>
            </TabsContent>

            <TabsContent value="clipboard" className="m-0">
              <ClipboardImporter 
                profileId={profileId}
                onComplete={handleCaptureComplete}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Clipboard Importer Component
function ClipboardImporter({ 
  profileId, 
  onComplete 
}: { 
  profileId?: string; 
  onComplete?: (id: string, data: any) => void;
}) {
  const [isPasting, setIsPasting] = useState(false);
  const [pastedContent, setPastedContent] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePaste = async () => {
    try {
      setIsPasting(true);
      
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        // Check for images
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types.find(t => t.startsWith('image/'))!);
          // Handle image paste - would upload to storage
          toast({
            title: 'Image Detected',
            description: 'Image pasted from clipboard. Processing...',
          });
          setPastedContent('[Image from clipboard]');
          return;
        }
        
        // Check for text
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          setPastedContent(text);
          
          // Check if it's a URL
          if (text.match(/^https?:\/\//)) {
            toast({
              title: 'URL Detected',
              description: 'Consider using the Web Scrape tab for better results.',
            });
          }
          return;
        }
      }
    } catch (error) {
      console.error('Clipboard read error:', error);
      toast({
        title: 'Clipboard Access Denied',
        description: 'Please allow clipboard access or use Ctrl+V manually.',
        variant: 'destructive',
      });
    } finally {
      setIsPasting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-6 border-2 border-dashed rounded-lg">
        <Link className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">
          Paste profile data, text, or images from your clipboard
        </p>
        <Button onClick={handlePaste} disabled={isPasting}>
          {isPasting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Paste from Clipboard
            </>
          )}
        </Button>
      </div>

      {pastedContent && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setPastedContent(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="bg-muted rounded-lg p-4 pr-10 max-h-40 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap break-words">
              {pastedContent.substring(0, 1000)}
              {pastedContent.length > 1000 && '...'}
            </pre>
          </div>
          <Button className="mt-3 w-full" disabled>
            Process Content (Coming Soon)
          </Button>
        </div>
      )}
    </div>
  );
}

export default DeviceIntelCapture;
