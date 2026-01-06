import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, MessageSquare, MoreHorizontal, Settings, Network, FileText, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/nativeFeatures';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const moreNavItems: NavItem[] = [
  { path: '/network', label: 'Network', icon: Network },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = async (path: string) => {
    await hapticFeedback('light');
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreNavItems.some(item => location.pathname === item.path);

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "cursor-pointer",
                    isActive(item.path) && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
