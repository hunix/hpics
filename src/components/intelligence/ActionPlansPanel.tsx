import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, Clock, Calendar, AlertTriangle, 
  ChevronDown, MessageSquare, Zap, Ban
} from 'lucide-react';
import { useState } from 'react';
import type { PsychologicalProfile, ActionItem } from '@/lib/psychologicalAnalysis';

interface ActionPlansPanelProps {
  profile: PsychologicalProfile;
  profileName: string;
}

export function ActionPlansPanel({ profile, profileName }: ActionPlansPanelProps) {
  const actionPlans = profile.action_plans as any;

  if (!actionPlans) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No action plans generated yet.</p>
        <p className="text-sm mt-1">Run a deep analysis to get strategic recommendations.</p>
      </div>
    );
  }

  const immediate = actionPlans.immediate || [];
  const shortTerm = actionPlans.short_term || [];
  const longTerm = actionPlans.long_term || [];
  const doNotDo = actionPlans.do_not_do || [];
  const scripts = actionPlans.conversation_scripts || [];

  return (
    <Tabs defaultValue="immediate" className="space-y-3">
      <TabsList className="grid grid-cols-4 w-full h-auto">
        <TabsTrigger value="immediate" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
          <Zap className="h-3.5 w-3.5" />
          Now
        </TabsTrigger>
        <TabsTrigger value="short" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
          <Clock className="h-3.5 w-3.5" />
          Month
        </TabsTrigger>
        <TabsTrigger value="long" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
          <Calendar className="h-3.5 w-3.5" />
          Quarter
        </TabsTrigger>
        <TabsTrigger value="avoid" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
          <Ban className="h-3.5 w-3.5" />
          Avoid
        </TabsTrigger>
      </TabsList>

      <TabsContent value="immediate" className="space-y-2">
        {immediate.length > 0 ? (
          immediate.map((action: ActionItem, i: number) => (
            <ActionItemCard key={i} action={action} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No immediate actions required.
          </p>
        )}
      </TabsContent>

      <TabsContent value="short" className="space-y-2">
        {shortTerm.length > 0 ? (
          shortTerm.map((action: ActionItem, i: number) => (
            <ActionItemCard key={i} action={action} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No short-term actions planned.
          </p>
        )}
      </TabsContent>

      <TabsContent value="long" className="space-y-2">
        {longTerm.length > 0 ? (
          longTerm.map((action: ActionItem, i: number) => (
            <ActionItemCard key={i} action={action} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No long-term actions planned.
          </p>
        )}
      </TabsContent>

      <TabsContent value="avoid" className="space-y-2">
        {doNotDo.length > 0 ? (
          doNotDo.map((item: any, i: number) => (
            <div 
              key={i}
              className={`p-2.5 rounded-lg border ${
                item.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                item.severity === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                'border-muted bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                  item.severity === 'critical' ? 'text-destructive' :
                  item.severity === 'warning' ? 'text-yellow-500' :
                  'text-muted-foreground'
                }`} />
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No specific actions to avoid.
          </p>
        )}
      </TabsContent>

      {/* Conversation Scripts */}
      {scripts.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4" />
            Conversation Scripts
          </h4>
          <div className="space-y-2">
            {scripts.map((script: any, i: number) => (
              <ScriptCard key={i} script={script} profileName={profileName} />
            ))}
          </div>
        </div>
      )}
    </Tabs>
  );
}

function ActionItemCard({ action }: { action: ActionItem }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    urgent: 'bg-destructive text-destructive-foreground',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-black',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-start justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] ${priorityColors[action.priority] || priorityColors.medium}`}>
                {action.priority}
              </Badge>
              <span className="text-sm font-medium">{action.title}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {action.description}
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 p-3 bg-muted/30 rounded-lg space-y-2 text-xs">
          <p className="text-muted-foreground">{action.description}</p>
          
          {action.timing_recommendation && (
            <div>
              <span className="font-medium">When: </span>
              <span className="text-muted-foreground">{action.timing_recommendation}</span>
            </div>
          )}
          
          {action.expected_outcome && (
            <div>
              <span className="font-medium">Expected outcome: </span>
              <span className="text-muted-foreground">{action.expected_outcome}</span>
            </div>
          )}
          
          {action.risk_if_ignored && (
            <div className="text-destructive">
              <span className="font-medium">Risk if ignored: </span>
              <span>{action.risk_if_ignored}</span>
            </div>
          )}

          {action.specific_scripts && action.specific_scripts.length > 0 && (
            <div className="mt-2 p-2 bg-background rounded border">
              <span className="font-medium block mb-1">Suggested approach:</span>
              {action.specific_scripts.map((script, i) => (
                <p key={i} className="italic text-muted-foreground">"{script}"</p>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ScriptCard({ script, profileName }: { script: any; profileName: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
          <span className="text-sm font-medium">{script.scenario}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 p-3 bg-muted/30 rounded-lg space-y-3 text-xs">
          {script.opening && (
            <div>
              <span className="font-medium block mb-1">Opening:</span>
              <p className="italic text-muted-foreground bg-background p-2 rounded">
                "{script.opening}"
              </p>
            </div>
          )}
          
          {script.key_points?.length > 0 && (
            <div>
              <span className="font-medium block mb-1">Key points to cover:</span>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {script.key_points.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          {script.phrases_to_avoid?.length > 0 && (
            <div>
              <span className="font-medium block mb-1 text-destructive">Avoid saying:</span>
              <ul className="list-disc list-inside text-destructive/80 space-y-0.5">
                {script.phrases_to_avoid.map((phrase: string, i: number) => (
                  <li key={i}>{phrase}</li>
                ))}
              </ul>
            </div>
          )}
          
          {script.expected_response && (
            <div>
              <span className="font-medium block mb-1">Expected response:</span>
              <p className="text-muted-foreground">{script.expected_response}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
