/**
 * Dossier Section Navigation (v3.9.34)
 * Sticky sidebar with category accordions and active section tracking
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DossierSection } from '@/components/reports/sections/types';
import type { ExtendedDossierData } from './utils/computeExtendedData';
import { checkSectionHasData } from '@/components/reports/utils/sectionDataCheck';

interface DossierSectionNavProps {
  sections: DossierSection[];
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
  dossierData: ExtendedDossierData | null;
}

const categoryLabels: Record<string, string> = {
  core: 'Core Intelligence',
  intelligence: 'Deep Intelligence',
  warfare: 'Warfare Operations',
  analysis: 'Analysis & Fusion',
};

const categoryColors: Record<string, string> = {
  core: 'text-emerald-500 bg-emerald-500/10',
  intelligence: 'text-violet-500 bg-violet-500/10',
  warfare: 'text-rose-500 bg-rose-500/10',
  analysis: 'text-amber-500 bg-amber-500/10',
};

export function DossierSectionNav({
  sections,
  activeSection,
  onSectionClick,
  dossierData,
}: DossierSectionNavProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['core', 'intelligence', 'warfare', 'analysis'])
  );

  const groupedSections = useMemo(() => {
    const groups: Record<string, DossierSection[]> = {
      core: [],
      intelligence: [],
      warfare: [],
      analysis: [],
    };
    
    sections.forEach(section => {
      const cat = section.category;
      if (groups[cat]) {
        groups[cat].push(section);
      }
    });
    
    return groups;
  }, [sections]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getSectionDataStatus = (sectionId: string): boolean => {
    if (!dossierData) return false;
    return checkSectionHasData(sectionId, dossierData);
  };

  const getCategoryProgress = (category: string): { total: number; withData: number } => {
    const categorySections = groupedSections[category] || [];
    const withData = categorySections.filter(s => getSectionDataStatus(s.id)).length;
    return { total: categorySections.length, withData };
  };

  return (
    <ScrollArea className="flex-1">
      <nav className="p-3 space-y-2">
        {Object.entries(groupedSections).map(([category, categorySections]) => {
          const isExpanded = expandedCategories.has(category);
          const progress = getCategoryProgress(category);
          
          return (
            <div key={category} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-lg transition-colors',
                  'hover:bg-muted/50',
                  categoryColors[category]
                )}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm">
                    {categoryLabels[category]}
                  </span>
                </div>
                <span className="text-xs opacity-70">
                  {progress.withData}/{progress.total}
                </span>
              </button>
              
              {/* Section Items */}
              {isExpanded && (
                <div className="ml-4 space-y-0.5">
                  {categorySections.map(section => {
                    const hasData = getSectionDataStatus(section.id);
                    const isActive = activeSection === section.id;
                    const Icon = section.icon;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => onSectionClick(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-md text-left transition-all text-sm',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : hasData
                              ? 'hover:bg-muted text-foreground'
                              : 'hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate flex-1">{section.label}</span>
                        {hasData ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 opacity-30 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
