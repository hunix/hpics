import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CSVRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  relationship_type?: string;
  notes?: string;
}

export default function Import() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows: CSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (value) {
          if (header.includes('first') || header === 'firstname') row.first_name = value;
          else if (header.includes('last') || header === 'lastname') row.last_name = value;
          else if (header.includes('email')) row.email = value;
          else if (header.includes('phone')) row.phone = value;
          else if (header.includes('org') || header.includes('company')) row.organization = value;
          else if (header.includes('title') || header.includes('job')) row.job_title = value;
          else if (header.includes('relation') || header.includes('type')) row.relationship_type = value;
          else if (header.includes('note')) row.notes = value;
        }
      });
      
      if (row.first_name) {
        rows.push(row);
      }
    }
    
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }
    
    setFile(selectedFile);
    setImportResult(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed.slice(0, 5));
    };
    reader.readAsText(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file || !user) throw new Error('No file or user');
      
      const text = await file.text();
      const rows = parseCSV(text);
      
      let success = 0;
      let failed = 0;
      
      for (const row of rows) {
        try {
          // Create profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              first_name: row.first_name!,
              last_name: row.last_name || null,
              organization: row.organization || null,
              job_title: row.job_title || null,
              relationship_type: (row.relationship_type as any) || 'other',
              notes: row.notes || null,
            })
            .select()
            .single();
          
          if (profileError) throw profileError;
          
          // Add contact methods if provided
          if (row.email) {
            await supabase.from('contact_methods').insert({
              profile_id: profile.id,
              contact_type: 'email',
              value: row.email,
              is_primary: true,
            });
          }
          
          if (row.phone) {
            await supabase.from('contact_methods').insert({
              profile_id: profile.id,
              contact_type: 'phone',
              value: row.phone,
            });
          }
          
          success++;
        } catch (error) {
          failed++;
        }
      }
      
      return { success, failed };
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Import complete',
        description: `Successfully imported ${result.success} contacts`,
      });
      setFile(null);
      setPreview([]);
    },
    onError: (error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <AppLayout title="Import Data">
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Contacts from CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file to bulk import contacts. The file should have headers like:
              first_name, last_name, email, phone, organization, job_title, relationship_type, notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            {preview.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 5 rows)</Label>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Organization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{row.first_name} {row.last_name}</td>
                          <td className="p-2 text-muted-foreground">{row.email || '-'}</td>
                          <td className="p-2 text-muted-foreground">{row.organization || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  Successfully imported {importResult.success} contacts.
                  {importResult.failed > 0 && ` ${importResult.failed} contacts failed to import.`}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={() => importMutation.mutate()} 
              disabled={!file || importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Contacts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Format Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`first_name,last_name,email,phone,organization,job_title,relationship_type
John,Doe,john@example.com,+1234567890,Acme Inc,CEO,client
Jane,Smith,jane@example.com,+0987654321,TechCorp,Engineer,colleague`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
