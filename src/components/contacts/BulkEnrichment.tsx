import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, CheckCircle, XCircle, Linkedin, Play, Square } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type EnrichmentResult = {
  profileId: string;
  profileName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
};

export function BulkEnrichment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shouldStop, setShouldStop] = useState(false);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts-for-enrichment', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch ALL contacts using recursive pagination
      const allContacts: any[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const start = page * pageSize;
        const end = start + pageSize - 1;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, linkedin_url, organization, job_title')
          .eq('user_id', user.id)
          .order('first_name')
          .range(start, end);

        if (error) throw error;

        if (data && data.length > 0) {
          allContacts.push(...data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return allContacts;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const contactsWithLinkedin = contacts?.filter(c => c.linkedin_url) ?? [];
  const contactsWithoutLinkedin = contacts?.filter(c => !c.linkedin_url) ?? [];

  const handleSelectAll = (withLinkedin: boolean) => {
    const targetContacts = withLinkedin ? contactsWithLinkedin : contactsWithoutLinkedin;
    const targetIds = targetContacts.map(c => c.id);
    const allSelected = targetIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !targetIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...targetIds])]);
    }
  };

  const toggleContact = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startEnrichment = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select contacts to enrich');
      return;
    }

    setIsProcessing(true);
    setShouldStop(false);
    setProgress(0);

    const initialResults: EnrichmentResult[] = selectedIds.map(id => {
      const contact = contacts?.find(c => c.id === id);
      return {
        profileId: id,
        profileName: `${contact?.first_name} ${contact?.last_name || ''}`.trim(),
        status: 'pending',
      };
    });
    setResults(initialResults);

    for (let i = 0; i < selectedIds.length; i++) {
      if (shouldStop) break;

      const profileId = selectedIds[i];
      const contact = contacts?.find(c => c.id === profileId);
      
      setResults(prev => prev.map(r => 
        r.profileId === profileId ? { ...r, status: 'processing' } : r
      ));

      try {
        const payload: any = { profileId };
        if (contact?.linkedin_url) {
          payload.linkedinUrl = contact.linkedin_url;
        } else {
          payload.searchQuery = `${contact?.first_name} ${contact?.last_name} ${contact?.organization || ''}`.trim();
        }

        const { data, error } = await supabase.functions.invoke('enrich-contact', {
          body: payload,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setResults(prev => prev.map(r => 
          r.profileId === profileId 
            ? { ...r, status: 'success', message: 'Enriched successfully' } 
            : r
        ));
      } catch (error) {
        setResults(prev => prev.map(r => 
          r.profileId === profileId 
            ? { ...r, status: 'error', message: error instanceof Error ? error.message : 'Failed' } 
            : r
        ));
      }

      setProgress(((i + 1) / selectedIds.length) * 100);
      
      // Add delay between requests to avoid rate limiting
      if (i < selectedIds.length - 1 && !shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsProcessing(false);
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['education'] });
    queryClient.invalidateQueries({ queryKey: ['skills'] });
    queryClient.invalidateQueries({ queryKey: ['certifications'] });
    
    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Enrichment complete: ${successCount}/${selectedIds.length} successful`);
  };

  const stopEnrichment = () => {
    setShouldStop(true);
    toast.info('Stopping enrichment...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Bulk Contact Enrichment
        </CardTitle>
        <CardDescription>
          Automatically enrich multiple contacts with web data. Contacts with LinkedIn URLs will be prioritized.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                This feature requires Firecrawl to be connected. Each enrichment will fetch education, skills, and career data from the web.
              </AlertDescription>
            </Alert>

            {/* Contacts with LinkedIn */}
            {contactsWithLinkedin.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    With LinkedIn URL ({contactsWithLinkedin.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(true)}
                  >
                    {contactsWithLinkedin.every(c => selectedIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {contactsWithLinkedin.map(contact => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIds.includes(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                        />
                        <span className="text-sm">
                          {contact.first_name} {contact.last_name}
                          {contact.organization && (
                            <span className="text-muted-foreground ml-1">- {contact.organization}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Contacts without LinkedIn */}
            {contactsWithoutLinkedin.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">
                    Without LinkedIn URL ({contactsWithoutLinkedin.length})
                    <span className="text-muted-foreground ml-2 font-normal text-xs">
                      Will use web search
                    </span>
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(false)}
                  >
                    {contactsWithoutLinkedin.every(c => selectedIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {contactsWithoutLinkedin.map(contact => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIds.includes(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                        />
                        <span className="text-sm">
                          {contact.first_name} {contact.last_name}
                          {contact.organization && (
                            <span className="text-muted-foreground ml-1">- {contact.organization}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedIds.length} selected
              </Badge>
              {isProcessing ? (
                <Button variant="destructive" onClick={stopEnrichment}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button onClick={startEnrichment} disabled={selectedIds.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Enrichment
                </Button>
              )}
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  Processing... {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Results</h4>
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="space-y-1">
                    {results.map(result => (
                      <div
                        key={result.profileId}
                        className="flex items-center justify-between p-2 rounded bg-muted/30"
                      >
                        <span className="text-sm">{result.profileName}</span>
                        <div className="flex items-center gap-2">
                          {result.status === 'pending' && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {result.status === 'processing' && (
                            <Badge className="bg-blue-500">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Processing
                            </Badge>
                          )}
                          {result.status === 'success' && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          )}
                          {result.status === 'error' && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              {result.message || 'Error'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
