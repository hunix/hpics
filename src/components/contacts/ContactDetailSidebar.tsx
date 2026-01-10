import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { categories, searchSections, type SectionId, type CategoryId } from '@/lib/contactDetailCategories';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ContactDetailSidebarProps {
  activeSection: SectionId;
  onSectionChange: (sectionId: SectionId) => void;
  className?: string;
}

export function ContactDetailSidebar({ 
  activeSection, 
  onSectionChange,
  className 
}: ContactDetailSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryId>>(() => {
    // Find which category contains the active section and expand it
    const activeCategory = categories.find(cat => 
      cat.sections.some(s => s.id === activeSection)
    );
    return new Set(activeCategory ? [activeCategory.id] : ['profile']);
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchSections(searchQuery);
  }, [searchQuery]);

  const toggleCategory = (categoryId: CategoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSectionClick = (sectionId: SectionId) => {
    onSectionChange(sectionId);
    setSearchQuery('');
  };

  return (
    <Card className={cn("sticky top-4", className)}>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="p-2">
          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-1 mb-4">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSectionClick(result.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
                    activeSection === result.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <result.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{result.label}</span>
                  <Badge 
                    variant="outline" 
                    className={cn("ml-auto text-[10px] px-1.5", result.category.color)}
                  >
                    {result.category.label}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {searchResults && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sections found
            </p>
          )}

          {/* Category Accordion */}
          {!searchResults && categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const hasActiveSection = category.sections.some(s => s.id === activeSection);
            
            return (
              <Collapsible
                key={category.id}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.id)}
                className="mb-1"
              >
                <CollapsibleTrigger className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-muted",
                  hasActiveSection && !isExpanded && category.bgColor
                )}>
                  {isExpanded ? (
                    <ChevronDown className={cn("h-4 w-4 shrink-0", category.color)} />
                  ) : (
                    <ChevronRight className={cn("h-4 w-4 shrink-0", category.color)} />
                  )}
                  <category.icon className={cn("h-4 w-4 shrink-0", category.color)} />
                  <span className="flex-1 text-left">{category.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-[10px] px-1.5 h-5",
                      hasActiveSection && category.bgColor,
                      hasActiveSection && category.color
                    )}
                  >
                    {category.sections.length}
                  </Badge>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pl-6 space-y-0.5 mt-1">
                  {category.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                        activeSection === section.id
                          ? cn("text-white", 
                              category.id === 'profile' && "bg-blue-500",
                              category.id === 'intelligence' && "bg-violet-500",
                              category.id === 'communication' && "bg-emerald-500",
                              category.id === 'media' && "bg-amber-500",
                              category.id === 'connections' && "bg-rose-500"
                            )
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <section.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{section.label}</span>
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Keyboard shortcut hint */}
      <div className="p-2 border-t">
        <p className="text-[10px] text-muted-foreground text-center">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘K</kbd> to search
        </p>
      </div>
    </Card>
  );
}
