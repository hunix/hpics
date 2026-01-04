import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, ArrowRight, ArrowLeft, Check, RotateCcw, 
  AlertTriangle, Merge, Plus, SkipForward,
  Info, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseGoogleCSV, GoogleParseResult, GoogleContact } from './googleCsvParser';
import { GoogleMappingEditor } from './GoogleMappingEditor';
import { 
  checkAllDuplicates, 
  smartMerge, 
  deduplicateImportFile,
  DuplicateCheckResult, 
  ExistingContact,
  ImportContact
} from '../shared/duplicateDetection';

type WizardStep = 'upload' | 'mapping' | 'preview' | 'duplicates' | 'import';

const STEPS = [
  { key: 'upload' as const, label: 'Upload' },
  { key: 'mapping' as const, label: 'Mapping' },
  { key: 'preview' as const, label: 'Preview' },
  { key: 'duplicates' as const, label: 'Duplicates' },
  { key: 'import' as const, label: 'Import' }
];

const ITEMS_PER_PAGE = 50;

export function GoogleImportWizard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Wizard state
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<GoogleParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const [duplicateResults, setDuplicateResults] = useState<DuplicateCheckResult[]>([]);
  const [withinFileDuplicates, setWithinFileDuplicates] = useState<number>(0);
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, created: 0, merged: 0, skipped: 0, failed: 0 });
  
  // Duplicate review UI state
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'duplicates' | 'new'>('all');
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [duplicatePage, setDuplicatePage] = useState(1);
  
  const currentStepIndex = STEPS.findIndex(s => s.key === step);
  
  // Fetch existing contacts for duplicate detection
  const { data: existingContacts = [] } = useQuery({
    queryKey: ['contacts-for-import', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, job_title, notes')
        .eq('user_id', user.id);
      
      if (!profiles) return [];
      
      // Fetch emails and phones for each profile
      const profileIds = profiles.map(p => p.id);
      const [emailsResult, phonesResult] = await Promise.all([
        supabase
          .from('contact_methods')
          .select('profile_id, value')
          .in('profile_id', profileIds)
          .eq('contact_type', 'email')
          .eq('is_primary', true),
        supabase
          .from('contact_methods')
          .select('profile_id, value')
          .in('profile_id', profileIds)
          .eq('contact_type', 'phone')
      ]);
      
      const emailMap = new Map(emailsResult.data?.map(e => [e.profile_id, e.value]) || []);
      const phoneMap = new Map(phonesResult.data?.map(p => [p.profile_id, p.value]) || []);
      
      return profiles.map(p => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        organization: p.organization,
        job_title: p.job_title,
        notes: p.notes,
        email: emailMap.get(p.id),
        phone: phoneMap.get(p.id)
      })) as ExistingContact[];
    },
    enabled: !!user?.id
  });
  
  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseGoogleCSV(content);
      setParseResult(result);
      setColumnMapping(result.columnMapping || {});
    };
    reader.readAsText(selectedFile);
  }, []);
  
  // Handle mapping change
  const handleMappingChange = useCallback((field: string, columnIndex: number | undefined) => {
    setColumnMapping(prev => {
      const next = { ...prev };
      if (columnIndex === undefined) {
        delete next[field];
      } else {
        next[field] = columnIndex;
      }
      return next;
    });
  }, []);
  
  // Run duplicate check with within-file deduplication
  const runDuplicateCheck = useCallback(() => {
    if (!parseResult) return;
    
    // First, deduplicate within the file
    const { deduplicated, duplicateGroups } = deduplicateImportFile(parseResult.contacts as any as ImportContact[]);
    setWithinFileDuplicates(duplicateGroups.length);
    
    const contacts = deduplicated.map((c, i) => ({
      rowIndex: i,
      contact: {
        first_name: c.first_name,
        last_name: c.last_name || '',
        email: c.email || '',
        organization: c.organization,
        job_title: c.job_title,
        notes: c.notes,
        phone: c.phone
      } as ImportContact
    }));
    
    const results = checkAllDuplicates(contacts, existingContacts, 80);
    setDuplicateResults(results);
    setDuplicatePage(1);
  }, [parseResult, existingContacts]);
  
  // Update action for a single result
  const updateAction = (rowIndex: number, action: 'create' | 'merge' | 'skip', mergeTargetId?: string) => {
    setDuplicateResults(prev => prev.map(r => 
      r.rowIndex === rowIndex ? { ...r, action, mergeTargetId } : r
    ));
  };
  
  // Bulk action buttons
  const setAllToCreate = () => {
    setDuplicateResults(prev => prev.map(r => ({ ...r, action: 'create', mergeTargetId: undefined })));
  };
  
  const setAllToMerge = () => {
    setDuplicateResults(prev => prev.map(r => ({
      ...r,
      action: r.duplicates.length > 0 ? 'merge' : 'create',
      mergeTargetId: r.duplicates[0]?.existingContact.id
    })));
  };
  
  const setAllToSkipDuplicates = () => {
    setDuplicateResults(prev => prev.map(r => ({
      ...r,
      action: r.duplicates.length > 0 ? 'skip' : 'create'
    })));
  };
  
  // Filtered and paginated duplicate results
  const filteredDuplicates = useMemo(() => {
    let results = duplicateResults;
    
    // Apply filter
    if (duplicateFilter === 'duplicates') {
      results = results.filter(r => r.duplicates.length > 0);
    } else if (duplicateFilter === 'new') {
      results = results.filter(r => r.duplicates.length === 0);
    }
    
    // Apply search
    if (duplicateSearch.trim()) {
      const search = duplicateSearch.toLowerCase();
      results = results.filter(r => 
        r.contact.first_name.toLowerCase().includes(search) ||
        r.contact.last_name?.toLowerCase().includes(search) ||
        r.contact.email?.toLowerCase().includes(search)
      );
    }
    
    return results;
  }, [duplicateResults, duplicateFilter, duplicateSearch]);
  
  const paginatedDuplicates = useMemo(() => {
    const start = (duplicatePage - 1) * ITEMS_PER_PAGE;
    return filteredDuplicates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDuplicates, duplicatePage]);
  
  const totalPages = Math.ceil(filteredDuplicates.length / ITEMS_PER_PAGE);
  
  // Import contacts
  const handleImport = useCallback(async () => {
    if (!user?.id || duplicateResults.length === 0) return;
    
    setIsImporting(true);
    setImportProgress({ processed: 0, created: 0, merged: 0, skipped: 0, failed: 0 });
    
    let created = 0, merged = 0, skipped = 0, failed = 0;
    
    for (let i = 0; i < duplicateResults.length; i++) {
      const { contact, action, mergeTargetId } = duplicateResults[i];
      
      try {
        if (action === 'skip') {
          skipped++;
        } else if (action === 'merge' && mergeTargetId) {
          const existing = existingContacts.find(c => c.id === mergeTargetId);
          if (existing) {
            const updates = smartMerge(existing, contact);
            
            if (Object.keys(updates).length > 0) {
              await supabase
                .from('profiles')
                .update(updates)
                .eq('id', mergeTargetId);
            }
            
            // Add phone if not exists
            if (contact.phone) {
              const { data: existingPhones } = await supabase
                .from('contact_methods')
                .select('value')
                .eq('profile_id', mergeTargetId)
                .eq('contact_type', 'phone');
              
              const phoneExists = existingPhones?.some(p => p.value === contact.phone);
              if (!phoneExists) {
                await supabase.from('contact_methods').insert([{
                  profile_id: mergeTargetId,
                  contact_type: 'phone' as const,
                  value: contact.phone
                }]);
              }
            }
            
            merged++;
          } else {
            await createContact(contact, user.id);
            created++;
          }
        } else {
          await createContact(contact, user.id);
          created++;
        }
      } catch (err) {
        console.error('Import error:', err);
        failed++;
      }
      
      setImportProgress({ processed: i + 1, created, merged, skipped, failed });
    }
    
    setIsImporting(false);
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    
    toast.success(`Import complete: ${created} created, ${merged} merged, ${skipped} skipped${failed > 0 ? `, ${failed} failed` : ''}`);
  }, [user?.id, duplicateResults, existingContacts, queryClient]);
  
  async function createContact(contact: ImportContact, userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([{
        user_id: userId,
        first_name: contact.first_name,
        last_name: contact.last_name || null,
        organization: contact.organization || null,
        job_title: contact.job_title || null,
        notes: contact.notes || null,
        relationship_type: 'other' as const
      }])
      .select('id')
      .single();
    
    if (error) throw error;
    
    if (contact.email && profile?.id) {
      await supabase.from('contact_methods').insert([{
        profile_id: profile.id,
        contact_type: 'email' as const,
        value: contact.email,
        is_primary: true
      }]);
    }
    
    if (contact.phone && profile?.id) {
      await supabase.from('contact_methods').insert([{
        profile_id: profile.id,
        contact_type: 'phone' as const,
        value: contact.phone
      }]);
    }
  }
  
  // Navigation
  const canProceed = () => {
    switch (step) {
      case 'upload':
        return parseResult?.success && parseResult.contacts.length > 0;
      case 'mapping':
        return columnMapping['first_name'] !== undefined;
      case 'preview':
        return parseResult && parseResult.contacts.length > 0;
      case 'duplicates':
        return duplicateResults.length > 0;
      case 'import':
        return !isImporting;
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (step === 'preview') {
      runDuplicateCheck();
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].key);
      
      if (STEPS[nextIndex].key === 'import') {
        handleImport();
      }
    }
  };
  
  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex].key);
    }
  };
  
  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setColumnMapping({});
    setDuplicateResults([]);
    setWithinFileDuplicates(0);
    setImportProgress({ processed: 0, created: 0, merged: 0, skipped: 0, failed: 0 });
    setDuplicatePage(1);
    setDuplicateFilter('all');
    setDuplicateSearch('');
  };
  
  // Stats
  const duplicateStats = {
    total: duplicateResults.length,
    withDuplicates: duplicateResults.filter(r => r.duplicates.length > 0).length,
    toCreate: duplicateResults.filter(r => r.action === 'create').length,
    toMerge: duplicateResults.filter(r => r.action === 'merge').length,
    toSkip: duplicateResults.filter(r => r.action === 'skip').length
  };
  
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
              ${i < currentStepIndex ? 'bg-primary text-primary-foreground' : 
                i === currentStepIndex ? 'bg-primary text-primary-foreground' : 
                'bg-muted text-muted-foreground'}`}>
              {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm ${i === currentStepIndex ? 'font-medium' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 'upload' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Upload Google Contacts CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export from Google Contacts → Export → "Google CSV" or "Outlook CSV"
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="max-w-xs"
                />
              </div>
              
              {parseResult && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">File Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Contacts found: <span className="font-medium">{parseResult.contacts.length}</span></div>
                    <div>Header row: <span className="font-medium">Line {parseResult.headerLineIndex + 1}</span></div>
                    <div>Delimiter: <span className="font-medium">{parseResult.delimiter === ',' ? 'Comma' : parseResult.delimiter === ';' ? 'Semicolon' : 'Tab'}</span></div>
                    <div>BOM: <span className="font-medium">{parseResult.bomDetected ? 'Yes' : 'No'}</span></div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Headers: {parseResult.headers.slice(0, 8).join(', ')}{parseResult.headers.length > 8 ? '...' : ''}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {step === 'mapping' && parseResult && (
          <GoogleMappingEditor
            parseResult={parseResult}
            columnMapping={columnMapping}
            onMappingChange={handleMappingChange}
          />
        )}
        
        {step === 'preview' && parseResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview ({parseResult.contacts.length} contacts)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.contacts.slice(0, 50).map((contact, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {contact.first_name} {contact.middle_name} {contact.last_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact.email || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact.phone || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {contact.organization || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parseResult.contacts.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Showing first 50 of {parseResult.contacts.length} contacts
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {step === 'duplicates' && (
          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                {withinFileDuplicates > 0 && (
                  <div className="mb-4 p-2 bg-blue-500/10 rounded-lg text-sm text-center">
                    <Info className="h-4 w-4 inline mr-1" />
                    {withinFileDuplicates} duplicate groups merged within the file
                  </div>
                )}
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{duplicateStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{duplicateStats.withDuplicates}</div>
                    <div className="text-xs text-muted-foreground">With matches</div>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{duplicateStats.toCreate}</div>
                    <div className="text-xs text-muted-foreground">Create new</div>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{duplicateStats.toMerge}</div>
                    <div className="text-xs text-muted-foreground">Merge</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{duplicateStats.toSkip}</div>
                    <div className="text-xs text-muted-foreground">Skip</div>
                  </div>
                </div>
                
                {/* Bulk actions */}
                <div className="flex gap-2 mt-4 justify-center">
                  <Button variant="outline" size="sm" onClick={setAllToCreate}>
                    <Plus className="h-3 w-3 mr-1" /> All Create
                  </Button>
                  <Button variant="outline" size="sm" onClick={setAllToMerge}>
                    <Merge className="h-3 w-3 mr-1" /> All Merge
                  </Button>
                  <Button variant="outline" size="sm" onClick={setAllToSkipDuplicates}>
                    <SkipForward className="h-3 w-3 mr-1" /> Skip Duplicates
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Duplicate list with filtering */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Review Contacts
                  </CardTitle>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={duplicateSearch}
                      onChange={(e) => {
                        setDuplicateSearch(e.target.value);
                        setDuplicatePage(1);
                      }}
                      className="pl-8 w-48 h-9"
                    />
                  </div>
                </div>
                
                <Tabs value={duplicateFilter} onValueChange={(v) => { setDuplicateFilter(v as any); setDuplicatePage(1); }}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs">All ({duplicateResults.length})</TabsTrigger>
                    <TabsTrigger value="duplicates" className="text-xs">With Duplicates ({duplicateStats.withDuplicates})</TabsTrigger>
                    <TabsTrigger value="new" className="text-xs">New Only ({duplicateResults.length - duplicateStats.withDuplicates})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {paginatedDuplicates.map((result) => (
                    <div key={result.rowIndex} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {result.contact.first_name} {result.contact.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {result.contact.email || 'No email'} {result.contact.phone && `• ${result.contact.phone}`}
                          </div>
                          {result.duplicates.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {result.duplicates.slice(0, 2).map((dup, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {dup.matchType === 'email' ? '📧' : dup.matchType === 'phone' ? '📱' : dup.matchType === 'name_exact' ? '✓' : '~'}{' '}
                                  {dup.existingContact.first_name} {dup.existingContact.last_name} ({dup.confidence}%)
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Select
                          value={result.action}
                          onValueChange={(v) => updateAction(result.rowIndex, v as any, result.duplicates[0]?.existingContact.id)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="create">Create</SelectItem>
                            <SelectItem value="merge">Merge</SelectItem>
                            <SelectItem value="skip">Skip</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {duplicatePage} of {totalPages} ({filteredDuplicates.length} contacts)
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDuplicatePage(p => Math.max(1, p - 1))}
                        disabled={duplicatePage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDuplicatePage(p => Math.min(totalPages, p + 1))}
                        disabled={duplicatePage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {step === 'import' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isImporting ? 'Importing...' : 'Import Complete'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={(importProgress.processed / duplicateResults.length) * 100} className="h-2" />
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{importProgress.created}</div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{importProgress.merged}</div>
                  <div className="text-xs text-muted-foreground">Merged</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{importProgress.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{importProgress.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
              
              <p className="text-sm text-center text-muted-foreground">
                {importProgress.processed} of {duplicateResults.length} processed
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={step === 'import' && !isImporting ? handleReset : handleBack}
          disabled={step === 'upload' || isImporting}
        >
          {step === 'import' && !isImporting ? (
            <><RotateCcw className="h-4 w-4 mr-2" /> Start Over</>
          ) : (
            <><ArrowLeft className="h-4 w-4 mr-2" /> Back</>
          )}
        </Button>
        
        {step !== 'import' && (
          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === 'duplicates' ? 'Import' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
