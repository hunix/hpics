import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, MessageSquare, MoreHorizontal, Search, Brain, Shield, Settings, Network, FileText, BarChart3, Image, Upload, Activity, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { navigationItems, categoryConfig } from '@/lib/navigationConfig';
import { useClearance } from '@/hooks/useClearance';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/communications', label: 'Messages', icon: MessageSquare },
];

export function MobileBottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole, hasClearance } = useClearance();

  const handleNavigation = async (path: string) => {
    await hapticFeedback('light');
    navigate(path);
    setSheetOpen(false);
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isMoreActive = !mainNavItems.some(item => isActive(item.path));

  // Filter accessible navigation items
  const accessibleItems = navigationItems.filter(item => {
    if (item.requiredRole && !hasRole(item.requiredRole)) return false;
    if (item.requiredClearance && !hasClearance(item.requiredClearance)) return false;
    return true;
  });

  // Group items by category
  const groupedItems = accessibleItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof accessibleItems>);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isMoreActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="text-left pb-4">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-6 pb-8">
                {Object.entries(groupedItems).map(([category, items]) => {
                  const config = categoryConfig[category as keyof typeof categoryConfig];
                  if (!config) return null;
                  
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn('w-2 h-2 rounded-full', `bg-gradient-to-r ${config.gradient}`)} />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {config.title}
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.url);
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavigation(item.url)}
                              className={cn(
                                'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                                'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                active && [
                                  'bg-accent',
                                  config.borderClass,
                                  'border',
                                ]
                              )}
                            >
                              <div className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-lg',
                                active ? [
                                  `bg-gradient-to-br ${config.gradient}`,
                                  'shadow-md',
                                ] : [
                                  'bg-muted/70',
                                ]
                              )}>
                                <Icon className={cn(
                                  'h-5 w-5',
                                  active ? 'text-white' : config.textClass
                                )} />
                              </div>
                              <span className={cn(
                                'text-xs font-medium text-center line-clamp-1',
                                active ? 'text-foreground' : 'text-muted-foreground'
                              )}>
                                {item.title}
                              </span>
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
      </div>
    </nav>
  );
}
