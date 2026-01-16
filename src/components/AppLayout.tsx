import { ReactNode, useEffect, lazy, Suspense, useCallback } from 'react';
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
// ProactiveAlertBanner removed - alerts now routed through NotificationCenter
import { NotificationCenter } from '@/components/navigation/NotificationCenter';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useOfflineData } from '@/hooks/useOfflineData';
import { FloatingCascadeAlerts } from '@/components/intelligence/phase19/FloatingCascadeAlerts';

// Lazy load heavy components
const FloatingAIAssistant = lazy(() => 
  import('@/components/ai/FloatingAIAssistant').then(m => ({ default: m.FloatingAIAssistant }))
);

const UltimateCommandFAB = lazy(() => 
  import('@/components/command/UltimateCommandFAB').then(m => ({ default: m.UltimateCommandFAB }))
);

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showQuickCapture?: boolean;
  captureProfileId?: string;
}

export function AppLayout({ children, title, showQuickCapture = false, captureProfileId }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount, syncPendingChanges, cacheContacts } = useOfflineData();
  

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
      <div className="min-h-screen-mobile flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen-mobile flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          {/* Header with clean layout */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur-sm px-4 safe-area-pt samsung-safe-top sticky top-0 z-40">
            <SidebarTrigger className="-ml-1 touch-target-lg" />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            {title && (
              <h1 className="text-lg font-semibold truncate flex-1 min-w-0">
                {title}
              </h1>
            )}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <GlobalSearch />
              <NotificationCenter />
            </div>
          </header>
          <OfflineIndicator pendingChanges={pendingCount} onSync={syncPendingChanges} />
          {/* Main content with proper padding for bottom nav */}
          <main className="flex-1 overflow-auto scroll-smooth-touch scrollbar-hide p-4 sm:p-6 pb-28 md:pb-6 safe-area-pb samsung-safe-bottom">
            <Breadcrumbs />
            {children}
          </main>
        </SidebarInset>
        
        {/* Mobile-only components */}
        <MobileBottomNav />
        {showQuickCapture && <QuickCaptureButton profileId={captureProfileId} />}
        <PushNotificationBanner />
        <InstallPromptBanner />
        
        {/* Floating AI Assistant */}
        <Suspense fallback={null}>
          <FloatingAIAssistant />
        </Suspense>
        
        {/* Ultimate Command FAB */}
        <Suspense fallback={null}>
          <UltimateCommandFAB />
        </Suspense>
        
        {/* AGIS Cascade Alerts */}
        <FloatingCascadeAlerts />
      </div>
    </SidebarProvider>
  );
}
