import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, Search, Clock, Star, ArrowRight, Plus, Upload, Users, FileText, Sparkles } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { navigationItems, categoryConfig, searchNavItems, type NavItem } from '@/lib/navigationConfig';
import { cn } from '@/lib/utils';
import { useClearance } from '@/hooks/useClearance';
import { useNavigationPreferences, type QuickAccessItem } from '@/hooks/useNavigationPreferences';

interface NavigationSpotlightProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Quick actions for power users
const quickActions = [
  { id: 'new-contact', label: 'Create new contact', icon: Plus, url: '/contacts?action=create', keywords: ['new', 'add', 'contact', 'create'] },
  { id: 'import-data', label: 'Import data', icon: Upload, url: '/import', keywords: ['import', 'upload', 'csv', 'excel'] },
  { id: 'ai-search', label: 'AI semantic search', icon: Sparkles, url: '/semantic-search', keywords: ['ai', 'search', 'smart', 'find'] },
];

export function NavigationSpotlight({ open, onOpenChange }: NavigationSpotlightProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { hasRole, hasClearance } = useClearance();
  const { quickAccess, isPinned } = useNavigationPreferences();
  
  // Filter items based on access
  const accessibleItems = useMemo(() => {
    return navigationItems.filter(item => {
      if (item.requiredRole && !hasRole(item.requiredRole)) return false;
      if (item.requiredClearance && !hasClearance(item.requiredClearance)) return false;
      return true;
    });
  }, [hasRole, hasClearance]);
  
  // Search results
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const results = searchNavItems(search);
    return results.filter(item => accessibleItems.some(a => a.id === item.id));
  }, [search, accessibleItems]);
  
  // Recent items from quick access
  const recentItems = useMemo(() => {
    return quickAccess
      .slice(0, 5)
      .map(qa => accessibleItems.find(item => item.url === qa.route))
      .filter(Boolean) as NavItem[];
  }, [quickAccess, accessibleItems]);
  
  // Pinned items
  const pinnedItems = useMemo(() => {
    return accessibleItems.filter(item => isPinned(item.id));
  }, [accessibleItems, isPinned]);
  
  const handleSelect = (item: NavItem) => {
    navigate(item.url);
    onOpenChange(false);
    setSearch('');
  };
  
  // Reset search when dialog closes
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);
  
  const renderItem = (item: NavItem) => {
    const config = categoryConfig[item.category];
    const Icon = item.icon;
    
    return (
      <CommandItem
        key={item.id}
        value={`${item.title} ${item.description} ${item.keywords?.join(' ')}`}
        onSelect={() => handleSelect(item)}
        className="flex items-center gap-3 py-3 cursor-pointer"
      >
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          `bg-gradient-to-br ${config.gradient}`,
          'shadow-sm'
        )}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.title}</span>
            {item.badge && (
              <Badge 
                variant="secondary"
                className={cn(
                  'text-[9px] px-1 py-0 h-3.5',
                  item.badge === 'new' && 'bg-emerald-500/20 text-emerald-600',
                  item.badge === 'beta' && 'bg-amber-500/20 text-amber-600'
                )}
              >
                {typeof item.badge === 'string' ? item.badge.toUpperCase() : item.badge}
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">
              {item.description}
            </p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-aria-selected:opacity-100 transition-opacity" />
      </CommandItem>
    );
  };
  
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-2 px-3 border-b">
        <Search className="h-4 w-4 text-muted-foreground" />
        <CommandInput
          placeholder="Search navigation, commands, and more..."
          value={search}
          onValueChange={setSearch}
          className="border-0 focus:ring-0"
        />
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ESC
        </kbd>
      </div>
      
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No results found</p>
            <p className="text-xs text-muted-foreground/70">
              Try searching for pages, features, or actions
            </p>
          </div>
        </CommandEmpty>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.map(renderItem)}
          </CommandGroup>
        )}
        
        {/* Show categories when not searching */}
        {!search.trim() && (
          <>
            {/* Quick Actions */}
            <CommandGroup heading={
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-violet-500" />
                <span>Quick Actions</span>
              </div>
            }>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={`${action.label} ${action.keywords.join(' ')}`}
                    onSelect={() => {
                      navigate(action.url);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 shadow-sm">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            
            {/* Pinned */}
            {pinnedItems.length > 0 && (
              <>
                <CommandGroup heading={
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-amber-500" />
                    <span>Pinned</span>
                  </div>
                }>
                  {pinnedItems.map(renderItem)}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            
            {/* Recent */}
            {recentItems.length > 0 && (
              <>
                <CommandGroup heading={
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>Recent</span>
                  </div>
                }>
                  {recentItems.map(renderItem)}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            
            {/* All Pages grouped by category */}
            <CommandGroup heading="All Pages">
              {accessibleItems.slice(0, 8).map(renderItem)}
            </CommandGroup>
          </>
        )}
      </CommandList>
      
      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted">↵</kbd>
            <span>Open</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Command className="h-3 w-3" />
          <span>+ K to toggle</span>
        </div>
      </div>
    </CommandDialog>
  );
}
