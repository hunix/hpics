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
import { Download, CalendarIcon, Loader2, FileSpreadsheet, FileJson } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subMonths, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExportMetric {
  id: string;
  label: string;
  description: string;
}

const EXPORT_METRICS: ExportMetric[] = [
  { id: 'contacts', label: 'Contacts', description: 'All contact profiles with details' },
  { id: 'personal_info', label: 'Personal Info', description: 'DOB, gender, blood type, allergies' },
  { id: 'languages', label: 'Languages', description: 'Spoken languages and proficiency' },
  { id: 'devices', label: 'Devices', description: 'Phones, tablets, laptops' },
  { id: 'vehicles', label: 'Vehicles', description: 'Cars and other vehicles' },
  { id: 'properties', label: 'Properties', description: 'Real estate and property ownership' },
  { id: 'residences', label: 'Residence History', description: 'Where contacts have lived' },
  { id: 'travel_history', label: 'Travel History', description: 'Travel destinations and dates' },
  { id: 'identity_documents', label: 'Identity Documents', description: 'Passports, IDs, etc.' },
  { id: 'education', label: 'Education', description: 'Schools, degrees, certifications' },
  { id: 'skills', label: 'Skills', description: 'Professional and personal skills' },
  { id: 'interests', label: 'Interests', description: 'Hobbies and interests' },
  { id: 'communications', label: 'Communications', description: 'Communication logs with sentiment' },
  { id: 'events', label: 'Events', description: 'Events and reminders' },
  { id: 'relationship_trends', label: 'Relationship Trends', description: 'Health scores over time' },
  { id: 'shared_experiences', label: 'Shared Experiences', description: 'Logged shared experiences' },
  { id: 'gift_ideas', label: 'Gift Ideas', description: 'Gift suggestions and history' },
];

export function AnalyticsExport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 12));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['contacts', 'personal_info', 'communications']);
  const [isExporting, setIsExporting] = useState(false);

  const handleSelectAll = () => {
    if (selectedMetrics.length === EXPORT_METRICS.length) {
      setSelectedMetrics([]);
    } else {
      setSelectedMetrics(EXPORT_METRICS.map(m => m.id));
    }
  };

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
      const exports: { name: string; csv: string; data: any[]; headers: string[] }[] = [];

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

          case 'personal_info':
            const { data: personalInfo } = await supabase
              .from('contact_personal_info')
              .select('profile_id, date_of_birth, gender, blood_group, rh_type, allergies, place_of_birth, father_name, mother_name, nationality, main_residence_city, main_residence_country, smoking_preference, favorite_color')
              .eq('user_id', user.id);
            data = personalInfo || [];
            headers = ['profile_id', 'date_of_birth', 'gender', 'blood_group', 'rh_type', 'allergies', 'place_of_birth', 'father_name', 'mother_name', 'nationality', 'main_residence_city', 'main_residence_country', 'smoking_preference', 'favorite_color'];
            break;

          case 'languages':
            const { data: languages } = await supabase
              .from('contact_languages')
              .select('profile_id, language_name, proficiency_level, is_native')
              .eq('user_id', user.id);
            data = languages || [];
            headers = ['profile_id', 'language_name', 'proficiency_level', 'is_native'];
            break;

          case 'devices':
            const { data: devices } = await supabase
              .from('contact_devices')
              .select('profile_id, device_type, brand, model, os, is_current, notes')
              .eq('user_id', user.id);
            data = devices || [];
            headers = ['profile_id', 'device_type', 'brand', 'model', 'os', 'is_current', 'notes'];
            break;

          case 'vehicles':
            const { data: vehicles } = await supabase
              .from('contact_vehicles')
              .select('profile_id, vehicle_type, make, model, year, color, license_plate, is_current')
              .eq('user_id', user.id);
            data = vehicles || [];
            headers = ['profile_id', 'vehicle_type', 'make', 'model', 'year', 'color', 'license_plate', 'is_current'];
            break;

          case 'properties':
            const { data: properties } = await supabase
              .from('contact_properties')
              .select('profile_id, property_type, address, city, country, area_sqm, estimated_value, is_primary_residence, purchase_date')
              .eq('user_id', user.id);
            data = properties || [];
            headers = ['profile_id', 'property_type', 'address', 'city', 'country', 'area_sqm', 'estimated_value', 'is_primary_residence', 'purchase_date'];
            break;

          case 'residences':
            const { data: residences } = await supabase
              .from('contact_residences')
              .select('profile_id, country, city, address, residence_type, start_date, end_date, is_current')
              .eq('user_id', user.id);
            data = residences || [];
            headers = ['profile_id', 'country', 'city', 'address', 'residence_type', 'start_date', 'end_date', 'is_current'];
            break;

          case 'travel_history':
            const { data: travel } = await supabase
              .from('contact_travel_history')
              .select('profile_id, destination_country, destination_city, travel_date, return_date, purpose, notes')
              .eq('user_id', user.id);
            data = travel || [];
            headers = ['profile_id', 'destination_country', 'destination_city', 'travel_date', 'return_date', 'purpose', 'notes'];
            break;

          case 'identity_documents':
            const { data: idDocs } = await supabase
              .from('contact_identity_documents')
              .select('profile_id, document_type, document_number, issuing_country, issue_date, expiry_date')
              .eq('user_id', user.id);
            data = idDocs || [];
            headers = ['profile_id', 'document_type', 'document_number', 'issuing_country', 'issue_date', 'expiry_date'];
            break;

          case 'education':
            const { data: education } = await supabase
              .from('education')
              .select('profile_id, institution_name, degree_type, field_of_study, start_date, end_date, grade_or_gpa, is_current')
              .eq('user_id', user.id);
            data = education || [];
            headers = ['profile_id', 'institution_name', 'degree_type', 'field_of_study', 'start_date', 'end_date', 'grade_or_gpa', 'is_current'];
            break;

          case 'skills':
            const { data: skills } = await supabase
              .from('contact_skills')
              .select('profile_id, skill_name, proficiency_level, endorsement_count')
              .eq('user_id', user.id);
            data = skills || [];
            headers = ['profile_id', 'skill_name', 'proficiency_level', 'endorsement_count'];
            break;

          case 'interests':
            const { data: interests } = await supabase
              .from('contact_interests')
              .select('profile_id, name, interest_type, notes, source, confidence_score')
              .eq('user_id', user.id);
            data = interests || [];
            headers = ['profile_id', 'name', 'interest_type', 'notes', 'source', 'confidence_score'];
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
        exports.push({ name: metric, csv, data, headers });
      }

      if (exportFormat === 'json') {
        // Combine all data into one JSON file
        const jsonData: Record<string, any[]> = {};
        exports.forEach(({ name, data }) => {
          jsonData[name] = data;
        });

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pics_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({ title: 'Export complete', description: 'Downloaded JSON backup file' });
      } else {
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

        toast({ title: 'Export complete', description: `Downloaded ${exports.length} CSV file(s)` });
      }
    } catch (error) {
      toast({ title: 'Export failed', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {exportFormat === 'json' ? <FileJson className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
          Export Contact Data
        </CardTitle>
        <CardDescription>
          Download a comprehensive backup of all your contact data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Format */}
        <div className="space-y-3">
          <Label>Export Format</Label>
          <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'json')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Multiple files)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON (Single backup)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

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
          <div className="flex items-center justify-between">
            <Label>Select Data to Export</Label>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedMetrics.length === EXPORT_METRICS.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
