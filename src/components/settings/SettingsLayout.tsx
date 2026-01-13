/**
 * @fileoverview Settings Two-Column Layout
 * Premium layout with left sidebar navigation and right content area
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SettingsNavigation, SETTINGS_GROUPS } from './SettingsNavigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings as SettingsIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SettingsLayoutProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function SettingsLayout({ 
  activeSection, 
  onSectionChange, 
  children,
  title,
  description,
}: SettingsLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSectionChange = useCallback((sectionId: string) => {
    onSectionChange(sectionId);
    setMobileNavOpen(false);
  }, [onSectionChange]);

  // Find current section info
  const currentSection = SETTINGS_GROUPS
    .flatMap(g => g.sections)
    .find(s => s.id === activeSection);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          "w-64 shrink-0 border-r border-border/50",
          "bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm",
        )}>
          <div className="sticky top-0 h-[calc(100vh-4rem)]">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Settings</h2>
                  <p className="text-xs text-muted-foreground">Configure your account</p>
                </div>
              </div>
            </div>
            
            <SettingsNavigation 
              activeSection={activeSection}
              onSectionChange={onSectionChange}
            />
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile Header with Nav Trigger */}
        {isMobile && (
          <div className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <SettingsIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm">Settings</h2>
                      <p className="text-xs text-muted-foreground">Configure your account</p>
                    </div>
                  </div>
                </div>
                <SettingsNavigation 
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2 min-w-0">
              {currentSection && (
                <>
                  <currentSection.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium truncate">{currentSection.label}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {/* Section Header */}
          {(title || currentSection) && (
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {title || currentSection?.label}
              </h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          
          {children}
        </div>
      </main>
    </div>
  );
}
