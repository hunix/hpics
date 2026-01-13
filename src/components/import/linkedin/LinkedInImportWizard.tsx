import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, ArrowRight, ArrowLeft, Check, RotateCcw, RotateCw } from 'lucide-react';
import { parseLinkedInCSV, ParseResult } from './linkedinCsvParser';
import { ColumnMapping, autoMapColumns, applyMapping, MappedContact } from './linkedinMapping';
import { validateRows, ValidationResult, generateDiagnosticsReport } from './linkedinValidation';
import { ImportDiagnosticsPanel } from './ImportDiagnosticsPanel';
import { MappingEditor } from './MappingEditor';
import { ValidationSummary } from './ValidationSummary';
import { ImportProgressPanel, ImportError } from './ImportProgressPanel';
import { useFormDraft } from '@/hooks/reliability/useFormDraft';
import { AutoSaveIndicator } from '@/components/reliability/AutoSaveIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';

type WizardStep = 'upload' | 'mapping' | 'validate' | 'import';

interface WizardDraftData extends Record<string, unknown> {
  step: WizardStep;
  mapping: ColumnMapping;
  parseResultMeta?: {
    headers: string[];
    rowCount: number;
  };
}

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'mapping', label: 'Map Columns' },
  { key: 'validate', label: 'Validate' },
  { key: 'import', label: 'Import' }
];

export function LinkedInImportWizard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form draft for auto-save and recovery
  const { 
    data: draftData, 
    setData: setDraftData, 
    hasDraft, 
    isSaving, 
    lastSaved, 
    restoreDraft, 
    discardDraft 
  } = useFormDraft<WizardDraftData>({
    formType: 'linkedin_import',
    formKey: user?.id || 'anonymous',
    debounceMs: 2000,
    expiryDays: 7,
  });
  
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  
  // Wizard state
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, success: 0, failed: 0 });
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  
  const currentStepIndex = STEPS.findIndex(s => s.key === step);
  
  // Check for draft on mount
  useEffect(() => {
    if (hasDraft && draftData && step === 'upload') {
      setShowDraftBanner(true);
    }
  }, [hasDraft, draftData, step]);
  
  // Save draft when state changes (except during import)
  useEffect(() => {
    if (step !== 'import' && step !== 'upload') {
      setDraftData({
        step,
        mapping,
        parseResultMeta: parseResult ? {
          headers: parseResult.headers,
          rowCount: parseResult.parsedRowCount,
        } : undefined,
      });
    }
  }, [step, mapping, parseResult, setDraftData]);
  
  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    const restored = restoreDraft();
    if (restored) {
      setStep(restored.step);
      setMapping(restored.mapping);
      setShowDraftBanner(false);
      toast.info('Draft restored. Please re-upload your CSV file to continue.');
    }
  }, [restoreDraft]);
  
  const handleDiscardDraft = useCallback(() => {
    discardDraft();
    setShowDraftBanner(false);
  }, [discardDraft]);
  
  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      console.log('[LinkedIn Wizard] File loaded, size:', content.length);
      
      const result = parseLinkedInCSV(content);
      setParseResult(result);
      
      if (result.success && result.parsedRowCount > 0) {
        // Auto-map columns
        const autoMapping = autoMapColumns(result.normalizedHeaders);
        setMapping(autoMapping);
      }
    };
    reader.readAsText(selectedFile);
  }, []);
  
  // Run validation when entering validate step
  const runValidation = useCallback(() => {
    if (!parseResult) return;
    
    const result = validateRows(parseResult.rows, mapping, parseResult.headerLineIndex);
    setValidation(result);
  }, [parseResult, mapping]);
  
  // Download diagnostics
  const handleDownloadDiagnostics = useCallback(() => {
    if (!parseResult || !validation) return;
    
    const report = generateDiagnosticsReport(parseResult, mapping, validation);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-import-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [parseResult, mapping, validation]);
  
  // Import contacts
  const handleImport = useCallback(async () => {
    if (!user?.id || !validation || validation.importableCount === 0) return;
    
    setIsImporting(true);
    setImportProgress({ processed: 0, success: 0, failed: 0 });
    setImportErrors([]);
    
    const contacts = validation.importableContacts;
    let successCount = 0;
    let failedCount = 0;
    const errors: ImportError[] = [];
    
    for (let i = 0; i < contacts.length; i++) {
      const { contact } = contacts[i];
      
      try {
        // Insert profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: user.id,
            first_name: contact.first_name,
            last_name: contact.last_name || null,
            organization: contact.organization || null,
            job_title: contact.job_title || null,
            notes: contact.notes || null,
            relationship_type: 'colleague' as const
          }])
          .select('id')
          .single();
        
        if (profileError) throw profileError;
        
        // Insert email if present
        if (contact.email && profile?.id) {
          await supabase.from('contact_methods').insert([{
            profile_id: profile.id,
            contact_type: 'email' as const,
            value: contact.email,
            is_primary: true
          }]);
        }
        
        successCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          rowIndex: contacts[i].rowIndex,
          name: `${contact.first_name} ${contact.last_name}`.trim(),
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
      
      setImportProgress({ processed: i + 1, success: successCount, failed: failedCount });
    }
    
    setImportErrors(errors);
    setIsImporting(false);
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    
    if (successCount > 0) {
      toast.success(`Imported ${successCount} contacts${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
    } else {
      toast.error('Import failed - no contacts were imported');
    }
  }, [user?.id, validation, queryClient]);
  
  // Navigation
  const canProceed = () => {
    switch (step) {
      case 'upload':
        return parseResult?.success && parseResult.parsedRowCount > 0;
      case 'mapping':
        return mapping.first_name !== undefined || 
               mapping.last_name !== undefined || 
               mapping.email !== undefined || 
               mapping.profile_url !== undefined;
      case 'validate':
        return validation && validation.importableCount > 0;
      case 'import':
        return !isImporting;
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (step === 'mapping') {
      runValidation();
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].key);
      
      if (STEPS[nextIndex].key === 'import' && validation && validation.importableCount > 0) {
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
    setMapping({});
    setValidation(null);
    setImportProgress({ processed: 0, success: 0, failed: 0 });
    setImportErrors([]);
  };
  
  return (
    <div className="space-y-6">
      {/* Draft recovery banner */}
      {showDraftBanner && (
        <Alert>
          <RotateCw className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You have an unsaved import session. Would you like to continue where you left off?</span>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={handleDiscardDraft}>
                Start Fresh
              </Button>
              <Button size="sm" onClick={handleRestoreDraft}>
                Restore Draft
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Auto-save indicator */}
      {step !== 'upload' && step !== 'import' && (
        <div className="flex justify-end">
          <AutoSaveIndicator 
            status={isSaving ? 'saving' : lastSaved ? 'saved' : 'idle'} 
            lastSaved={lastSaved || undefined}
          />
        </div>
      )}
      
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
              <div className={`w-12 h-0.5 mx-3 ${i < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 'upload' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Upload LinkedIn Connections CSV</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Export your connections from LinkedIn → Settings → Data privacy → Get a copy of your data → Connections
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>
            
            {parseResult && file && (
              <ImportDiagnosticsPanel
                fileName={file.name}
                fileSize={file.size}
                parseResult={parseResult}
              />
            )}
          </div>
        )}
        
        {step === 'mapping' && parseResult && (
          <div className="space-y-4">
            <MappingEditor
              headers={parseResult.headers}
              mapping={mapping}
              onMappingChange={setMapping}
            />
          </div>
        )}
        
        {step === 'validate' && validation && parseResult && (
          <ValidationSummary
            validation={validation}
            onDownloadDiagnostics={handleDownloadDiagnostics}
          />
        )}
        
        {step === 'import' && validation && (
          <ImportProgressPanel
            isImporting={isImporting}
            total={validation.importableCount}
            processed={importProgress.processed}
            successCount={importProgress.success}
            failedCount={importProgress.failed}
            errors={importErrors}
          />
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
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </>
          )}
        </Button>
        
        {step !== 'import' && (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === 'validate' ? 'Import' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
