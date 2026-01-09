import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: 'navigation' | 'actions' | 'dialogs' | 'editing';
  action: () => void;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  showToast?: boolean;
}

// Global shortcuts registry
const globalShortcuts: KeyboardShortcut[] = [];

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[] = [],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, showToast = false } = options;
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore if focused on input elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape to work in inputs
      if (event.key !== 'Escape') return;
    }
    
    const allShortcuts = [...globalShortcuts, ...shortcuts];
    
    for (const shortcut of allShortcuts) {
      if (shortcut.enabled === false) continue;
      
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const modifiers = shortcut.modifiers || [];
      
      const ctrlMatch = modifiers.includes('ctrl') ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
      const altMatch = modifiers.includes('alt') ? event.altKey : !event.altKey;
      const shiftMatch = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey;
      const metaMatch = modifiers.includes('meta') ? event.metaKey : true;
      
      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        
        if (showToast) {
          toast({
            title: shortcut.description,
            duration: 1500,
          });
        }
        return;
      }
    }
  }, [shortcuts, enabled, showToast]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return { shortcuts: [...globalShortcuts, ...shortcuts] };
}

// Hook to register global navigation shortcuts
export function useGlobalNavigationShortcuts() {
  const navigate = useNavigate();
  
  const navigationShortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      id: 'go-dashboard',
      key: 'g',
      modifiers: ['alt'],
      description: 'Go to Dashboard',
      category: 'navigation',
      action: () => navigate('/dashboard'),
    },
    {
      id: 'go-contacts',
      key: 'c',
      modifiers: ['alt'],
      description: 'Go to Contacts',
      category: 'navigation',
      action: () => navigate('/contacts'),
    },
    {
      id: 'go-calendar',
      key: 'l',
      modifiers: ['alt'],
      description: 'Go to Calendar',
      category: 'navigation',
      action: () => navigate('/calendar'),
    },
    {
      id: 'go-messages',
      key: 'm',
      modifiers: ['alt'],
      description: 'Go to Messages',
      category: 'navigation',
      action: () => navigate('/communications'),
    },
    {
      id: 'go-settings',
      key: ',',
      modifiers: ['ctrl'],
      description: 'Go to Settings',
      category: 'navigation',
      action: () => navigate('/settings'),
    },
    {
      id: 'go-back',
      key: '[',
      modifiers: ['ctrl'],
      description: 'Go Back',
      category: 'navigation',
      action: () => navigate(-1),
    },
    {
      id: 'go-forward',
      key: ']',
      modifiers: ['ctrl'],
      description: 'Go Forward',
      category: 'navigation',
      action: () => navigate(1),
    },
  ], [navigate]);
  
  useKeyboardShortcuts(navigationShortcuts);
  
  return navigationShortcuts;
}

// Get all registered shortcuts for help display
export function getShortcutsByCategory(shortcuts: KeyboardShortcut[]) {
  const categories: Record<string, KeyboardShortcut[]> = {
    navigation: [],
    actions: [],
    dialogs: [],
    editing: [],
  };
  
  shortcuts.forEach(shortcut => {
    if (categories[shortcut.category]) {
      categories[shortcut.category].push(shortcut);
    }
  });
  
  return categories;
}

// Format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const modifiers = shortcut.modifiers || [];
  
  if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (modifiers.includes('alt')) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  if (modifiers.includes('shift')) {
    parts.push('⇧');
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}
