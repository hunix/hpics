import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const reportTypes = [
  { value: 'daily_summary', label: 'Daily Summary', description: 'Captures, alerts, device status' },
  { value: 'mission_report', label: 'Mission Report', description: 'Mission objectives and outcomes' },
  { value: 'threat_analysis', label: 'Threat Analysis', description: 'Threat events and correlations' },
  { value: 'device_inventory', label: 'Device Inventory', description: 'All devices with specs' },
  { value: 'full_export', label: 'Full Export', description: 'Complete data backup' },
];

const formatIcons = {
  pdf: FileText,
  csv: FileSpreadsheet,
  json: FileJson,
};

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  generating: { icon: Loader2, color: 'text-blue-500', label: 'Generating', animate: true },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  failed: { icon: AlertCircle, color: 'text-red-500', label: 'Failed' },
};

export function ReportExportPanel() {
  const {
    reports: rawReports,
    isLoading,
    generateReport,
    isGenerating,
    downloadReport
  } = useReportGeneration();
  const reports = rawReports ?? [];

  const [reportType, setReportType] = useState<string>('daily_summary');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [includeDevices, setIncludeDevices] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeMissions, setIncludeMissions] = useState(true);

  const handleGenerate = () => {
    generateReport({
      reportType: reportType as any,
      format: reportFormat,
      reportName: `${reportType}_${new Date().toISOString().split('T')[0]}`,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    });
  };

  const getFileSizeLabel = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generator */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Create new export reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <p>{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="flex gap-2">
                {(['pdf', 'csv', 'json'] as const).map(fmt => {
                  const Icon = formatIcons[fmt];
                  return (
                    <Button
                      key={fmt}
                      variant={reportFormat === fmt ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setReportFormat(fmt)}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {fmt.toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.from, 'MMM d')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.to, 'MMM d')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Include Options */}
            <div className="space-y-2">
              <Label>Include</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="devices"
                    checked={includeDevices}
                    onCheckedChange={(checked) => setIncludeDevices(!!checked)}
                  />
                  <label htmlFor="devices" className="text-sm">Devices</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="alerts"
                    checked={includeAlerts}
                    onCheckedChange={(checked) => setIncludeAlerts(!!checked)}
                  />
                  <label htmlFor="alerts" className="text-sm">Alerts</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="missions"
                    checked={includeMissions}
                    onCheckedChange={(checked) => setIncludeMissions(!!checked)}
                  />
                  <label htmlFor="missions" className="text-sm">Missions</label>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Report History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report History</CardTitle>
            <CardDescription>Previously generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-sm mt-1">Create your first report using the form</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                    {reports.map(report => {
                      const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      const FormatIcon = formatIcons[report.format as keyof typeof formatIcons] || FileText;
                      const reportTypeInfo = reportTypes.find(t => t.value === report.report_type);
                      const isAnimated = report.status === 'generating';

                      return (
                        <div
                          key={report.id}
                          className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FormatIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{reportTypeInfo?.label || report.report_type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right text-sm">
                                <p className="text-muted-foreground">{report.format.toUpperCase()}</p>
                                <p>{getFileSizeLabel(report.file_size_bytes || null)}</p>
                              </div>
                              <Badge variant="secondary" className="gap-1">
                                <StatusIcon className={`h-3 w-3 ${status.color} ${isAnimated ? 'animate-spin' : ''}`} />
                                {status.label}
                              </Badge>
                              {report.status === 'completed' && report.file_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadReport(report)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
