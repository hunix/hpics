/**
 * StylemetryAnalyzer Component (v9.0)
 * 
 * Provides stylometric analysis for authorship attribution and LLM detection.
 * Uses linguistic fingerprinting to identify writing patterns.
 */

import React, { useState } from 'react';
import { FileText, Bot, User, Fingerprint, Search, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStylemetricAnalysis } from '@/hooks/intelligence/useStylemetricAnalysis';
import { cn } from '@/lib/utils';

interface StylemetryAnalyzerProps {
  profileId?: string;
  className?: string;
}

export function StylemetryAnalyzer({ profileId, className }: StylemetryAnalyzerProps) {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('analyze');
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeTextFn> | null>(null);
  const [llmResult, setLlmResult] = useState<ReturnType<typeof detectLLMFn> | null>(null);
  const [authorshipResult, setAuthorshipResult] = useState<{ matchScore: number; assessment: string; divergentFeatures: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const {
    analyzeText: analyzeTextFn,
    detectLLM: detectLLMFn,
    compareAuthorship,
    isComparing,
  } = useStylemetricAnalysis(profileId);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = analyzeTextFn(inputText);
      setAnalysisResult(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDetectLLM = async () => {
    if (!inputText.trim()) return;
    setIsDetecting(true);
    try {
      const result = detectLLMFn(inputText);
      setLlmResult(result);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCompareAuthorship = async () => {
    if (!inputText.trim() || !profileId) return;
    try {
      const result = await compareAuthorship({ text: inputText, targetProfileId: profileId });
      setAuthorshipResult({
        matchScore: result.similarity,
        assessment: result.confidence > 0.7 ? 'Strong authorship match' : 'Weak authorship correlation',
        divergentFeatures: result.divergentFeatures || [],
      });
    } catch (e) {
      console.error('Authorship comparison failed:', e);
    }
  };

  const isLoading = isAnalyzing || isDetecting || isComparing;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          Stylometric Analyzer
        </CardTitle>
        <CardDescription>
          Analyze writing patterns for authorship attribution and AI detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Paste text to analyze (minimum 100 words recommended)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{inputText.split(/\s+/).filter(Boolean).length} words</span>
            <span>{inputText.length} characters</span>
          </div>
        </div>

        {/* Analysis Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyze" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Features
            </TabsTrigger>
            <TabsTrigger value="llm" className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI Detection
            </TabsTrigger>
            <TabsTrigger value="author" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Authorship
            </TabsTrigger>
          </TabsList>

          {/* Feature Extraction Tab */}
          <TabsContent value="analyze" className="space-y-4">
            <Button 
              onClick={handleAnalyze} 
              disabled={isLoading || !inputText.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Features...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Extract Stylometric Features
                </>
              )}
            </Button>

            {analysisResult && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h4 className="font-semibold text-sm">Feature Analysis</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <FeatureItem 
                    label="Avg Sentence Length" 
                    value={`${analysisResult.features?.avgSentenceLength?.toFixed(1) || 0} words`} 
                  />
                  <FeatureItem 
                    label="Vocabulary Richness" 
                    value={`${((analysisResult.features?.vocabularyRichness || 0) * 100).toFixed(1)}%`} 
                  />
                  <FeatureItem 
                    label="Lexical Density" 
                    value={`${((analysisResult.features?.lexicalDensity || 0) * 100).toFixed(2)}%`} 
                  />
                  <FeatureItem 
                    label="Hapax Rate" 
                    value={`${((analysisResult.features?.hapaxRate || 0) * 100).toFixed(0)}%`} 
                  />
                </div>
                
                {analysisResult.features?.functionWordFrequencies && (
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground">Top Function Words:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(analysisResult.features.functionWordFrequencies)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([word], i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {word}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* LLM Detection Tab */}
          <TabsContent value="llm" className="space-y-4">
            <Button 
              onClick={handleDetectLLM} 
              disabled={isLoading || !inputText.trim()}
              className="w-full"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting AI Patterns...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Detect AI-Generated Content
                </>
              )}
            </Button>

            {llmResult && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Detection Result</h4>
                  <Badge 
                    variant={llmResult.isLLMGenerated ? 'destructive' : 'default'}
                    className="flex items-center gap-1"
                  >
                    {llmResult.isLLMGenerated ? (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        AI Detected
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Human Written
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">AI Probability</span>
                    <span className="font-medium">{((llmResult.confidence || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(llmResult.confidence || 0) * 100} 
                    className={cn(
                      'h-2',
                      llmResult.confidence > 0.7 ? '[&>div]:bg-destructive' : ''
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                  <FeatureItem 
                    label="Perplexity" 
                    value={llmResult.perplexityAnalysis?.estimatedPerplexity?.toFixed(2) || 'N/A'} 
                  />
                  <FeatureItem 
                    label="Burstiness" 
                    value={llmResult.burstinessAnalysis?.burstiessScore?.toFixed(2) || 'N/A'} 
                  />
                </div>

                {llmResult.predictedModel && (
                  <div className="pt-2 text-xs">
                    <span className="text-muted-foreground">Suspected Model: </span>
                    <span className="font-medium">{llmResult.predictedModel}</span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Authorship Comparison Tab */}
          <TabsContent value="author" className="space-y-4">
            <Button 
              onClick={handleCompareAuthorship} 
              disabled={isLoading || !inputText.trim() || !profileId}
              className="w-full"
            >
              {isComparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comparing Authorship...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Compare to Profile Writing Style
                </>
              )}
            </Button>

            {!profileId && (
              <p className="text-xs text-muted-foreground text-center">
                Select a profile to compare authorship
              </p>
            )}

            {authorshipResult && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Authorship Match</h4>
                  <Badge 
                    variant={authorshipResult.matchScore > 0.7 ? 'default' : 'secondary'}
                  >
                    {((authorshipResult.matchScore || 0) * 100).toFixed(0)}% Match
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Similarity Score</span>
                    <span className="font-medium">{((authorshipResult.matchScore || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(authorshipResult.matchScore || 0) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Assessment:</p>
                  <p>{authorshipResult.assessment || 'Analysis complete'}</p>
                </div>

                {authorshipResult.divergentFeatures && authorshipResult.divergentFeatures.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground">Divergent Features:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {authorshipResult.divergentFeatures.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function FeatureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
