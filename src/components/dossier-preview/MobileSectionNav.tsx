/**
 * Mobile Section Navigation for Dossier Preview (v3.9.34)
 * Floating TOC button with bottom sheet navigation
 */

import { useState } from 'react';
import { List, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { DossierSection } from '@/components/reports/sections/types';
import type { ExtendedDossierData } from './utils/computeExtendedData';

interface MobileSectionNavProps {
  sections: DossierSection[];
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
  dossierData: ExtendedDossierData | null;
}

const categoryColors: Record<string, string> = {
  core: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  intelligence: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  warfare: 'bg-red-500/10 text-red-600 border-red-500/30',
  fusion: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  analysis: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
};

export function MobileSectionNav({ 
  sections, 
  activeSection, 
  onSectionClick,
  dossierData 
}: MobileSectionNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    onSectionClick(sectionId);
    setIsOpen(false);
  };

  // Group sections by category
  const groupedSections = sections.reduce((acc, section) => {
    const category = section.category || 'core';
    if (!acc[category]) acc[category] = [];
    acc[category].push(section);
    return acc;
  }, {} as Record<string, DossierSection[]>);

  const categoryOrder = ['core', 'intelligence', 'warfare', 'fusion', 'analysis'];

  // Find current section info
  const currentSection = sections.find(s => s.id === activeSection);
  const currentIndex = sections.findIndex(s => s.id === activeSection);
  const totalSections = sections.length;

  return (
    <>
      {/* Floating TOC Button - Only visible on mobile */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <List className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-left">Dossier Sections</SheetTitle>
                <Badge variant="outline" className="text-xs">
                  {currentIndex + 1} / {totalSections}
                </Badge>
              </div>
              {currentSection && (
                <p className="text-sm text-muted-foreground text-left">
                  Current: {currentSection.label}
                </p>
              )}
            </SheetHeader>
            
            <ScrollArea className="h-[calc(70vh-100px)] mt-4">
              <div className="space-y-4 pr-4">
                {categoryOrder.map(category => {
                  const categorySections = groupedSections[category];
                  if (!categorySections?.length) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className={cn(
                        "text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded mb-2",
                        categoryColors[category]
                      )}>
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {categorySections.map(section => {
                          const isActive = section.id === activeSection;
                          const Icon = section.icon;
                          
                          return (
                            <button
                              key={section.id}
                              onClick={() => handleSectionClick(section.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                isActive 
                                  ? "bg-primary/10 text-primary border border-primary/30" 
                                  : "hover:bg-muted"
                              )}
                            >
                              {Icon && <Icon className="h-4 w-4 shrink-0" />}
                              <span className="flex-1 text-sm truncate">
                                {section.label}
                              </span>
                              {isActive && (
                                <ChevronRight className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Progress indicator */}
        <AnimatePresence>
          {currentSection && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-10 right-0 bg-background/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-xs whitespace-nowrap border"
            >
              {currentIndex + 1}/{totalSections}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
