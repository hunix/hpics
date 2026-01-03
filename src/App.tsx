import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Communications from "./pages/Communications";
import Documents from "./pages/Documents";
import MediaPage from "./pages/Media";
import Events from "./pages/Events";
import Insights from "./pages/Insights";
import Import from "./pages/Import";
import Settings from "./pages/Settings";
import Network from "./pages/Network";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/events" element={<Events />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/import" element={<Import />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/network" element={<Network />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
