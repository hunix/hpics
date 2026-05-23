import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UserX, AlertTriangle, Shield, Search, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invokeFunction } from '@/lib/api';

interface AnalysisResult {
  isSocialEngineering: boolean;
  threatLevel: number;
  attackType: string;
  attackVector: string;
  techniques: string[];
  confidence: number;
  recommendations: string[];
}

export function SocialEngineeringDetector() {
  const [messageContent, setMessageContent] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeMessage = async () => {
    if (!messageContent.trim()) {
      toast({ title: 'Error', description: 'Enter message content to analyze', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeFunction('social-engineering-detector', {
          messageContent,
          senderInfo: senderInfo ? { identifier: senderInfo } : undefined,
          context: { channel: 'email' }
        });

      if (error) throw error;

      setResult(data.analysis);

      if (data.analysis.isSocialEngineering) {
        toast({
          title: '⚠️ Social Engineering Detected',
          description: `Threat level: ${Math.round(data.analysis.threatLevel * 100)}%`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Analysis Complete',
          description: 'No significant social engineering indicators detected'
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({ title: 'Error', description: 'Analysis failed', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getThreatColor = (level: number) => {
    if (level >= 0.8) return 'text-destructive';
    if (level >= 0.6) return 'text-orange-500';
    if (level >= 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getThreatBadge = (level: number) => {
    if (level >= 0.8) return { text: 'Critical', class: 'bg-destructive text-destructive-foreground' };
    if (level >= 0.6) return { text: 'High', class: 'bg-orange-500 text-white' };
    if (level >= 0.4) return { text: 'Medium', class: 'bg-yellow-500 text-black' };
    return { text: 'Low', class: 'bg-green-500 text-white' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Social Engineering Detector
          </CardTitle>
          <CardDescription>
            Analyze messages and communications for social engineering attack indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Message Content</label>
            <Textarea
              value={messageContent}
              onChange={e => setMessageContent(e.target.value)}
              placeholder="Paste the suspicious message here..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Sender Info (optional)</label>
            <Input
              value={senderInfo}
              onChange={e => setSenderInfo(e.target.value)}
              placeholder="Email, phone number, or username"
            />
          </div>
          <Button onClick={analyzeMessage} disabled={isAnalyzing} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Message'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.isSocialEngineering ? 'border-destructive/50' : 'border-green-500/50'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {result.isSocialEngineering ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <Shield className="h-5 w-5 text-green-500" />
                )}
                Analysis Results
              </CardTitle>
              <Badge className={getThreatBadge(result.threatLevel).class}>
                {getThreatBadge(result.threatLevel).text} Risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Threat Level</div>
                <div className="flex items-center gap-2">
                  <Progress value={result.threatLevel * 100} className="flex-1" />
                  <span className={`font-bold ${getThreatColor(result.threatLevel)}`}>
                    {Math.round(result.threatLevel * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                <div className="flex items-center gap-2">
                  <Progress value={result.confidence * 100} className="flex-1" />
                  <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Attack Type</div>
                <Badge variant="outline" className="capitalize">
                  {result.attackType.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Attack Vector</div>
                <Badge variant="outline" className="capitalize">
                  {result.attackVector}
                </Badge>
              </div>
            </div>

            {result.techniques.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Detected Techniques</div>
                <div className="flex flex-wrap gap-2">
                  {result.techniques.map((tech, idx) => (
                    <Badge key={idx} variant="secondary" className="capitalize">
                      {tech.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Recommendations</div>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
