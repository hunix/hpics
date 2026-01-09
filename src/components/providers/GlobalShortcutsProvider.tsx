import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useGlobalNavigationShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/navigation/KeyboardShortcutsDialog';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

interface GlobalShortcutsContextValue {
  shortcuts: KeyboardShortcut[];
  showShortcutsDialog: () => void;
  showOnboarding: () => void;
}

const GlobalShortcutsContext = createContext<GlobalShortcutsContextValue | null>(null);

export function useGlobalShortcuts() {
  const context = useContext(GlobalShortcutsContext);
  if (!context) {
    throw new Error('useGlobalShortcuts must be used within GlobalShortcutsProvider');
  }
  return context;
}

interface GlobalShortcutsProviderProps {
  children: ReactNode;
}

export function GlobalShortcutsProvider({ children }: GlobalShortcutsProviderProps) {
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Register navigation shortcuts
  const navigationShortcuts = useGlobalNavigationShortcuts();
  
  // All shortcuts including navigation
  const allShortcuts: KeyboardShortcut[] = [
    ...navigationShortcuts,
    {
      id: 'show-shortcuts',
      key: '/',
      modifiers: ['ctrl'],
      description: 'Show all shortcuts',
      category: 'dialogs',
      action: () => setShortcutsDialogOpen(true),
    },
  ];
  
  const handleShowShortcuts = useCallback(() => {
    setShortcutsDialogOpen(true);
  }, []);
  
  const handleShowOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);
  
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);
  
  return (
    <GlobalShortcutsContext.Provider 
      value={{ 
        shortcuts: allShortcuts, 
        showShortcutsDialog: handleShowShortcuts,
        showOnboarding: handleShowOnboarding,
      }}
    >
      {children}
      
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
        shortcuts={allShortcuts}
      />
      
      {showOnboarding && (
        <OnboardingTour 
          onComplete={handleOnboardingComplete}
          forceShow
        />
      )}
    </GlobalShortcutsContext.Provider>
  );
}
