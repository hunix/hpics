import { useState, useEffect, useCallback } from 'react';
import { ComposeEmailDialog } from '@/components/communications/ComposeEmailDialog';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useComprehensiveScan } from '@/hooks/useComprehensiveScan';
import { ArrowLeft, User, ChevronRight } from 'lucide-react';
import { ContactDialog } from '@/components/contacts/ContactDialog';
import { DeepIntelligencePanel } from '@/components/intelligence/DeepIntelligencePanel';
import { ContactDetailSidebar } from '@/components/contacts/ContactDetailSidebar';
import { ContactDetailMobileNav } from '@/components/contacts/ContactDetailMobileNav';
import { ContactSectionSearch } from '@/components/contacts/ContactSectionSearch';
import { ContactDetailHeader } from '@/components/contacts/ContactDetailHeader';
import { ContactDetailContent } from '@/components/contacts/ContactDetailContent';
import { MobileIntelSheet } from '@/components/mobile/MobileIntelSheet';
import { MobileIntelActions } from '@/components/mobile/MobileIntelActions';
import { ComprehensiveScanButton } from '@/components/intelligence/ComprehensiveScanButton';
import { ComprehensiveIntelligenceScan } from '@/components/intelligence/ComprehensiveIntelligenceScan';
import { cn } from '@/lib/utils';
import { type SectionId, getCategoryForSection } from '@/lib/contactDetailCategories';
import type { Profile as BaseProfile } from '@/types/database-helpers';

type Profile = BaseProfile & { relationship_subtype?: string; hierarchy_level?: string; is_self_profile?: boolean };

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Initialize section from URL or default to 'overview'
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const urlSection = searchParams.get('section') as SectionId | null;
    return urlSection || 'overview';
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle section change with URL persistence
  const handleSectionChange = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);
    setSearchParams({ section: sectionId }, { replace: true });
  }, [setSearchParams]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync URL section on mount
  useEffect(() => {
    const urlSection = searchParams.get('section') as SectionId | null;
    if (urlSection && urlSection !== activeSection) {
      setActiveSection(urlSection);
    }
  }, [searchParams, activeSection]);

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

  const handleToggleSelfProfile = async () => {
    if (!contact?.is_self_profile) {
      await supabase
        .from('profiles')
        .update({ is_self_profile: false })
        .eq('user_id', user!.id)
        .eq('is_self_profile', true);
    }
    await supabase
      .from('profiles')
      .update({ is_self_profile: !contact?.is_self_profile })
      .eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['contact', id] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
    toast({ 
      title: contact?.is_self_profile 
        ? 'Removed "This is me" marker' 
        : 'Marked as "This is me"' 
    });
  };

  const contactName = contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : '';
  const activeCategory = getCategoryForSection(activeSection);
  
  // Initialize comprehensive scan hook
  const { startScan } = useComprehensiveScan(id || '');

  if (isLoading) {
    return (
      <AppLayout title="Contact">
        <div className="flex gap-6">
          <div className="w-64 space-y-4 hidden lg:block">
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

  return (
    <AppLayout title={contactName} showQuickCapture captureProfileId={contact.id}>
      {/* Breadcrumb with category indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/contacts" className="hover:text-foreground transition-colors">Contacts</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{contactName}</span>
        {activeCategory && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Badge variant="outline" className={cn("text-xs", activeCategory.color)}>
              {activeCategory.label}
            </Badge>
          </>
        )}
      </div>

      {/* Header */}
      <ContactDetailHeader
        contact={contact}
        contactName={contactName}
        showAIPanel={showAIPanel}
        onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
        onEdit={() => setIsEditDialogOpen(true)}
        onDelete={() => deleteMutation.mutate()}
        onToggleFavorite={() => toggleFavoriteMutation.mutate()}
        onSendEmail={() => setIsEmailDialogOpen(true)}
        onToggleSelfProfile={handleToggleSelfProfile}
      />

      {/* Mobile Navigation */}
      <ContactDetailMobileNav 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main Layout */}
      <div className={cn(
        "grid gap-6 mt-4 lg:mt-0",
        showAIPanel 
          ? "lg:grid-cols-[220px_1fr_380px] xl:grid-cols-[240px_1fr_420px]" 
          : "lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]"
      )}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ContactDetailSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-1 min-w-0">
          <ContactDetailContent
            activeSection={activeSection}
            contact={contact}
            contactName={contactName}
            contactMethods={contactMethods}
          />
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

      {/* Section Search Dialog */}
      <ContactSectionSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        contactId={id}
      />

      <ContactDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contact={contact}
      />

      <ComposeEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        defaultTo={contactMethods?.find(m => m.contact_type === 'email')?.value || ''}
        profileId={contact.id}
        profileName={contactName}
      />

      {/* Mobile Intel Components */}
      <MobileIntelSheet 
        profileId={contact.id} 
        profileName={contactName}
        onAction={(action) => {
          if (action === 'email') setIsEmailDialogOpen(true);
        }}
      />
      <MobileIntelActions 
        profileId={contact.id}
        profileName={contactName}
        onFullScan={() => startScan('mobile')}
      />
      
      {/* Comprehensive Scan FAB (Mobile) */}
      <ComprehensiveScanButton
        profileId={contact.id}
        profileName={contactName}
        className="md:hidden"
      />
      
      {/* Desktop Comprehensive Scan Card */}
      {activeSection === 'unified-profile' && (
        <div className="hidden md:block fixed bottom-6 right-6 z-40">
          <ComprehensiveIntelligenceScan
            profileId={contact.id}
            profileName={contactName}
            className="w-96 shadow-2xl"
          />
        </div>
      )}
    </AppLayout>
  );
}
