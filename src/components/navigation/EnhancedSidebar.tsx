import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClearance } from '@/hooks/useClearance';
import { useNavigationPreferences } from '@/hooks/useNavigationPreferences';
import { getNavGroups, filterNavItemsByAccess, categoryConfig, type NavCategory } from '@/lib/navigationConfig';
import { NavGroupHeader } from './NavGroupHeader';
import { NavItemEnhanced } from './NavItemEnhanced';
import { QuickAccessBar } from './QuickAccessBar';
import { SidebarFooterEnhanced } from './SidebarFooterEnhanced';
import { NavigationSpotlight } from './NavigationSpotlight';
import { SystemHealthIndicator } from './SystemHealthIndicator';
import { HiddenItemsManager } from './HiddenItemsManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';

export function EnhancedSidebar() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const { hasRole, hasClearance } = useClearance();
  const {
    preferences,
    isLoading,
    toggleGroupCollapse,
    togglePinItem,
    toggleHideItem,
    isGroupCollapsed,
    isPinned,
    isHidden,
    setLayoutMode,
    setShowBadges,
    setShowDescriptions,
  } = useNavigationPreferences();
  
  // Keyboard shortcut for spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Get nav groups with filtering
  const navGroups = useMemo(() => {
    const groups = getNavGroups();
    
    return groups.map(group => ({
      ...group,
      items: filterNavItemsByAccess(
        group.items,
        undefined,
        undefined,
        hasRole,
        hasClearance
      ).filter(item => !isHidden(item.id)),
    })).filter(group => group.items.length > 0);
  }, [hasRole, hasClearance, isHidden]);
  
  // Sort groups by user preference
  const sortedGroups = useMemo(() => {
    const order = preferences.group_order;
    return [...navGroups].sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      return aIndex - bIndex;
    });
  }, [navGroups, preferences.group_order]);
  
  // Restore all hidden items
  const restoreAllHidden = useCallback(() => {
    preferences.hidden_items.forEach(id => toggleHideItem(id));
  }, [preferences.hidden_items, toggleHideItem]);
  
  return (
    <>
      <Sidebar className="border-r border-border/50">
        {/* Header */}
        <SidebarHeader className="border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              'bg-gradient-to-br from-primary to-primary/80',
              'shadow-lg shadow-primary/25'
            )}>
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">PICS</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Intelligence CRM
              </span>
            </div>
          </div>
        </SidebarHeader>
        
        {/* Search trigger */}
        <div className="px-3 py-2 border-b border-border/30">
          <button
            onClick={() => setSpotlightOpen(true)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-muted/50 hover:bg-muted transition-colors',
              'text-sm text-muted-foreground hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>
        
        <SidebarContent className="flex flex-col h-full">
          {/* System health + Quick access */}
          <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-medium text-muted-foreground">Intelligence Ready</span>
            </div>
            <SystemHealthIndicator compact />
          </div>
          
          {/* Quick access bar */}
          <QuickAccessBar
            pinnedItems={preferences.pinned_items}
            onUnpin={togglePinItem}
          />
          
          {/* Navigation groups */}
          <ScrollArea className="flex-1 px-2 py-2">
            <div className="space-y-1">
              {sortedGroups.map((group) => {
                const collapsed = isGroupCollapsed(group.id);
                
                return (
                  <div key={group.id} className="mb-2">
                    <NavGroupHeader
                      category={group.id}
                      isCollapsed={collapsed}
                      onToggle={() => toggleGroupCollapse(group.id)}
                      itemCount={group.items.length}
                      layoutMode={preferences.layout_mode}
                    />
                    
                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="py-1 pl-2 space-y-0.5">
                            {group.items.map((item) => (
                              <NavItemEnhanced
                                key={item.id}
                                item={item}
                                isPinned={isPinned(item.id)}
                                onTogglePin={() => togglePinItem(item.id)}
                                onToggleHide={() => toggleHideItem(item.id)}
                                showDescription={preferences.show_descriptions}
                                layoutMode={preferences.layout_mode}
                                showBadges={preferences.show_badges}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              
              {/* Hidden items manager */}
              {preferences.hidden_items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <HiddenItemsManager
                    hiddenItems={preferences.hidden_items}
                    onRestoreItem={toggleHideItem}
                    onRestoreAll={restoreAllHidden}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Enhanced footer */}
          <SidebarFooterEnhanced
            preferences={preferences}
            onLayoutModeChange={setLayoutMode}
            onShowBadgesChange={setShowBadges}
            onShowDescriptionsChange={setShowDescriptions}
            onOpenSpotlight={() => setSpotlightOpen(true)}
          />
        </SidebarContent>
      </Sidebar>
      
      {/* Spotlight search dialog */}
      <NavigationSpotlight
        open={spotlightOpen}
        onOpenChange={setSpotlightOpen}
      />
    </>
  );
}
