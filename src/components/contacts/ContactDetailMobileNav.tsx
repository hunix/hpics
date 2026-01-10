import { useState, useMemo, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { categories, searchSections, type SectionId, type CategoryId } from '@/lib/contactDetailCategories';
import { hapticFeedback } from '@/lib/nativeFeatures';
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

  // Update active category when section changes
  useEffect(() => {
    const cat = categories.find(c => c.sections.some(s => s.id === activeSection));
    if (cat) setActiveCategory(cat.id);
  }, [activeSection]);

  const currentCategory = categories.find(c => c.id === activeCategory)!;
  const activeSectionData = categories
    .flatMap(c => c.sections)
    .find(s => s.id === activeSection);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchSections(searchQuery);
  }, [searchQuery]);

  const handleSectionClick = async (sectionId: SectionId) => {
    await hapticFeedback('light');
    onSectionChange(sectionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCategoryChange = async (categoryId: CategoryId) => {
    await hapticFeedback('light');
    setActiveCategory(categoryId);
  };

  return (
    <div className="lg:hidden">
      {/* Current Section Indicator & Open Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-14 mb-4 touch-target active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              {activeSectionData && (
                <>
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    currentCategory.bgColor
                  )}>
                    <activeSectionData.icon className={cn("h-5 w-5", currentCategory.color)} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{activeSectionData.label}</p>
                    <p className="text-xs text-muted-foreground">{currentCategory.label}</p>
                  </div>
                </>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[90vh] sm:h-[75vh] p-0 rounded-t-2xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
          
          <SheetHeader className="px-4 pb-2">
            <SheetTitle className="text-left text-lg">Navigate Sections</SheetTitle>
          </SheetHeader>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 touch-target"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <ScrollArea className="h-[calc(90vh-160px)] sm:h-[calc(75vh-160px)]">
              <div className="px-4 space-y-2 pb-8">
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
                        "w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all touch-target",
                        "active:scale-[0.98]",
                        activeSection === result.id
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        activeSection === result.id ? "bg-white/20" : result.category.bgColor
                      )}>
                        <result.icon className={cn(
                          "h-6 w-6", 
                          activeSection === result.id ? "text-white" : result.category.color
                        )} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-base">{result.label}</p>
                        <p className={cn(
                          "text-sm",
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
              {/* Category Tabs - Larger touch targets */}
              <div className="px-4 pb-3">
                <div className="flex gap-1.5 p-1.5 bg-muted rounded-xl overflow-x-auto scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all touch-target",
                        "active:scale-95",
                        activeCategory === category.id
                          ? cn("bg-background shadow-md", category.color)
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <category.icon className="h-5 w-5 shrink-0" />
                      <span className="hidden xs:inline sm:inline">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Grid - Optimized touch targets */}
              <ScrollArea className="h-[calc(90vh-230px)] sm:h-[calc(75vh-230px)]">
                <div className="px-4 pb-8">
                  {/* Responsive grid: 2 cols on small, 3 on medium, 4 on large tablets */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentCategory.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section.id)}
                        className={cn(
                          "flex flex-col items-center gap-2.5 p-4 rounded-xl text-center transition-all",
                          "min-h-[100px] touch-target",
                          "active:scale-95",
                          activeSection === section.id
                            ? cn(
                                "text-white shadow-lg",
                                currentCategory.id === 'profile' && "bg-gradient-to-br from-blue-500 to-blue-600",
                                currentCategory.id === 'intelligence' && "bg-gradient-to-br from-violet-500 to-violet-600",
                                currentCategory.id === 'communication' && "bg-gradient-to-br from-emerald-500 to-emerald-600",
                                currentCategory.id === 'media' && "bg-gradient-to-br from-amber-500 to-amber-600",
                                currentCategory.id === 'connections' && "bg-gradient-to-br from-rose-500 to-rose-600"
                              )
                            : cn("bg-muted/50 hover:bg-muted", currentCategory.borderColor, "border")
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          activeSection === section.id 
                            ? "bg-white/20" 
                            : currentCategory.bgColor
                        )}>
                          <section.icon className={cn(
                            "h-6 w-6",
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

      {/* Quick Action Pills (always visible) - Larger touch targets */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide scroll-smooth-touch">
        {categories.map((category) => {
          const isActive = category.sections.some(s => s.id === activeSection);
          return (
            <Button
              key={category.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "shrink-0 gap-2 h-10 px-4 touch-target",
                "active:scale-95 transition-transform",
                isActive && cn(
                  category.id === 'profile' && "bg-blue-500 hover:bg-blue-600 border-blue-500",
                  category.id === 'intelligence' && "bg-violet-500 hover:bg-violet-600 border-violet-500",
                  category.id === 'communication' && "bg-emerald-500 hover:bg-emerald-600 border-emerald-500",
                  category.id === 'media' && "bg-amber-500 hover:bg-amber-600 border-amber-500",
                  category.id === 'connections' && "bg-rose-500 hover:bg-rose-600 border-rose-500"
                )
              )}
              onClick={() => {
                setActiveCategory(category.id);
                setIsOpen(true);
              }}
            >
              <category.icon className="h-4 w-4" />
              <span className="font-medium">{category.label}</span>
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 px-1.5 text-[10px] font-semibold",
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
