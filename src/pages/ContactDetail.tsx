import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, Edit, Trash2, Star, Brain, 
  User, MessageSquare, Briefcase, GraduationCap,
  FileText, Image, Target, Gift, Heart, Clock,
  Calendar, Sparkles, Users, ChevronRight, Building,
  Mic, Eye, Activity, Volume2, UserCircle, GitCompare, Wallet, Link2, Mail, UserCheck
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
import { cn } from '@/lib/utils';
import { formatRelationshipDisplay } from '@/lib/relationshipLabels';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { relationship_subtype?: string; hierarchy_level?: string };

type SectionId = 
  | 'overview' | 'personal-info' | 'contact' | 'documents' | 'media' | 'recordings'
  | 'outreach' | 'templates' | 'briefing' | 'whatsapp' | 'emails'
  | 'interests' | 'gifts' | 'goals' | 'experiences' | 'relationships' | 'kids-schools'
  | 'education' | 'messages' | 'timeline' | 'groups' | 'enrich'
  | 'behavioral' | 'facial' | 'body-language' | 'vocal' | 'comparison'
  | 'financial' | 'observations';

interface NavSection {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  group: string;
}

const sections: NavSection[] = [
  { id: 'overview', label: 'Overview', icon: User, group: 'General' },
  { id: 'personal-info', label: 'Extended Info', icon: UserCircle, group: 'General' },
  { id: 'contact', label: 'Contact Methods', icon: MessageSquare, group: 'General' },
  { id: 'documents', label: 'Documents', icon: FileText, group: 'Files' },
  { id: 'media', label: 'Media', icon: Image, group: 'Files' },
  { id: 'recordings', label: 'Recordings', icon: Mic, group: 'Files' },
  { id: 'outreach', label: 'Outreach Timing', icon: Clock, group: 'Communication' },
  { id: 'templates', label: 'Message Templates', icon: Sparkles, group: 'Communication' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, group: 'Communication' },
  { id: 'emails', label: 'Emails', icon: Mail, group: 'Communication' },
  { id: 'messages', label: 'Conversations', icon: MessageSquare, group: 'Communication' },
  { id: 'briefing', label: 'Meeting Briefing', icon: Calendar, group: 'AI Insights' },
  { id: 'observations', label: 'My Observations', icon: Eye, group: 'AI Insights' },
  { id: 'behavioral', label: 'Behavioral', icon: Brain, group: 'Analysis' },
  { id: 'facial', label: 'Facial/Micro-Expressions', icon: Eye, group: 'Analysis' },
  { id: 'body-language', label: 'Body Language', icon: Activity, group: 'Analysis' },
  { id: 'vocal', label: 'Vocal Analysis', icon: Volume2, group: 'Analysis' },
  { id: 'comparison', label: 'Compare Over Time', icon: GitCompare, group: 'Analysis' },
  { id: 'interests', label: 'Interests', icon: Heart, group: 'Relationship' },
  { id: 'gifts', label: 'Gifts', icon: Gift, group: 'Relationship' },
  { id: 'goals', label: 'Goals', icon: Target, group: 'Relationship' },
  { id: 'experiences', label: 'Experiences', icon: Heart, group: 'Relationship' },
  { id: 'relationships', label: 'Family & Connections', icon: Link2, group: 'Family' },
  { id: 'kids-schools', label: 'Kids Schools', icon: GraduationCap, group: 'Family' },
  { id: 'education', label: 'Education & Skills', icon: GraduationCap, group: 'Professional' },
  { id: 'financial', label: 'Financial', icon: Wallet, group: 'Financial' },
  { id: 'timeline', label: 'Timeline', icon: Clock, group: 'History' },
  { id: 'groups', label: 'Groups', icon: Users, group: 'Tools' },
  { id: 'enrich', label: 'Enrichment', icon: Sparkles, group: 'Tools' },
];

const groupOrder = ['General', 'Files', 'Communication', 'AI Insights', 'Analysis', 'Relationship', 'Family', 'Professional', 'Financial', 'History', 'Tools'];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

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

  if (isLoading) {
    return (
      <AppLayout title="Contact">
        <div className="flex gap-6">
          <div className="w-64 space-y-4">
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

  // Group sections by group
  const groupedSections = groupOrder.map(group => ({
    group,
    items: sections.filter(s => s.group === group)
  }));

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <ExtendedOverview profileId={contact.id} profile={contact} />;
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
      case 'interests':
        return <InterestsManager profileId={contact.id} contactName={contactName} />;
      case 'gifts':
        return <GiftSuggestions profileId={contact.id} contactName={contactName} />;
      case 'goals':
        return <RelationshipGoals profileId={contact.id} contactName={contactName} />;
      case 'experiences':
        return <SharedExperiences profileId={contact.id} contactName={contactName} />;
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
      case 'groups':
        return <ContactGroupSelector profileId={contact.id} />;
      case 'enrich':
        return <ContactEnrichment profileId={contact.id} profileName={contactName} linkedinUrl={contact.linkedin_url} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout title={contactName}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/contacts" className="hover:text-foreground transition-colors">Contacts</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{contactName}</span>
      </div>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shrink-0">
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <>{contact.first_name?.[0]}{contact.last_name?.[0]}</>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {contact.first_name} {contact.last_name}
                  {contact.nickname && <span className="text-muted-foreground font-normal">({contact.nickname})</span>}
                </h1>
                <div className="flex items-center gap-2 mt-1">
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
                          <Badge variant="outline">
                            {display.secondary}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                  <ContactStorageBadge profileId={contact.id} />
                  {contact.organization && (
                    <span className="text-sm text-muted-foreground">{contact.organization}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={(contact as any).is_self_profile ? "default" : "outline"} 
                size="sm"
                onClick={async () => {
                  // Clear any existing self profile first
                  if (!(contact as any).is_self_profile) {
                    await supabase
                      .from('profiles')
                      .update({ is_self_profile: false })
                      .eq('user_id', user!.id)
                      .eq('is_self_profile', true);
                  }
                  // Toggle this profile
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
              <Button variant="ghost" size="icon" onClick={() => toggleFavoriteMutation.mutate()}>
                <Star className={`h-5 w-5 ${contact.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              <Button variant={showAIPanel ? "default" : "outline"} size="icon" onClick={() => setShowAIPanel(!showAIPanel)} title="AI Insights">
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

      {/* Main Layout */}
      <div className={cn("grid gap-6", showAIPanel ? "lg:grid-cols-[240px_1fr_400px] xl:grid-cols-[240px_1fr_450px]" : "lg:grid-cols-[240px_1fr]")}>
        {/* Sidebar */}
        <div className="hidden lg:block">
          <Card className="sticky top-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="p-4 space-y-4">
                {groupedSections.map(({ group, items }) => (
                  items.length > 0 && (
                    <div key={group}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                        {group}
                      </h3>
                      <div className="space-y-1">
                        {items.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                              activeSection === section.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <section.icon className="h-4 w-4" />
                            {section.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Mobile Section Selector */}
        <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className="whitespace-nowrap"
              >
                <section.icon className="h-4 w-4 mr-1" />
                {section.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-1">
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

      <ContactDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contact={contact}
      />
    </AppLayout>
  );
}
