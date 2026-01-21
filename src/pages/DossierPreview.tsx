/**
 * Dossier Preview Page (v3.9.20)
 * Interactive HTML rendering of the full 74-section intelligence dossier
 */

import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, RefreshCw, Printer, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useDossierData, DossierDataResult } from '@/components/reports/hooks/useDossierData';
import { computeExtendedDossierData, ExtendedDossierData } from '@/components/dossier-preview/utils/computeExtendedData';
import { DossierSectionNav } from '@/components/dossier-preview/DossierSectionNav';
import { DossierHeader } from '@/components/dossier-preview/DossierHeader';
import { DossierContent } from '@/components/dossier-preview/DossierContent';
import { MobileSectionNav } from '@/components/dossier-preview/MobileSectionNav';
import { useDossierNavigation } from '@/components/dossier-preview/hooks/useDossierNavigation';
import { DEFAULT_SECTIONS } from '@/components/reports/sections/sectionDefinitions';
import { DossierLoadingScreen } from '@/components/dossier-preview/DossierLoadingScreen';

export default function DossierPreview() {
  const { profileId } = useParams<{ profileId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [dossierData, setDossierData] = useState<ExtendedDossierData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { fetchAllDossierData } = useDossierData();
  const { activeSection, scrollToSection, registerSection, sectionRefs } = useDossierNavigation(
    DEFAULT_SECTIONS.map(s => s.id)
  );
  
  // Auto-scroll to section from URL param
  const sectionParam = searchParams.get('section');
  
  useEffect(() => {
    if (!profileId || !user) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const raw = await fetchAllDossierData(profileId);
        if (!raw) {
          setError('Profile not found');
          return;
        }
        
        const contactName = [raw.profile.first_name, raw.profile.last_name].filter(Boolean).join(' ') || 'Unknown';
        const extended = computeExtendedDossierData(raw, contactName);
        setDossierData(extended);
        
        // Scroll to section from URL param after data loads
        if (sectionParam) {
          setTimeout(() => scrollToSection(sectionParam), 500);
        }
      } catch (err) {
        console.error('Failed to load dossier:', err);
        setError('Failed to load dossier data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [profileId, user, fetchAllDossierData, sectionParam, scrollToSection]);
  
  const handleRefresh = async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const raw = await fetchAllDossierData(profileId);
      if (raw) {
        const contactName = [raw.profile.first_name, raw.profile.last_name].filter(Boolean).join(' ') || 'Unknown';
        setDossierData(computeExtendedDossierData(raw, contactName));
        toast.success('Dossier refreshed');
      }
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (!profileId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No profile ID provided</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }
  
  // Show dedicated loading screen
  if (isLoading) {
    return <DossierLoadingScreen contactName={dossierData?.contactName} />;
  }
  
  return (
    <div className="flex h-screen bg-background print:bg-white">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-72 border-r bg-muted/30 flex-col print:hidden">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        {dossierData && (
        <DossierSectionNav
          sections={DEFAULT_SECTIONS}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
          dossierData={dossierData}
          />
        )}
      </aside>

      {/* Tablet Sidebar - Collapsible Sheet */}
      <div className="hidden md:block lg:hidden print:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="fixed top-4 left-4 z-50"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="p-4 border-b">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <DossierSectionNav
              sections={DEFAULT_SECTIONS}
              activeSection={activeSection}
              onSectionClick={scrollToSection}
              dossierData={dossierData}
            />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
          <div className="flex items-center justify-between p-4 gap-2">
            {/* Mobile back button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="lg:hidden md:hidden shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {isLoading ? (
              <Skeleton className="h-10 w-64 flex-1" />
            ) : (
              <div className="flex-1 min-w-0">
                <DossierHeader
                  contactName={dossierData?.contactName || 'Loading...'}
                  organization={dossierData?.profile?.organization}
                  intelligenceCompleteness={dossierData?.intelligenceCompleteness || 0}
                />
              </div>
            )}
            
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="hidden sm:flex">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="sm:hidden">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate(`/dossier-intelligence?contact=${profileId}`)} className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="default" size="icon" onClick={() => navigate(`/dossier-intelligence?contact=${profileId}`)} className="sm:hidden">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-6">
          {isLoading ? (
            <div className="p-6 space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ))}
            </div>
          ) : dossierData ? (
            <DossierContent
              data={dossierData}
              sections={DEFAULT_SECTIONS}
              registerSection={registerSection}
            />
          ) : null}
        </div>
      </main>
      
      {/* Mobile Section Navigation */}
      {!isLoading && dossierData && (
        <MobileSectionNav
          sections={DEFAULT_SECTIONS}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
          dossierData={dossierData}
        />
      )}
    </div>
  );
}
