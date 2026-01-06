import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartNameInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  nameType?: 'first' | 'last' | 'full';
  onSuggestion?: (suggestion: { firstName?: string; lastName?: string }) => void;
}

const capitalizeWord = (word: string): string => {
  if (!word) return '';
  
  // Handle special prefixes (Mc, Mac, O', etc.)
  if (word.toLowerCase().startsWith('mc') && word.length > 2) {
    return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
  }
  if (word.toLowerCase().startsWith('mac') && word.length > 3) {
    return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
  }
  if (word.startsWith("o'") || word.startsWith("O'")) {
    return "O'" + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
  }
  
  // Handle hyphenated names
  if (word.includes('-')) {
    return word.split('-').map(part => capitalizeWord(part)).join('-');
  }
  
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

const formatName = (value: string, nameType: 'first' | 'last' | 'full'): string => {
  const trimmed = value.trim();
  
  if (nameType === 'full') {
    return trimmed.split(/\s+/).map(word => capitalizeWord(word)).join(' ');
  }
  
  // For first or last name, capitalize properly
  return capitalizeWord(trimmed);
};

const detectNameIssues = (value: string, nameType: 'first' | 'last' | 'full'): { issue: string; suggestion?: { firstName?: string; lastName?: string } } | null => {
  const trimmed = value.trim();
  
  if (!trimmed) return null;
  
  // Detect if full name entered in first name field
  if (nameType === 'first' && trimmed.includes(' ')) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return {
        issue: 'This looks like a full name',
        suggestion: {
          firstName: capitalizeWord(parts[0]),
          lastName: parts.slice(1).map(p => capitalizeWord(p)).join(' '),
        },
      };
    }
  }
  
  // Detect reversed name (last, first format)
  if (nameType === 'full' && trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return {
        issue: 'Name appears to be in "Last, First" format',
        suggestion: {
          firstName: capitalizeWord(parts[1]),
          lastName: capitalizeWord(parts[0]),
        },
      };
    }
  }
  
  // Detect all caps or all lowercase
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    if (trimmed.length > 1) {
      return {
        issue: 'Name will be auto-capitalized',
      };
    }
  }
  
  return null;
};

export const SmartNameInput = forwardRef<HTMLInputElement, SmartNameInputProps>(
  ({ value = '', onChange, nameType = 'first', onSuggestion, className, placeholder, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [issue, setIssue] = useState<{ issue: string; suggestion?: { firstName?: string; lastName?: string } } | null>(null);

    useEffect(() => {
      setInternalValue(value);
      const detected = detectNameIssues(value, nameType);
      setIssue(detected);
    }, [value, nameType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setInternalValue(rawValue);
      
      const detected = detectNameIssues(rawValue, nameType);
      setIssue(detected);
      
      onChange?.(rawValue);
    };

    const handleBlur = () => {
      // Auto-format on blur
      const formatted = formatName(internalValue, nameType);
      if (formatted !== internalValue) {
        setInternalValue(formatted);
        onChange?.(formatted);
      }
    };

    const applySuggestion = () => {
      if (issue?.suggestion) {
        onSuggestion?.(issue.suggestion);
        if (issue.suggestion.firstName && nameType === 'first') {
          setInternalValue(issue.suggestion.firstName);
          onChange?.(issue.suggestion.firstName);
        }
        setIssue(null);
      }
    };

    const defaultPlaceholder = nameType === 'first' ? 'First name' : nameType === 'last' ? 'Last name' : 'Full name';

    return (
      <div className="space-y-1">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            type="text"
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              "pl-9",
              issue && "border-yellow-500 focus-visible:ring-yellow-500",
              className
            )}
            placeholder={placeholder || defaultPlaceholder}
            {...props}
          />
          {issue && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
          )}
        </div>
        
        {issue && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-600 dark:text-yellow-400">{issue.issue}</span>
            {issue.suggestion && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={applySuggestion}
              >
                Split names
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

SmartNameInput.displayName = 'SmartNameInput';
