import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Eye, TrendingDown, Shield, AlertCircle, MessageSquare, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReputationIncident {
  id: string;
  incident_type: string;
  source_platform: string;
  severity_score: number;
  status: string;
  detected_at: string;
  content_summary?: string;
}

interface IncidentSummary {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  averageSeverity: number;
  last30Days: number;
}

export function ReputationDefensePanel({ profileId }: { profileId?: string }) {
  const [incidents, setIncidents] = useState<ReputationIncident[]>([]);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [newThreat, setNewThreat] = useState({ content: '', platform: '', followerCount: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('reputation-defense-engine', {
        body: { action: 'get_incidents' }
      });

      if (error) throw error;
      setIncidents(data.incidents || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  };

  const analyzeThreat = async () => {
    if (!newThreat.content.trim()) {
      toast({ title: 'Error', description: 'Enter content to analyze', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reputation-defense-engine', {
        body: {
          action: 'analyze_threat',
          profileId,
          incidentDetails: {
            content: newThreat.content,
            platform: newThreat.platform,
            followerCount: newThreat.followerCount
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Threat Analyzed',
        description: `Severity: ${data.analysis.severityScore}% - Response: ${data.analysis.responseType}`
      });

      setShowAnalyze(false);
      setNewThreat({ content: '', platform: '', followerCount: 0 });
      fetchIncidents();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({ title: 'Error', description: 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'bg-destructive text-destructive-foreground';
    if (score >= 60) return 'bg-orange-500 text-white';
    if (score >= 40) return 'bg-yellow-500 text-black';
    return 'bg-green-500 text-white';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-destructive/20 text-destructive';
      case 'responding': return 'bg-yellow-500/20 text-yellow-600';
      case 'resolved': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Reputation Defense Center
              </CardTitle>
              <CardDescription>
                Monitor and respond to reputation threats across platforms
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchIncidents}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowAnalyze(!showAnalyze)}>
                {showAnalyze ? 'Cancel' : 'Analyze Threat'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAnalyze && (
            <Card className="mb-6 border-primary/50">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Threat Content</label>
                  <Textarea
                    value={newThreat.content}
                    onChange={e => setNewThreat(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Paste the threatening content..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Platform</label>
                    <Input
                      value={newThreat.platform}
                      onChange={e => setNewThreat(prev => ({ ...prev, platform: e.target.value }))}
                      placeholder="Twitter, Reddit, etc."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Source Followers</label>
                    <Input
                      type="number"
                      value={newThreat.followerCount}
                      onChange={e => setNewThreat(prev => ({ ...prev, followerCount: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <Button onClick={analyzeThreat} disabled={isLoading} className="w-full">
                  {isLoading ? 'Analyzing...' : 'Analyze Threat'}
                </Button>
              </CardContent>
            </Card>
          )}

          {summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{summary.totalIncidents}</div>
                  <div className="text-sm text-muted-foreground">Total Incidents</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-destructive">{summary.activeIncidents}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{summary.resolvedIncidents}</div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{summary.averageSeverity}%</div>
                  <div className="text-sm text-muted-foreground">Avg Severity</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active Threats</TabsTrigger>
              <TabsTrigger value="all">All Incidents</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div>No active reputation threats</div>
                </div>
              ) : (
                incidents.filter(i => i.status !== 'resolved').map(incident => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3">
              {incidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function IncidentCard({ incident }: { incident: ReputationIncident }) {
  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'bg-destructive text-destructive-foreground';
    if (score >= 60) return 'bg-orange-500 text-white';
    if (score >= 40) return 'bg-yellow-500 text-black';
    return 'bg-green-500 text-white';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-destructive/20 text-destructive';
      case 'responding': return 'bg-yellow-500/20 text-yellow-600';
      case 'resolved': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize">
                {incident.incident_type.replace(/_/g, ' ')}
              </Badge>
              <Badge variant="outline">
                {incident.source_platform}
              </Badge>
              <Badge className={getStatusColor(incident.status)}>
                {incident.status}
              </Badge>
            </div>
            {incident.content_summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {incident.content_summary}
              </p>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              Detected: {new Date(incident.detected_at).toLocaleString()}
            </div>
          </div>
          <Badge className={getSeverityColor(incident.severity_score)}>
            {incident.severity_score}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
