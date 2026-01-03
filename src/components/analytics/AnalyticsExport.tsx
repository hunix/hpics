import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, CalendarIcon, Loader2, FileSpreadsheet } from 'lucide-react';
import { format, subMonths, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExportMetric {
  id: string;
  label: string;
  description: string;
}

const EXPORT_METRICS: ExportMetric[] = [
  { id: 'contacts', label: 'Contacts', description: 'All contact profiles with details' },
  { id: 'communications', label: 'Communications', description: 'Communication logs with sentiment' },
  { id: 'events', label: 'Events', description: 'Events and reminders' },
  { id: 'relationship_trends', label: 'Relationship Trends', description: 'Health scores over time' },
  { id: 'shared_experiences', label: 'Shared Experiences', description: 'Logged shared experiences' },
  { id: 'gift_ideas', label: 'Gift Ideas', description: 'Gift suggestions and history' },
];

export function AnalyticsExport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['contacts', 'communications']);
  const [isExporting, setIsExporting] = useState(false);

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const convertToCSV = (data: any[], headers: string[]): string => {
    if (data.length === 0) return headers.join(',') + '\n';
    
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = data.map(row => 
      headers.map(header => escapeCSV(row[header])).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const handleExport = async () => {
    if (!user || selectedMetrics.length === 0) {
      toast({ title: 'Select at least one metric to export', variant: 'destructive' });
      return;
    }

    setIsExporting(true);
    const startDateStr = startOfDay(startDate).toISOString();
    const endDateStr = endOfDay(endDate).toISOString();

    try {
      const exports: { name: string; csv: string }[] = [];

      for (const metric of selectedMetrics) {
        let data: any[] = [];
        let headers: string[] = [];

        switch (metric) {
          case 'contacts':
            const { data: contacts } = await supabase
              .from('profiles')
              .select('first_name, last_name, nickname, organization, job_title, relationship_type, tags, last_contact_date, is_favorite, created_at')
              .eq('user_id', user.id)
              .gte('created_at', startDateStr)
              .lte('created_at', endDateStr);
            data = contacts || [];
            headers = ['first_name', 'last_name', 'nickname', 'organization', 'job_title', 'relationship_type', 'tags', 'last_contact_date', 'is_favorite', 'created_at'];
            break;

          case 'communications':
            const { data: comms } = await supabase
              .from('communications')
              .select('channel, direction, subject, content, occurred_at, sentiment_score, duration_minutes')
              .eq('user_id', user.id)
              .gte('occurred_at', startDateStr)
              .lte('occurred_at', endDateStr)
              .order('occurred_at', { ascending: false });
            data = comms || [];
            headers = ['channel', 'direction', 'subject', 'content', 'occurred_at', 'sentiment_score', 'duration_minutes'];
            break;

          case 'events':
            const { data: events } = await supabase
              .from('events')
              .select('title, description, event_type, event_date, reminder_frequency, is_active')
              .eq('user_id', user.id)
              .gte('event_date', startDateStr)
              .lte('event_date', endDateStr)
              .order('event_date', { ascending: true });
            data = events || [];
            headers = ['title', 'description', 'event_type', 'event_date', 'reminder_frequency', 'is_active'];
            break;

          case 'relationship_trends':
            const { data: trends } = await supabase
              .from('relationship_trends')
              .select('profile_id, health_score, communication_count, sentiment_avg, recorded_at')
              .eq('user_id', user.id)
              .gte('recorded_at', startDateStr)
              .lte('recorded_at', endDateStr)
              .order('recorded_at', { ascending: false });
            data = trends || [];
            headers = ['profile_id', 'health_score', 'communication_count', 'sentiment_avg', 'recorded_at'];
            break;

          case 'shared_experiences':
            const { data: experiences } = await supabase
              .from('shared_experiences')
              .select('title, description, experience_type, experience_date, location, sentiment, tags')
              .eq('user_id', user.id)
              .gte('created_at', startDateStr)
              .lte('created_at', endDateStr)
              .order('experience_date', { ascending: false });
            data = experiences || [];
            headers = ['title', 'description', 'experience_type', 'experience_date', 'location', 'sentiment', 'tags'];
            break;

          case 'gift_ideas':
            const { data: gifts } = await supabase
              .from('gift_ideas')
              .select('title, description, category, price_range, occasion, is_given, given_date, url')
              .eq('user_id', user.id)
              .gte('created_at', startDateStr)
              .lte('created_at', endDateStr);
            data = gifts || [];
            headers = ['title', 'description', 'category', 'price_range', 'occasion', 'is_given', 'given_date', 'url'];
            break;
        }

        const csv = convertToCSV(data, headers);
        exports.push({ name: metric, csv });
      }

      // Download each CSV
      exports.forEach(({ name, csv }) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pics_${name}_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });

      toast({ title: 'Export complete', description: `Downloaded ${exports.length} file(s)` });
    } catch (error: any) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Analytics Data
        </CardTitle>
        <CardDescription>
          Download your relationship data as CSV files for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-3">
          <Label>Date Range</Label>
          <div className="flex flex-wrap gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="self-center text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Metrics Selection */}
        <div className="space-y-3">
          <Label>Select Data to Export</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXPORT_METRICS.map((metric) => (
              <div 
                key={metric.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedMetrics.includes(metric.id) 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:bg-muted/50"
                )}
                onClick={() => toggleMetric(metric.id)}
              >
                <Checkbox 
                  checked={selectedMetrics.includes(metric.id)}
                  onCheckedChange={() => toggleMetric(metric.id)}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting || selectedMetrics.length === 0}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export {selectedMetrics.length} Dataset{selectedMetrics.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
