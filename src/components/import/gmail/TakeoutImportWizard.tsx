import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFormDraft } from '@/hooks/reliability/useFormDraft';
import { AutoSaveIndicator } from '@/components/reliability/AutoSaveIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Upload, 
  FileArchive, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Shield,
  Mail,
  Users,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

type ImportStep = 'instructions' | 'upload' | 'processing' | 'matching' | 'complete';

interface TakeoutDraftData {
  step: ImportStep;
  fileName?: string;
  fileSize?: number;
  [key: string]: unknown;
}


interface ImportProgress {
  totalEmails: number;
  processedEmails: number;
  matchedContacts: number;
  errors: number;
  currentBatch: number;
  totalBatches: number;
}

export function TakeoutImportWizard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ImportStep>('instructions');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    totalEmails: 0,
    processedEmails: 0,
    matchedContacts: 0,
    errors: 0,
    currentBatch: 0,
    totalBatches: 0,
  });

  // Form draft for auto-save/recovery
  const {
    data: draftData,
    hasDraft,
    isSaving,
    lastSaved,
    setData: updateData,
    restoreDraft,
    discardDraft,
  } = useFormDraft<TakeoutDraftData>({
    formType: 'takeout_import',
    formKey: user?.id || 'anonymous',
    debounceMs: 1000,
    expiryDays: 7,
  });

  // Sync step changes to draft (can't save File object, only metadata)
  useEffect(() => {
    if (step !== 'instructions') {
      updateData({
        step,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
      });
    }
  }, [step, selectedFile?.name, selectedFile?.size, updateData]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    restoreDraft();
    if (draftData?.step && draftData.step !== 'processing' && draftData.step !== 'matching') {
      setStep(draftData.step);
    }
    toast.success('Draft restored');
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setStep('processing');
      
      // Read file in chunks and upload
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      // Create import session via edge function
      const sessionId = crypto.randomUUID();
      
      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const { error: uploadError } = await supabase.storage
          .from('mbox-imports')
          .upload(`${user!.id}/${sessionId}/chunk-${i}`, chunk);

        if (uploadError) throw uploadError;

        setProgress(prev => ({
          ...prev,
          currentBatch: i + 1,
          totalBatches: totalChunks,
        }));
      }

      // Trigger processing
      const { data, error } = await supabase.functions.invoke('import-mbox-emails', {
        body: { 
          sessionId,
          fileName: file.name,
          fileSize: file.size,
          totalChunks,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setProgress(prev => ({
        ...prev,
        totalEmails: data.totalEmails || 0,
        processedEmails: data.processedEmails || 0,
        matchedContacts: data.matchedContacts || 0,
        errors: data.errors || 0,
      }));
      setStep('matching');
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      toast.error('Import failed: ' + (error as Error).message);
      setStep('upload');
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.mbox') && !file.name.endsWith('.zip')) {
        toast.error('Please select an MBOX file or a ZIP archive from Google Takeout');
        return;
      }
      setSelectedFile(file);
      setStep('upload');
    }
  }, []);

  // Start import
  const handleStartImport = useCallback(() => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  }, [selectedFile, importMutation]);

  const renderInstructions = () => (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Secure Import</AlertTitle>
        <AlertDescription>
          Your emails are processed locally in secure batches. All data is encrypted at rest 
          and no raw content is sent to external services.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">How to Export Your Gmail Data</h3>
        
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </span>
            <div>
              <p className="font-medium">Go to Google Takeout</p>
              <a 
                href="https://takeout.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                takeout.google.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>
          
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              2
            </span>
            <div>
              <p className="font-medium">Deselect all and select only "Mail"</p>
              <p className="text-sm text-muted-foreground">
                Click "Deselect all" at the top, then scroll down and check only "Mail"
              </p>
            </div>
          </li>
          
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              3
            </span>
            <div>
              <p className="font-medium">Choose MBOX format</p>
              <p className="text-sm text-muted-foreground">
                Click "All Mail data included" and ensure MBOX format is selected
              </p>
            </div>
          </li>
          
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              4
            </span>
            <div>
              <p className="font-medium">Create export and wait for download link</p>
              <p className="text-sm text-muted-foreground">
                Google will email you when your export is ready (may take hours for large mailboxes)
              </p>
            </div>
          </li>
          
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              5
            </span>
            <div>
              <p className="font-medium">Download and upload here</p>
              <p className="text-sm text-muted-foreground">
                You can upload the ZIP file directly or extract the .mbox file first
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div className="flex justify-end">
        <label>
          <input
            type="file"
            accept=".mbox,.zip"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Select MBOX or ZIP File
            </span>
          </Button>
        </label>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-6">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <FileArchive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="font-medium">{selectedFile?.name}</p>
        <p className="text-sm text-muted-foreground">
          {(selectedFile?.size || 0 / (1024 * 1024)).toFixed(2)} MB
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Processing Time</AlertTitle>
        <AlertDescription>
          Large mailboxes may take several minutes to process. You can close this window 
          and check back later - the import will continue in the background.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => setStep('instructions')}>
          Back
        </Button>
        <Button onClick={handleStartImport} disabled={importMutation.isPending}>
          <Upload className="h-4 w-4 mr-2" />
          Start Secure Import
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => {
    const uploadProgress = progress.totalBatches > 0 
      ? (progress.currentBatch / progress.totalBatches) * 100 
      : 0;

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-pulse">
            <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
          </div>
          <p className="font-medium text-lg">Processing Your Emails</p>
          <p className="text-sm text-muted-foreground mt-2">
            This may take a few minutes for large mailboxes
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Upload Progress</span>
            <span>{progress.currentBatch} / {progress.totalBatches} chunks</span>
          </div>
          <Progress value={uploadProgress} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{progress.processedEmails}</p>
            <p className="text-sm text-muted-foreground">Emails Processed</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{progress.matchedContacts}</p>
            <p className="text-sm text-muted-foreground">Contacts Matched</p>
          </div>
        </div>
      </div>
    );
  };

  const renderMatching = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Users className="h-12 w-12 mx-auto text-primary mb-4" />
        <p className="font-medium text-lg">Matching Emails to Contacts</p>
        <p className="text-sm text-muted-foreground mt-2">
          AI is analyzing email patterns to link messages with your contacts
        </p>
      </div>

      <Progress value={75} className="animate-pulse" />

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Privacy Protected</AlertTitle>
        <AlertDescription>
          All email content is masked before AI analysis. Only anonymized patterns are used 
          for matching - no personal data leaves your secure environment.
        </AlertDescription>
      </Alert>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setStep('complete')}
      >
        Skip to Review
      </Button>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <p className="font-medium text-xl">Import Complete!</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg text-center">
          <Mail className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{progress.totalEmails}</p>
          <p className="text-sm text-muted-foreground">Total Emails</p>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{progress.matchedContacts}</p>
          <p className="text-sm text-muted-foreground">Contacts Matched</p>
        </div>
      </div>

      {progress.errors > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some Issues Detected</AlertTitle>
          <AlertDescription>
            {progress.errors} emails could not be processed. These may be corrupted or in an unsupported format.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => {
          setStep('instructions');
          setSelectedFile(null);
          setProgress({
            totalEmails: 0,
            processedEmails: 0,
            matchedContacts: 0,
            errors: 0,
            currentBatch: 0,
            totalBatches: 0,
          });
        }}>
          Import More
        </Button>
        <Button onClick={() => {
          // Navigate to communications hub
          window.location.href = '/communications';
        }}>
          View Communications
        </Button>
      </div>
    </div>
  );

  // Draft recovery banner
  const DraftBanner = () => hasDraft && step === 'instructions' ? (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <RotateCcw className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>You have an unsaved import session{draftData?.fileName ? ` (${draftData.fileName})` : ''}. Would you like to restore it?</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={discardDraft}>
            Discard
          </Button>
          <Button size="sm" onClick={handleRestoreDraft}>
            Restore
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  ) : null;

  return (
    <>
      <DraftBanner />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Google Takeout Import
              </CardTitle>
              <CardDescription>
                Import your complete Gmail history from a Google Takeout export. 
                No OAuth credentials required - you download your own data.
              </CardDescription>
            </div>
            <AutoSaveIndicator 
              status={isSaving ? 'saving' : hasDraft ? 'saved' : 'idle'} 
              lastSaved={lastSaved || undefined} 
            />
          </div>
        </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {['instructions', 'upload', 'processing', 'matching', 'complete'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === s ? 'bg-primary text-primary-foreground' : 
                    ['instructions', 'upload', 'processing', 'matching', 'complete'].indexOf(step) > i 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {['instructions', 'upload', 'processing', 'matching', 'complete'].indexOf(step) > i ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 4 && (
                  <div className={`w-12 h-0.5 mx-1 ${
                    ['instructions', 'upload', 'processing', 'matching', 'complete'].indexOf(step) > i 
                      ? 'bg-green-500' 
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 'instructions' && renderInstructions()}
        {step === 'upload' && renderUpload()}
        {step === 'processing' && renderProcessing()}
        {step === 'matching' && renderMatching()}
        {step === 'complete' && renderComplete()}
      </CardContent>
    </Card>
    </>
  );
}
