import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Mail, Plus, Trash2, Play, Pause } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ScheduledReport {
  id: string;
  name: string;
  type: 'network' | 'relationships' | 'communications' | 'analytics' | 'security';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

const mockReports: ScheduledReport[] = [
  {
    id: '1',
    name: 'Weekly Network Summary',
    type: 'network',
    frequency: 'weekly',
    recipients: ['user@example.com'],
    format: 'pdf',
    enabled: true,
    lastRun: '2024-01-08T09:00:00Z',
    nextRun: '2024-01-15T09:00:00Z',
  },
  {
    id: '2',
    name: 'Monthly Relationship Health',
    type: 'relationships',
    frequency: 'monthly',
    recipients: ['user@example.com', 'team@example.com'],
    format: 'pdf',
    enabled: true,
    nextRun: '2024-02-01T09:00:00Z',
  },
];

const reportTypes = [
  { value: 'network', label: 'Network Analysis' },
  { value: 'relationships', label: 'Relationship Health' },
  { value: 'communications', label: 'Communications Summary' },
  { value: 'analytics', label: 'Analytics Overview' },
  { value: 'security', label: 'Security Report' },
];

export function ScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>(mockReports);
  const [isCreating, setIsCreating] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'network' as const,
    frequency: 'weekly' as const,
    recipients: '',
    format: 'pdf' as const,
  });

  const handleCreateReport = () => {
    if (!newReport.name || !newReport.recipients) {
      toast.error('Please fill in all required fields');
      return;
    }

    const report: ScheduledReport = {
      id: Date.now().toString(),
      name: newReport.name,
      type: newReport.type,
      frequency: newReport.frequency,
      recipients: newReport.recipients.split(',').map(e => e.trim()),
      format: newReport.format,
      enabled: true,
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setReports([...reports, report]);
    setNewReport({ name: '', type: 'network', frequency: 'weekly', recipients: '', format: 'pdf' });
    setIsCreating(false);
    toast.success('Scheduled report created');
  };

  const toggleReport = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const deleteReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    toast.success('Report deleted');
  };

  const runNow = (id: string) => {
    toast.success('Report generation started. You will receive it via email shortly.');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      network: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      relationships: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      communications: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      analytics: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      security: 'bg-red-500/10 text-red-600 dark:text-red-400',
    };
    return colors[type] || 'bg-muted';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Reports
            </CardTitle>
            <CardDescription>
              Automate report generation and delivery
            </CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Scheduled Report</DialogTitle>
                <DialogDescription>
                  Set up automatic report generation and delivery
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Report Name</Label>
                  <Input
                    placeholder="e.g., Weekly Network Summary"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select
                      value={newReport.type}
                      onValueChange={(v: any) => setNewReport({ ...newReport, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={newReport.frequency}
                      onValueChange={(v: any) => setNewReport({ ...newReport, frequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Recipients (comma-separated emails)</Label>
                  <Input
                    placeholder="email@example.com, team@example.com"
                    value={newReport.recipients}
                    onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={newReport.format}
                    onValueChange={(v: any) => setNewReport({ ...newReport, format: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateReport} className="w-full">
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled reports yet</p>
            <p className="text-sm">Create one to automate your reporting</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {report.frequency}
                      </Badge>
                      <Badge variant="outline" className="text-xs uppercase">
                        {report.format}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {report.recipients.length} recipient(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next: {new Date(report.nextRun).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => runNow(report.id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={report.enabled}
                    onCheckedChange={() => toggleReport(report.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReport(report.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
