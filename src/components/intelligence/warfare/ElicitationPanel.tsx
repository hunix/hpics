import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  MessageSquarePlus, Target, Brain, AlertTriangle, 
  CheckCircle2, Clock, Sparkles, Copy, Play
} from 'lucide-react';
import { toast } from 'sonner';

interface ElicitationPanelProps {
  profileId?: string;
  profileName?: string;
}

// FBI Elicitation Techniques Database
const ELICITATION_TECHNIQUES = [
  {
    id: 'assumptive',
    name: 'Assumptive Questions',
    category: 'Direct',
    difficulty: 'easy',
    description: 'Make a statement that assumes the answer you want, prompting correction or confirmation.',
    examples: [
      "So you work in finance, right?",
      "I assume the project is behind schedule?",
      "Your team must have about 50 people?"
    ],
    effectiveness: 0.75,
    detectability: 0.3,
    useCase: 'Gathering basic factual information without appearing to interrogate.'
  },
  {
    id: 'bracketing',
    name: 'Bracketing',
    category: 'Quantitative',
    difficulty: 'medium',
    description: 'Offer a range (high and low) to get the target to correct you with accurate numbers.',
    examples: [
      "The budget is probably between $100K and $500K, right?",
      "You've been there what, 2 years? Maybe 10?",
      "That deal was worth somewhere between $1M and $10M?"
    ],
    effectiveness: 0.82,
    detectability: 0.25,
    useCase: 'Extracting specific numbers, figures, or quantities.'
  },
  {
    id: 'deliberate_false',
    name: 'Deliberate False Statement',
    category: 'Provocative',
    difficulty: 'hard',
    description: 'Make an intentionally wrong statement to provoke correction with true information.',
    examples: [
      "I heard your CEO is stepping down next month.",
      "Word is your biggest client just left for a competitor.",
      "The new product launch was cancelled, wasn't it?"
    ],
    effectiveness: 0.88,
    detectability: 0.45,
    useCase: 'Extracting sensitive information through ego-driven corrections.'
  },
  {
    id: 'flattery',
    name: 'Flattery & Appeal to Ego',
    category: 'Psychological',
    difficulty: 'easy',
    description: 'Compliment expertise or position to encourage sharing of privileged information.',
    examples: [
      "You clearly understand this space better than anyone...",
      "With your experience, what do you think about...",
      "Someone at your level must know the real story..."
    ],
    effectiveness: 0.70,
    detectability: 0.15,
    useCase: 'Building rapport while extracting expert knowledge.'
  },
  {
    id: 'naive',
    name: 'Naïve Approach',
    category: 'Deceptive',
    difficulty: 'medium',
    description: 'Feign ignorance to encourage the target to explain and reveal details.',
    examples: [
      "I don't really understand how that works...",
      "This is all new to me - can you explain?",
      "I'm confused about the process here..."
    ],
    effectiveness: 0.78,
    detectability: 0.20,
    useCase: 'Technical information extraction from experts.'
  },
  {
    id: 'oblique',
    name: 'Oblique Reference',
    category: 'Indirect',
    difficulty: 'hard',
    description: 'Reference information tangentially to prompt the target to fill in gaps.',
    examples: [
      "That situation with the board must have been difficult...",
      "After what happened last quarter...",
      "Given the recent changes in leadership..."
    ],
    effectiveness: 0.72,
    detectability: 0.35,
    useCase: 'Confirming suspected information without direct questioning.'
  },
  {
    id: 'quid_pro_quo',
    name: 'Quid Pro Quo',
    category: 'Exchange',
    difficulty: 'medium',
    description: 'Offer information (real or fabricated) to encourage reciprocal sharing.',
    examples: [
      "At my company, we handle it this way... how do you?",
      "I heard from another source that... is that accurate?",
      "Let me share what I know, maybe you can add to it..."
    ],
    effectiveness: 0.80,
    detectability: 0.30,
    useCase: 'Information exchange in peer-to-peer contexts.'
  },
  {
    id: 'word_repetition',
    name: 'Word Repetition',
    category: 'Active Listening',
    difficulty: 'easy',
    description: 'Repeat key words or phrases to encourage elaboration.',
    examples: [
      '"Restructuring..." (pause)',
      '"A difficult situation..." (wait)',
      '"Significant changes..." (nod expectantly)'
    ],
    effectiveness: 0.65,
    detectability: 0.10,
    useCase: 'Encouraging deeper explanation of mentioned topics.'
  },
  {
    id: 'silence',
    name: 'Strategic Silence',
    category: 'Pressure',
    difficulty: 'medium',
    description: 'Use prolonged silence to create discomfort that prompts filling with information.',
    examples: [
      "(After target speaks) ...silence for 5-10 seconds...",
      "(Nod slowly, maintain eye contact, say nothing)",
      "(Pause expectantly after incomplete answer)"
    ],
    effectiveness: 0.75,
    detectability: 0.40,
    useCase: 'Extracting additional details after initial disclosure.'
  },
  {
    id: 'provocative',
    name: 'Provocative Statement',
    category: 'Emotional',
    difficulty: 'hard',
    description: 'Make a controversial or challenging statement to provoke a defensive response.',
    examples: [
      "Most people in your position would have quit by now.",
      "That strategy seems pretty risky...",
      "I've heard mixed things about that approach..."
    ],
    effectiveness: 0.85,
    detectability: 0.55,
    useCase: 'Breaking through guarded responses or denial.'
  },
  {
    id: 'volunteering',
    name: 'Volunteering Information',
    category: 'Trust Building',
    difficulty: 'easy',
    description: 'Share your own information freely to create sense of trust and reciprocity.',
    examples: [
      "At my last job, we had this exact problem...",
      "Between us, I've seen this go wrong before...",
      "I can tell you from experience..."
    ],
    effectiveness: 0.68,
    detectability: 0.15,
    useCase: 'Building rapport before deeper information extraction.'
  },
  {
    id: 'disbelief',
    name: 'Expression of Disbelief',
    category: 'Provocative',
    difficulty: 'medium',
    description: 'Express skepticism to trigger an emotional response with proof or details.',
    examples: [
      "I find that hard to believe...",
      "That can't be right...",
      "Are you sure about that?"
    ],
    effectiveness: 0.82,
    detectability: 0.45,
    useCase: 'Prompting evidence or detailed explanations.'
  },
  {
    id: 'leading',
    name: 'Leading Questions',
    category: 'Suggestive',
    difficulty: 'easy',
    description: 'Frame questions to suggest the expected or desired answer.',
    examples: [
      "You don't really support that policy, do you?",
      "Wouldn't you agree that...",
      "Isn't it true that..."
    ],
    effectiveness: 0.70,
    detectability: 0.50,
    useCase: 'Confirming suspected opinions or attitudes.'
  },
  {
    id: 'mirroring',
    name: 'Mirroring',
    category: 'Rapport',
    difficulty: 'easy',
    description: 'Reflect body language, tone, and phrases to build unconscious connection.',
    examples: [
      "(Match their posture and gestures)",
      "(Adopt similar speech patterns)",
      "(Echo emotional tone)"
    ],
    effectiveness: 0.65,
    detectability: 0.10,
    useCase: 'Building rapport before substantive questioning.'
  },
  {
    id: 'hypothetical',
    name: 'Hypothetical Scenario',
    category: 'Indirect',
    difficulty: 'medium',
    description: 'Pose hypothetical situations to extract real policies or reactions.',
    examples: [
      "What would happen if a competitor...",
      "Hypothetically, if the market dropped...",
      "Let's say someone were to..."
    ],
    effectiveness: 0.75,
    detectability: 0.25,
    useCase: 'Extracting sensitive policies without direct questioning.'
  },
  {
    id: 'mutual_interest',
    name: 'Mutual Interest',
    category: 'Rapport',
    difficulty: 'easy',
    description: 'Find common ground to create connection and lower defenses.',
    examples: [
      "I'm also really interested in that area...",
      "We have the same problem at my company...",
      "I've been following that topic too..."
    ],
    effectiveness: 0.60,
    detectability: 0.10,
    useCase: 'Initial rapport building and trust establishment.'
  },
  {
    id: 'third_party',
    name: 'Third-Party Reference',
    category: 'Indirect',
    difficulty: 'hard',
    description: 'Reference alleged third-party statements to validate or extract information.',
    examples: [
      "Someone mentioned that your team is working on...",
      "I heard from a mutual contact that...",
      "There's been talk about..."
    ],
    effectiveness: 0.78,
    detectability: 0.40,
    useCase: 'Confirming rumored information without direct asking.'
  },
  {
    id: 'complaint',
    name: 'Shared Complaint',
    category: 'Bonding',
    difficulty: 'easy',
    description: 'Express frustration about shared experience to encourage venting.',
    examples: [
      "These new regulations are such a headache...",
      "The market has been brutal lately...",
      "Management never listens, right?"
    ],
    effectiveness: 0.72,
    detectability: 0.15,
    useCase: 'Extracting complaints and internal frustrations.'
  },
  {
    id: 'confidentiality',
    name: 'Implied Confidentiality',
    category: 'Trust',
    difficulty: 'medium',
    description: 'Create sense of privacy or off-record conversation.',
    examples: [
      "Just between us...",
      "Off the record...",
      "I won't repeat this, but..."
    ],
    effectiveness: 0.80,
    detectability: 0.35,
    useCase: 'Extracting sensitive information in private settings.'
  },
  {
    id: 'recognition',
    name: 'Recognition Seeking',
    category: 'Psychological',
    difficulty: 'medium',
    description: 'Appeal to desire for recognition and acknowledgment of achievements.',
    examples: [
      "You must have been key to that success...",
      "That was your initiative, wasn't it?",
      "Who else could have pulled that off?"
    ],
    effectiveness: 0.75,
    detectability: 0.20,
    useCase: 'Attributing achievements to extract role details.'
  },
  {
    id: 'time_pressure',
    name: 'Artificial Time Pressure',
    category: 'Pressure',
    difficulty: 'hard',
    description: 'Create urgency to prompt quick, less guarded responses.',
    examples: [
      "I only have a few minutes, quick question...",
      "Before you go, just tell me...",
      "I need to know now because..."
    ],
    effectiveness: 0.70,
    detectability: 0.50,
    useCase: 'Bypassing careful consideration of responses.'
  },
  {
    id: 'incremental',
    name: 'Incremental Disclosure',
    category: 'Progressive',
    difficulty: 'hard',
    description: 'Start with minor questions, gradually escalating to sensitive topics.',
    examples: [
      "Start: How's work? → Middle: Any big projects? → End: What's the timeline on that merger?",
      "Progress from general to specific over multiple interactions"
    ],
    effectiveness: 0.85,
    detectability: 0.20,
    useCase: 'Long-term intelligence gathering over multiple interactions.'
  },
  {
    id: 'social_proof',
    name: 'Social Proof',
    category: 'Psychological',
    difficulty: 'medium',
    description: 'Suggest others have shared similar information to normalize disclosure.',
    examples: [
      "Others in your industry have mentioned...",
      "Your colleagues seem to agree that...",
      "Most people in your position share..."
    ],
    effectiveness: 0.75,
    detectability: 0.30,
    useCase: 'Reducing resistance to sharing by normalizing disclosure.'
  },
  {
    id: 'commitment',
    name: 'Commitment Escalation',
    category: 'Psychological',
    difficulty: 'hard',
    description: 'Get small commitments first, then leverage consistency principle for larger ones.',
    examples: [
      "You agreed earlier that... so would you also say...",
      "Since you mentioned X, Y must also be true?",
      "Building on what you said..."
    ],
    effectiveness: 0.80,
    detectability: 0.35,
    useCase: 'Extracting logical conclusions from previous admissions.'
  }
];

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  hard: 'bg-red-500/20 text-red-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Direct': 'bg-blue-500/20 text-blue-400',
  'Quantitative': 'bg-violet-500/20 text-violet-400',
  'Provocative': 'bg-red-500/20 text-red-400',
  'Psychological': 'bg-pink-500/20 text-pink-400',
  'Deceptive': 'bg-amber-500/20 text-amber-400',
  'Indirect': 'bg-cyan-500/20 text-cyan-400',
  'Exchange': 'bg-emerald-500/20 text-emerald-400',
  'Active Listening': 'bg-indigo-500/20 text-indigo-400',
  'Pressure': 'bg-orange-500/20 text-orange-400',
  'Emotional': 'bg-rose-500/20 text-rose-400',
  'Trust Building': 'bg-teal-500/20 text-teal-400',
  'Suggestive': 'bg-fuchsia-500/20 text-fuchsia-400',
  'Rapport': 'bg-lime-500/20 text-lime-400',
  'Bonding': 'bg-sky-500/20 text-sky-400',
  'Trust': 'bg-green-500/20 text-green-400',
  'Progressive': 'bg-purple-500/20 text-purple-400',
};

export function ElicitationPanel({ profileId, profileName }: ElicitationPanelProps) {
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...new Set(ELICITATION_TECHNIQUES.map(t => t.category))];
  
  const filteredTechniques = activeCategory === 'all' 
    ? ELICITATION_TECHNIQUES 
    : ELICITATION_TECHNIQUES.filter(t => t.category === activeCategory);

  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example);
    toast.success('Example copied to clipboard');
  };

  const generatePersonalized = (technique: typeof ELICITATION_TECHNIQUES[0]) => {
    toast.info(`Generating personalized ${technique.name} approach for ${profileName || 'target'}...`);
    // This would call an AI function to generate personalized scripts
  };

  return (
    <Card className="border-violet-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-violet-400" />
            <CardTitle>FBI Elicitation Console</CardTitle>
          </div>
          <Badge variant="outline" className="text-violet-400">
            {ELICITATION_TECHNIQUES.length} Techniques
          </Badge>
        </div>
        <CardDescription>
          Master conversational extraction techniques for intelligence gathering
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="library" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library">Technique Library</TabsTrigger>
            <TabsTrigger value="planner">Session Planner</TabsTrigger>
            <TabsTrigger value="scripts">AI Scripts</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            {/* Category Filter */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className="capitalize"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Techniques List */}
            <ScrollArea className="h-[500px]">
              <Accordion type="single" collapsible className="space-y-2">
                {filteredTechniques.map((technique) => (
                  <AccordionItem 
                    key={technique.id} 
                    value={technique.id}
                    className="border rounded-lg bg-background/50 px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{technique.name}</span>
                            <Badge className={DIFFICULTY_COLORS[technique.difficulty as keyof typeof DIFFICULTY_COLORS]}>
                              {technique.difficulty}
                            </Badge>
                            <Badge className={CATEGORY_COLORS[technique.category] || 'bg-muted text-muted-foreground'}>
                              {technique.category}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {technique.description}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <p className="text-sm">{technique.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Effectiveness</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${technique.effectiveness * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{Math.round(technique.effectiveness * 100)}%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Detectability Risk</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500" 
                                style={{ width: `${technique.detectability * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{Math.round(technique.detectability * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <h5 className="text-xs font-medium text-violet-400 mb-2 flex items-center gap-1">
                          <Target className="h-3 w-3" /> Best Use Case
                        </h5>
                        <p className="text-sm">{technique.useCase}</p>
                      </div>

                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-2">Example Phrases</h5>
                        <div className="space-y-2">
                          {technique.examples.map((example, i) => (
                            <div 
                              key={i}
                              className="flex items-center justify-between p-2 rounded bg-muted/50 group"
                            >
                              <span className="text-sm italic">"{example}"</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => copyExample(example)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {profileId && (
                        <Button 
                          className="w-full mt-2"
                          onClick={() => generatePersonalized(technique)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Personalized Script for {profileName || 'Target'}
                        </Button>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="planner" className="space-y-4">
            <Card className="bg-background/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-violet-400" />
                  <h4 className="font-semibold">Session Planning</h4>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {profileId 
                        ? `Plan an elicitation session for ${profileName}`
                        : 'Select a profile to plan an elicitation session'}
                    </p>
                    {profileId && (
                      <Button className="mt-3" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Start Session Planning
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-emerald-500/10 border-emerald-500/30">
                      <CardContent className="p-4 text-center">
                        <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                        <p className="text-2xl font-bold text-emerald-400">0</p>
                        <p className="text-xs text-muted-foreground">Successful Extractions</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-500/10 border-amber-500/30">
                      <CardContent className="p-4 text-center">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                        <p className="text-2xl font-bold text-amber-400">0</p>
                        <p className="text-xs text-muted-foreground">Pending Sessions</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/30">
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-400" />
                        <p className="text-2xl font-bold text-red-400">0</p>
                        <p className="text-xs text-muted-foreground">Detection Risks</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-4">
            <Card className="bg-background/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <h4 className="font-semibold">AI-Generated Scripts</h4>
                </div>
                <div className="p-8 rounded-lg border border-dashed border-muted-foreground/30 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-violet-400/50" />
                  <h4 className="font-medium mb-2">Personalized Elicitation Scripts</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI will analyze the target profile and generate custom conversation scripts
                    optimized for their personality, vulnerabilities, and your objectives.
                  </p>
                  {profileId ? (
                    <Button>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Custom Scripts
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Select a profile to generate scripts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export { ELICITATION_TECHNIQUES };
