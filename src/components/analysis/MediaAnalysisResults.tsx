import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  AlertCircle, 
  Lightbulb, 
  CheckCircle, 
  Brain, 
  ListTodo,
  ChevronRight
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MediaAnalysisResultsProps {
  results: any;
  mediaType: string;
  processingTime?: number;
  estimatedCost?: number;
}

export function MediaAnalysisResults({
  results,
  mediaType,
  processingTime,
  estimatedCost,
}: MediaAnalysisResultsProps) {
  const keyInsights = results?.key_insights || [];
  const redFlags = results?.red_flags || [];
  const yellowFlags = results?.yellow_flags || [];
  const actionItems = results?.action_items || [];
  const certainties = results?.certainties || [];
  const personalityCues = results?.personality_cues || null;
  const overallConfidence = results?.overall_confidence;

  // Get analysis-specific results
  const analysisKeys = Object.keys(results || {}).filter(
    key => !['key_insights', 'red_flags', 'yellow_flags', 'action_items', 'certainties', 'personality_cues', 'overall_confidence', 'raw_analysis', 'parse_error'].includes(key)
  );

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {overallConfidence !== undefined && (
          <Badge variant="outline">
            Confidence: {overallConfidence}%
          </Badge>
        )}
        {processingTime && (
          <span>Processed in {(processingTime / 1000).toFixed(1)}s</span>
        )}
        {estimatedCost !== undefined && (
          <span>Est. cost: ${(estimatedCost / 100).toFixed(3)}</span>
        )}
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="flags" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Flags
            {(redFlags.length + yellowFlags.length > 0) && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                {redFlags.length + yellowFlags.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1">
            <ListTodo className="h-3 w-3" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Key Insights ({keyInsights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keyInsights.length === 0 ? (
                <p className="text-muted-foreground text-sm">No insights extracted</p>
              ) : (
                <ul className="space-y-2">
                  {keyInsights.map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              )}

              {certainties.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    High Confidence Certainties
                  </h4>
                  <ul className="space-y-2">
                    {certainties.map((cert: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <div className="space-y-4">
            {redFlags.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Red Flags ({redFlags.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {redFlags.map((flag: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {yellowFlags.length > 0 && (
              <Card className="border-yellow-500/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    Yellow Flags ({yellowFlags.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {yellowFlags.map((flag: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {redFlags.length === 0 && yellowFlags.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                  <p>No flags detected</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-blue-500" />
                Action Items ({actionItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">No action items identified</p>
              ) : (
                <ul className="space-y-2">
                  {actionItems.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="h-5 w-5 rounded border flex items-center justify-center text-xs text-muted-foreground mt-0.5 flex-shrink-0">
                        {i + 1}
                      </div>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Personality Cues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!personalityCues || Object.keys(personalityCues).length === 0 ? (
                <p className="text-muted-foreground text-sm">No personality indicators extracted</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(personalityCues).map(([key, value]: [string, any]) => (
                    <div key={key} className="border-b pb-2 last:border-0">
                      <h4 className="text-sm font-medium capitalize mb-1">
                        {key.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detailed Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisKeys.length === 0 ? (
                <p className="text-muted-foreground text-sm">No detailed analysis available</p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {analysisKeys.map((key) => (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger className="text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="max-h-[300px]">
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {JSON.stringify(results[key], null, 2)}
                          </pre>
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
