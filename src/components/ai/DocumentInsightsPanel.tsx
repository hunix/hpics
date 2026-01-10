import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Eye, 
  Table, 
  Users, 
  Calendar,
  Shield,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentInsightsPanelProps {
  profileId?: string;
  mediaId?: string;
  insightId?: string;
}

export function DocumentInsightsPanel({ profileId, mediaId, insightId }: DocumentInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState('ocr');

  const { data: insights, isLoading } = useQuery({
    queryKey: ['document-insights', profileId, mediaId, insightId],
    queryFn: async () => {
      let query = supabase
        .from('document_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (insightId) {
        query = query.eq('id', insightId);
      } else if (mediaId) {
        query = query.eq('media_id', mediaId);
      } else if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!(profileId || mediaId || insightId),
  });

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 animate-pulse" />
            Loading document insights...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No document insights available</p>
            <p className="text-sm mt-1">Run document analysis to extract information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const insight = insights[0];
  const rawText = insight.raw_text as string;
  const documentType = insight.document_type as string;
  const documentSubtype = insight.document_subtype as string;
  const structuredData = insight.structured_data as Record<string, any> || {};
  const keyValuePairs = (insight.key_value_pairs as any[]) || [];
  const tables = (insight.tables_extracted as any[]) || [];
  const contactInfo = insight.contact_info_extracted as Record<string, any[]> || {};
  const suggestedContacts = (insight.suggested_contacts as any[]) || [];
  const datesFound = (insight.dates_found as any[]) || [];
  const reminders = (insight.suggested_reminders as any[]) || [];
  const sensitiveData = insight.sensitive_data as Record<string, any> || {};
  const patterns = insight.patterns_detected as Record<string, any[]> || {};
  const anomalies = (insight.anomalies as any[]) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Document Intelligence
          <div className="ml-auto flex items-center gap-2">
            {documentType && (
              <Badge variant="default">{documentType}</Badge>
            )}
            {documentSubtype && (
              <Badge variant="outline">{documentSubtype}</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="ocr" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              OCR
            </TabsTrigger>
            <TabsTrigger value="structure" className="text-xs">
              <Table className="h-3 w-3 mr-1" />
              Data
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="dates" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Dates
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ocr" className="mt-4">
            <div className="space-y-4">
              {/* Raw Text */}
              <div className="relative">
                <ScrollArea className="h-64 rounded-md border p-4">
                  <p className="text-sm whitespace-pre-wrap font-mono">
                    {rawText || 'No text extracted'}
                  </p>
                </ScrollArea>
                {rawText && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyText(rawText)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Language */}
              {insight.language_detected && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Language:</span>
                  <Badge variant="outline">{insight.language_detected as string}</Badge>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="structure" className="mt-4">
            <div className="space-y-4">
              {/* Key-Value Pairs */}
              {keyValuePairs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Extracted Fields</h4>
                  <div className="grid gap-2">
                    {keyValuePairs.map((kv: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span className="text-muted-foreground">{kv.key}</span>
                        <span className="font-medium">{kv.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Data */}
              {Object.keys(structuredData).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Structured Data</h4>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <pre className="text-xs">
                      {JSON.stringify(structuredData, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {/* Tables */}
              {tables.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Extracted Tables</h4>
                  {tables.map((table: any, idx: number) => (
                    <div key={idx} className="border rounded overflow-hidden">
                      <ScrollArea className="max-h-48">
                        <table className="w-full text-xs">
                          {table.headers && (
                            <thead className="bg-muted">
                              <tr>
                                {table.headers.map((h: string, i: number) => (
                                  <th key={i} className="p-2 text-left font-medium">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                          )}
                          <tbody>
                            {table.rows?.map((row: any[], rIdx: number) => (
                              <tr key={rIdx} className="border-t">
                                {row.map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="p-2">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                    </div>
                  ))}
                </div>
              )}

              {!keyValuePairs.length && !Object.keys(structuredData).length && !tables.length && (
                <p className="text-muted-foreground text-sm">No structured data extracted</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <div className="space-y-4">
              {/* Extracted Contact Info */}
              {Object.keys(contactInfo).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Extracted Contact Information</h4>
                  <div className="grid gap-2">
                    {Object.entries(contactInfo).map(([type, items]) => (
                      <div key={type} className="p-2 border rounded">
                        <span className="text-xs text-muted-foreground capitalize">{type}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(items as any[])?.map((item: any, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {typeof item === 'string' ? item : item.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Contact Matches */}
              {suggestedContacts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Matched Contacts</h4>
                  {suggestedContacts.map((contact: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Contact Match</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {Math.round((contact.confidence || 0) * 100)}% match
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          via {contact.matched_on}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!Object.keys(contactInfo).length && !suggestedContacts.length && (
                <p className="text-muted-foreground text-sm">No contact information found</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dates" className="mt-4">
            <div className="space-y-4">
              {/* Dates Found */}
              {datesFound.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Dates Detected</h4>
                  {datesFound.map((date: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{date.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={date.type === 'deadline' ? 'destructive' : 'secondary'}>
                          {date.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {date.context}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested Reminders */}
              {reminders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Suggested Reminders</h4>
                  {reminders.map((reminder: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={
                          reminder.priority === 'high' ? 'destructive' : 
                          reminder.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {reminder.priority} priority
                        </Badge>
                        <span className="text-sm font-medium">{reminder.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.reminder_text}</p>
                    </div>
                  ))}
                </div>
              )}

              {!datesFound.length && !reminders.length && (
                <p className="text-muted-foreground text-sm">No dates or reminders found</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <div className="space-y-4">
              {/* Authenticity Score */}
              {insight.authenticity_score && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Authenticity Score</span>
                    <Badge variant={(insight.authenticity_score as number) > 0.7 ? 'default' : 'destructive'}>
                      {Math.round((insight.authenticity_score as number) * 100)}%
                    </Badge>
                  </div>
                </div>
              )}

              {/* Sensitive Data */}
              {sensitiveData.types_found?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    Sensitive Data Detected
                  </h4>
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <div className="flex flex-wrap gap-1">
                      {sensitiveData.types_found.map((type: string, idx: number) => (
                        <Badge key={idx} variant="destructive">{type}</Badge>
                      ))}
                    </div>
                    {sensitiveData.redaction_recommended && (
                      <p className="text-sm text-destructive mt-2">
                        ⚠️ Redaction recommended before sharing
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Anomalies */}
              {anomalies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Anomalies Detected</h4>
                  {anomalies.map((anomaly: any, idx: number) => (
                    <div key={idx} className="p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                          {anomaly.severity}
                        </Badge>
                        <span>{anomaly.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Patterns */}
              {patterns.recurring_elements?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Detected Patterns</h4>
                  <div className="flex flex-wrap gap-1">
                    {patterns.recurring_elements.map((pattern: any, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {typeof pattern === 'string' ? pattern : pattern.element}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!sensitiveData.types_found?.length && !anomalies.length && (
                <div className="p-3 bg-green-500/10 rounded-lg text-green-700 dark:text-green-400 text-sm">
                  <Shield className="h-4 w-4 inline mr-2" />
                  No security concerns detected
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
