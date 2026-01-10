import { useState, useEffect, useCallback } from 'react';
import { ComposeEmailDialog } from '@/components/communications/ComposeEmailDialog';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, Edit, Trash2, Star, Brain, 
  User, ChevronRight, Mail, UserCheck
} from 'lucide-react';
import { ContactDialog } from '@/components/contacts/ContactDialog';
import { ContactMethodsManager } from '@/components/contacts/ContactMethodsManager';
import { ContactEnrichment } from '@/components/contacts/ContactEnrichment';
import { ConversationsManager } from '@/components/conversations/ConversationsManager';
import { ContactTimeline } from '@/components/contacts/ContactTimeline';
import { EducationManager } from '@/components/contacts/EducationManager';
import { CertificationsManager } from '@/components/contacts/CertificationsManager';
import { SkillsManager } from '@/components/contacts/SkillsManager';
import { DeepIntelligencePanel } from '@/components/intelligence/DeepIntelligencePanel';
import { MeetingBriefing } from '@/components/contacts/MeetingBriefing';
import { GiftSuggestions } from '@/components/contacts/GiftSuggestions';
import { InterestsManager } from '@/components/contacts/InterestsManager';
import { RelationshipGoals } from '@/components/contacts/RelationshipGoals';
import { SharedExperiences } from '@/components/contacts/SharedExperiences';
import { OptimalOutreach } from '@/components/contacts/OptimalOutreach';
import { MessageTemplates } from '@/components/contacts/MessageTemplates';
import { ContactDocumentsManager } from '@/components/contacts/ContactDocumentsManager';
import { ContactMediaManager } from '@/components/contacts/ContactMediaManager';
import { ContactGroupSelector } from '@/components/contacts/ContactGroupSelector';
import { RecordingsManager } from '@/components/recordings/RecordingsManager';
import { VoiceNotesManager } from '@/components/contacts/VoiceNotesManager';
import { BehavioralAnalysis } from '@/components/analysis/BehavioralAnalysis';
import { FacialAnalysis } from '@/components/analysis/FacialAnalysis';
import { BodyLanguageAnalysis } from '@/components/analysis/BodyLanguageAnalysis';
import { VocalAnalysis } from '@/components/analysis/VocalAnalysis';
import { AnalysisComparison } from '@/components/analysis/AnalysisComparison';
import { ExtendedOverview } from '@/components/contacts/ExtendedOverview';
import { ExtendedInfoSection } from '@/components/contacts/ExtendedInfoSection';
import { WhatsAppChat } from '@/components/whatsapp/WhatsAppChat';
import { BankAccountsManager } from '@/components/contacts/BankAccountsManager';
import { PaymentAccountsManager } from '@/components/contacts/PaymentAccountsManager';
import { FinancialHistoryManager } from '@/components/contacts/FinancialHistoryManager';
import { ObservationsManager } from '@/components/contacts/ObservationsManager';
import { ContactRelationshipsManager } from '@/components/contacts/ContactRelationshipsManager';
import { KidsSchoolsManager } from '@/components/contacts/KidsSchoolsManager';
import { ContactEmailThreads } from '@/components/contacts/ContactEmailThreads';
import { ContactStorageBadge } from '@/components/contacts/ContactStorageBadge';
import { LifeMilestonesManager } from '@/components/contacts/LifeMilestonesManager';
import { CommunicationPreferencesManager } from '@/components/contacts/CommunicationPreferencesManager';
import { InteractionNotesManager } from '@/components/contacts/InteractionNotesManager';
import { ContactPlaybook } from '@/components/contacts/ContactPlaybook';
import { ContactActivityHistory } from '@/components/contacts/ContactActivityHistory';
import { TrustAssessmentPanel } from '@/components/intelligence/TrustAssessmentPanel';
import { DossierGenerator } from '@/components/intelligence/DossierGenerator';
import { NetworkIntelligencePanel } from '@/components/intelligence/NetworkIntelligencePanel';
import { LocationIntelligencePanel } from '@/components/intelligence/LocationIntelligencePanel';
import { TemporalAnalysisPanel } from '@/components/intelligence/TemporalAnalysisPanel';
import { RelationshipTrajectoryPanel } from '@/components/intelligence/RelationshipTrajectoryPanel';
import { CommunicationTriangulationPanel } from '@/components/intelligence/CommunicationTriangulationPanel';
import { DeceptionAnalysisPanel } from '@/components/intelligence/DeceptionAnalysisPanel';
import { BiometricSignatureBuilder } from '@/components/contacts/BiometricSignatureBuilder';
import { InfluenceDashboard } from '@/components/intelligence/InfluenceDashboard';
import { UnifiedIntelligencePanel } from '@/components/intelligence/UnifiedIntelligencePanel';
import { SharedExperiencesPanel } from '@/components/intelligence/SharedExperiencesPanel';
import { CrossModalSynthesisPanel } from '@/components/intelligence/CrossModalSynthesisPanel';
import { OSINTPanel } from '@/components/intelligence/OSINTPanel';
import { ThreatAssessmentTab } from '@/components/intelligence/ThreatAssessmentTab';
import { InferredConnectionsPanel } from '@/components/intelligence/InferredConnectionsPanel';
import { BehavioralPredictionsPanel } from '@/components/intelligence/BehavioralPredictionsPanel';
import { ShareContactDialog } from '@/components/collaboration/ShareContactDialog';
import { ContactCommentsPanel } from '@/components/collaboration/ContactCommentsPanel';
import { DetectedItemsManager } from '@/components/intelligence/DetectedItemsManager';
import { UnknownPersonsQueue } from '@/components/intelligence/UnknownPersonsQueue';
import { DocumentIntelligencePanel } from '@/components/intelligence/DocumentIntelligencePanel';
import { cn } from '@/lib/utils';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import { ProfileCompletenessWidget } from '@/components/contacts/ProfileCompletenessWidget';
import { VoiceInsightsPanel } from '@/components/ai/VoiceInsightsPanel';
import { DocumentInsightsPanel } from '@/components/ai/DocumentInsightsPanel';
import { ContentRelationshipsGraph } from '@/components/ai/ContentRelationshipsGraph';
import { KeywordWatchlistManager } from '@/components/ai/KeywordWatchlistManager';
import { ContactDetailSidebar } from '@/components/contacts/ContactDetailSidebar';
import { ContactDetailMobileNav } from '@/components/contacts/ContactDetailMobileNav';
import { ContactSectionSearch } from '@/components/contacts/ContactSectionSearch';
import { type SectionId, getCategoryForSection } from '@/lib/contactDetailCategories';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { relationship_subtype?: string; hierarchy_level?: string };

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Initialize section from URL or default to 'overview'
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const urlSection = searchParams.get('section') as SectionId | null;
    return urlSection || 'overview';
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle section change with URL persistence
  const handleSectionChange = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);
    setSearchParams({ section: sectionId }, { replace: true });
  }, [setSearchParams]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync URL section on mount
  useEffect(() => {
    const urlSection = searchParams.get('section') as SectionId | null;
    if (urlSection && urlSection !== activeSection) {
      setActiveSection(urlSection);
    }
  }, [searchParams, activeSection]);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!id,
  });

  const { data: contactMethods } = useQuery({
    queryKey: ['contact-methods', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('profile_id', id);
      return data ?? [];
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('profiles').delete().eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact deleted' });
      navigate('/contacts');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_favorite: !contact?.is_favorite })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
    },
  });

  const relationshipColors: Record<string, string> = {
    family: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    friend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    colleague: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    client: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    mentor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    mentee: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    acquaintance: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  const contactName = contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : '';
  const activeCategory = getCategoryForSection(activeSection);

  if (isLoading) {
    return (
      <AppLayout title="Contact">
        <div className="flex gap-6">
          <div className="w-64 space-y-4 hidden lg:block">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout title="Contact Not Found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Contact not found</h3>
            <p className="text-muted-foreground text-center mb-4">
              This contact doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/contacts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contacts
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <ProfileCompletenessWidget profileId={contact.id} />
            <ExtendedOverview profileId={contact.id} profile={contact} />
          </div>
        );
      case 'personal-info':
        return <ExtendedInfoSection profileId={contact.id} />;
      case 'contact':
        return <ContactMethodsManager profileId={contact.id} contactMethods={contactMethods || []} />;
      case 'documents':
        return <ContactDocumentsManager profileId={contact.id} contactName={contactName} />;
      case 'media':
        return <ContactMediaManager profileId={contact.id} contactName={contactName} />;
      case 'recordings':
        return <RecordingsManager profileId={contact.id} profileName={contactName} />;
      case 'voice-notes':
        return <VoiceNotesManager profileId={contact.id} />;
      case 'unified-profile':
        return <UnifiedIntelligencePanel profileId={contact.id} contactName={contactName} />;
      case 'milestones':
        return <LifeMilestonesManager profileId={contact.id} contactName={contactName} />;
      case 'comm-prefs':
        return <CommunicationPreferencesManager profileId={contact.id} contactName={contactName} />;
      case 'interaction-notes':
        return <InteractionNotesManager profileId={contact.id} contactName={contactName} />;
      case 'playbook':
        return <ContactPlaybook profileId={contact.id} contactName={contactName} />;
      case 'influence':
        return <InfluenceDashboard profileId={contact.id} contactName={contactName} />;
      case 'behavioral':
        return <BehavioralAnalysis profileId={contact.id} profileName={contactName} />;
      case 'facial':
        return <FacialAnalysis profileId={contact.id} profileName={contactName} />;
      case 'body-language':
        return <BodyLanguageAnalysis profileId={contact.id} profileName={contactName} />;
      case 'vocal':
        return <VocalAnalysis profileId={contact.id} profileName={contactName} />;
      case 'comparison':
        return <AnalysisComparison profileId={contact.id} profileName={contactName} />;
      case 'cross-modal':
        return <CrossModalSynthesisPanel profileId={contact.id} />;
      case 'detected-items':
        return <DetectedItemsManager profileId={contact.id} />;
      case 'unknown-persons':
        return <UnknownPersonsQueue profileId={contact.id} />;
      case 'doc-intelligence':
        return <DocumentIntelligencePanel profileId={contact.id} />;
      case 'voice-insights':
        return <VoiceInsightsPanel profileId={contact.id} />;
      case 'document-insights':
        return <DocumentInsightsPanel profileId={contact.id} />;
      case 'content-relationships':
        return <ContentRelationshipsGraph profileId={contact.id} />;
      case 'keyword-watchlist':
        return <KeywordWatchlistManager />;
      case 'biometrics':
        return <BiometricSignatureBuilder profileId={contact.id} profileName={contactName} avatarUrl={contact.avatar_url} />;
      case 'outreach':
        return <OptimalOutreach profileId={contact.id} contactName={contactName} />;
      case 'templates':
        return <MessageTemplates profileId={contact.id} contactName={contactName} />;
      case 'whatsapp':
        return <WhatsAppChat profileId={contact.id} profileName={contactName} />;
      case 'emails':
        return <ContactEmailThreads profileId={contact.id} contactName={contactName} />;
      case 'briefing':
        return <MeetingBriefing profileId={contact.id} contactName={contactName} />;
      case 'observations':
        return <ObservationsManager profileId={contact.id} contactName={contactName} />;
      case 'trust-assessment':
        return <TrustAssessmentPanel profileId={contact.id} />;
      case 'threat-assessment':
        return <ThreatAssessmentTab profileId={contact.id} contactName={contactName} />;
      case 'osint':
        return <OSINTPanel profileId={contact.id} contactName={contactName} />;
      case 'inferred-connections':
        return <InferredConnectionsPanel profileId={contact.id} contactName={contactName} />;
      case 'predictions':
        return <BehavioralPredictionsPanel profileId={contact.id} contactName={contactName} />;
      case 'dossier':
        return <DossierGenerator profileId={contact.id} profileName={contactName} />;
      case 'network-intel':
        return <NetworkIntelligencePanel />;
      case 'temporal':
        return <TemporalAnalysisPanel profileId={contact.id} />;
      case 'trajectory':
        return <RelationshipTrajectoryPanel profileId={contact.id} />;
      case 'triangulation':
        return <CommunicationTriangulationPanel profileId={contact.id} />;
      case 'consistency':
        return <DeceptionAnalysisPanel profileId={contact.id} />;
      case 'locations':
        return <LocationIntelligencePanel profileId={contact.id} profileName={contactName} />;
      case 'interests':
        return <InterestsManager profileId={contact.id} contactName={contactName} />;
      case 'gifts':
        return <GiftSuggestions profileId={contact.id} contactName={contactName} />;
      case 'goals':
        return <RelationshipGoals profileId={contact.id} contactName={contactName} />;
      case 'experiences':
        return <SharedExperiences profileId={contact.id} contactName={contactName} />;
      case 'shared-experiences':
        return <SharedExperiencesPanel profileId={contact.id} />;
      case 'relationships':
        return <ContactRelationshipsManager profileId={contact.id} contactName={contactName} />;
      case 'kids-schools':
        return <KidsSchoolsManager profileId={contact.id} />;
      case 'education':
        return (
          <div className="space-y-6">
            <EducationManager profileId={contact.id} />
            <Separator />
            <CertificationsManager profileId={contact.id} />
            <Separator />
            <SkillsManager profileId={contact.id} />
          </div>
        );
      case 'messages':
        return <ConversationsManager profileId={contact.id} profileName={contactName} />;
      case 'financial':
        return (
          <div className="space-y-6">
            <BankAccountsManager profileId={contact.id} />
            <Separator />
            <PaymentAccountsManager profileId={contact.id} />
            <Separator />
            <FinancialHistoryManager profileId={contact.id} />
          </div>
        );
      case 'timeline':
        return <ContactTimeline profileId={contact.id} />;
      case 'activity':
        return <ContactActivityHistory profileId={contact.id} contactName={contactName} />;
      case 'groups':
        return <ContactGroupSelector profileId={contact.id} />;
      case 'enrich':
        return <ContactEnrichment profileId={contact.id} profileName={contactName} linkedinUrl={contact.linkedin_url} />;
      case 'team-notes':
        return <ContactCommentsPanel profileId={contact.id} profileName={contactName} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout title={contactName} showQuickCapture captureProfileId={contact.id}>
      {/* Breadcrumb with category indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/contacts" className="hover:text-foreground transition-colors">Contacts</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{contactName}</span>
        {activeCategory && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Badge variant="outline" className={cn("text-xs", activeCategory.color)}>
              {activeCategory.label}
            </Badge>
          </>
        )}
      </div>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg sm:text-xl shrink-0">
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover" />
                ) : (
                  <>{contact.first_name?.[0]}{contact.last_name?.[0]}</>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 flex-wrap">
                  <span className="truncate">{contact.first_name} {contact.last_name}</span>
                  {contact.nickname && <span className="text-muted-foreground font-normal text-sm">({contact.nickname})</span>}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {contact.relationship_type && (() => {
                    const display = formatRelationshipDisplay(
                      contact.relationship_type,
                      contact.relationship_subtype || null,
                      contact.hierarchy_level || null
                    );
                    return (
                      <>
                        <Badge className={relationshipColors[contact.relationship_type]}>
                          {display.primary}
                        </Badge>
                        {display.secondary && (
                          <Badge variant="outline" className="hidden sm:inline-flex">
                            {display.secondary}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                  <ContactStorageBadge profileId={contact.id} />
                  {contact.organization && (
                    <span className="text-sm text-muted-foreground hidden md:inline">{contact.organization}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Button 
                variant={(contact as any).is_self_profile ? "default" : "outline"} 
                size="sm"
                className="hidden sm:flex"
                onClick={async () => {
                  if (!(contact as any).is_self_profile) {
                    await supabase
                      .from('profiles')
                      .update({ is_self_profile: false })
                      .eq('user_id', user!.id)
                      .eq('is_self_profile', true);
                  }
                  await supabase
                    .from('profiles')
                    .update({ is_self_profile: !(contact as any).is_self_profile })
                    .eq('id', id);
                  queryClient.invalidateQueries({ queryKey: ['contact', id] });
                  queryClient.invalidateQueries({ queryKey: ['contacts'] });
                  queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
                  toast({ 
                    title: (contact as any).is_self_profile 
                      ? 'Removed "This is me" marker' 
                      : 'Marked as "This is me"' 
                  });
                }}
                title="Mark this contact as yourself for family tree anchoring"
              >
                <UserCheck className={`h-4 w-4 mr-1 ${(contact as any).is_self_profile ? '' : 'opacity-50'}`} />
                {(contact as any).is_self_profile ? 'This is me' : 'Set as me'}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsEmailDialogOpen(true)}
                title="Send Email"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => toggleFavoriteMutation.mutate()}>
                <Star className={`h-5 w-5 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              <ShareContactDialog profileId={contact.id} profileName={contactName} />
              <Button variant={showAIPanel ? "default" : "outline"} size="icon" onClick={() => setShowAIPanel(!showAIPanel)} title="AI Insights" className="hidden lg:flex">
                <Brain className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this contact?')) {
                    deleteMutation.mutate();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Navigation */}
      <ContactDetailMobileNav 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main Layout */}
      <div className={cn(
        "grid gap-6 mt-4 lg:mt-0",
        showAIPanel 
          ? "lg:grid-cols-[220px_1fr_380px] xl:grid-cols-[240px_1fr_420px]" 
          : "lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]"
      )}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ContactDetailSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-1 min-w-0">
          {renderContent()}
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <DeepIntelligencePanel profileId={contact.id} profileName={contactName} />
            </div>
          </div>
        )}
      </div>

      {/* Section Search Dialog */}
      <ContactSectionSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        contactId={id}
      />

      <ContactDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contact={contact}
      />

      <ComposeEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        defaultTo={contactMethods?.find(m => m.contact_type === 'email')?.value || ''}
        profileId={contact.id}
        profileName={contactName}
      />
    </AppLayout>
  );
}
