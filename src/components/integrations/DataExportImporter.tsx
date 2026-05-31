import { useState, useRef, useCallback } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Upload, CheckCircle2, XCircle, Loader2, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface DataExportImporterProps {
  platform: 'instagram' | 'linkedin';
  functionName: string;
  instructions: string[];
  exportUrl: string;
  acceptedFormats: string;
  onComplete?: (result: Record<string, number>) => void;
}

type ImportState =
  | { status: 'idle' }
  | { status: 'parsing' }
  | { status: 'importing' }
  | { status: 'success'; result: Record<string, number> }
  | { status: 'error'; message: string };

export function DataExportImporter({
  platform,
  functionName,
  instructions,
  exportUrl,
  acceptedFormats,
  onComplete,
}: DataExportImporterProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  const isZip = (file: File) =>
    file.name.toLowerCase().endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed';

  const handleFile = useCallback(
    async (file: File) => {
      if (!isZip(file)) {
        setState({ status: 'error', message: `Please upload a ZIP file (received: ${file.name}).` });
        return;
      }

      setState({ status: 'parsing' });

      try {
        setState({ status: 'importing' });

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const formData = new FormData();
        formData.append('file', file);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token ?? supabaseKey}`,
              apikey: supabaseKey,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `Server error: ${response.status}`);
        }

        const result = (await response.json()) as Record<string, number>;
        setState({ status: 'success', result });
        onComplete?.(result);
      } catch (err) {
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Import failed. Please try again.',
        });
      }
    },
    [functionName, onComplete],
  );

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRetry() {
    setState({ status: 'idle' });
    if (fileRef.current) fileRef.current.value = '';
  }

  const isLoading = state.status === 'parsing' || state.status === 'importing';
  const platformLabel = platform === 'instagram' ? 'Instagram' : 'LinkedIn';

  return (
    <div className="space-y-4">
      {/* Instructions card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">How to get your {platformLabel} export</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(exportUrl, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open {platformLabel} Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Drop zone */}
      {state.status !== 'success' && (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
            'flex flex-col items-center justify-center gap-3 p-8 text-center',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-border hover:bg-muted/30',
            isLoading && 'pointer-events-none opacity-60',
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept={acceptedFormats}
            className="hidden"
            onChange={handleInputChange}
            disabled={isLoading}
          />

          {isLoading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium">
                {state.status === 'parsing' ? 'Validating file…' : 'Uploading to server…'}
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Drop your {platformLabel} ZIP here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse — accepts {acceptedFormats}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Import Failed</AlertTitle>
          <AlertDescription className="flex items-start justify-between gap-2">
            <span>{state.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="shrink-0 mt-0.5"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {state.status === 'success' && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {platformLabel} Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(state.result).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-sm py-1">
                  {value.toLocaleString()} {key}
                </Badge>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
