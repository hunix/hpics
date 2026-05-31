import { useState, useRef } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MessageCircle, Upload, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SmsRecord {
  address: string;
  date: string;
  type: string;
  body: string;
  readable_date: string;
  contact_name: string;
}

interface SmsBridgeProps {
  onComplete?: (count: number) => void;
}

const BATCH_SIZE = 500;

export function SmsBridge({ onComplete }: SmsBridgeProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<SmsRecord[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const uniqueContacts = new Set(messages.map(m => m.address)).size;
  const previewRows = messages.slice(0, 10);

  function parseXml(text: string): SmsRecord[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const parseErr = doc.querySelector('parsererror');
    if (parseErr) {
      throw new Error('Invalid XML file. Please check the file is a valid SMS Backup & Restore export.');
    }
    const smsElements = Array.from(doc.querySelectorAll('sms'));
    return smsElements.map(el => ({
      address: el.getAttribute('address') ?? '',
      date: el.getAttribute('date') ?? '',
      type: el.getAttribute('type') ?? '',
      body: el.getAttribute('body') ?? '',
      readable_date: el.getAttribute('readable_date') ?? '',
      contact_name: el.getAttribute('contact_name') ?? '',
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setParseError('Please select an XML file exported from SMS Backup & Restore.');
      return;
    }

    setParseError(null);
    setImportError(null);
    setImportedCount(null);
    setMessages([]);

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseXml(text);
        if (parsed.length === 0) {
          setParseError('No SMS messages found in this file.');
        } else {
          setMessages(parsed);
        }
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse XML file.');
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (messages.length === 0) return;

    setImporting(true);
    setImportError(null);
    setImportedCount(null);

    const totalBatches = Math.ceil(messages.length / BATCH_SIZE);
    let totalImported = 0;

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = messages.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        setBatchProgress({ done: i, total: totalBatches });

        const { data, error } = await supabase.functions.invoke('import-sms-backup', {
          body: { messages: batch },
        });

        if (error) throw new Error(error.message);
        totalImported += (data as { imported?: number })?.imported ?? batch.length;
      }

      setBatchProgress({ done: totalBatches, total: totalBatches });
      setImportedCount(totalImported);
      onComplete?.(totalImported);
      setMessages([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  const progressPct = batchProgress
    ? Math.round((batchProgress.done / batchProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            How to export your SMS messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
              <span>Install <strong className="text-foreground">SMS Backup &amp; Restore</strong> from the Google Play Store</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
              <span>Open the app and tap <strong className="text-foreground">Back Up Now</strong> — save the XML file to your device</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>
              <span>Transfer the <code className="text-foreground bg-muted px-1 rounded text-xs">sms-*.xml</code> file to this browser and upload it below</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* File upload */}
      <div className="space-y-2">
        <Label htmlFor="sms-file">Upload SMS XML file</Label>
        <Input
          id="sms-file"
          type="file"
          accept=".xml"
          ref={fileRef}
          onChange={handleFileChange}
          disabled={importing}
        />
      </div>

      {parseError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Parse Error</AlertTitle>
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {messages.length > 0 && (
        <>
          {/* Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <MessageCircle className="h-3 w-3 mr-1.5" />
              {messages.length.toLocaleString()} messages
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {uniqueContacts} contacts
            </Badge>
          </div>

          {/* Preview table */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Preview (first 10 messages)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Contact</th>
                      <th className="text-left p-2 font-medium">Number</th>
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((msg, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="p-2 font-medium truncate max-w-[100px]">
                          {msg.contact_name || '—'}
                        </td>
                        <td className="p-2 text-muted-foreground font-mono">{msg.address}</td>
                        <td className="p-2 text-muted-foreground whitespace-nowrap">
                          {msg.readable_date || new Date(parseInt(msg.date)).toLocaleDateString()}
                        </td>
                        <td className="p-2 text-muted-foreground truncate max-w-[200px]">
                          {msg.body.slice(0, 50)}{msg.body.length > 50 ? '…' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {importing && batchProgress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Importing batch {batchProgress.done + 1} of {batchProgress.total}…</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {importError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Import Failed</AlertTitle>
              <AlertDescription>
                {importError}
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 h-auto p-0 text-destructive-foreground underline"
                  onClick={handleImport}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleImport}
            disabled={importing}
            className="w-full"
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Import {messages.length.toLocaleString()} SMS Messages</>
            )}
          </Button>
        </>
      )}

      {importedCount !== null && (
        <Alert className="border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle className="text-emerald-700 dark:text-emerald-400">Import Complete</AlertTitle>
          <AlertDescription>
            Successfully imported <strong>{importedCount.toLocaleString()}</strong> SMS messages.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
