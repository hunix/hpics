import { useState } from 'react';
import { 
  Globe, 
  Linkedin, 
  Mail, 
  Search, 
  DollarSign, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EnrichmentSource {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  estimatedCost: number;
  available: boolean;
  selected: boolean;
}

interface MobileEnrichmentPanelProps {
  profileId: string;
  profileName: string;
  hasEmail?: boolean;
  hasLinkedIn?: boolean;
  hasCompany?: boolean;
  onEnrichmentComplete?: () => void;
  className?: string;
}

const defaultSources: EnrichmentSource[] = [
  { id: 'perplexity', name: 'AI Search', icon: Search, description: 'Web intelligence', estimatedCost: 0.02, available: true, selected: true },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, description: 'Professional data', estimatedCost: 0.10, available: false, selected: false },
  { id: 'email', name: 'Email Intel', icon: Mail, description: 'Email verification', estimatedCost: 0.01, available: false, selected: false },
  { id: 'web', name: 'Web Scrape', icon: Globe, description: 'Company data', estimatedCost: 0.05, available: true, selected: true },
];

export function MobileEnrichmentPanel({
  profileId,
  profileName,
  hasEmail = false,
  hasLinkedIn = false,
  hasCompany = false,
  onEnrichmentComplete,
  className,
}: MobileEnrichmentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sources, setSources] = useState<EnrichmentSource[]>(() => 
    defaultSources.map(s => ({
      ...s,
      available: s.id === 'linkedin' ? hasLinkedIn : s.id === 'email' ? hasEmail : s.available
    }))
  );
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const selectedSources = sources.filter(s => s.selected && s.available);
  const totalCost = selectedSources.reduce((sum, s) => sum + s.estimatedCost, 0);

  const toggleSource = async (sourceId: string) => {
    await hapticFeedback('light');
    setSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, selected: !s.selected } : s
    ));
  };

  const handleEnrich = async () => {
    if (selectedSources.length === 0) {
      toast.error('Select at least one source');
      return;
    }

    await hapticFeedback('medium');
    setIsEnriching(true);
    setProgress(0);

    try {
      const steps = selectedSources.map(s => s.name);
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(`Querying ${steps[i]}...`);
        setProgress(((i + 0.5) / steps.length) * 100);
        
        // Simulate API call - replace with actual enrichment
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setProgress(((i + 1) / steps.length) * 100);
      }

      setCurrentStep('Processing results...');
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Enrichment complete', {
        description: `Found new data from ${selectedSources.length} sources`
      });
      
      onEnrichmentComplete?.();
      setIsOpen(false);
    } catch (error) {
      toast.error('Enrichment failed', {
        description: 'Some sources could not be reached'
      });
    } finally {
      setIsEnriching(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 touch-target", className)}
        >
          <Globe className="h-4 w-4" />
          Enrich
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-2xl safe-area-pb"
      >
        <div className="flex justify-center pt-2 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enrich {profileName}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-140px)] mt-4">
          <div className="space-y-4 pb-4">
            {/* Sources */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Data Sources</h3>
              {sources.map((source) => {
                const Icon = source.icon;
                return (
                  <Card 
                    key={source.id}
                    className={cn(
                      "transition-all",
                      !source.available && "opacity-50"
                    )}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          source.selected && source.available ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            source.selected && source.available ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{source.name}</p>
                          <p className="text-xs text-muted-foreground">{source.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          ${source.estimatedCost.toFixed(2)}
                        </Badge>
                        <Switch
                          checked={source.selected && source.available}
                          onCheckedChange={() => toggleSource(source.id)}
                          disabled={!source.available}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Missing data hints */}
            {(!hasEmail || !hasLinkedIn) && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Add more data to unlock sources:</p>
                      <ul className="text-muted-foreground mt-1 space-y-0.5">
                        {!hasEmail && <li>• Add email for email intelligence</li>}
                        {!hasLinkedIn && <li>• Add LinkedIn URL for professional data</li>}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer with cost and action */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-pb">
          {isEnriching ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{currentStep}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Estimated cost: ${totalCost.toFixed(2)}
                </p>
              </div>
              <Button 
                onClick={handleEnrich}
                disabled={selectedSources.length === 0}
                className="touch-target gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Enrich Now
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
