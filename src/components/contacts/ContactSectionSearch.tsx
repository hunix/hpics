import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { categories, searchSections, allSections, type SectionId } from '@/lib/contactDetailCategories';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from '@/components/ui/badge';

interface ContactSectionSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: SectionId;
  onSectionChange: (sectionId: SectionId) => void;
  contactId?: string;
}

const RECENT_SECTIONS_KEY = 'contact-detail-recent-sections';
const MAX_RECENT = 5;

function getRecentSections(): SectionId[] {
  try {
    const stored = localStorage.getItem(RECENT_SECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSection(sectionId: SectionId) {
  try {
    const recent = getRecentSections().filter(id => id !== sectionId);
    recent.unshift(sectionId);
    localStorage.setItem(RECENT_SECTIONS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // Ignore localStorage errors
  }
}

export function ContactSectionSearch({ 
  open, 
  onOpenChange, 
  activeSection,
  onSectionChange,
  contactId
}: ContactSectionSearchProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const recentSectionIds = useMemo(() => getRecentSections(), [open]);
  
  const recentSections = useMemo(() => {
    return recentSectionIds
      .map(id => {
        const section = allSections.find(s => s.id === id);
        const category = categories.find(c => c.sections.some(s => s.id === id));
        if (section && category) {
          return { ...section, category };
        }
        return null;
      })
      .filter(Boolean) as Array<typeof allSections[0] & { category: typeof categories[0] }>;
  }, [recentSectionIds]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return searchSections(search);
  }, [search]);

  const handleSelect = useCallback((sectionId: SectionId) => {
    addRecentSection(sectionId);
    onSectionChange(sectionId);
    onOpenChange(false);
    setSearch('');
    
    // Update URL if contactId is provided
    if (contactId) {
      navigate(`/contacts/${contactId}?section=${sectionId}`, { replace: true });
    }
  }, [onSectionChange, onOpenChange, contactId, navigate]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Keyboard navigation between sections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      // Navigate between sections with [ and ]
      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        const allSectionIds = categories.flatMap(c => c.sections.map(s => s.id));
        const currentIndex = allSectionIds.indexOf(activeSection);
        
        if (e.key === '[' && currentIndex > 0) {
          handleSelect(allSectionIds[currentIndex - 1]);
        } else if (e.key === ']' && currentIndex < allSectionIds.length - 1) {
          handleSelect(allSectionIds[currentIndex + 1]);
        }
      }
      
      // Jump to category with number keys
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const categoryIndex = parseInt(e.key) - 1;
        if (categories[categoryIndex]) {
          handleSelect(categories[categoryIndex].sections[0].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, activeSection, handleSelect]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search sections..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No sections found.</CommandEmpty>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => handleSelect(result.id)}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center",
                  result.category.bgColor
                )}>
                  <result.icon className={cn("h-4 w-4", result.category.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.label}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("shrink-0 text-[10px]", result.category.color)}
                >
                  {result.category.label}
                </Badge>
                {activeSection === result.id && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Recent Sections */}
        {!search && recentSections.length > 0 && (
          <CommandGroup heading="Recent">
            {recentSections.map((section) => (
              <CommandItem
                key={section.id}
                value={`recent-${section.id}`}
                onSelect={() => handleSelect(section.id)}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center",
                  section.category.bgColor
                )}>
                  <section.icon className={cn("h-4 w-4", section.category.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{section.label}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("shrink-0 text-[10px]", section.category.color)}
                >
                  {section.category.label}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* All Categories */}
        {!search && categories.map((category) => (
          <CommandGroup key={category.id} heading={category.label}>
            {category.sections.map((section) => (
              <CommandItem
                key={section.id}
                value={section.id}
                onSelect={() => handleSelect(section.id)}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center",
                  category.bgColor
                )}>
                  <section.icon className={cn("h-4 w-4", category.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{section.label}</p>
                </div>
                {activeSection === section.id && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>

      {/* Footer with shortcuts */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd> Select</span>
        </div>
        <div className="flex gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">[</kbd><kbd className="px-1.5 py-0.5 bg-muted rounded">]</kbd> Prev/Next</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">1-5</kbd> Categories</span>
        </div>
      </div>
    </CommandDialog>
  );
}
