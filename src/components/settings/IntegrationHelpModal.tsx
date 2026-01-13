import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ExternalLink, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen,
  Key,
  Zap,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useIntegrationGuide, type IntegrationGuide } from '@/hooks/useIntegrationGuide';
import { cn } from '@/lib/utils';

interface IntegrationHelpModalProps {
  integrationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function DifficultyBadge({ level }: { level: string }) {
  const colors = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn('capitalize', colors[level as keyof typeof colors] || colors.medium)}
    >
      {level}
    </Badge>
  );
}

function StepList({ steps, title }: { steps: { step: number; title: string; description: string }[]; title: string }) {
  if (!steps || steps.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.step} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {step.step}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideContent({ guide }: { guide: IntegrationGuide }) {
  return (
    <ScrollArea className="max-h-[70vh] pr-4">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge level={guide.difficulty_level} />
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {guide.estimated_setup_time}
          </Badge>
          {guide.has_connector && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Connector Available
            </Badge>
          )}
          {guide.requires_oauth && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              OAuth Required
            </Badge>
          )}
        </div>
        
        {/* Description */}
        {guide.usage_description && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm">{guide.usage_description}</p>
          </div>
        )}
        
        {/* Features */}
        {guide.features_enabled && guide.features_enabled.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Features Enabled
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {guide.features_enabled.map((feature, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <Separator />
        
        {/* Pricing */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </h4>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm font-medium text-green-400">
              {guide.free_tier_limits || 'Check pricing page'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Model: {guide.pricing_model?.replace(/-/g, ' ') || 'Unknown'}
            </p>
          </div>
          {guide.pricing_url && (
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <a href={guide.pricing_url} target="_blank" rel="noopener noreferrer">
                View full pricing <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
        
        <Separator />
        
        {/* Accordion for detailed steps */}
        <Accordion type="multiple" defaultValue={['registration', 'api-key']} className="w-full">
          {/* Registration Steps */}
          <AccordionItem value="registration">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>1. Registration</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {guide.registration_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={guide.registration_url} target="_blank" rel="noopener noreferrer">
                      Open Registration Page <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                <StepList steps={guide.registration_steps} title="Steps" />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* API Key Generation */}
          <AccordionItem value="api-key">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <span>2. Get API Key</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {guide.api_key_location && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground">Location:</p>
                    <p className="text-sm font-medium">{guide.api_key_location}</p>
                  </div>
                )}
                <StepList steps={guide.api_key_steps} title="Steps" />
                {guide.api_key_format && (
                  <div className="p-3 rounded-lg bg-muted/50 border font-mono text-xs">
                    Format: <span className="text-primary">{guide.api_key_format}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Add to System */}
          <AccordionItem value="add-system">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>3. Add to System</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Copy your API key</p>
                    <p className="text-xs text-muted-foreground">From the service dashboard</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Paste in the API Key field</p>
                    <p className="text-xs text-muted-foreground">In the integration card on this page</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Test the connection</p>
                    <p className="text-xs text-muted-foreground">Click the Test button to verify it works</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-sm">Save the integration</p>
                    <p className="text-xs text-muted-foreground">Click Save to store your API key securely</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Troubleshooting */}
          {guide.common_errors && guide.common_errors.length > 0 && (
            <AccordionItem value="troubleshooting">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Troubleshooting</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {guide.common_errors.map((err, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border space-y-1">
                      <p className="text-sm font-medium text-red-400">{err.error}</p>
                      <p className="text-xs text-muted-foreground">Cause: {err.cause}</p>
                      <p className="text-xs text-green-400">Solution: {err.solution}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
        
        {/* Documentation Links */}
        <div className="flex flex-wrap gap-2 pt-4">
          {guide.documentation_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={guide.documentation_url} target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4 mr-1" />
                Documentation
              </a>
            </Button>
          )}
          {guide.support_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={guide.support_url} target="_blank" rel="noopener noreferrer">
                <HelpCircle className="h-4 w-4 mr-1" />
                Support
              </a>
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

export function IntegrationHelpModal({ integrationId, isOpen, onClose }: IntegrationHelpModalProps) {
  const { data: guide, isLoading, error } = useIntegrationGuide(integrationId);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {guide?.display_name || 'Integration Setup Guide'}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Failed to load guide</p>
          </div>
        ) : guide ? (
          <GuideContent guide={guide} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No guide available for this integration</p>
            <p className="text-xs mt-1">Check the service's documentation directly</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
