import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, AlertTriangle, Shield, FileText, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/lib/api';

interface LegalAnalysis {
  threatType: string;
  severity: string;
  likelihood: number;
  costRange: { low: number; high: number; currency: string };
  recommendedPosture: string;
  defenseStrategies: string[];
  evidenceNeeded: string[];
  timelineEstimate: string;
  counterMeasures: string[];
}

export function LawfareDefensePanel() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [threatDetails, setThreatDetails] = useState({
    description: '',
    demandLetter: false,
    priorActions: false,
    deadline: ''
  });
  const [adversaryInfo, setAdversaryInfo] = useState({
    type: 'individual',
    resources: 'unknown'
  });
  const [jurisdiction, setJurisdiction] = useState('');
  const [analysis, setAnalysis] = useState<LegalAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeThreat = async () => {
    if (!threatDetails.description.trim()) {
      toast({ title: 'Error', description: 'Describe the legal threat', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeFunction('lawfare-defense-analyzer', { threatDetails, adversaryInfo, jurisdiction });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: `Threat Type: ${data.analysis.threatType} - Severity: ${data.analysis.severity}`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({ title: 'Error', description: 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Lawfare Defense Analyzer
          </CardTitle>
          <CardDescription>
            Analyze legal threats and generate defense strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Threat Description</label>
            <Textarea
              value={threatDetails.description}
              onChange={e => setThreatDetails(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the legal threat or demand..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Adversary Type</label>
              <Select 
                value={adversaryInfo.type} 
                onValueChange={v => setAdversaryInfo(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Adversary Resources</label>
              <Select 
                value={adversaryInfo.resources} 
                onValueChange={v => setAdversaryInfo(prev => ({ ...prev, resources: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Jurisdiction</label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us_federal">US Federal</SelectItem>
                  <SelectItem value="us_state">US State</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="eu">European Union</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={threatDetails.demandLetter}
                onChange={e => setThreatDetails(prev => ({ ...prev, demandLetter: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Received demand letter</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={threatDetails.priorActions}
                onChange={e => setThreatDetails(prev => ({ ...prev, priorActions: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Prior legal actions by adversary</span>
            </label>
          </div>

          <Button onClick={analyzeThreat} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? 'Analyzing...' : 'Analyze Legal Threat'}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Threat Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Threat Type</span>
                <Badge variant="outline" className="capitalize">
                  {analysis.threatType.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Severity</span>
                <Badge className={getSeverityColor(analysis.severity)}>
                  {analysis.severity}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Likelihood</span>
                <span className="font-medium">{Math.round(analysis.likelihood * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recommended Posture</span>
                <Badge variant="outline" className="capitalize">
                  {analysis.recommendedPosture.replace(/_/g, ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Estimated Legal Costs</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(analysis.costRange.low)} - {formatCurrency(analysis.costRange.high)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Timeline Estimate</div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{analysis.timelineEstimate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Defense Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.defenseStrategies.map((strategy, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evidence Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {analysis.evidenceNeeded.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Counter-Measures</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {analysis.counterMeasures.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
