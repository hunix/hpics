import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Linkedin, Globe, Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface ContactEnrichmentProps {
  profileId: string;
  profileName: string;
  linkedinUrl?: string | null;
  onEnriched?: () => void;
}

interface EnrichmentResult {
  success: boolean;
  error?: string;
  message?: string;
  savedCount?: {
    education: number;
    skills: number;
    certifications: number;
    profileFields: number;
  };
  enrichmentData?: {
    linkedinError?: string;
    searchError?: string;
    source?: string;
  };
}

export function ContactEnrichment({ profileId, profileName, linkedinUrl, onEnriched }: ContactEnrichmentProps) {
  const queryClient = useQueryClient();
  const [customLinkedinUrl, setCustomLinkedinUrl] = useState(linkedinUrl || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastResult, setLastResult] = useState<EnrichmentResult | null>(null);

  const enrichMutation = useMutation({
    mutationFn: async ({ type }: { type: 'linkedin' | 'search' }): Promise<EnrichmentResult> => {
      const payload: any = { profileId };
      
      if (type === 'linkedin' && customLinkedinUrl) {
        payload.linkedinUrl = customLinkedinUrl;
      } else if (type === 'search' && searchQuery) {
        payload.searchQuery = searchQuery;
      }

      const { data, error } = await invokeFunction('enrich-contact', payload,);

      if (error) throw error;
      return data as EnrichmentResult;
    },
    onSuccess: (data) => {
      setLastResult(data);
      
      if (data.success) {
        const { savedCount } = data;
        const parts = [];
        if (savedCount?.education) parts.push(`${savedCount.education} education`);
        if (savedCount?.skills) parts.push(`${savedCount.skills} skills`);
        if (savedCount?.certifications) parts.push(`${savedCount.certifications} certifications`);
        if (savedCount?.profileFields) parts.push(`${savedCount.profileFields} profile fields`);
        
        toast.success('Contact enriched!', {
          description: parts.length > 0 ? `Added: ${parts.join(', ')}` : data.message,
        });
        
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        queryClient.invalidateQueries({ queryKey: ['education'] });
        queryClient.invalidateQueries({ queryKey: ['skills'] });
        queryClient.invalidateQueries({ queryKey: ['certifications'] });
        onEnriched?.();
      } else {
        toast.error('Enrichment incomplete', {
          description: data.error || 'No new data was found',
        });
      }
    },
    onError: (error: Error) => {
      setLastResult({ success: false, error: error.message });
      
      if (error.message.includes('not configured')) {
        toast.error('Firecrawl not connected', {
          description: 'Please connect Firecrawl in Settings to enable web enrichment.',
        });
      } else {
        toast.error('Enrichment failed', {
          description: error.message,
        });
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Enrich Contact Data
        </CardTitle>
        <CardDescription>
          Automatically fetch education, skills, and career info from the web
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Direct LinkedIn scraping requires a Firecrawl Enterprise plan. 
            The web search method works with all plans and can find publicly available professional information.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin-url" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn Profile URL (Enterprise only)
            </Label>
            <div className="flex gap-2">
              <Input
                id="linkedin-url"
                placeholder="https://linkedin.com/in/username"
                value={customLinkedinUrl}
                onChange={(e) => setCustomLinkedinUrl(e.target.value)}
              />
              <Button
                onClick={() => enrichMutation.mutate({ type: 'linkedin' })}
                disabled={!customLinkedinUrl || enrichMutation.isPending}
                variant="outline"
              >
                {enrichMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Will attempt LinkedIn scraping, then fall back to web search
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Recommended</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-query" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Web Search
            </Label>
            <div className="flex gap-2">
              <Input
                id="search-query"
                placeholder={`Search for "${profileName}"...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                onClick={() => enrichMutation.mutate({ type: 'search' })}
                disabled={enrichMutation.isPending}
              >
                {enrichMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Searches the web for public professional profiles, articles, and mentions
            </p>
          </div>
        </div>

        {lastResult?.success && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {lastResult.message}
            </AlertDescription>
          </Alert>
        )}

        {lastResult && !lastResult.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {lastResult.error}
              {lastResult.enrichmentData?.linkedinError && (
                <div className="mt-1 text-xs opacity-80">
                  {lastResult.enrichmentData.linkedinError}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
