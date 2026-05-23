import React, { useState, useEffect, useCallback } from 'react';
import { Nfc, Plus, Trash2, Edit2, Check, X, Loader2, Smartphone, Tag, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';

interface NFCTag {
  id: string;
  tag_id: string;
  contact_id: string | null;
  tag_label: string;
  created_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  tap_count?: number;
  last_tapped?: string;
}

interface NFCTagManagerProps {
  className?: string;
  onTagTapped?: (tagId: string, contactId: string) => void;
}

export function NFCTagManager({ className, onTagTapped }: NFCTagManagerProps) {
  const [tags, setTags] = useState<NFCTag[]>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; first_name: string; last_name: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<NFCTag | null>(null);
  const [newTag, setNewTag] = useState({ label: '', contactId: '' });
  const [scannedTagId, setScannedTagId] = useState<string | null>(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check NFC support
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
    loadTags();
    loadContacts();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('nfc_tags')
        .select(`
          *,
          profiles:contact_id (id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedTags = (data || []).map((tag: any) => ({
        ...tag,
        contact: tag.profiles,
      }));

      setTags(transformedTags);
    } catch (error) {
      console.error('Failed to load NFC tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load NFC tags',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  // Store NFC reader ref for cleanup
  const ndefReaderRef = React.useRef<any>(null);
  const nfcTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleReadingRef = React.useRef<((event: { serialNumber: string }) => void) | null>(null);

  // Cleanup NFC resources on unmount
  useEffect(() => {
    return () => {
      if (nfcTimeoutRef.current) {
        clearTimeout(nfcTimeoutRef.current);
        nfcTimeoutRef.current = null;
      }
      // Remove NFC reading event listener if attached
      if (ndefReaderRef.current && handleReadingRef.current) {
        try {
          ndefReaderRef.current.removeEventListener('reading', handleReadingRef.current);
        } catch {
          // Ignore if removal fails
        }
        handleReadingRef.current = null;
      }
      ndefReaderRef.current = null;
    };
  }, []);

  const startNFCScan = async () => {
    if (!nfcSupported) {
      toast({
        title: 'NFC Not Supported',
        description: 'Your device does not support NFC scanning',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    try {
      // @ts-expect-error - NDEFReader is not in TypeScript types
      const ndef = new NDEFReader();
      ndefReaderRef.current = ndef;
      await ndef.scan();

      const handleReading = ({ serialNumber }: { serialNumber: string }) => {
        setScannedTagId(serialNumber);
        setIsScanning(false);
        setIsDialogOpen(true);
        
        // Clear timeout since we got a reading
        if (nfcTimeoutRef.current) {
          clearTimeout(nfcTimeoutRef.current);
          nfcTimeoutRef.current = null;
        }
        
        toast({
          title: 'NFC Tag Detected',
          description: `Tag ID: ${serialNumber.substring(0, 8)}...`,
        });
      };

      // Store ref for cleanup
      handleReadingRef.current = handleReading;
      ndef.addEventListener('reading', handleReading);

      toast({
        title: 'Scanning...',
        description: 'Hold your phone near an NFC tag',
      });

      // Timeout after 30 seconds
      nfcTimeoutRef.current = setTimeout(() => {
        if (isScanning) {
          setIsScanning(false);
          toast({
            title: 'Scan Timeout',
            description: 'No NFC tag detected',
          });
        }
        nfcTimeoutRef.current = null;
      }, 30000);
    } catch (error) {
      console.error('NFC scan error:', error);
      setIsScanning(false);
      toast({
        title: 'NFC Error',
        description: 'Failed to start NFC scanner. Make sure NFC is enabled.',
        variant: 'destructive',
      });
    }
  };

  const saveTag = async () => {
    if (!newTag.label.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a label for this tag',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tagId = scannedTagId || `manual-${Date.now()}`;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('nfc_tags').insert({
        user_id: user.id,
        tag_id: tagId,
        tag_label: newTag.label,
        contact_id: newTag.contactId || null,
      });

      if (error) throw error;

      toast({
        title: 'Tag Saved',
        description: `NFC tag "${newTag.label}" has been registered`,
      });

      setIsDialogOpen(false);
      setNewTag({ label: '', contactId: '' });
      setScannedTagId(null);
      loadTags();
    } catch (error) {
      console.error('Failed to save tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to save NFC tag',
        variant: 'destructive',
      });
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('nfc_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({
        title: 'Tag Deleted',
        description: 'NFC tag has been removed',
      });

      loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete NFC tag',
        variant: 'destructive',
      });
    }
  };

  const simulateTap = async (tag: NFCTag) => {
    try {
      const { data, error } = await invokeFunction('process-nfc-tap', {
          tagId: tag.tag_id,
          location: null, // Could use geolocation here
        },);

      if (error) throw error;

      toast({
        title: 'Interaction Logged',
        description: `Logged interaction with ${tag.contact?.first_name || tag.tag_label}`,
      });

      if (tag.contact_id) {
        onTagTapped?.(tag.tag_id, tag.contact_id);
      }
    } catch (error) {
      console.error('Failed to log tap:', error);
      toast({
        title: 'Error',
        description: 'Failed to log NFC tap',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Nfc className="h-5 w-5 text-primary" />
          NFC Tag Manager
        </CardTitle>
        <CardDescription>
          Create NFC tags for quick interaction logging with contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NFC Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <span className="text-sm font-medium">
              NFC {nfcSupported ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          <Badge variant={nfcSupported ? 'secondary' : 'outline'}>
            {nfcSupported ? 'Ready' : 'Unavailable'}
          </Badge>
        </div>

        {/* Scan Button */}
        <div className="flex gap-2">
          <Button 
            className="flex-1"
            onClick={startNFCScan}
            disabled={isScanning || !nfcSupported}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Nfc className="h-4 w-4 mr-2" />
                Scan NFC Tag
              </>
            )}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setScannedTagId(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Manual Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {scannedTagId ? 'Register Scanned Tag' : 'Add NFC Tag Manually'}
                </DialogTitle>
                <DialogDescription>
                  {scannedTagId 
                    ? `Tag ID: ${scannedTagId.substring(0, 16)}...`
                    : 'Enter a label and optionally link to a contact'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-label">Tag Label</Label>
                  <Input
                    id="tag-label"
                    placeholder="e.g., Desk Tag, Wallet Tag"
                    value={newTag.label}
                    onChange={(e) => setNewTag({ ...newTag, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Link to Contact (Optional)</Label>
                  <Select 
                    value={newTag.contactId} 
                    onValueChange={(v) => setNewTag({ ...newTag, contactId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Contact</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={saveTag} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Save Tag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tags List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Registered Tags ({tags.length})</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No NFC tags registered</p>
              <p className="text-xs mt-1">Scan or add a tag to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div 
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Nfc className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tag.tag_label}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {tag.contact && (
                            <span>{tag.contact.first_name} {tag.contact.last_name}</span>
                          )}
                          <span className="opacity-50">•</span>
                          <span className="font-mono">{tag.tag_id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => simulateTap(tag)}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteTag(tag.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Usage Tips */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Quick Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Place an NFC tag on your desk to log meetings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Give a tag to a contact - tap to log interactions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Tap from Galaxy Watch for hands-free logging</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default NFCTagManager;
