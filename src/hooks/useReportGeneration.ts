import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { invokeFunction } from '@/lib/api';

export type ReportType = 'daily_summary' | 'device_inventory' | 'threat_analysis' | 'mission_report' | 'full_export';
export type ReportFormat = 'pdf' | 'csv' | 'json';
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface GeneratedReport {
  id: string;
  user_id: string;
  report_type: ReportType;
  report_name: string;
  format: ReportFormat;
  parameters: {
    start_date?: string;
    end_date?: string;
    device_ids?: string[];
    mission_id?: string;
  };
  file_url?: string;
  file_size_bytes?: number;
  status: ReportStatus;
  error_message?: string;
  generated_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface GenerateReportParams {
  reportType: ReportType;
  format?: ReportFormat;
  reportName?: string;
  startDate?: string;
  endDate?: string;
  deviceIds?: string[];
  missionId?: string;
}

export function useReportGeneration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch report history
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['generated-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        report_name: r.report_name || r.title || 'Untitled Report',
        parameters: (r.parameters || {}) as GeneratedReport['parameters'],
        status: r.status || 'completed',
      })) as GeneratedReport[];
    },
    enabled: !!user?.id,
  });

  // Generate report mutation
  const generateReport = useMutation({
    mutationFn: async (params: GenerateReportParams) => {
      const { data, error } = await invokeFunction('generate-hardware-report', {
          report_type: params.reportType,
          format: params.format || 'json',
          report_name: params.reportName,
          parameters: {
            start_date: params.startDate,
            end_date: params.endDate,
            device_ids: params.deviceIds,
            mission_id: params.missionId,
          },
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
      toast.success('Report generated successfully', {
        description: `Report ID: ${data.report_id}`,
      });
    },
    onError: (error) => {
      toast.error('Failed to generate report', { description: error.message });
    },
  });

  // Check report status
  const checkReportStatus = useCallback(async (reportId: string) => {
    const { data, error } = await invokeFunction('generate-hardware-report', null, { headers: {
        'Content-Type': 'application/json',
      } });

    // Fallback to direct query since GET with path params may not work
    const { data: report, error: queryError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (queryError) throw queryError;
    const r = report as any;
    return {
      ...r,
      report_name: r.report_name || r.title || 'Untitled Report',
      parameters: (r.parameters || {}) as GeneratedReport['parameters'],
      status: r.status || 'completed',
    } as GeneratedReport;
  }, []);

  // Download report
  const downloadReport = useCallback(async (report: GeneratedReport) => {
    if (!report.file_url) {
      // If no file URL, fetch the content directly
      const result = await generateReport.mutateAsync({
        reportType: report.report_type,
        format: report.format,
        startDate: report.parameters.start_date,
        endDate: report.parameters.end_date,
        deviceIds: report.parameters.device_ids,
        missionId: report.parameters.mission_id,
      });

      // Create downloadable blob
      const content = result.formatted_content || JSON.stringify(result.content, null, 2);
      const blob = new Blob([content], { 
        type: report.format === 'csv' ? 'text/csv' : 
              report.format === 'json' ? 'application/json' : 
              'application/pdf' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.report_name || report.report_type}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return;
    }

    // Download from URL
    window.open(report.file_url, '_blank');
  }, [generateReport]);

  // Delete report
  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('generated_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
      toast.success('Report deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete report', { description: error.message });
    },
  });

  // Get recent reports by type
  const getReportsByType = useCallback((type: ReportType) => {
    return (reports || []).filter(r => r.report_type === type);
  }, [reports]);

  // Stats
  const stats = {
    totalReports: reports?.length || 0,
    completedReports: reports?.filter(r => r.status === 'completed').length || 0,
    pendingReports: reports?.filter(r => r.status === 'pending' || r.status === 'generating').length || 0,
    failedReports: reports?.filter(r => r.status === 'failed').length || 0,
    byType: {
      daily_summary: getReportsByType('daily_summary').length,
      device_inventory: getReportsByType('device_inventory').length,
      threat_analysis: getReportsByType('threat_analysis').length,
      mission_report: getReportsByType('mission_report').length,
      full_export: getReportsByType('full_export').length,
    },
  };

  return {
    reports,
    stats,
    isLoading,
    error,
    generateReport: generateReport.mutate,
    generateReportAsync: generateReport.mutateAsync,
    isGenerating: generateReport.isPending,
    checkReportStatus,
    downloadReport,
    deleteReport: deleteReport.mutate,
    getReportsByType,
  };
}
