import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Loader2, 
  User, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  Heart,
  MessageCircle,
  Clock,
  Printer
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { useAIModelPreference } from '@/hooks/useAIModelPreference';
import { calculateCostCents } from '@/lib/aiPricing';
import { toast } from 'sonner';

interface BriefingData {
  briefing: {
    executiveSummary: string;
    keyFacts: string[];
    recentContext: string;
    conversationStarters: string[];
    topicsToAvoid: string[];
    actionItems: string[];
    relationshipHealth: {
      status: string;
      score: number;
      recommendations: string[];
    };
  };
  profile: {
    name: string;
    title: string | null;
    organization: string | null;
    avatarUrl: string | null;
  };
  generatedAt: string;
}

interface MeetingBriefingProps {
  profileId: string;
  contactName: string;
}

export function MeetingBriefing({ profileId, contactName }: MeetingBriefingProps) {
  const { session } = useAuth();
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  const modelKey = useAIModelPreference('generate-briefing');
  const [isLoading, setIsLoading] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);

  const generateBriefing = async () => {
    const promptText = `Generating comprehensive meeting briefing for ${contactName}. This includes executive summary, key facts, recent context, conversation starters, topics to avoid, action items, and relationship health analysis.`;
    
    const { approved, logId } = await requestConfirmation({
      functionName: 'generate-briefing',
      modelKey,
      promptText,
      profileId,
    });
    
    if (!approved || !logId) return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-briefing', {
        body: { profileId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        await updateLogWithResult(logId, {
          status: 'failed',
          errorMessage: error.message,
          responseTimeMs: responseTime,
        });
        throw error;
      }
      
      await updateLogWithResult(logId, {
        status: 'completed',
        responseTimeMs: responseTime,
        actualCostCents: calculateCostCents(modelKey, 3000, 2000),
      });
      
      setBriefing(data);
      toast.success('Meeting briefing generated!');
    } catch (error) {
      console.error('Error generating briefing:', error);
      toast.error('Failed to generate briefing');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  if (!briefing) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Meeting Briefing</h3>
        <p className="text-muted-foreground mb-4">
          Generate a comprehensive briefing packet for your meeting with {contactName}
        </p>
        <Button onClick={generateBriefing} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Briefing
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-2xl font-bold">Meeting Briefing</h2>
            <p className="text-muted-foreground">
              Generated {new Date(briefing.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={generateBriefing} disabled={isLoading}>
              Regenerate
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold">
                {briefing.profile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <CardTitle className="text-xl">{briefing.profile.name}</CardTitle>
                <CardDescription>
                  {briefing.profile.title && <span>{briefing.profile.title}</span>}
                  {briefing.profile.title && briefing.profile.organization && <span> at </span>}
                  {briefing.profile.organization && <span>{briefing.profile.organization}</span>}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{briefing.briefing.executiveSummary}</p>
          </CardContent>
        </Card>

        {/* Relationship Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4" />
              Relationship Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getHealthColor(briefing.briefing.relationshipHealth.score)}`}>
                {briefing.briefing.relationshipHealth.score}
              </div>
              <div>
                <p className="font-medium">{briefing.briefing.relationshipHealth.status}</p>
                <p className="text-sm text-muted-foreground">Current relationship status</p>
              </div>
            </div>
            {briefing.briefing.relationshipHealth.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations:</p>
                <ul className="space-y-1">
                  {briefing.briefing.relationshipHealth.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Facts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Key Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {briefing.briefing.keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5">{i + 1}</Badge>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              Recent Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{briefing.briefing.recentContext}</p>
          </CardContent>
        </Card>

        {/* Conversation Starters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Conversation Starters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {briefing.briefing.conversationStarters.map((starter, i) => (
                <li key={i} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  "{starter}"
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Topics to Avoid */}
        {briefing.briefing.topicsToAvoid.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Topics to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {briefing.briefing.topicsToAvoid.map((topic, i) => (
                  <li key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    {topic}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {briefing.briefing.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 p-2">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
