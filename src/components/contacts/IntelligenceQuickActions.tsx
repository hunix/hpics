import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Mic, 
  FileSearch, 
  Brain, 
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useContactIntelligenceIndicators } from '@/hooks/useContactIntelligenceIndicators';
import { cn } from '@/lib/utils';

interface IntelligenceQuickActionsProps {
  profileId: string;
  contactName: string;
}

export function IntelligenceQuickActions({ profileId, contactName }: IntelligenceQuickActionsProps) {
  const navigate = useNavigate();
  const { data: indicators, isLoading } = useContactIntelligenceIndicators(profileId);

  const actions = [
    {
      id: 'media',
      label: 'Media Analysis',
      description: indicators?.mediaCount ? `${indicators.mediaCount} analyzed` : 'Analyze photos & videos',
      icon: Image,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      hasData: indicators?.hasMediaAnalysis,
      onClick: () => navigate(`/analysis?contact=${profileId}`),
    },
    {
      id: 'voice',
      label: 'Voice Analysis',
      description: indicators?.voiceCount ? `${indicators.voiceCount} insights` : 'Analyze recordings',
      icon: Mic,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      hasData: indicators?.hasVoiceInsights,
      onClick: () => navigate(`/analysis?contact=${profileId}&tab=voice`),
    },
    {
      id: 'dossier',
      label: 'Intelligence Dossier',
      description: indicators?.hasDossier ? 'View dossier' : 'Generate dossier',
      icon: FileSearch,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      hasData: indicators?.hasDossier,
      onClick: () => navigate(`/analysis?contact=${profileId}&tab=dossier`),
    },
    {
      id: 'unified',
      label: 'Unified Intelligence',
      description: 'Combined insights view',
      icon: Brain,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      hasData: indicators?.hasMediaAnalysis || indicators?.hasVoiceInsights,
      onClick: () => {
        // Scroll to unified-profile section
        const event = new CustomEvent('navigate-to-section', { detail: 'unified-profile' });
        window.dispatchEvent(event);
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Intelligence Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              className={cn(
                "w-full justify-between h-auto py-3 px-3",
                "hover:bg-muted/50 transition-colors"
              )}
              onClick={action.onClick}
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", action.bgColor)}>
                  <Icon className={cn("h-4 w-4", action.color)} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {action.hasData ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                )}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
