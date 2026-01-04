import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Linkedin, CreditCard, MessageCircle, Send, GraduationCap, Sparkles, FileUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { WhatsAppImport } from '@/components/import/WhatsAppImport';
import { TelegramImport } from '@/components/import/TelegramImport';
import { EducationBulkImport } from '@/components/import/EducationBulkImport';
import { BulkEnrichment } from '@/components/contacts/BulkEnrichment';
import { ContactImport } from '@/components/import/ContactImport';

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
  const [vcardText, setVcardText] = useState('');
  const [linkedinCsv, setLinkedinCsv] = useState<File | null>(null);
  const [linkedinPreview, setLinkedinPreview] = useState<CSVRow[]>([]);

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
          else if (header.includes('title') || header.includes('job') || header.includes('position')) row.job_title = value;
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

  const parseLinkedInCSV = (text: string): { rows: CSVRow[]; headers: string[] } => {
    // Remove BOM and normalize line endings
    const cleanText = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { rows: [], headers: [] };
    
    // Auto-detect delimiter from first line
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    
    let delimiter = ',';
    if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';
    else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';
    
    console.log('LinkedIn CSV - Detected delimiter:', delimiter === '\t' ? 'TAB' : delimiter);
    
    // Quote-aware CSV line parser
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          // Handle escaped quotes ""
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };
    
    // Parse headers
    const rawHeaders = parseCSVLine(lines[0]);
    const headers = rawHeaders.map(h => 
      h.toLowerCase().replace(/['"]/g, '').replace(/:$/, '').trim()
    );
    
    console.log('LinkedIn CSV Headers:', headers);
    
    const rows: CSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/['"]/g, '').trim();
        if (value) {
          // Normalize header for matching (remove spaces, underscores)
          const h = header.replace(/[\s_-]/g, '');
          
          // Flexible matching for LinkedIn column names
          if (h === 'firstname' || h.includes('firstname')) row.first_name = value;
          else if (header === 'first name') row.first_name = value;
          else if (h === 'lastname' || h.includes('lastname')) row.last_name = value;
          else if (header === 'last name') row.last_name = value;
          else if (h.includes('email')) row.email = value;
          else if (h === 'company' || h.includes('company')) row.organization = value;
          else if (h === 'position' || h.includes('position')) row.job_title = value;
          else if (h.includes('url') || h.includes('profile')) {
            row.notes = value;
          }
        }
      });
      
      // Accept rows with at least a first name, last name, email, or URL
      if (row.first_name || row.last_name || row.email || row.notes) {
        row.relationship_type = 'colleague';
        // Ensure first_name exists for database insert
        if (!row.first_name && row.last_name) {
          row.first_name = row.last_name;
          row.last_name = undefined;
        } else if (!row.first_name && row.email) {
          row.first_name = row.email.split('@')[0];
        } else if (!row.first_name && row.notes) {
          row.first_name = 'LinkedIn Contact';
        }
        rows.push(row);
      }
    }
    
    console.log('Parsed LinkedIn rows:', rows.length);
    if (rows.length > 0) {
      console.log('Sample row:', rows[0]);
    }
    
    return { rows, headers };
  };

  const parseVCard = (text: string): CSVRow[] => {
    const vcards = text.split('END:VCARD').filter(v => v.includes('BEGIN:VCARD'));
    const rows: CSVRow[] = [];
    
    for (const vcard of vcards) {
      const row: CSVRow = {};
      const lines = vcard.split('\n');
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (key.startsWith('FN')) {
          const parts = value.split(' ');
          row.first_name = parts[0];
          row.last_name = parts.slice(1).join(' ');
        } else if (key.startsWith('N')) {
          const parts = value.split(';');
          if (!row.last_name) row.last_name = parts[0];
          if (!row.first_name) row.first_name = parts[1];
        } else if (key.startsWith('EMAIL')) {
          row.email = value;
        } else if (key.startsWith('TEL')) {
          row.phone = value;
        } else if (key.startsWith('ORG')) {
          row.organization = value.split(';')[0];
        } else if (key.startsWith('TITLE')) {
          row.job_title = value;
        } else if (key.startsWith('NOTE')) {
          row.notes = value;
        }
      }
      
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
      toast({ title: 'Invalid file type', description: 'Please upload a CSV file', variant: 'destructive' });
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

  const handleLinkedInFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setLinkedinCsv(selectedFile);
    setImportResult(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { rows, headers } = parseLinkedInCSV(text);
      
      if (rows.length === 0) {
        toast({
          title: 'No contacts detected',
          description: `Detected headers: ${headers.length > 0 ? headers.slice(0, 5).join(', ') : 'none'}. Make sure you uploaded LinkedIn's "Connections.csv" file.`,
          variant: 'destructive',
        });
      }
      
      setLinkedinPreview(rows.slice(0, 5));
    };
    reader.readAsText(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async (rows: CSVRow[]) => {
      if (!user) throw new Error('Not authenticated');
      
      let success = 0;
      let failed = 0;
      
      for (const row of rows) {
        try {
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
      toast({ title: 'Import complete', description: `Successfully imported ${result.success} contacts` });
      setFile(null);
      setPreview([]);
      setLinkedinCsv(null);
      setLinkedinPreview([]);
      setVcardText('');
    },
    onError: (error) => {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleCSVImport = async () => {
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    importMutation.mutate(rows);
  };

  const handleLinkedInImport = async () => {
    if (!linkedinCsv) return;
    const text = await linkedinCsv.text();
    const { rows, headers } = parseLinkedInCSV(text);
    
    if (rows.length === 0) {
      toast({
        title: 'No contacts to import',
        description: `Detected headers: ${headers.length > 0 ? headers.slice(0, 5).join(', ') : 'none'}. Please upload LinkedIn's "Connections.csv" file.`,
        variant: 'destructive',
      });
      return;
    }
    
    importMutation.mutate(rows);
  };

  const handleVCardImport = () => {
    if (!vcardText.trim()) return;
    const rows = parseVCard(vcardText);
    if (rows.length === 0) {
      toast({ title: 'No contacts found', description: 'Please check your vCard format', variant: 'destructive' });
      return;
    }
    importMutation.mutate(rows);
  };

  const PreviewTable = ({ data }: { data: CSVRow[] }) => (
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
          {data.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{row.first_name} {row.last_name}</td>
              <td className="p-2 text-muted-foreground">{row.email || '-'}</td>
              <td className="p-2 text-muted-foreground">{row.organization || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppLayout title="Import Data">
      <div className="max-w-3xl space-y-6">
        <Tabs defaultValue="quick">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="quick">
              <FileUp className="h-4 w-4 mr-2" />
              Quick Import
            </TabsTrigger>
            <TabsTrigger value="enrich">
              <Sparkles className="h-4 w-4 mr-2" />
              Bulk Enrich
            </TabsTrigger>
            <TabsTrigger value="csv">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="vcard">
              <CreditCard className="h-4 w-4 mr-2" />
              vCard
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="telegram">
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="education">
              <GraduationCap className="h-4 w-4 mr-2" />
              Education
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="mt-4">
            <ContactImport />
          </TabsContent>

          <TabsContent value="enrich" className="mt-4">
            <BulkEnrichment />
          </TabsContent>

          <TabsContent value="csv" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Import from CSV</CardTitle>
                <CardDescription>
                  Upload a CSV file with headers: first_name, last_name, email, phone, organization, job_title
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select CSV File</Label>
                  <Input type="file" accept=".csv" onChange={handleFileChange} />
                </div>

                {preview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (first 5 rows)</Label>
                    <PreviewTable data={preview} />
                  </div>
                )}

                <Button 
                  onClick={handleCSVImport} 
                  disabled={!file || importMutation.isPending}
                  className="w-full"
                >
                  {importMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Import Contacts</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linkedin" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  Import LinkedIn Connections
                </CardTitle>
                <CardDescription>
                  Export your connections from LinkedIn and import them here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>How to export from LinkedIn</AlertTitle>
                  <AlertDescription className="text-sm space-y-1">
                    <p>1. Go to LinkedIn → Settings → Data Privacy → Get a copy of your data</p>
                    <p>2. Select "Connections" and request the archive</p>
                    <p>3. Download and upload the Connections.csv file here</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Select LinkedIn CSV</Label>
                  <Input type="file" accept=".csv" onChange={handleLinkedInFileChange} />
                </div>

                {linkedinPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (first 5 rows)</Label>
                    <PreviewTable data={linkedinPreview} />
                  </div>
                )}

                <Button 
                  onClick={handleLinkedInImport} 
                  disabled={!linkedinCsv || importMutation.isPending}
                  className="w-full"
                >
                  {importMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Import LinkedIn Connections</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vcard" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Import from vCard</CardTitle>
                <CardDescription>
                  Paste vCard (.vcf) content to import contacts from your phone or other apps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>vCard Content</Label>
                  <Textarea
                    value={vcardText}
                    onChange={(e) => setVcardText(e.target.value)}
                    placeholder="Paste vCard content here (BEGIN:VCARD ... END:VCARD)"
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>

                <Button 
                  onClick={handleVCardImport} 
                  disabled={!vcardText.trim() || importMutation.isPending}
                  className="w-full"
                >
                  {importMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Import from vCard</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-4">
            <WhatsAppImport />
          </TabsContent>

          <TabsContent value="telegram" className="mt-4">
            <TelegramImport />
          </TabsContent>

          <TabsContent value="education" className="mt-4">
            <EducationBulkImport />
          </TabsContent>
        </Tabs>

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

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">CSV Format Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-background rounded-lg text-sm overflow-x-auto">
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
