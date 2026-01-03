import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, FileText, Users, Check, X } from 'lucide-react';

interface ParsedContact {
  id: string;
  first_name: string;
  last_name?: string;
  organization?: string;
  job_title?: string;
  emails?: string[];
  phones?: string[];
  selected: boolean;
}

export function ContactImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const parseVCard = (content: string): ParsedContact[] => {
    const contacts: ParsedContact[] = [];
    const vcards = content.split('END:VCARD').filter(v => v.includes('BEGIN:VCARD'));

    for (const vcard of vcards) {
      const lines = vcard.split(/\r?\n/);
      const contact: ParsedContact = {
        id: crypto.randomUUID(),
        first_name: '',
        emails: [],
        phones: [],
        selected: true,
      };

      for (const line of lines) {
        if (line.startsWith('FN:') || line.startsWith('FN;')) {
          const fullName = line.split(':').slice(1).join(':').trim();
          const parts = fullName.split(' ');
          contact.first_name = parts[0] || '';
          contact.last_name = parts.slice(1).join(' ') || undefined;
        } else if (line.startsWith('N:') || line.startsWith('N;')) {
          const nameParts = line.split(':').slice(1).join(':').split(';');
          if (!contact.first_name) {
            contact.last_name = nameParts[0] || undefined;
            contact.first_name = nameParts[1] || '';
          }
        } else if (line.startsWith('ORG:') || line.startsWith('ORG;')) {
          contact.organization = line.split(':').slice(1).join(':').split(';')[0].trim() || undefined;
        } else if (line.startsWith('TITLE:') || line.startsWith('TITLE;')) {
          contact.job_title = line.split(':').slice(1).join(':').trim() || undefined;
        } else if (line.startsWith('EMAIL') && line.includes(':')) {
          const email = line.split(':').slice(1).join(':').trim();
          if (email) contact.emails?.push(email);
        } else if (line.startsWith('TEL') && line.includes(':')) {
          const phone = line.split(':').slice(1).join(':').trim();
          if (phone) contact.phones?.push(phone);
        }
      }

      if (contact.first_name) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  const parseCSV = (content: string): ParsedContact[] => {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const contacts: ParsedContact[] = [];

    const findIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const firstNameIdx = findIndex(['first', 'given', 'firstname']);
    const lastNameIdx = findIndex(['last', 'surname', 'family', 'lastname']);
    const fullNameIdx = findIndex(['name', 'fullname', 'full name']);
    const orgIdx = findIndex(['org', 'company', 'organization', 'employer']);
    const titleIdx = findIndex(['title', 'job', 'position', 'role']);
    const emailIdx = findIndex(['email', 'e-mail']);
    const phoneIdx = findIndex(['phone', 'tel', 'mobile', 'cell']);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      let firstName = '';
      let lastName = '';

      if (firstNameIdx >= 0) {
        firstName = values[firstNameIdx] || '';
      }
      if (lastNameIdx >= 0) {
        lastName = values[lastNameIdx] || '';
      }
      if (!firstName && fullNameIdx >= 0) {
        const parts = (values[fullNameIdx] || '').split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ');
      }

      if (firstName) {
        contacts.push({
          id: crypto.randomUUID(),
          first_name: firstName,
          last_name: lastName || undefined,
          organization: orgIdx >= 0 ? values[orgIdx] || undefined : undefined,
          job_title: titleIdx >= 0 ? values[titleIdx] || undefined : undefined,
          emails: emailIdx >= 0 && values[emailIdx] ? [values[emailIdx]] : [],
          phones: phoneIdx >= 0 && values[phoneIdx] ? [values[phoneIdx]] : [],
          selected: true,
        });
      }
    }

    return contacts;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    let contacts: ParsedContact[] = [];

    if (file.name.endsWith('.vcf') || file.name.endsWith('.vcard')) {
      contacts = parseVCard(content);
    } else if (file.name.endsWith('.csv')) {
      contacts = parseCSV(content);
    } else {
      toast({ title: 'Unsupported file format', description: 'Please use .vcf or .csv files', variant: 'destructive' });
      return;
    }

    if (contacts.length === 0) {
      toast({ title: 'No contacts found', description: 'Could not parse any contacts from the file', variant: 'destructive' });
      return;
    }

    setParsedContacts(contacts);
    toast({ title: `Found ${contacts.length} contacts`, description: 'Review and select contacts to import' });
  };

  const toggleContact = (id: string) => {
    setParsedContacts(prev =>
      prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const toggleAll = (selected: boolean) => {
    setParsedContacts(prev => prev.map(c => ({ ...c, selected })));
  };

  const importContacts = async () => {
    const selectedContacts = parsedContacts.filter(c => c.selected);
    if (selectedContacts.length === 0) {
      toast({ title: 'No contacts selected', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    let imported = 0;

    try {
      for (const contact of selectedContacts) {
        // Insert profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user!.id,
            first_name: contact.first_name,
            last_name: contact.last_name || null,
            organization: contact.organization || null,
            job_title: contact.job_title || null,
          })
          .select('id')
          .single();

        if (profileError) {
          console.error('Error importing contact:', profileError);
          continue;
        }

        // Insert contact methods
        const methods = [];
        for (const email of contact.emails || []) {
          methods.push({ profile_id: profile.id, contact_type: 'email' as const, value: email });
        }
        for (const phone of contact.phones || []) {
          methods.push({ profile_id: profile.id, contact_type: 'phone' as const, value: phone });
        }

        if (methods.length > 0) {
          await supabase.from('contact_methods').insert(methods);
        }

        imported++;
      }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: `Imported ${imported} contacts` });
      setParsedContacts([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({ title: 'Import failed', description: 'Some contacts may not have been imported', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = parsedContacts.filter(c => c.selected).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Contacts
        </CardTitle>
        <CardDescription>Import contacts from vCard (.vcf) or CSV files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".vcf,.vcard,.csv"
            onChange={handleFileSelect}
          />
          <p className="text-xs text-muted-foreground">
            Supports vCard (.vcf) and CSV files with columns: First Name, Last Name, Email, Phone, Organization, Title
          </p>
        </div>

        {parsedContacts.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selectedCount} of {parsedContacts.length} selected</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-2">
                {parsedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      contact.selected ? 'bg-primary/10 border border-primary/30' : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <Checkbox checked={contact.selected} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contact.organization && (
                          <Badge variant="secondary" className="text-xs">{contact.organization}</Badge>
                        )}
                        {contact.emails?.[0] && (
                          <Badge variant="outline" className="text-xs">{contact.emails[0]}</Badge>
                        )}
                        {contact.phones?.[0] && (
                          <Badge variant="outline" className="text-xs">{contact.phones[0]}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button onClick={importContacts} disabled={isImporting || selectedCount === 0} className="w-full">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Import {selectedCount} Contacts
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
