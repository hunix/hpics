import React, { useState, useEffect } from 'react';
import { Check, X, User, AlertCircle, Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ExtractedData {
  // Profile data
  username?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  email?: string;
  phone?: string;
  
  // Social stats
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  
  // Work info
  company?: string;
  jobTitle?: string;
  industry?: string;
  
  // Additional
  profileImageUrl?: string;
  externalLinks?: string[];
  posts?: Array<{ content?: string; likes?: number; comments?: number }>;
  
  // Platform info
  platform?: string;
  confidence?: number;
}

interface ApplyToContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedData;
  sourceType: string;
  captureId?: string;
  preSelectedContactId?: string;
  onApplied?: (contactId: string) => void;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  organization?: string;
}

interface FieldMapping {
  field: keyof ExtractedData;
  label: string;
  contactField: string;
  value: any;
  selected: boolean;
  conflict?: string;
}

export function ApplyToContactDialog({
  open,
  onOpenChange,
  extractedData,
  sourceType,
  captureId,
  preSelectedContactId,
  onApplied,
}: ApplyToContactDialogProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>(preSelectedContactId || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadContacts();
      buildFieldMappings();
    }
  }, [open, extractedData]);

  useEffect(() => {
    if (preSelectedContactId) {
      setSelectedContactId(preSelectedContactId);
      setIsCreatingNew(false);
    }
  }, [preSelectedContactId]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setContacts((data || []).map(c => ({ ...c, company: undefined })) as Contact[]);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildFieldMappings = () => {
    const mappings: FieldMapping[] = [];

    // Map extracted fields to contact fields
    const fieldMap: Array<{ field: keyof ExtractedData; label: string; contactField: string }> = [
      { field: 'displayName', label: 'Display Name', contactField: 'display_name' },
      { field: 'bio', label: 'Bio', contactField: 'bio' },
      { field: 'website', label: 'Website', contactField: 'website' },
      { field: 'location', label: 'Location', contactField: 'location' },
      { field: 'email', label: 'Email', contactField: 'email' },
      { field: 'phone', label: 'Phone', contactField: 'phone' },
      { field: 'company', label: 'Company', contactField: 'company' },
      { field: 'jobTitle', label: 'Job Title', contactField: 'job_title' },
      { field: 'industry', label: 'Industry', contactField: 'industry' },
      { field: 'profileImageUrl', label: 'Profile Photo', contactField: 'avatar_url' },
    ];

    fieldMap.forEach(({ field, label, contactField }) => {
      const value = extractedData[field];
      if (value !== undefined && value !== null && value !== '') {
        mappings.push({
          field,
          label,
          contactField,
          value,
          selected: true,
        });
      }
    });

    setFieldMappings(mappings);
  };

  const toggleField = (field: keyof ExtractedData) => {
    setFieldMappings(prev => 
      prev.map(m => 
        m.field === field ? { ...m, selected: !m.selected } : m
      )
    );
  };

  const handleApply = async () => {
    if (!selectedContactId && !isCreatingNew) {
      toast({
        title: 'Select a Contact',
        description: 'Please select an existing contact or create a new one',
        variant: 'destructive',
      });
      return;
    }

    if (isCreatingNew && !newContactName.trim()) {
      toast({
        title: 'Enter Name',
        description: 'Please enter a name for the new contact',
        variant: 'destructive',
      });
      return;
    }

    setIsApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let contactId = selectedContactId;

      // Create new contact if needed
      if (isCreatingNew) {
        const nameParts = newContactName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newContact, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
          })
          .select()
          .single();

        if (createError) throw createError;
        contactId = newContact.id;
      }

      // Build update object from selected fields
      const updates: Record<string, any> = {};
      fieldMappings
        .filter(m => m.selected)
        .forEach(m => {
          updates[m.contactField] = m.value;
        });

      // Apply updates to contact
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', contactId);

        if (updateError) throw updateError;
      }

      // Store social profile data in device_captures
      if (extractedData.username && extractedData.platform) {
        await supabase.from('device_captures').insert({
          profile_id: contactId,
          user_id: user.id,
          device_type: 'web',
          capture_type: 'social_profile_link',
          source_url: extractedData.website,
          extracted_data: {
            platform: extractedData.platform,
            username: extractedData.username,
            followers_count: extractedData.followersCount,
            following_count: extractedData.followingCount,
            posts_count: extractedData.postsCount,
            is_verified: extractedData.isVerified,
            bio: extractedData.bio,
          },
          status: 'applied',
        }).select().single().then(({ error }) => {
          if (error) console.error('Failed to store social link:', error);
        });
      }

      // Update capture record if exists
      if (captureId) {
        await supabase
          .from('device_captures')
          .update({ 
            profile_id: contactId,
            status: 'applied',
          })
          .eq('id', captureId);
      }

      toast({
        title: 'Data Applied',
        description: `Updated ${fieldMappings.filter(m => m.selected).length} fields`,
      });

      onApplied?.(contactId);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to apply data:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply data to contact',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const selectedFieldsCount = fieldMappings.filter(m => m.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Apply to Contact
          </DialogTitle>
          <DialogDescription>
            Review and apply extracted data from {sourceType} to a contact
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Selection */}
          <div className="space-y-2">
            <Label>Select Contact</Label>
            <div className="flex gap-2">
              <Select 
                value={isCreatingNew ? '__new__' : selectedContactId} 
                onValueChange={(v) => {
                  if (v === '__new__') {
                    setIsCreatingNew(true);
                    setSelectedContactId('');
                    // Pre-fill name from extracted data
                    if (extractedData.displayName) {
                      setNewContactName(extractedData.displayName);
                    }
                  } else {
                    setIsCreatingNew(false);
                    setSelectedContactId(v);
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a contact..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Contact
                    </div>
                  </SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                      {contact.company && (
                        <span className="text-muted-foreground ml-2">({contact.company})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCreatingNew && (
              <Input
                placeholder="Enter full name..."
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Extracted Data Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Data to Apply ({selectedFieldsCount} fields)</Label>
              <Badge variant="secondary" className="text-xs">
                {Math.round((extractedData.confidence || 0.8) * 100)}% confidence
              </Badge>
            </div>

            <ScrollArea className="h-48 border rounded-lg p-3">
              <div className="space-y-2">
                {fieldMappings.map((mapping) => (
                  <div 
                    key={mapping.field}
                    className="flex items-start gap-3 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      id={mapping.field}
                      checked={mapping.selected}
                      onCheckedChange={() => toggleField(mapping.field)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={mapping.field} className="text-sm font-medium cursor-pointer">
                        {mapping.label}
                      </Label>
                      <p className="text-xs text-muted-foreground truncate">
                        {typeof mapping.value === 'string' 
                          ? mapping.value.substring(0, 100) 
                          : String(mapping.value)
                        }
                      </p>
                    </div>
                    {mapping.conflict && (
                      <Badge variant="outline" className="text-amber-600 shrink-0">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Conflict
                      </Badge>
                    )}
                  </div>
                ))}

                {fieldMappings.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No data extracted</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Advanced Options
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox id="overwrite" />
                <Label htmlFor="overwrite" className="text-sm">Overwrite existing values</Label>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox id="link-social" defaultChecked />
                <Label htmlFor="link-social" className="text-sm">Link social profile</Label>
              </div>
              {extractedData.posts && extractedData.posts.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox id="save-posts" />
                  <Label htmlFor="save-posts" className="text-sm">
                    Save {extractedData.posts.length} posts
                  </Label>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isApplying || (selectedFieldsCount === 0)}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Apply {selectedFieldsCount} Fields
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApplyToContactDialog;
