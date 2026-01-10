import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { categories, searchSections, type SectionId, type CategoryId } from '@/lib/contactDetailCategories';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ContactDetailMobileNavProps {
  activeSection: SectionId;
  onSectionChange: (sectionId: SectionId) => void;
}

export function ContactDetailMobileNav({ 
  activeSection, 
  onSectionChange 
}: ContactDetailMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>(() => {
    const cat = categories.find(c => c.sections.some(s => s.id === activeSection));
    return cat?.id || 'profile';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = categories.find(c => c.id === activeCategory)!;
  const activeSectionData = categories
    .flatMap(c => c.sections)
    .find(s => s.id === activeSection);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchSections(searchQuery);
  }, [searchQuery]);

  const handleSectionClick = (sectionId: SectionId) => {
    onSectionChange(sectionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="lg:hidden">
      {/* Current Section Indicator & Open Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 mb-4"
          >
            <div className="flex items-center gap-2">
              {activeSectionData && (
                <>
                  <activeSectionData.icon className="h-4 w-4" />
                  <span>{activeSectionData.label}</span>
                </>
              )}
            </div>
            <Badge variant="secondary" className="ml-2">
              Navigate
            </Badge>
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-xl">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-left">Navigate Sections</SheetTitle>
          </SheetHeader>

          {/* Search */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <ScrollArea className="h-[calc(85vh-140px)]">
              <div className="p-4 pt-0 space-y-2">
                {searchResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No sections found
                  </p>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSectionClick(result.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        activeSection === result.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        result.category.bgColor
                      )}>
                        <result.icon className={cn("h-5 w-5", result.category.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{result.label}</p>
                        <p className={cn(
                          "text-xs truncate",
                          activeSection === result.id 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        )}>
                          {result.category.label}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Category Navigation */}
          {!searchResults && (
            <>
              {/* Category Tabs */}
              <div className="px-4 pb-2">
                <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors min-w-0",
                        activeCategory === category.id
                          ? cn("bg-background shadow-sm", category.color)
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <category.icon className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Grid */}
              <ScrollArea className="h-[calc(85vh-200px)]">
                <div className="p-4 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {currentCategory.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all",
                          "min-h-[88px]",
                          activeSection === section.id
                            ? cn(
                                "text-white shadow-lg",
                                currentCategory.id === 'profile' && "bg-blue-500",
                                currentCategory.id === 'intelligence' && "bg-violet-500",
                                currentCategory.id === 'communication' && "bg-emerald-500",
                                currentCategory.id === 'media' && "bg-amber-500",
                                currentCategory.id === 'connections' && "bg-rose-500"
                              )
                            : cn("bg-muted/50 hover:bg-muted", currentCategory.borderColor, "border")
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          activeSection === section.id 
                            ? "bg-white/20" 
                            : currentCategory.bgColor
                        )}>
                          <section.icon className={cn(
                            "h-5 w-5",
                            activeSection === section.id 
                              ? "text-white" 
                              : currentCategory.color
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs font-medium leading-tight line-clamp-2",
                          activeSection !== section.id && "text-muted-foreground"
                        )}>
                          {section.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Quick Action Pills (always visible) */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => {
          const isActive = category.sections.some(s => s.id === activeSection);
          return (
            <Button
              key={category.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "shrink-0 gap-1.5",
                isActive && cn(
                  category.id === 'profile' && "bg-blue-500 hover:bg-blue-600",
                  category.id === 'intelligence' && "bg-violet-500 hover:bg-violet-600",
                  category.id === 'communication' && "bg-emerald-500 hover:bg-emerald-600",
                  category.id === 'media' && "bg-amber-500 hover:bg-amber-600",
                  category.id === 'connections' && "bg-rose-500 hover:bg-rose-600"
                )
              )}
              onClick={() => {
                setActiveCategory(category.id);
                setIsOpen(true);
              }}
            >
              <category.icon className="h-3.5 w-3.5" />
              {category.label}
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 px-1.5 text-[10px]",
                  isActive && "bg-white/20 text-white"
                )}
              >
                {category.sections.length}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
