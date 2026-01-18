import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  Loader2,
  BarChart3,
  Clock,
  Network,
  FileDown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PDFDossierGenerator } from '@/components/reports/PDFDossierGenerator';
import { NetworkMapExport } from '@/components/reports/NetworkMapExport';
import { ScheduledReportsManager } from '@/components/reports/ScheduledReportsManager';

export default function Reports() {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('reports_schedule')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async (timePeriod: string) => {
      const response = await supabase.functions.invoke('generate-executive-summary', {
        body: { timePeriod },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Executive summary generated');
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const generateHealthReportMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('calculate-relationship-scores', {
        body: { generateReport: true },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Relationship health report generated');
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const generateNetworkReportMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('analyze-network-intelligence', {
        body: { generateReport: true },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Network analysis report generated');
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'executive_summary':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'relationship_health':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'dossier':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout title="Reports">
      <div className="space-y-6">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList>
            <TabsTrigger value="generate">
              <FileText className="h-4 w-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="dossiers">
              <FileDown className="h-4 w-4 mr-2" />
              Dossiers
            </TabsTrigger>
            <TabsTrigger value="network">
              <Network className="h-4 w-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              <Calendar className="h-4 w-4 mr-2" />
              Scheduled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Executive Summary</CardTitle>
                      <CardDescription>Overview of your relationship activity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => generateSummaryMutation.mutate('week')}
                      disabled={generateSummaryMutation.isPending}
                    >
                      Weekly
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => generateSummaryMutation.mutate('month')}
                      disabled={generateSummaryMutation.isPending}
                    >
                      Monthly
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => generateSummaryMutation.mutate('quarter')}
                      disabled={generateSummaryMutation.isPending}
                    >
                      Quarterly
                    </Button>
                  </div>
                  {generateSummaryMutation.isPending && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                  {generateSummaryMutation.data && (
                    <div className="p-4 bg-muted rounded-lg text-sm">
                      <h4 className="font-medium mb-2">Summary Generated</h4>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>Contacts: {generateSummaryMutation.data.summary?.stats?.totalContacts ?? 0}</div>
                        <div>New: {generateSummaryMutation.data.summary?.stats?.newContacts ?? 0}</div>
                        <div>Communications: {generateSummaryMutation.data.summary?.stats?.totalCommunications ?? 0}</div>
                        <div>Avg Score: {generateSummaryMutation.data.summary?.stats?.averageRelationshipScore ?? 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Relationship Health</CardTitle>
                      <CardDescription>Analyze decay risks and trends</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    onClick={() => generateHealthReportMutation.mutate()}
                    disabled={generateHealthReportMutation.isPending}
                  >
                    {generateHealthReportMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Generate Report
                  </Button>
                  {generateHealthReportMutation.data && (
                    <div className="p-4 bg-muted rounded-lg text-sm">
                      <p className="text-muted-foreground">Report generated successfully!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Network Analysis</CardTitle>
                      <CardDescription>Understand your connection network</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => generateNetworkReportMutation.mutate()}
                    disabled={generateNetworkReportMutation.isPending}
                  >
                    {generateNetworkReportMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Generate Report
                  </Button>
                  {generateNetworkReportMutation.data && (
                    <div className="p-4 bg-muted rounded-lg text-sm">
                      <p className="text-muted-foreground">Report generated successfully!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dossiers" className="mt-6 min-h-[600px]">
            <div className="w-full">
              <PDFDossierGenerator />
            </div>
          </TabsContent>

          <TabsContent value="network" className="mt-6 min-h-[600px]">
            <div className="w-full">
              <NetworkMapExport />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>Previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report: any) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getReportIcon(report.report_type)}
                          <div>
                            <h4 className="font-medium">{report.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        {report.file_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={report.file_url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No reports generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            <ScheduledReportsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}