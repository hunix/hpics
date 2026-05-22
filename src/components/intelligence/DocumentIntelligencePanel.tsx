import { useState } from 'react';
import {
  useExtractedDocuments,
  useProfilesForDocumentLinking,
  useDocumentTypeCounts,
  useLinkDocumentToProfile,
  useAcceptDocumentSuggestion,
  useIgnoreDocument,
  type ExtractedDocument,
} from '@/hooks/intelligence/useDocumentIntelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, CreditCard, IdCard, FileCheck, Receipt, FileSignature, 
  Mail, Phone, MapPin, Globe, Link as LinkIcon, X, Eye, Search, Filter, User
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const DOCUMENT_ICONS: Record<string, any> = {
  id_card: IdCard,
  passport: IdCard,
  license: FileCheck,
  invoice: Receipt,
  receipt: Receipt,
  contract: FileSignature,
  letter: Mail,
  form: FileText,
  certificate: FileCheck,
  card: CreditCard,
  ticket: Receipt,
  other: FileText,
};

const DOCUMENT_COLORS: Record<string, string> = {
  id_card: 'bg-blue-500/10 text-blue-500',
  passport: 'bg-red-500/10 text-red-500',
  license: 'bg-green-500/10 text-green-500',
  invoice: 'bg-amber-500/10 text-amber-500',
  receipt: 'bg-orange-500/10 text-orange-500',
  contract: 'bg-purple-500/10 text-purple-500',
  letter: 'bg-cyan-500/10 text-cyan-500',
  form: 'bg-gray-500/10 text-gray-500',
  certificate: 'bg-emerald-500/10 text-emerald-500',
  card: 'bg-indigo-500/10 text-indigo-500',
  ticket: 'bg-pink-500/10 text-pink-500',
  other: 'bg-gray-500/10 text-gray-500',
};

interface DocumentIntelligencePanelProps {
  profileId?: string;
}

export function DocumentIntelligencePanel({ profileId }: DocumentIntelligencePanelProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ExtractedDocument | null>(null);

  const { data: documents, isLoading } = useExtractedDocuments({
    profileId,
    type: selectedType,
    status: selectedStatus,
    search: searchQuery,
  });
  const { data: profiles } = useProfilesForDocumentLinking();
  const { data: typeCounts } = useDocumentTypeCounts(profileId);
  const linkMutation = useLinkDocumentToProfile();
  const acceptSuggestionMutation = useAcceptDocumentSuggestion();
  const ignoreMutation = useIgnoreDocument();

  const pendingCount = documents?.filter(d => d.linked_status === 'pending').length || 0;
  const linkedCount = documents?.filter(d => d.linked_status !== 'pending' && d.linked_status !== 'ignored').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Intelligence
            </CardTitle>
            <CardDescription>
              OCR-extracted documents with contact information
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pendingCount} pending</Badge>
            <Badge variant="secondary">{linkedCount} linked</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeCounts || {}).map(([type, count]) => {
                const Icon = DOCUMENT_ICONS[type] || FileText;
                return (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.replace(/_/g, ' ')} ({count})
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="auto_linked">Auto-linked</SelectItem>
              <SelectItem value="manually_linked">Manually Linked</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents list */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : documents?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <p>No documents extracted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents?.map((doc) => {
                const Icon = DOCUMENT_ICONS[doc.document_type] || FileText;
                const contactInfo = doc.extracted_contact;
                const hasContactInfo = contactInfo && 
                  ((contactInfo.phone_numbers?.length ?? 0) > 0 ||
                   (contactInfo.emails?.length ?? 0) > 0 ||
                   (contactInfo.urls?.length ?? 0) > 0);

                return (
                  <div
                    key={doc.id}
                    className="rounded-lg border bg-card overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-3">
                      <div className={`p-2 rounded-lg ${DOCUMENT_COLORS[doc.document_type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium capitalize">
                            {doc.document_type.replace(/_/g, ' ')}
                          </span>
                          {doc.document_subtype && (
                            <Badge variant="outline" className="text-xs">
                              {String(doc.document_subtype)}
                            </Badge>
                          )}
                          <Badge 
                            variant={doc.linked_status === 'pending' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {doc.linked_status}
                          </Badge>
                        </div>
                        
                        {/* Raw text preview */}
                        {doc.raw_text && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {doc.raw_text}
                          </p>
                        )}

                        {/* Contact info extracted */}
                        {hasContactInfo && contactInfo && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {contactInfo.phone_numbers?.map((phone: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                {phone}
                              </Badge>
                            ))}
                            {contactInfo.emails?.map((email: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                {email}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Suggested match */}
                        {doc.suggested_profile && doc.linked_status === 'pending' && (
                          <div className="flex items-center gap-2 mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                            <span className="text-xs text-muted-foreground">Suggested:</span>
                            <span className="text-sm font-medium">{doc.suggested_profile.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round((Number(doc.match_confidence) || 0) * 100)}%
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 ml-auto"
                              onClick={() => acceptSuggestionMutation.mutate({
                                docId: doc.id,
                                profileId: doc.suggested_profile.id
                              })}
                            >
                              Accept
                            </Button>
                          </div>
                        )}

                        {doc.linked_profile_data?.full_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Linked to: <span className="font-medium">{doc.linked_profile_data.full_name}</span>
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {doc.linked_status === 'pending' && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Link Document to Contact</DialogTitle>
                                  <DialogDescription>
                                    Review extracted content and assign to a contact.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  {/* Document preview */}
                                  <Accordion type="single" collapsible>
                                    <AccordionItem value="text">
                                      <AccordionTrigger>Extracted Text</AccordionTrigger>
                                      <AccordionContent>
                                        <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-lg max-h-[200px] overflow-auto">
                                          {doc.raw_text || 'No text extracted'}
                                        </pre>
                                      </AccordionContent>
                                    </AccordionItem>
                                    {doc.structured_data && Object.keys(doc.structured_data).length > 0 && (
                                      <AccordionItem value="structured">
                                        <AccordionTrigger>Structured Data</AccordionTrigger>
                                        <AccordionContent>
                                          <div className="space-y-2">
                                            {Object.entries(doc.structured_data).map(([key, value]) => (
                                              <div key={key} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground capitalize">
                                                  {key.replace(/_/g, ' ')}
                                                </span>
                                                <span className="font-medium">
                                                  {Array.isArray(value) ? value.join(', ') : String(value)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    )}
                                  </Accordion>

                                  {/* Profile selection */}
                                  <div>
                                    <label className="text-sm font-medium">Assign to Contact:</label>
                                    <ScrollArea className="h-[200px] mt-2">
                                      <div className="space-y-1">
                                        {profiles?.map((profile) => (
                                          <button
                                            key={profile.id}
                                            onClick={() => {
                                              linkMutation.mutate({ docId: doc.id, profileId: profile.id });
                                            }}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                                          >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                              {profile.avatar_url ? (
                                                <img src={profile.avatar_url} className="h-8 w-8 rounded-full" />
                                              ) : (
                                                <User className="h-4 w-4" />
                                              )}
                                            </div>
                                            <span>{profile.full_name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => ignoreMutation.mutate(doc.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="capitalize">
                                {doc.document_type.replace(/_/g, ' ')} Details
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-muted-foreground">Document Type</label>
                                  <p className="font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                                </div>
                                {doc.document_subtype && (
                                  <div>
                                    <label className="text-xs text-muted-foreground">Subtype</label>
                                    <p className="font-medium">{String(doc.document_subtype)}</p>
                                  </div>
                                )}
                                <div>
                                  <label className="text-xs text-muted-foreground">Confidence</label>
                                  <p className="font-medium">{Math.round((Number(doc.match_confidence) || 0) * 100)}%</p>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Status</label>
                                  <p className="font-medium capitalize">{doc.linked_status}</p>
                                </div>
                              </div>

                              {doc.raw_text && (
                                <div>
                                  <label className="text-xs text-muted-foreground">Full Text</label>
                                  <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg mt-1 max-h-[300px] overflow-auto">
                                    {doc.raw_text}
                                  </pre>
                                </div>
                              )}

                              {doc.structured_data && Object.keys(doc.structured_data).length > 0 && (
                                <div>
                                  <label className="text-xs text-muted-foreground">Structured Data</label>
                                  <div className="mt-1 space-y-1 p-3 bg-muted rounded-lg">
                                    {Object.entries(doc.structured_data).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground capitalize">
                                          {key.replace(/_/g, ' ')}
                                        </span>
                                        <span className="font-medium">
                                          {Array.isArray(value) ? value.join(', ') : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {doc.extracted_contact && (
                                <div>
                                  <label className="text-xs text-muted-foreground">Contact Information</label>
                                  <div className="mt-1 space-y-2">
                                    {(doc.extracted_contact.phone_numbers?.length ?? 0) > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{doc.extracted_contact.phone_numbers?.join(', ')}</span>
                                      </div>
                                    )}
                                    {(doc.extracted_contact.emails?.length ?? 0) > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{doc.extracted_contact.emails?.join(', ')}</span>
                                      </div>
                                    )}
                                    {(doc.extracted_contact.urls?.length ?? 0) > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span>{doc.extracted_contact.urls?.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
