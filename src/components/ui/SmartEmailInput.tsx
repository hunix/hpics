import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartEmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
}

const COMMON_TYPOS: { [key: string]: string } = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlool.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'icoud.com': 'icloud.com',
  'iclod.com': 'icloud.com',
  'icluod.com': 'icloud.com',
  'protonmal.com': 'protonmail.com',
  'protonmai.com': 'protonmail.com',
};

const COMMON_TLDS = ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'de', 'fr', 'jp', 'au', 'ca', 'in', 'br', 'nl', 'es', 'it', 'ru', 'ch', 'se', 'no', 'dk', 'fi', 'pl', 'at', 'be', 'pt', 'ie', 'nz', 'za', 'mx', 'ar', 'cl', 'co.uk', 'com.au', 'co.jp', 'co.in', 'com.br', 'co.za'];

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const suggestCorrection = (email: string): string | null => {
  if (!email.includes('@')) return null;
  
  const [localPart, domain] = email.split('@');
  if (!domain) return null;
  
  const lowerDomain = domain.toLowerCase();
  
  // Check for common typos
  if (COMMON_TYPOS[lowerDomain]) {
    return `${localPart}@${COMMON_TYPOS[lowerDomain]}`;
  }
  
  // Check for TLD typos
  const parts = lowerDomain.split('.');
  if (parts.length >= 2) {
    const tld = parts[parts.length - 1];
    const domainWithoutTld = parts.slice(0, -1).join('.');
    
    // Common TLD typos
    const tldCorrections: { [key: string]: string } = {
      'con': 'com',
      'cmo': 'com',
      'ocm': 'com',
      'vom': 'com',
      'xom': 'com',
      'copm': 'com',
      'comm': 'com',
      'orgg': 'org',
      'ogr': 'org',
      'rog': 'org',
      'nett': 'net',
      'nte': 'net',
      'ioo': 'io',
      'oi': 'io',
    };
    
    if (tldCorrections[tld]) {
      return `${localPart}@${domainWithoutTld}.${tldCorrections[tld]}`;
    }
  }
  
  return null;
};

export const SmartEmailInput = forwardRef<HTMLInputElement, SmartEmailInputProps>(
  ({ value = '', onChange, onValidChange, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    useEffect(() => {
      setInternalValue(value);
      if (value.length > 3 && value.includes('@')) {
        const valid = validateEmail(value);
        setIsValid(valid);
        onValidChange?.(valid);
        
        if (!valid || value !== value.toLowerCase()) {
          const corrected = suggestCorrection(value);
          setSuggestion(corrected);
        } else {
          setSuggestion(null);
        }
      } else {
        setIsValid(null);
        setSuggestion(null);
      }
    }, [value, onValidChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.trim().toLowerCase();
      setInternalValue(rawValue);
      
      if (rawValue.length > 3 && rawValue.includes('@')) {
        const valid = validateEmail(rawValue);
        setIsValid(valid);
        onValidChange?.(valid);
        
        const corrected = suggestCorrection(rawValue);
        setSuggestion(corrected);
      } else {
        setIsValid(null);
        setSuggestion(null);
      }
      
      onChange?.(rawValue);
    };

    const applySuggestion = () => {
      if (suggestion) {
        setInternalValue(suggestion);
        setSuggestion(null);
        setIsValid(validateEmail(suggestion));
        onChange?.(suggestion);
      }
    };

    return (
      <div className="space-y-1">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            type="email"
            value={internalValue}
            onChange={handleChange}
            className={cn(
              "pl-9 pr-10",
              isValid === true && "border-green-500 focus-visible:ring-green-500",
              isValid === false && "border-destructive focus-visible:ring-destructive",
              className
            )}
            placeholder="email@example.com"
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid === true && <Check className="h-4 w-4 text-green-500" />}
            {isValid === false && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        
        {suggestion && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Did you mean:</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-primary"
              onClick={applySuggestion}
            >
              {suggestion}
            </Button>
          </div>
        )}
        
        {isValid === false && !suggestion && internalValue.includes('@') && (
          <p className="text-xs text-destructive">
            Please enter a valid email address
          </p>
        )}
      </div>
    );
  }
);

SmartEmailInput.displayName = 'SmartEmailInput';
