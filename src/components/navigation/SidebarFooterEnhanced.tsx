import { LogOut, Moon, Sun, Monitor, Keyboard, ChevronUp, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClearance } from '@/hooks/useClearance';
import { useTheme } from 'next-themes';

// Clearance display constants
const CLEARANCE_LABELS: Record<string, string> = {
  uncleared: 'Uncleared',
  confidential: 'Confidential',
  secret: 'Secret',
  top_secret: 'Top Secret',
  sci: 'SCI',
};

const CLEARANCE_COLORS: Record<string, string> = {
  uncleared: 'text-muted-foreground border-muted',
  confidential: 'text-blue-500 border-blue-500/30',
  secret: 'text-amber-500 border-amber-500/30',
  top_secret: 'text-red-500 border-red-500/30',
  sci: 'text-purple-500 border-purple-500/30',
};
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NavigationPreferences } from '@/hooks/useNavigationPreferences';

interface SidebarFooterEnhancedProps {
  preferences: NavigationPreferences;
  onLayoutModeChange: (mode: NavigationPreferences['layout_mode']) => void;
  onShowBadgesChange: (show: boolean) => void;
  onShowDescriptionsChange: (show: boolean) => void;
  onOpenSpotlight: () => void;
}

export function SidebarFooterEnhanced({
  preferences,
  onLayoutModeChange,
  onShowBadgesChange,
  onShowDescriptionsChange,
  onOpenSpotlight,
}: SidebarFooterEnhancedProps) {
  const { signOut, user } = useAuth();
  const { userRole, isLoading } = useClearance();
  const { theme, setTheme } = useTheme();
  
  const userEmail = user?.email || 'User';
  const userInitials = userEmail.slice(0, 2).toUpperCase();
  const clearanceLevel = userRole?.clearance || 'uncleared';
  const role = userRole?.role || 'viewer';
  
  return (
    <div className="border-t border-border/50 p-3 space-y-3">
      {/* Keyboard shortcut hint */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onOpenSpotlight}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
              'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 hover:from-violet-500/20 hover:to-indigo-500/20 transition-all',
              'text-xs text-muted-foreground hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'border border-violet-500/20'
            )}
          >
            <span className="flex items-center gap-2">
              <Keyboard className="h-3.5 w-3.5 text-violet-500" />
              <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent font-medium">
                Quick search...
              </span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-background text-[10px] font-mono border border-border">
              ⌘K
            </kbd>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Press ⌘K to open command palette
        </TooltipContent>
      </Tooltip>
      
      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            'w-full flex items-center gap-3 p-2 rounded-lg',
            'hover:bg-accent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}>
            <Avatar className="h-9 w-9 border-2 border-border">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{userEmail}</p>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={cn(
                  'text-[9px] px-1 py-0 h-3.5 font-medium',
                  CLEARANCE_COLORS[clearanceLevel]
                )}>
                  {CLEARANCE_LABELS[clearanceLevel]}
                </Badge>
                <span className="text-[10px] text-muted-foreground capitalize">{role}</span>
              </div>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Theme submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === 'dark' ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : theme === 'light' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          {/* Layout submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings2 className="mr-2 h-4 w-4" />
              Layout
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup 
                value={preferences.layout_mode} 
                onValueChange={(v) => onLayoutModeChange(v as NavigationPreferences['layout_mode'])}
              >
                <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="spacious">Spacious</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onShowBadgesChange(!preferences.show_badges)}>
                {preferences.show_badges ? '✓ ' : '  '}Show badges
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowDescriptionsChange(!preferences.show_descriptions)}>
                {preferences.show_descriptions ? '✓ ' : '  '}Show descriptions
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
