import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { 
  Globe, RefreshCw, ExternalLink, Newspaper, User, Building,
  FileText, AlertCircle, Clock, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface OSINTPanelProps {
  profileId: string;
  contactName: string;
}

interface OSINTFinding {
  id: string;
  finding_type: string;
  source: string;
  source_url: string | null;
  title: string;
  snippet: string | null;
  relevance_score: number | null;
  published_at: string | null;
  is_verified: boolean;
  created_at: string;
  metadata: any;
}

const findingTypeIcons: Record<string, any> = {
  news_mention: Newspaper,
  social_profile: User,
  company_update: Building,
  public_record: FileText,
  web_mention: Globe,
};

const findingTypeColors: Record<string, string> = {
  news_mention: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  social_profile: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  company_update: 'bg-green-500/10 text-green-600 border-green-500/20',
  public_record: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  web_mention: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function OSINTPanel({ profileId, contactName }: OSINTPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanTypes, setScanTypes] = useState<string[]>(['web', 'news']);
  const [deepScan, setDeepScan] = useState(false);

  const { data: findings, isLoading } = useQuery({
    queryKey: ['osint-findings', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('osint_findings')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OSINTFinding[];
    },
    enabled: !!user && !!profileId,
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('osint-scan', {
        body: { 
          profileId, 
          scanTypes,
          deepScan
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['osint-findings', profileId] });
      toast.success(`Found ${data.findings_count} new intelligence findings`);
    },
    onError: (error) => {
      toast.error('OSINT scan failed: ' + error.message);
    },
  });

  const toggleScanType = (type: string) => {
    setScanTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              OSINT Intelligence
            </CardTitle>
            <CardDescription>
              Open source intelligence gathered about {contactName}
            </CardDescription>
          </div>
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending || scanTypes.length === 0}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            {scanMutation.isPending ? 'Scanning...' : 'Run Scan'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Options */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
          <div className="text-sm font-medium">Scan Options</div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox 
                checked={scanTypes.includes('web')}
                onCheckedChange={() => toggleScanType('web')}
              />
              Web Mentions
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox 
                checked={scanTypes.includes('news')}
                onCheckedChange={() => toggleScanType('news')}
              />
              News Articles
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox 
                checked={scanTypes.includes('social')}
                onCheckedChange={() => toggleScanType('social')}
              />
              Social Profiles
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox 
                checked={deepScan}
                onCheckedChange={(checked) => setDeepScan(!!checked)}
              />
              Deep Scan
            </label>
          </div>
        </div>

        {/* Findings List */}
        {findings && findings.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {findings.map((finding) => {
                const Icon = findingTypeIcons[finding.finding_type] || Globe;
                const colorClass = findingTypeColors[finding.finding_type] || findingTypeColors.web_mention;
                
                return (
                  <div 
                    key={finding.id}
                    className="p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{finding.title}</h4>
                            {finding.is_verified && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Verified
                              </Badge>
                            )}
                          </div>
                          {finding.snippet && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {finding.snippet}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="capitalize">{finding.source}</span>
                            {finding.relevance_score && (
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(finding.relevance_score * 100)}% relevant
                              </Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(finding.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {finding.source_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => window.open(finding.source_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No OSINT findings yet</p>
            <p className="text-sm mb-4">Run a scan to discover public information about this contact</p>
            <Button 
              onClick={() => scanMutation.mutate()} 
              disabled={scanMutation.isPending || scanTypes.length === 0}
            >
              <Globe className="h-4 w-4 mr-2" />
              Start OSINT Scan
            </Button>
          </div>
        )}

        {/* Summary Stats */}
        {findings && findings.length > 0 && (
          <div className="grid grid-cols-4 gap-3 pt-3 border-t">
            {Object.entries(
              findings.reduce((acc, f) => {
                acc[f.finding_type] = (acc[f.finding_type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => {
              const Icon = findingTypeIcons[type] || Globe;
              return (
                <div key={type} className="text-center p-2">
                  <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
