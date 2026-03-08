import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Loader2, GraduationCap, FileJson, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';

interface ParsedEducation {
  profileName: string;
  institutionName: string;
  degreeType?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  gpa?: string;
}

const educationSchema = z.object({
  profileName: z.string().min(1).max(200),
  institutionName: z.string().min(1).max(500),
  degreeType: z.string().max(100).optional(),
  fieldOfStudy: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  gpa: z.string().max(20).optional(),
});

export function EducationBulkImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [preview, setPreview] = useState<ParsedEducation[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const { data: profiles } = useQuery({
    queryKey: ['profiles-list', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_id', user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const parseCSV = (text: string): ParsedEducation[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const results: ParsedEducation[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));

      const row: Partial<ParsedEducation> = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (!value) return;

        if (header.includes('name') && (header.includes('contact') || header.includes('profile') || header.includes('person'))) {
          row.profileName = value;
        } else if (header.includes('institution') || header.includes('school') || header.includes('university') || header.includes('college')) {
          row.institutionName = value;
        } else if (header.includes('degree') || header.includes('type')) {
          row.degreeType = value;
        } else if (header.includes('field') || header.includes('study') || header.includes('major') || header.includes('subject')) {
          row.fieldOfStudy = value;
        } else if (header.includes('start')) {
          row.startDate = value;
        } else if (header.includes('end')) {
          row.endDate = value;
        } else if (header.includes('current') || header.includes('ongoing')) {
          row.isCurrent = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
        } else if (header.includes('gpa') || header.includes('grade')) {
          row.gpa = value;
        }
      });

      if (row.profileName && row.institutionName) {
        results.push(row as ParsedEducation);
      }
    }

    return results;
  };

  const parseJSON = (text: string): ParsedEducation[] => {
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : (data.education || data.items || data.records || [data]);
      
      return items.map((item: any) => ({
        profileName: item.profileName || item.profile_name || item.contactName || item.contact_name || item.name || '',
        institutionName: item.institutionName || item.institution_name || item.institution || item.school || item.university || '',
        degreeType: item.degreeType || item.degree_type || item.degree || '',
        fieldOfStudy: item.fieldOfStudy || item.field_of_study || item.field || item.major || '',
        startDate: item.startDate || item.start_date || item.start || '',
        endDate: item.endDate || item.end_date || item.end || '',
        isCurrent: item.isCurrent ?? item.is_current ?? item.current ?? false,
        gpa: item.gpa || item.grade || item.grade_or_gpa || '',
      })).filter((e: ParsedEducation) => e.profileName && e.institutionName);
    } catch {
      return [];
    }
  };

  const handleCSVPreview = () => {
    const parsed = parseCSV(csvContent);
    if (parsed.length === 0) {
      toast({ title: 'No valid data found', description: 'Check CSV format', variant: 'destructive' });
      return;
    }
    setPreview(parsed);
    setImportResult(null);
    toast({ title: `Found ${parsed.length} education records` });
  };

  const handleJSONPreview = () => {
    const parsed = parseJSON(jsonContent);
    if (parsed.length === 0) {
      toast({ title: 'No valid data found', description: 'Check JSON format', variant: 'destructive' });
      return;
    }
    setPreview(parsed);
    setImportResult(null);
    toast({ title: `Found ${parsed.length} education records` });
  };

  const importMutation = useMutation({
    mutationFn: async (records: ParsedEducation[]) => {
      if (!user || !profiles) throw new Error('Not authenticated');

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const record of records) {
        try {
          // Validate record
          educationSchema.parse(record);

          // Find matching profile by name
          const nameLower = record.profileName.toLowerCase();
          const profile = profiles.find(p => {
            const fullName = `${p.first_name} ${p.last_name || ''}`.toLowerCase().trim();
            const firstName = p.first_name.toLowerCase();
            return fullName === nameLower || firstName === nameLower || fullName.includes(nameLower);
          });

          if (!profile) {
            errors.push(`Profile not found: ${record.profileName}`);
            failed++;
            continue;
          }

          // Parse dates
          let startDate: string | null = null;
          let endDate: string | null = null;

          if (record.startDate) {
            const parsed = new Date(record.startDate);
            if (!isNaN(parsed.getTime())) {
              startDate = parsed.toISOString().split('T')[0];
            }
          }

          if (record.endDate && !record.isCurrent) {
            const parsed = new Date(record.endDate);
            if (!isNaN(parsed.getTime())) {
              endDate = parsed.toISOString().split('T')[0];
            }
          }

          const { error } = await supabase.from('education').insert({
            profile_id: profile.id,
            user_id: user.id,
            institution_name: record.institutionName,
            degree_type: record.degreeType || null,
            field_of_study: record.fieldOfStudy || null,
            start_date: startDate,
            end_date: endDate,
            is_current: record.isCurrent || false,
            grade_or_gpa: record.gpa || null,
          });

          if (error) throw error;
          success++;
        } catch (error) {
          errors.push(`${record.profileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failed++;
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['education'] });
      toast({ 
        title: 'Import complete', 
        description: `Imported ${result.success} records. ${result.failed} failed.`,
        variant: result.failed > 0 ? 'destructive' : 'default'
      });
      if (result.success > 0) {
        setPreview([]);
        setCsvContent('');
        setJsonContent('');
      }
    },
    onError: (error) => {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Bulk Import Education
        </CardTitle>
        <CardDescription>
          Import education records for multiple contacts from CSV or JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="csv">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-4 space-y-4">
            <Alert>
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription className="text-xs font-mono mt-2">
                profile_name,institution,degree,field_of_study,start_date,end_date,gpa<br/>
                John Doe,MIT,Bachelor's,Computer Science,2015-09,2019-05,3.8
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Paste CSV Content</Label>
              <Textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste your CSV data here..."
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            <Button variant="outline" onClick={handleCSVPreview} disabled={!csvContent.trim()}>
              Preview
            </Button>
          </TabsContent>

          <TabsContent value="json" className="mt-4 space-y-4">
            <Alert>
              <AlertTitle>JSON Format</AlertTitle>
              <AlertDescription className="text-xs font-mono mt-2 whitespace-pre">
{`[{
  "profileName": "John Doe",
  "institutionName": "MIT",
  "degreeType": "Bachelor's",
  "fieldOfStudy": "Computer Science"
}]`}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Paste JSON Content</Label>
              <Textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                placeholder='[{"profileName": "...", "institutionName": "..."}]'
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            <Button variant="outline" onClick={handleJSONPreview} disabled={!jsonContent.trim()}>
              Preview
            </Button>
          </TabsContent>
        </Tabs>

        {preview.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <Label>Preview ({preview.length} records)</Label>
            <div className="rounded-lg border max-h-48 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Institution</th>
                    <th className="text-left p-2">Degree</th>
                    <th className="text-left p-2">Field</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{row.profileName}</td>
                      <td className="p-2">{row.institutionName}</td>
                      <td className="p-2">{row.degreeType || '-'}</td>
                      <td className="p-2">{row.fieldOfStudy || '-'}</td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr className="border-t bg-muted/50">
                      <td colSpan={4} className="p-2 text-center text-muted-foreground">
                        ...and {preview.length - 10} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Button 
              onClick={() => importMutation.mutate(preview)} 
              disabled={importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Import {preview.length} Records</>
              )}
            </Button>
          </div>
        )}

        {importResult && (
          <Alert variant={importResult.failed > 0 ? 'destructive' : 'default'}>
            {importResult.failed > 0 ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>Import Complete</AlertTitle>
            <AlertDescription>
              <p>Successfully imported {importResult.success} education records.</p>
              {importResult.failed > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">
                    {importResult.failed} failed - click to see errors
                  </summary>
                  <ul className="mt-1 text-xs max-h-24 overflow-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-destructive">{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
