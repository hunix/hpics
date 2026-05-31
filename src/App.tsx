import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundaryWithRecovery } from "@/components/ErrorBoundaryWithRecovery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { AIConfirmationProvider } from "@/contexts/AIConfirmationContext";
import { GlobalShortcutsProvider } from "@/components/providers/GlobalShortcutsProvider";
import { AIBudgetWarning } from "@/components/ai/AIBudgetWarning";
import { FullPageLoader } from "@/components/ui/LoadingSpinner";
import { lazyWithRetry } from "@/lib/chunkErrorHandler";
import { SessionTimeoutProvider } from "@/components/providers/SessionTimeoutProvider";
import { DIProvider } from "@/infrastructure/di/DIContext";

// ALL pages lazy-loaded for optimal initial bundle size.
// Index uses forwardRef so its default export doesn't match the
// `ComponentType<unknown>` generic on lazyWithRetry; cast at the import.
const Index = lazyWithRetry(() => import("./pages/Index") as unknown as Promise<{ default: React.ComponentType<unknown> }>);
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Contacts = lazyWithRetry(() => import("./pages/Contacts"));
const ContactDetail = lazyWithRetry(() => import("./pages/ContactDetail"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

// Lazy loaded pages with retry for deployment resilience
const ConversationDetail = lazyWithRetry(() => import("./pages/ConversationDetail"));
const Communications = lazyWithRetry(() => import("./pages/Communications"));
const Documents = lazyWithRetry(() => import("./pages/Documents"));
const MediaPage = lazyWithRetry(() => import("./pages/Media"));
const Events = lazyWithRetry(() => import("./pages/Events"));
const Insights = lazyWithRetry(() => import("./pages/Insights"));
const Import = lazyWithRetry(() => import("./pages/Import"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const Network = lazyWithRetry(() => import("./pages/Network"));
const Calendar = lazyWithRetry(() => import("./pages/Calendar"));
const VideoAnalysis = lazyWithRetry(() => import("./pages/VideoAnalysis"));
const MediaAnalysis = lazyWithRetry(() => import("./pages/MediaAnalysis"));
const BulkAnalysisDashboard = lazyWithRetry(() => import("./pages/BulkAnalysisDashboard"));
const Reports = lazyWithRetry(() => import("./pages/Reports"));
const DossierIntelligence = lazyWithRetry(() => import("./pages/DossierIntelligence"));
const DossierPreview = lazyWithRetry(() => import("./pages/DossierPreview"));
const TeamDashboard = lazyWithRetry(() => import("./pages/TeamDashboard"));
const Install = lazyWithRetry(() => import("./pages/Install"));
const Downloads = lazyWithRetry(() => import("./pages/Downloads"));
const Security = lazyWithRetry(() => import("./pages/Security"));
const NetworkIntelligence = lazyWithRetry(() => import("./pages/NetworkIntelligence"));
const SemanticSearchPage = lazyWithRetry(() => import("./pages/SemanticSearchPage"));
const CounterIntelligence = lazyWithRetry(() => import("./pages/CounterIntelligence"));
const SystemHealthPage = lazyWithRetry(() => import("./pages/SystemHealthPage"));
const CrossModalIntelligencePage = lazyWithRetry(() => import("./pages/CrossModalIntelligencePage"));
const AdvancedNetworkPage = lazyWithRetry(() => import("./pages/AdvancedNetworkPage"));
const AICostCenterPage = lazyWithRetry(() => import("./pages/AICostCenterPage"));
const IntelligenceCenter = lazyWithRetry(() => import("./pages/IntelligenceCenter"));
const IntelligenceCommandCenter = lazyWithRetry(() => import("./pages/IntelligenceCommandCenter"));
const AIChat = lazyWithRetry(() => import("./pages/AIChat"));
const ShareReceive = lazyWithRetry(() => import("./pages/ShareReceive"));
const CommandCenter = lazyWithRetry(() => import("./pages/CommandCenter"));
const CapabilitiesExplorer = lazyWithRetry(() => import("./pages/CapabilitiesExplorer"));
const MobileEcosystemPage = lazyWithRetry(() => import("./pages/MobileEcosystemPage"));
const UltimateCommandCenter = lazyWithRetry(() => import("./pages/UltimateCommandCenter"));
const SocialIntelligenceDashboard = lazyWithRetry(() => import("./pages/SocialIntelligenceDashboard"));
const Superiority = lazyWithRetry(() => import("./pages/Superiority"));
const InvestmentIntelligence = lazyWithRetry(() => import("./pages/InvestmentIntelligence"));
const PsychologyIntelligence = lazyWithRetry(() => import("./pages/PsychologyIntelligence"));
const DeceptionAnalysis = lazyWithRetry(() => import("./pages/DeceptionAnalysis"));
const BiometricHub = lazyWithRetry(() => import("./pages/BiometricHub"));
const HardwareCommand = lazyWithRetry(() => import("./pages/HardwareCommand"));
const WarfarePage = lazyWithRetry(() => import("./pages/WarfarePage"));
const AGISCommandCenter = lazyWithRetry(() => import("./pages/AGISCommandCenter"));
const AGISAnalytics = lazyWithRetry(() => import("./pages/AGISAnalytics"));
const AICostDashboard = lazyWithRetry(() => import("./pages/AICostDashboard"));
const CrossModalAnalysis = lazyWithRetry(() => import("./pages/CrossModalAnalysis"));
const ComprehensiveSystemHealthDashboard = lazyWithRetry(() => import("./pages/ComprehensiveSystemHealthDashboard"));
const FusionCommandCenter = lazyWithRetry(() => import("./pages/FusionCommandCenter"));
const PlatformConfiguration = lazyWithRetry(() => import("./pages/PlatformConfiguration"));
const AgentIntelligenceConfig = lazyWithRetry(() => import("./pages/AgentIntelligenceConfig"));
const DatabaseMaintenance = lazyWithRetry(() => import("./pages/DatabaseMaintenance"));
const DataCollectionGuide = lazyWithRetry(() => import("./pages/DataCollectionGuide"));
const EnhancementSuite = lazyWithRetry(() => import("./pages/EnhancementSuite"));
const MemoryExplorer = lazyWithRetry(() => import("./pages/MemoryExplorer"));
const AgentConsole = lazyWithRetry(() => import("./pages/AgentConsole"));
const IntelAgent = lazyWithRetry(() => import("./pages/IntelAgent"));
const IntelligenceFeed = lazyWithRetry(() => import("./pages/IntelligenceFeed"));
const BiometricStudio = lazyWithRetry(() => import("./pages/BiometricStudio"));
const AutonomyDashboard = lazyWithRetry(() => import("./pages/AutonomyDashboard"));
const HocIntegration = lazyWithRetry(() => import("./pages/HocIntegration"));
const AndroidDataSyncPage = lazyWithRetry(() => import("./pages/AndroidDataSyncPage"));
const IntegrationsSetupPage = lazyWithRetry(() => import("./pages/IntegrationsSetupPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 3, // Retry failed queries up to 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: 'always', // Refetch when user returns to tab (better UX)
      refetchOnReconnect: 'always', // Refetch when network reconnects
      networkMode: 'offlineFirst', // Support offline-first pattern
    },
    mutations: {
      retry: 2, // Retry failed mutations twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'offlineFirst',
      onError: (error) => {
        console.error('[React Query] Mutation failed:', error);
      },
    },
  },
});

const App = () => (
  <ErrorBoundaryWithRecovery>
    <QueryClientProvider client={queryClient}>
      <DIProvider>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <RealtimeProvider>
                <AIConfirmationProvider>
                  <SessionTimeoutProvider timeoutMinutes={30} warningMinutes={5}>
                    <Toaster />
                    <Sonner />
                    <AIBudgetWarning />
                  <BrowserRouter>
                    <GlobalShortcutsProvider>
                      <Suspense fallback={<FullPageLoader />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/contacts" element={<Contacts />} />
                          <Route path="/contacts/:id" element={<ContactDetail />} />
                          <Route path="/contacts/:contactId/conversations/:conversationId" element={<ConversationDetail />} />
                          <Route path="/communications" element={<Communications />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/media" element={<MediaPage />} />
                          <Route path="/events" element={<Events />} />
                          <Route path="/insights" element={<Insights />} />
                          <Route path="/import" element={<Import />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/network" element={<Network />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route path="/video-analysis" element={<VideoAnalysis />} />
                          <Route path="/analysis" element={<MediaAnalysis />} />
                          <Route path="/analysis/dashboard" element={<BulkAnalysisDashboard />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/dossier-intelligence" element={<DossierIntelligence />} />
                          <Route path="/dossier-preview/:profileId" element={<DossierPreview />} />
                          <Route path="/team" element={<TeamDashboard />} />
                          <Route path="/install" element={<Install />} />
                          <Route path="/downloads" element={<Downloads />} />
                          <Route path="/security" element={<Security />} />
                          <Route path="/network-intelligence" element={<NetworkIntelligence />} />
                          <Route path="/semantic-search" element={<SemanticSearchPage />} />
                          <Route path="/counter-intelligence" element={<CounterIntelligence />} />
                          <Route path="/system-health" element={<SystemHealthPage />} />
                          <Route path="/cross-modal-intelligence" element={<CrossModalIntelligencePage />} />
                          <Route path="/network-advanced" element={<AdvancedNetworkPage />} />
                          <Route path="/ai-costs" element={<AICostCenterPage />} />
                          <Route path="/intelligence" element={<IntelligenceCenter />} />
                          <Route path="/intelligence/command-center" element={<IntelligenceCommandCenter />} />
                          <Route path="/ai-chat" element={<AIChat />} />
                          <Route path="/data-guide" element={<DataCollectionGuide />} />
                          <Route path="/share-receive" element={<ShareReceive />} />
                          <Route path="/command-center" element={<CommandCenter />} />
                          <Route path="/capabilities" element={<CapabilitiesExplorer />} />
                          <Route path="/mobile/ecosystem" element={<MobileEcosystemPage />} />
                          <Route path="/ultimate-command" element={<UltimateCommandCenter />} />
                          <Route path="/social-intelligence" element={<SocialIntelligenceDashboard />} />
                          <Route path="/superiority" element={<Superiority />} />
                          <Route path="/investment-intelligence" element={<InvestmentIntelligence />} />
                          <Route path="/psychology-intelligence" element={<PsychologyIntelligence />} />
                          <Route path="/deception-analysis" element={<DeceptionAnalysis />} />
                          <Route path="/biometric-hub" element={<BiometricHub />} />
                          <Route path="/hardware-command" element={<HardwareCommand />} />
                          <Route path="/defense-grid" element={<WarfarePage />} />
                          <Route path="/agis-command" element={<AGISCommandCenter />} />
                          <Route path="/agis-analytics" element={<AGISAnalytics />} />
                          <Route path="/ai-cost-dashboard" element={<AICostDashboard />} />
                          <Route path="/cross-modal-analysis" element={<CrossModalAnalysis />} />
                          <Route path="/system-health-dashboard" element={<ComprehensiveSystemHealthDashboard />} />
                          <Route path="/fusion-command" element={<FusionCommandCenter />} />
                          <Route path="/platform-config" element={<PlatformConfiguration />} />
                          <Route path="/agent-intelligence" element={<AgentIntelligenceConfig />} />
                          <Route path="/maintenance" element={<DatabaseMaintenance />} />
                          <Route path="/enhancement-suite" element={<EnhancementSuite />} />
                          <Route path="/memory-explorer" element={<MemoryExplorer />} />
                           <Route path="/agent-console" element={<AgentConsole />} />
                           <Route path="/intel-agent" element={<IntelAgent />} />
                           <Route path="/intelligence-feed" element={<IntelligenceFeed />} />
                           <Route path="/biometric-studio" element={<BiometricStudio />} />
                           <Route path="/autonomy" element={<AutonomyDashboard />} />
                           <Route path="/hoc-integration" element={<HocIntegration />} />
                           <Route path="/android-sync" element={<AndroidDataSyncPage />} />
                           <Route path="/integrations" element={<IntegrationsSetupPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </GlobalShortcutsProvider>
                  </BrowserRouter>
                  </SessionTimeoutProvider>
                </AIConfirmationProvider>
              </RealtimeProvider>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </DIProvider>
    </QueryClientProvider>
  </ErrorBoundaryWithRecovery>
);

export default App;
