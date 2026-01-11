import { Suspense, lazy } from 'react';
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

// Eagerly loaded core pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import NotFound from "./pages/NotFound";

// Lazy loaded pages for performance
const ConversationDetail = lazy(() => import("./pages/ConversationDetail"));
const Communications = lazy(() => import("./pages/Communications"));
const Documents = lazy(() => import("./pages/Documents"));
const MediaPage = lazy(() => import("./pages/Media"));
const Events = lazy(() => import("./pages/Events"));
const Insights = lazy(() => import("./pages/Insights"));
const Import = lazy(() => import("./pages/Import"));
const Settings = lazy(() => import("./pages/Settings"));
const Network = lazy(() => import("./pages/Network"));
const Calendar = lazy(() => import("./pages/Calendar"));
const VideoAnalysis = lazy(() => import("./pages/VideoAnalysis"));
const MediaAnalysis = lazy(() => import("./pages/MediaAnalysis"));
const BulkAnalysisDashboard = lazy(() => import("./pages/BulkAnalysisDashboard"));
const Reports = lazy(() => import("./pages/Reports"));
const TeamDashboard = lazy(() => import("./pages/TeamDashboard"));
const Install = lazy(() => import("./pages/Install"));
const Security = lazy(() => import("./pages/Security"));
const NetworkIntelligence = lazy(() => import("./pages/NetworkIntelligence"));
const SemanticSearchPage = lazy(() => import("./pages/SemanticSearchPage"));
const CounterIntelligence = lazy(() => import("./pages/CounterIntelligence"));
const SystemHealthPage = lazy(() => import("./pages/SystemHealthPage"));
const CrossModalIntelligencePage = lazy(() => import("./pages/CrossModalIntelligencePage"));
const AdvancedNetworkPage = lazy(() => import("./pages/AdvancedNetworkPage"));
const AICostCenterPage = lazy(() => import("./pages/AICostCenterPage"));
const IntelligenceCenter = lazy(() => import("./pages/IntelligenceCenter"));
const AIChat = lazy(() => import("./pages/AIChat"));
const ShareReceive = lazy(() => import("./pages/ShareReceive"));

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
                        <Route path="/security" element={<Security />} />
                        <Route path="/network-intelligence" element={<NetworkIntelligence />} />
                        <Route path="/semantic-search" element={<SemanticSearchPage />} />
                        <Route path="/counter-intelligence" element={<CounterIntelligence />} />
                        <Route path="/system-health" element={<SystemHealthPage />} />
                        <Route path="/cross-modal-intelligence" element={<CrossModalIntelligencePage />} />
                        <Route path="/network-advanced" element={<AdvancedNetworkPage />} />
                        <Route path="/ai-costs" element={<AICostCenterPage />} />
                        <Route path="/intelligence" element={<IntelligenceCenter />} />
                        <Route path="/ai-chat" element={<AIChat />} />
                        <Route path="/share-receive" element={<ShareReceive />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </GlobalShortcutsProvider>
                </BrowserRouter>
              </AIConfirmationProvider>
            </RealtimeProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundaryWithRecovery>
);

export default App;
