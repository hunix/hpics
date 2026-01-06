import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Upload, 
  Loader2, 
  Mail, 
  Inbox, 
  Send, 
  Trash2, 
  FileText, 
  Calendar,
  CheckCircle,
  AlertCircle,
  FileArchive,
  Info
} from 'lucide-react';
import { parseOutlookCSV, parseEMLFile, parseEMLZip, batchEmails, ParsedEmail } from '@/lib/pstParser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImportStats {
  imported: number;
  skipped: number;
  matchedContacts: number;
  unmatchedEmails: number;
}

export function PSTImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'csv' | 'eml' | 'zip'>('csv');
  const [options, setOptions] = useState({
    skipDuplicates: true,
    createUnmatchedThreads: true,
  });
  
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[] | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Fetch contacts for matching preview
  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-pst-import'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_methods')
        .select('value, profile_id, profiles!inner(first_name, last_name)')
        .eq('contact_type', 'email');
      return data || [];
    },
    enabled: !!user,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    const fileName = selectedFile.name.toLowerCase();
    
    // Detect file type
    if (fileName.endsWith('.csv')) {
      setImportType('csv');
    } else if (fileName.endsWith('.eml')) {
      setImportType('eml');
    } else if (fileName.endsWith('.zip')) {
      setImportType('zip');
    } else if (fileName.endsWith('.pst')) {
      toast({ 
        title: 'PST files not directly supported', 
        description: 'Please export your emails from Outlook as CSV or EML files first. See instructions below.', 
        variant: 'destructive' 
      });
      return;
    } else {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please upload a CSV, EML, or ZIP file containing EML files', 
        variant: 'destructive' 
      });
      return;
    }
    
    setFile(selectedFile);
    setParsedEmails(null);
    setImportStats(null);
  };

  const handleParse = async () => {
    if (!file) return;
    
    setIsParsing(true);
    setParsedEmails(null);
    setImportStats(null);
    
    try {
      let emails: ParsedEmail[] = [];
      
      if (importType === 'csv') {
        const text = await file.text();
        emails = parseOutlookCSV(text);
      } else if (importType === 'eml') {
        const text = await file.text();
        const email = parseEMLFile(text);
        if (email) emails = [email];
      } else if (importType === 'zip') {
        emails = await parseEMLZip(file);
      }
      
      setParsedEmails(emails);
      
      if (emails.length === 0) {
        toast({
          title: 'No emails found',
          description: 'The file did not contain any parseable emails. Please check the format.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Parsing complete',
          description: `Found ${emails.length} emails ready for import`,
        });
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'Failed to parse file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (emails: ParsedEmail[]) => {
      if (!user) throw new Error('Not authenticated');
      
      const batches = batchEmails(emails, 100);
      let imported = 0;
      let skipped = 0;
      let matchedContacts = 0;
      let unmatchedEmails = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setUploadProgress({ current: i + 1, total: batches.length });
        
        const { data, error } = await supabase.functions.invoke('import-pst-emails', {
          body: {
            emails: batch,
            options: {
              skipDuplicates: options.skipDuplicates,
              createUnmatchedThreads: options.createUnmatchedThreads,
            },
          },
        });
        
        if (error) {
          console.error('Batch import error:', error);
          skipped += batch.length;
        } else if (data) {
          imported += data.imported || 0;
          skipped += data.skipped || 0;
          matchedContacts += data.matchedContacts?.length || 0;
          unmatchedEmails += data.unmatchedEmails || 0;
        }
      }
      
      return { imported, skipped, matchedContacts, unmatchedEmails };
    },
    onSuccess: (result) => {
      setImportStats(result);
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      toast({
        title: 'Import complete',
        description: `Imported ${result.imported} emails, matched to ${result.matchedContacts} contacts`,
      });
    },
    onError: (error) => {
      setUploadProgress(null);
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImport = () => {
    if (!parsedEmails || parsedEmails.length === 0) return;
    importMutation.mutate(parsedEmails);
  };

  // Calculate email matching preview
  const getMatchPreview = useCallback(() => {
    if (!parsedEmails || !contacts) return { matched: 0, unmatched: 0 };
    
    const contactEmails = new Set(contacts.map(c => c.value.toLowerCase()));
    let matched = 0;
    let unmatched = 0;
    
    const seenEmails = new Set<string>();
    for (const email of parsedEmails) {
      const allEmails = [email.senderEmail, ...email.recipients, ...email.ccRecipients];
      for (const addr of allEmails) {
        if (addr && !seenEmails.has(addr)) {
          seenEmails.add(addr);
          if (contactEmails.has(addr)) {
            matched++;
          } else {
            unmatched++;
          }
        }
      }
    }
    
    return { matched, unmatched };
  }, [parsedEmails, contacts]);

  const matchPreview = parsedEmails ? getMatchPreview() : null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          Import Outlook Emails
        </CardTitle>
        <CardDescription>
          Import your email history for deep analysis and contact correlation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How to export from Outlook</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-sm">
            <p><strong>CSV Export:</strong> File → Open & Export → Import/Export → Export to a file → Comma Separated Values</p>
            <p><strong>EML Export:</strong> Select emails → Drag to a folder → ZIP them for bulk import</p>
          </AlertDescription>
        </Alert>

        {/* Format Tabs */}
        <Tabs value={importType} onValueChange={(v) => setImportType(v as typeof importType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="eml" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              EML
            </TabsTrigger>
            <TabsTrigger value="zip" className="flex items-center gap-2">
              <FileArchive className="h-4 w-4" />
              ZIP (EML)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="csv" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Upload an Outlook CSV export. Must include columns for From, To, Subject, and Date.
            </p>
          </TabsContent>
          
          <TabsContent value="eml" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Upload a single .eml file (standard email format).
            </p>
          </TabsContent>
          
          <TabsContent value="zip" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Upload a ZIP archive containing multiple .eml files for bulk import.
            </p>
          </TabsContent>
        </Tabs>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Select File</Label>
          <Input 
            type="file" 
            accept={importType === 'csv' ? '.csv' : importType === 'eml' ? '.eml' : '.zip'}
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({formatFileSize(file.size)})
            </p>
          )}
        </div>

        {/* Import Options */}
        <div className="space-y-3">
          <Label className="text-base">Import Options</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipDuplicates"
              checked={options.skipDuplicates}
              onCheckedChange={(checked) => 
                setOptions(o => ({ ...o, skipDuplicates: !!checked }))
              }
            />
            <Label htmlFor="skipDuplicates" className="cursor-pointer">
              Skip duplicate emails (by message ID)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createUnmatched"
              checked={options.createUnmatchedThreads}
              onCheckedChange={(checked) => 
                setOptions(o => ({ ...o, createUnmatchedThreads: !!checked }))
              }
            />
            <Label htmlFor="createUnmatched" className="cursor-pointer">
              Import emails from unmatched contacts
            </Label>
          </div>
        </div>

        {/* Parse Button */}
        {file && !parsedEmails && (
          <Button 
            onClick={handleParse} 
            disabled={isParsing}
            className="w-full"
          >
            {isParsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing file...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Parse File
              </>
            )}
          </Button>
        )}

        {/* Parsed Summary */}
        {parsedEmails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{parsedEmails.length.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Emails Found</div>
              </div>
              {matchPreview && (
                <div className="p-4 bg-green-500/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{matchPreview.matched}</div>
                  <div className="text-sm text-muted-foreground">Matching Contacts</div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading batch {uploadProgress.current} of {uploadProgress.total}</span>
                  <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                </div>
                <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
              </div>
            )}

            {/* Import Button */}
            <Button 
              onClick={handleImport} 
              disabled={importMutation.isPending || parsedEmails.length === 0}
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
                  Import {parsedEmails.length.toLocaleString()} Emails
                </>
              )}
            </Button>
          </div>
        )}

        {/* Import Results */}
        {importStats && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {importStats.imported > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">Import Complete</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Imported:</span>{' '}
                <span className="font-medium">{importStats.imported.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Skipped:</span>{' '}
                <span className="font-medium">{importStats.skipped.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Matched contacts:</span>{' '}
                <span className="font-medium">{importStats.matchedContacts}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Unmatched:</span>{' '}
                <span className="font-medium">{importStats.unmatchedEmails}</span>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Emails are parsed in your browser before upload - your data stays private</p>
          <p>• After import, emails will be matched to existing contacts by email address</p>
          <p>• Imported emails become available for deep psychological analysis</p>
        </div>
      </CardContent>
    </Card>
  );
}
