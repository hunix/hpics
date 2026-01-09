import { ReactNode, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { QuickCaptureButton } from '@/components/mobile/QuickCaptureButton';
import { PushNotificationBanner } from '@/components/mobile/PushNotificationBanner';
import { InstallPromptBanner } from '@/components/mobile/InstallPromptBanner';
import { ProactiveAlertBanner } from '@/components/intelligence/ProactiveAlertBanner';
import { NotificationCenter } from '@/components/navigation/NotificationCenter';
import { useOfflineData } from '@/hooks/useOfflineData';

// Lazy load heavy components
const FloatingAIAssistant = lazy(() => 
  import('@/components/ai/FloatingAIAssistant').then(m => ({ default: m.FloatingAIAssistant }))
);

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showQuickCapture?: boolean;
}

export function AppLayout({ children, title, showQuickCapture = false }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount, syncPendingChanges, cacheContacts } = useOfflineData();
  const showAlerts = location.pathname === '/dashboard' || location.pathname === '/';

  // Cache contacts on mount for offline access
  useEffect(() => {
    if (user) {
      cacheContacts();
    }
  }, [user, cacheContacts]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 hidden md:flex" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
            <div className="ml-auto flex items-center gap-2">
              <GlobalSearch />
              <NotificationCenter />
            </div>
          </header>
          <OfflineIndicator pendingChanges={pendingCount} onSync={syncPendingChanges} />
          {showAlerts && <div className="px-6 pt-4"><ProactiveAlertBanner /></div>}
          <main className="flex-1 overflow-auto p-6 pb-20 md:pb-6">
            {children}
          </main>
        </SidebarInset>
        
        {/* Mobile-only components */}
        <MobileBottomNav />
        {showQuickCapture && <QuickCaptureButton />}
        <PushNotificationBanner />
        <InstallPromptBanner />
        
        {/* Floating AI Assistant */}
        <Suspense fallback={null}>
          <FloatingAIAssistant />
        </Suspense>
      </div>
    </SidebarProvider>
  );
}
