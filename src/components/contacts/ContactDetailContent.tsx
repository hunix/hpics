import { Separator } from '@/components/ui/separator';
import { type SectionId } from '@/lib/contactDetailCategories';
import type { Tables } from '@/integrations/supabase/types';

// Lazy imports for code splitting
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Core sections (eagerly loaded for fast initial render)
import { ExtendedOverview } from '@/components/contacts/ExtendedOverview';
import { ExtendedInfoSection } from '@/components/contacts/ExtendedInfoSection';
import { ContactMethodsManager } from '@/components/contacts/ContactMethodsManager';
import { ProfileCompletenessWidget } from '@/components/contacts/ProfileCompletenessWidget';

// Lazy-loaded sections for better performance
const ContactDocumentsManager = lazy(() => import('@/components/contacts/ContactDocumentsManager').then(m => ({ default: m.ContactDocumentsManager })));
const ContactMediaManager = lazy(() => import('@/components/contacts/ContactMediaManager').then(m => ({ default: m.ContactMediaManager })));
const RecordingsManager = lazy(() => import('@/components/recordings/RecordingsManager').then(m => ({ default: m.RecordingsManager })));
const VoiceNotesManager = lazy(() => import('@/components/contacts/VoiceNotesManager').then(m => ({ default: m.VoiceNotesManager })));
const UnifiedIntelligencePanel = lazy(() => import('@/components/intelligence/UnifiedIntelligencePanel').then(m => ({ default: m.UnifiedIntelligencePanel })));
const LifeMilestonesManager = lazy(() => import('@/components/contacts/LifeMilestonesManager').then(m => ({ default: m.LifeMilestonesManager })));
const CommunicationPreferencesManager = lazy(() => import('@/components/contacts/CommunicationPreferencesManager').then(m => ({ default: m.CommunicationPreferencesManager })));
const InteractionNotesManager = lazy(() => import('@/components/contacts/InteractionNotesManager').then(m => ({ default: m.InteractionNotesManager })));
const ContactPlaybook = lazy(() => import('@/components/contacts/ContactPlaybook').then(m => ({ default: m.ContactPlaybook })));
const InfluenceDashboard = lazy(() => import('@/components/intelligence/InfluenceDashboard').then(m => ({ default: m.InfluenceDashboard })));
const BehavioralAnalysis = lazy(() => import('@/components/analysis/BehavioralAnalysis').then(m => ({ default: m.BehavioralAnalysis })));
const FacialAnalysis = lazy(() => import('@/components/analysis/FacialAnalysis').then(m => ({ default: m.FacialAnalysis })));
const BodyLanguageAnalysis = lazy(() => import('@/components/analysis/BodyLanguageAnalysis').then(m => ({ default: m.BodyLanguageAnalysis })));
const VocalAnalysis = lazy(() => import('@/components/analysis/VocalAnalysis').then(m => ({ default: m.VocalAnalysis })));
const AnalysisComparison = lazy(() => import('@/components/analysis/AnalysisComparison').then(m => ({ default: m.AnalysisComparison })));
const CrossModalSynthesisPanel = lazy(() => import('@/components/intelligence/CrossModalSynthesisPanel').then(m => ({ default: m.CrossModalSynthesisPanel })));
const DetectedItemsManager = lazy(() => import('@/components/intelligence/DetectedItemsManager').then(m => ({ default: m.DetectedItemsManager })));
const UnknownPersonsQueue = lazy(() => import('@/components/intelligence/UnknownPersonsQueue').then(m => ({ default: m.UnknownPersonsQueue })));
const DocumentIntelligencePanel = lazy(() => import('@/components/intelligence/DocumentIntelligencePanel').then(m => ({ default: m.DocumentIntelligencePanel })));
const VoiceInsightsPanel = lazy(() => import('@/components/ai/VoiceInsightsPanel').then(m => ({ default: m.VoiceInsightsPanel })));
const DocumentInsightsPanel = lazy(() => import('@/components/ai/DocumentInsightsPanel').then(m => ({ default: m.DocumentInsightsPanel })));
const ContentRelationshipsGraph = lazy(() => import('@/components/ai/ContentRelationshipsGraph').then(m => ({ default: m.ContentRelationshipsGraph })));
const KeywordWatchlistManager = lazy(() => import('@/components/ai/KeywordWatchlistManager').then(m => ({ default: m.KeywordWatchlistManager })));
const BiometricSignatureBuilder = lazy(() => import('@/components/contacts/BiometricSignatureBuilder').then(m => ({ default: m.BiometricSignatureBuilder })));
const OptimalOutreach = lazy(() => import('@/components/contacts/OptimalOutreach').then(m => ({ default: m.OptimalOutreach })));
const MessageTemplates = lazy(() => import('@/components/contacts/MessageTemplates').then(m => ({ default: m.MessageTemplates })));
const WhatsAppChat = lazy(() => import('@/components/whatsapp/WhatsAppChat').then(m => ({ default: m.WhatsAppChat })));
const ContactEmailThreads = lazy(() => import('@/components/contacts/ContactEmailThreads').then(m => ({ default: m.ContactEmailThreads })));
const MeetingBriefing = lazy(() => import('@/components/contacts/MeetingBriefing').then(m => ({ default: m.MeetingBriefing })));
const ObservationsManager = lazy(() => import('@/components/contacts/ObservationsManager').then(m => ({ default: m.ObservationsManager })));
const TrustAssessmentPanel = lazy(() => import('@/components/intelligence/TrustAssessmentPanel').then(m => ({ default: m.TrustAssessmentPanel })));
const ThreatAssessmentTab = lazy(() => import('@/components/intelligence/ThreatAssessmentTab').then(m => ({ default: m.ThreatAssessmentTab })));
const OSINTPanel = lazy(() => import('@/components/intelligence/OSINTPanel').then(m => ({ default: m.OSINTPanel })));
const InferredConnectionsPanel = lazy(() => import('@/components/intelligence/InferredConnectionsPanel').then(m => ({ default: m.InferredConnectionsPanel })));
const BehavioralPredictionsPanel = lazy(() => import('@/components/intelligence/BehavioralPredictionsPanel').then(m => ({ default: m.BehavioralPredictionsPanel })));
const DossierGenerator = lazy(() => import('@/components/intelligence/DossierGenerator').then(m => ({ default: m.DossierGenerator })));
const NetworkIntelligencePanel = lazy(() => import('@/components/intelligence/NetworkIntelligencePanel').then(m => ({ default: m.NetworkIntelligencePanel })));
const TemporalAnalysisPanel = lazy(() => import('@/components/intelligence/TemporalAnalysisPanel').then(m => ({ default: m.TemporalAnalysisPanel })));
const RelationshipTrajectoryPanel = lazy(() => import('@/components/intelligence/RelationshipTrajectoryPanel').then(m => ({ default: m.RelationshipTrajectoryPanel })));
const CommunicationTriangulationPanel = lazy(() => import('@/components/intelligence/CommunicationTriangulationPanel').then(m => ({ default: m.CommunicationTriangulationPanel })));
const DeceptionAnalysisPanel = lazy(() => import('@/components/intelligence/DeceptionAnalysisPanel').then(m => ({ default: m.DeceptionAnalysisPanel })));
const LocationIntelligencePanel = lazy(() => import('@/components/intelligence/LocationIntelligencePanel').then(m => ({ default: m.LocationIntelligencePanel })));
const InterestsManager = lazy(() => import('@/components/contacts/InterestsManager').then(m => ({ default: m.InterestsManager })));
const GiftSuggestions = lazy(() => import('@/components/contacts/GiftSuggestions').then(m => ({ default: m.GiftSuggestions })));
const RelationshipGoals = lazy(() => import('@/components/contacts/RelationshipGoals').then(m => ({ default: m.RelationshipGoals })));
const SharedExperiences = lazy(() => import('@/components/contacts/SharedExperiences').then(m => ({ default: m.SharedExperiences })));
const SharedExperiencesPanel = lazy(() => import('@/components/intelligence/SharedExperiencesPanel').then(m => ({ default: m.SharedExperiencesPanel })));
const ContactRelationshipsManager = lazy(() => import('@/components/contacts/ContactRelationshipsManager').then(m => ({ default: m.ContactRelationshipsManager })));
const KidsSchoolsManager = lazy(() => import('@/components/contacts/KidsSchoolsManager').then(m => ({ default: m.KidsSchoolsManager })));
const EducationManager = lazy(() => import('@/components/contacts/EducationManager').then(m => ({ default: m.EducationManager })));
const CertificationsManager = lazy(() => import('@/components/contacts/CertificationsManager').then(m => ({ default: m.CertificationsManager })));
const SkillsManager = lazy(() => import('@/components/contacts/SkillsManager').then(m => ({ default: m.SkillsManager })));
const ConversationsManager = lazy(() => import('@/components/conversations/ConversationsManager').then(m => ({ default: m.ConversationsManager })));
const BankAccountsManager = lazy(() => import('@/components/contacts/BankAccountsManager').then(m => ({ default: m.BankAccountsManager })));
const PaymentAccountsManager = lazy(() => import('@/components/contacts/PaymentAccountsManager').then(m => ({ default: m.PaymentAccountsManager })));
const FinancialHistoryManager = lazy(() => import('@/components/contacts/FinancialHistoryManager').then(m => ({ default: m.FinancialHistoryManager })));
const ContactTimeline = lazy(() => import('@/components/contacts/ContactTimeline').then(m => ({ default: m.ContactTimeline })));
const ContactActivityHistory = lazy(() => import('@/components/contacts/ContactActivityHistory').then(m => ({ default: m.ContactActivityHistory })));
const ContactGroupSelector = lazy(() => import('@/components/contacts/ContactGroupSelector').then(m => ({ default: m.ContactGroupSelector })));
const ContactEnrichment = lazy(() => import('@/components/contacts/ContactEnrichment').then(m => ({ default: m.ContactEnrichment })));
const ContactCommentsPanel = lazy(() => import('@/components/collaboration/ContactCommentsPanel').then(m => ({ default: m.ContactCommentsPanel })));
const PreferencePredictionsPanel = lazy(() => import('@/components/intelligence/PreferencePredictionsPanel').then(m => ({ default: m.PreferencePredictionsPanel })));

// Psychology & Deception Intelligence
const DarkPsychologyDashboard = lazy(() => import('@/components/intelligence/DarkPsychologyDashboard').then(m => ({ default: m.DarkPsychologyDashboard })));
const DeceptionDetectionConsole = lazy(() => import('@/components/intelligence/DeceptionDetectionConsole').then(m => ({ default: m.DeceptionDetectionConsole })));
const MicroExpressionTimeline = lazy(() => import('@/components/intelligence/MicroExpressionTimeline').then(m => ({ default: m.MicroExpressionTimeline })));
const VoiceStressPanel = lazy(() => import('@/components/intelligence/VoiceStressPanel').then(m => ({ default: m.VoiceStressPanel })));
const InfluencePlaybookPanel = lazy(() => import('@/components/intelligence/InfluencePlaybookPanel').then(m => ({ default: m.InfluencePlaybookPanel })));

// Keystroke Enrollment
const KeystrokeEnrollment = lazy(() => import('@/components/contacts/enrollment/KeystrokeEnrollment').then(m => ({ default: m.KeystrokeEnrollment })));

// AGIS Phase 2 Panels
const AttachmentVulnerabilityPanel = lazy(() => import('@/components/intelligence/AttachmentVulnerabilityPanel').then(m => ({ default: m.AttachmentVulnerabilityPanel })));
const ChronotypePanel = lazy(() => import('@/components/intelligence/ChronotypePanel').then(m => ({ default: m.ChronotypePanel })));
const TacticalNegotiationPanel = lazy(() => import('@/components/intelligence/TacticalNegotiationPanel').then(m => ({ default: m.TacticalNegotiationPanel })));
const LifeTrajectoryPanel = lazy(() => import('@/components/intelligence/LifeTrajectoryPanel').then(m => ({ default: m.LifeTrajectoryPanel })));
const BehavioralEconomicsPanel = lazy(() => import('@/components/intelligence/BehavioralEconomicsPanel').then(m => ({ default: m.BehavioralEconomicsPanel })));
const FamilySystemsPanel = lazy(() => import('@/components/intelligence/FamilySystemsPanel').then(m => ({ default: m.FamilySystemsPanel })));

// AGIS Phase 3 Panels
const SemanticWarfarePanel = lazy(() => import('@/components/intelligence/warfare/SemanticWarfarePanel').then(m => ({ default: m.SemanticWarfarePanel })));
const MICERecruitmentPanel = lazy(() => import('@/components/intelligence/warfare/MICERecruitmentPanel').then(m => ({ default: m.MICERecruitmentPanel })));
const BetrayalRiskPanel = lazy(() => import('@/components/intelligence/warfare/BetrayalRiskPanel').then(m => ({ default: m.BetrayalRiskPanel })));
const SacredValuesPanel = lazy(() => import('@/components/intelligence/warfare/SacredValuesPanel').then(m => ({ default: m.SacredValuesPanel })));
const MemeticEngineeringPanel = lazy(() => import('@/components/intelligence/warfare/MemeticEngineeringPanel').then(m => ({ default: m.MemeticEngineeringPanel })));
const SyntheticConsensusPanel = lazy(() => import('@/components/intelligence/warfare/SyntheticConsensusPanel').then(m => ({ default: m.SyntheticConsensusPanel })));
const ElicitationPanel = lazy(() => import('@/components/intelligence/warfare/ElicitationPanel').then(m => ({ default: m.ElicitationPanel })));

type Profile = Tables<'profiles'>;

interface ContactDetailContentProps {
  activeSection: SectionId;
  contact: Profile;
  contactName: string;
  contactMethods?: any[];
}

function SectionLoader() {
  return <Skeleton className="h-64 w-full" />;
}

export function ContactDetailContent({
  activeSection,
  contact,
  contactName,
  contactMethods = [],
}: ContactDetailContentProps) {
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
        return <ContactMethodsManager profileId={contact.id} contactMethods={contactMethods} />;
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
        return (
          <div className="space-y-6">
            <BehavioralPredictionsPanel profileId={contact.id} contactName={contactName} />
            <PreferencePredictionsPanel profileId={contact.id} profileName={contactName} />
          </div>
        );
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
      case 'psychology':
        return (
          <div className="space-y-6">
            <DarkPsychologyDashboard profileId={contact.id} profileName={contactName} />
            <InfluencePlaybookPanel profileId={contact.id} profileName={contactName} />
          </div>
        );
      case 'deception':
        return (
          <div className="space-y-6">
            <DeceptionDetectionConsole profileId={contact.id} profileName={contactName} />
            <MicroExpressionTimeline events={[]} />
            <VoiceStressPanel audioSegments={[]} />
          </div>
        );
      case 'keystroke-enrollment':
        return <KeystrokeEnrollment profileId={contact.id} profileName={contactName} />;
      // AGIS Phase 2 Sections
      case 'agis-attachment':
        return <AttachmentVulnerabilityPanel profileId={contact.id} />;
      case 'agis-chronotype':
        return <ChronotypePanel profileId={contact.id} />;
      case 'agis-negotiation':
        return <TacticalNegotiationPanel profileId={contact.id} />;
      case 'agis-trajectory':
        return <LifeTrajectoryPanel profileId={contact.id} />;
      case 'agis-economics':
        return <BehavioralEconomicsPanel profileId={contact.id} />;
      case 'agis-family':
        return <FamilySystemsPanel profileId={contact.id} />;
      // AGIS Phase 3 Sections
      case 'agis-semantic-warfare':
        return <SemanticWarfarePanel profileId={contact.id} />;
      case 'agis-mice-recruitment':
        return <MICERecruitmentPanel profileId={contact.id} />;
      case 'agis-betrayal-risk':
        return <BetrayalRiskPanel profileId={contact.id} />;
      case 'agis-sacred-values':
        return <SacredValuesPanel profileId={contact.id} />;
      case 'agis-memetic':
        return <MemeticEngineeringPanel profileId={contact.id} />;
      case 'agis-consensus':
        return <SyntheticConsensusPanel profileId={contact.id} />;
      case 'agis-elicitation':
        return <ElicitationPanel profileId={contact.id} profileName={contactName} />;
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<SectionLoader />}>
      {renderContent()}
    </Suspense>
  );
}
