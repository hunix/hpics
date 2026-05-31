import { useState, useRef } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MessageCircle, Smartphone, Users, Activity,
  CheckCircle2, XCircle, Loader2,
  Upload, Globe, Share2,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { SmsBridge } from '@/components/android/SmsBridge';
import { DataExportImporter } from '@/components/integrations/DataExportImporter';
import { WhatsAppPersonalBridge } from '@/components/whatsapp/WhatsAppPersonalBridge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SourceHealthRow {
  source: string;
  lastSync: string;
  records: number;
  status: 'ok' | 'stale' | 'error' | 'never';
}

// ---------------------------------------------------------------------------
// Contacts Section
// ---------------------------------------------------------------------------

// Navigator Contacts API is still behind an experimental flag on Android Chrome.
// Typed minimally to avoid relying on a specific lib version.
interface ContactsManager {
  select: (properties: string[], options?: { multiple?: boolean }) => Promise<Array<{
    name?: string[];
    email?: string[];
    tel?: string[];
  }>>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

interface PickedContact {
  name: string;
  email: string;
  phone: string;
}

function ContactsSyncSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickedContacts, setPickedContacts] = useState<PickedContact[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [vcfParsed, setVcfParsed] = useState<PickedContact[]>([]);

  const contactsApiAvailable = typeof navigator !== 'undefined' && !!navigator.contacts;

  async function handlePickContacts() {
    if (!navigator.contacts) {
      setPickError('Contacts Picker API is only available in Android Chrome 80+. Use the vCard import below instead.');
      return;
    }
    setPickError(null);
    try {
      const results = await navigator.contacts.select(['name', 'email', 'tel'], { multiple: true });
      const mapped: PickedContact[] = results.map(c => ({
        name: c.name?.[0] ?? '',
        email: c.email?.[0] ?? '',
        phone: c.tel?.[0] ?? '',
      }));
      setPickedContacts(mapped);
    } catch (err) {
      setPickError(err instanceof Error ? err.message : 'Contact picker was dismissed.');
    }
  }

  async function importContacts(contacts: PickedContact[]) {
    if (contacts.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const { error } = await supabase.functions.invoke('import-contacts-batch', {
        body: { contacts },
      });
      if (error) throw new Error(error.message);
      setImportedCount(contacts.length);
      setPickedContacts([]);
      setVcfParsed([]);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  function parseVcf(text: string): PickedContact[] {
    const vcards = text.split('END:VCARD');
    const contacts: PickedContact[] = [];
    for (const block of vcards) {
      if (!block.includes('BEGIN:VCARD')) continue;
      let name = '', email = '', phone = '';
      for (const line of block.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('FN:')) name = trimmed.slice(3);
        else if (trimmed.startsWith('EMAIL') && trimmed.includes(':')) email = trimmed.split(':').slice(1).join(':');
        else if (trimmed.startsWith('TEL') && trimmed.includes(':')) phone = trimmed.split(':').slice(1).join(':');
      }
      if (name || phone) contacts.push({ name, email, phone });
    }
    return contacts;
  }

  function handleVcfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseVcf(text);
      setVcfParsed(parsed);
    };
    reader.readAsText(file);
  }

  const activeContacts = pickedContacts.length > 0 ? pickedContacts : vcfParsed;

  return (
    <div className="space-y-4">
      {/* Contacts Picker API */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Android Contacts Picker
          </CardTitle>
          <CardDescription>
            Uses the native Contacts Picker API available in Android Chrome 80+
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!contactsApiAvailable && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertTitle className="text-amber-700 dark:text-amber-400">Not available in this browser</AlertTitle>
              <AlertDescription className="text-sm">
                The Contacts Picker API requires Android Chrome. Use the vCard import below.
              </AlertDescription>
            </Alert>
          )}
          <Button
            variant="outline"
            onClick={handlePickContacts}
            disabled={!contactsApiAvailable}
          >
            <Users className="h-4 w-4 mr-2" />
            Sync Contacts via Contacts Picker
          </Button>
          {pickError && <p className="text-sm text-destructive">{pickError}</p>}
          {pickedContacts.length > 0 && (
            <Badge variant="secondary">{pickedContacts.length} contacts picked</Badge>
          )}
        </CardContent>
      </Card>

      {/* vCard import */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            vCard Import (.vcf)
          </CardTitle>
          <CardDescription>
            Export contacts from your phone as a .vcf file, then upload here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="space-y-1 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
              <span>Open Contacts app on your Samsung Galaxy</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
              <span>Tap Menu → Manage contacts → Export → Save as VCF</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>
              <span>Upload the .vcf file below</span>
            </li>
          </ol>
          <div className="space-y-2">
            <Label htmlFor="vcf-file">Upload .vcf file</Label>
            <Input
              id="vcf-file"
              type="file"
              accept=".vcf"
              ref={fileRef}
              onChange={handleVcfChange}
            />
          </div>
          {vcfParsed.length > 0 && (
            <Badge variant="secondary">{vcfParsed.length} contacts parsed</Badge>
          )}
        </CardContent>
      </Card>

      {/* Import button */}
      {activeContacts.length > 0 && (
        <div className="space-y-3">
          {importError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Import Failed</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={() => importContacts(activeContacts)}
            disabled={importing}
            className="w-full"
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Import {activeContacts.length} Contacts</>
            )}
          </Button>
        </div>
      )}

      {importedCount !== null && (
        <Alert className="border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle className="text-emerald-700 dark:text-emerald-400">Import Complete</AlertTitle>
          <AlertDescription>
            Successfully imported <strong>{importedCount}</strong> contacts.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source Health Dashboard
// ---------------------------------------------------------------------------

function SourceHealthDashboard() {
  // Mock data — reads from source_health_log table in production
  const rows: SourceHealthRow[] = [
    { source: 'WhatsApp Bridge',  lastSync: '2 minutes ago',   records: 14820, status: 'ok' },
    { source: 'SMS',              lastSync: 'Never',            records: 0,     status: 'never' },
    { source: 'Instagram',        lastSync: '3 days ago',       records: 1204,  status: 'stale' },
    { source: 'LinkedIn',         lastSync: '1 week ago',       records: 892,   status: 'stale' },
    { source: 'Contacts',         lastSync: 'Never',            records: 0,     status: 'never' },
  ];

  const statusBadge: Record<SourceHealthRow['status'], { label: string; className: string }> = {
    ok:    { label: 'Synced',  className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    stale: { label: 'Stale',   className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    error: { label: 'Error',   className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    never: { label: 'Never',   className: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="space-y-3">
      <Alert className="border-border/50">
        <Activity className="h-4 w-4" />
        <AlertTitle>Source Health Log</AlertTitle>
        <AlertDescription className="text-xs">
          Reads from the <code className="bg-muted px-1 rounded">source_health_log</code> table.
          Data shown below is a placeholder until real sync events are recorded.
        </AlertDescription>
      </Alert>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/30">
                <tr>
                  <th className="text-left p-3 font-medium">Source</th>
                  <th className="text-left p-3 font-medium">Last Sync</th>
                  <th className="text-right p-3 font-medium">Records</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const sb = statusBadge[row.status];
                  return (
                    <tr key={row.source} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-medium">{row.source}</td>
                      <td className="p-3 text-muted-foreground">{row.lastSync}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {row.records.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', sb.className)}>
                          {sb.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AndroidDataSyncPage() {
  return (
    <AppLayout title="Android Data Sync">
      <div className="space-y-6 max-w-3xl">

        {/* Hero */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Samsung Galaxy S26 Ultra Data Hub</CardTitle>
                <CardDescription>
                  Capture all data from your Android device — messages, contacts, social exports and more
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main tabs */}
        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="w-full h-auto p-1.5 grid grid-cols-3 sm:grid-cols-6 gap-1">
            <TabsTrigger value="whatsapp" className="flex items-center gap-1.5 py-2 text-xs">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">WA</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-1.5 py-2 text-xs">
              <Smartphone className="h-3.5 w-3.5" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex items-center gap-1.5 py-2 text-xs">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Instagram</span>
              <span className="sm:hidden">IG</span>
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="flex items-center gap-1.5 py-2 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">LinkedIn</span>
              <span className="sm:hidden">LI</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1.5 py-2 text-xs">
              <Users className="h-3.5 w-3.5" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-1.5 py-2 text-xs">
              <Activity className="h-3.5 w-3.5" />
              Health
            </TabsTrigger>
          </TabsList>

          {/* WhatsApp Bridge */}
          <TabsContent value="whatsapp" className="mt-4">
            <WhatsAppPersonalBridge />
          </TabsContent>

          {/* SMS */}
          <TabsContent value="sms" className="mt-4">
            <SmsBridge />
          </TabsContent>

          {/* Instagram */}
          <TabsContent value="instagram" className="mt-4">
            <DataExportImporter
              platform="instagram"
              functionName="import-instagram-export"
              exportUrl="https://accountscenter.instagram.com/info_and_permissions/dyi/"
              acceptedFormats=".zip"
              instructions={[
                'Go to Instagram → Settings → Account Center → Your information and permissions → Download your information',
                'Select "Download or transfer information" → All Instagram accounts',
                'Choose "Download to device" and select JSON format',
                'Wait for the export email (can take up to 48 hours), then download the ZIP',
                'Upload the ZIP file below',
              ]}
              onComplete={result => console.log('Instagram import complete', result)}
            />
          </TabsContent>

          {/* LinkedIn */}
          <TabsContent value="linkedin" className="mt-4">
            <DataExportImporter
              platform="linkedin"
              functionName="import-linkedin-export"
              exportUrl="https://www.linkedin.com/mypreferences/d/download-my-data"
              acceptedFormats=".zip"
              instructions={[
                'Go to LinkedIn → Settings & Privacy → Data privacy → Get a copy of your data',
                'Select "Want something in particular?" and choose: Connections, Messages, Profile',
                'Click "Request archive" — you\'ll receive an email within 24 hours',
                'Download the ZIP from the email link and upload it below',
              ]}
              onComplete={result => console.log('LinkedIn import complete', result)}
            />
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts" className="mt-4">
            <ContactsSyncSection />
          </TabsContent>

          {/* Source Health */}
          <TabsContent value="health" className="mt-4">
            <SourceHealthDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
