import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-full justify-start"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="mr-2 h-4 w-4" />
          Light Mode
        </>
      ) : (
        <>
          <Moon className="mr-2 h-4 w-4" />
          Dark Mode
        </>
      )}
    </Button>
  );
}
