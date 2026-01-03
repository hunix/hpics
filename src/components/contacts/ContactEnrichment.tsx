import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Linkedin, Globe, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContactEnrichmentProps {
  profileId: string;
  profileName: string;
  linkedinUrl?: string | null;
  onEnriched?: () => void;
}

export function ContactEnrichment({ profileId, profileName, linkedinUrl, onEnriched }: ContactEnrichmentProps) {
  const queryClient = useQueryClient();
  const [customLinkedinUrl, setCustomLinkedinUrl] = useState(linkedinUrl || '');
  const [searchQuery, setSearchQuery] = useState('');

  const enrichMutation = useMutation({
    mutationFn: async ({ type }: { type: 'linkedin' | 'search' }) => {
      const payload: any = { profileId };
      
      if (type === 'linkedin' && customLinkedinUrl) {
        payload.linkedinUrl = customLinkedinUrl;
      } else if (type === 'search' && searchQuery) {
        payload.searchQuery = searchQuery;
      }

      const { data, error } = await supabase.functions.invoke('enrich-contact', {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      toast.success('Contact enriched successfully!');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['education'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      onEnriched?.();
    },
    onError: (error: Error) => {
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
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Uses AI-powered web scraping to find and extract professional information about {profileName}.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin-url" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn Profile URL
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
              >
                {enrichMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
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
              Search the web for public information about this contact
            </p>
          </div>
        </div>

        {enrichMutation.isSuccess && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Successfully enriched contact data. Check the Education, Skills, and Certifications tabs for new information.
            </AlertDescription>
          </Alert>
        )}

        {enrichMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {(enrichMutation.error as Error).message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
