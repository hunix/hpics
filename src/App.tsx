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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import ConversationDetail from "./pages/ConversationDetail";
import Communications from "./pages/Communications";
import Documents from "./pages/Documents";
import MediaPage from "./pages/Media";
import Events from "./pages/Events";
import Insights from "./pages/Insights";
import Import from "./pages/Import";
import Settings from "./pages/Settings";
import Network from "./pages/Network";
import Calendar from "./pages/Calendar";
import VideoAnalysis from "./pages/VideoAnalysis";
import MediaAnalysis from "./pages/MediaAnalysis";
import BulkAnalysisDashboard from "./pages/BulkAnalysisDashboard";
import Reports from "./pages/Reports";
import TeamDashboard from "./pages/TeamDashboard";
import Install from "./pages/Install";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                <BrowserRouter>
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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
