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

// Eagerly loaded core pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import NotFound from "./pages/NotFound";

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
const Supremacy = lazyWithRetry(() => import("./pages/Supremacy"));
const SupremacyV2 = lazyWithRetry(() => import("./pages/SupremacyV2Page"));
const CognitiveWarfare = lazyWithRetry(() => import("./pages/CognitiveWarfarePage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundaryWithRecovery>
    <QueryClientProvider client={queryClient}>
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
                        <Route path="/supremacy" element={<Supremacy />} />
                        <Route path="/supremacy-v2" element={<SupremacyV2 />} />
                        <Route path="/cognitive-warfare" element={<CognitiveWarfare />} />
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
    </QueryClientProvider>
  </ErrorBoundaryWithRecovery>
);

export default App;
