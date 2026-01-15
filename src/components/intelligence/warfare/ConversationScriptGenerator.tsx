/**
 * AI Conversation Script Generator
 * Dynamic dialogue trees for tactical conversations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, GitBranch, Target, Sparkles, Download, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScriptBranch {
  id: string;
  userLine: string;
  predictedResponses: Array<{
    response: string;
    probability: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'defensive';
    nextBranches?: string[];
  }>;
  pivotStrategies: string[];
  objective: string;
}

interface ConversationScript {
  id: string;
  objective: string;
  targetProfile: string;
  branches: ScriptBranch[];
  successCriteria: string[];
  riskFactors: string[];
}

interface ConversationScriptGeneratorProps {
  profileId?: string;
  profileName?: string;
}

export function ConversationScriptGenerator({ profileId, profileName }: ConversationScriptGeneratorProps) {
  const [objective, setObjective] = useState('');
  const [context, setContext] = useState('');
  const [scriptType, setScriptType] = useState<'elicitation' | 'negotiation' | 'confrontation' | 'rapport'>('elicitation');
  const [generatedScript, setGeneratedScript] = useState<ConversationScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<ScriptBranch | null>(null);

  const handleGenerate = async () => {
    if (!objective.trim()) {
      toast.error('Please enter an objective');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation (would call edge function in production)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const demoScript: ConversationScript = {
      id: crypto.randomUUID(),
      objective,
      targetProfile: profileName || 'Target',
      branches: [
        {
          id: 'opening',
          userLine: "I've been thinking about what you mentioned last time regarding the project timeline...",
          predictedResponses: [
            { response: "Yes, I've had some concerns about that too.", probability: 0.45, sentiment: 'neutral', nextBranches: ['probe-concerns'] },
            { response: "What specifically are you referring to?", probability: 0.35, sentiment: 'defensive', nextBranches: ['clarify'] },
            { response: "I'd rather not discuss work right now.", probability: 0.20, sentiment: 'negative', nextBranches: ['pivot-personal'] },
          ],
          pivotStrategies: ['Acknowledge their perspective', 'Use assumptive framing', 'Appeal to shared interests'],
          objective: 'Establish topic and gauge openness',
        },
        {
          id: 'probe-concerns',
          userLine: "What aspects concern you the most?",
          predictedResponses: [
            { response: "The deadlines seem unrealistic given our resources.", probability: 0.55, sentiment: 'neutral' },
            { response: "I'm not sure I should be discussing this with you.", probability: 0.25, sentiment: 'defensive' },
            { response: "Everything, honestly. It's a mess.", probability: 0.20, sentiment: 'negative' },
          ],
          pivotStrategies: ['Validate concerns', 'Offer hypothetical solutions', 'Use reciprocity by sharing own concerns'],
          objective: 'Extract specific pain points',
        },
        {
          id: 'clarify',
          userLine: "You mentioned the resource allocation seemed off - I was curious about your perspective.",
          predictedResponses: [
            { response: "Oh, that. Yes, I think we could optimize things differently.", probability: 0.60, sentiment: 'positive' },
            { response: "Who told you I said that?", probability: 0.25, sentiment: 'defensive' },
            { response: "I don't recall saying that exactly.", probability: 0.15, sentiment: 'neutral' },
          ],
          pivotStrategies: ['Use cognitive dissonance', 'Appeal to expertise', 'Flattery approach'],
          objective: 'Reframe and redirect to target topic',
        },
        {
          id: 'pivot-personal',
          userLine: "Fair enough. How have you been doing otherwise? I noticed you seemed stressed lately.",
          predictedResponses: [
            { response: "It's been challenging, but I'm managing.", probability: 0.50, sentiment: 'neutral' },
            { response: "Thanks for noticing. It's been rough.", probability: 0.35, sentiment: 'positive' },
            { response: "I'm fine. Why do you ask?", probability: 0.15, sentiment: 'defensive' },
          ],
          pivotStrategies: ['Build emotional rapport', 'Offer support', 'Circle back to professional topic later'],
          objective: 'Build trust before returning to main objective',
        },
      ],
      successCriteria: [
        'Target reveals specific concerns about project',
        'Target shares internal dynamics or conflicts',
        'Emotional rapport is established for future conversations',
      ],
      riskFactors: [
        'Target may become suspicious of motives',
        'Defensive reactions could damage relationship',
        'Information shared may be inaccurate or intentionally misleading',
      ],
    };
    
    setGeneratedScript(demoScript);
    setSelectedBranch(demoScript.branches[0]);
    setIsGenerating(false);
    toast.success('Conversation script generated');
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'neutral': return 'text-yellow-500';
      case 'negative': return 'text-red-500';
      case 'defensive': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  const handleExport = () => {
    if (!generatedScript) return;
    
    const content = `
CONVERSATION SCRIPT
==================
Target: ${generatedScript.targetProfile}
Objective: ${generatedScript.objective}
Generated: ${new Date().toLocaleString()}

DIALOGUE BRANCHES
-----------------
${generatedScript.branches.map(b => `
[${b.id.toUpperCase()}]
Your Line: "${b.userLine}"
Objective: ${b.objective}

Predicted Responses:
${b.predictedResponses.map(r => `  - (${(r.probability * 100).toFixed(0)}%) [${r.sentiment}] "${r.response}"`).join('\n')}

Pivot Strategies:
${b.pivotStrategies.map(s => `  • ${s}`).join('\n')}
`).join('\n---\n')}

SUCCESS CRITERIA
----------------
${generatedScript.successCriteria.map(c => `• ${c}`).join('\n')}

RISK FACTORS
------------
${generatedScript.riskFactors.map(r => `• ${r}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-script-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script exported');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Conversation Script Generator</CardTitle>
        </div>
        <CardDescription>Generate dynamic dialogue trees with predicted responses</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="view" disabled={!generatedScript}>View Script</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Conversation Objective</label>
                <Input
                  placeholder="What do you want to achieve in this conversation?"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Script Type</label>
                <Select value={scriptType} onValueChange={(v: any) => setScriptType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elicitation">Information Elicitation</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="confrontation">Confrontation</SelectItem>
                    <SelectItem value="rapport">Rapport Building</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Additional Context</label>
                <Textarea
                  placeholder="Any relevant context about the target or situation..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button onClick={handleGenerate} disabled={!objective.trim() || isGenerating} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Script'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="view" className="space-y-4 mt-4">
            {generatedScript && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{generatedScript.objective}</p>
                    <p className="text-sm text-muted-foreground">Target: {generatedScript.targetProfile}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Branch List */}
                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-medium">Dialogue Branches</label>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {generatedScript.branches.map((branch) => (
                          <Button
                            key={branch.id}
                            variant={selectedBranch?.id === branch.id ? 'default' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() => setSelectedBranch(branch)}
                          >
                            <GitBranch className="h-3 w-3 mr-2" />
                            {branch.id}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Branch Details */}
                  <div className="col-span-2 space-y-3">
                    {selectedBranch && (
                      <>
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Your Line</span>
                          </div>
                          <p className="text-sm italic">"{selectedBranch.userLine}"</p>
                          <Badge variant="outline" className="mt-2 text-xs">{selectedBranch.objective}</Badge>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Predicted Responses</label>
                          {selectedBranch.predictedResponses.map((response, idx) => (
                            <div key={idx} className="p-2 rounded border bg-card">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm flex-1">"{response.response}"</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {(response.probability * 100).toFixed(0)}%
                                  </Badge>
                                  <span className={`text-xs ${getSentimentColor(response.sentiment)}`}>
                                    {response.sentiment}
                                  </span>
                                </div>
                              </div>
                              {response.nextBranches && response.nextBranches.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3 w-3" />
                                  {response.nextBranches.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <label className="text-sm font-medium">Pivot Strategies</label>
                          <ul className="mt-1 space-y-1">
                            {selectedBranch.pivotStrategies.map((strategy, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                <ChevronRight className="h-3 w-3" />
                                {strategy}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Risk Factors</span>
                  </div>
                  <ul className="space-y-1">
                    {generatedScript.riskFactors.map((risk, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {risk}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
