import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartPhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  showCountryBadge?: boolean;
}

interface CountryInfo {
  code: string;
  name: string;
  pattern: RegExp;
}

const COUNTRY_PREFIXES: { [key: string]: CountryInfo } = {
  '+1': { code: 'US', name: 'USA/Canada', pattern: /^\+1\d{10}$/ },
  '+44': { code: 'GB', name: 'UK', pattern: /^\+44\d{10}$/ },
  '+49': { code: 'DE', name: 'Germany', pattern: /^\+49\d{10,11}$/ },
  '+33': { code: 'FR', name: 'France', pattern: /^\+33\d{9}$/ },
  '+81': { code: 'JP', name: 'Japan', pattern: /^\+81\d{9,10}$/ },
  '+86': { code: 'CN', name: 'China', pattern: /^\+86\d{11}$/ },
  '+91': { code: 'IN', name: 'India', pattern: /^\+91\d{10}$/ },
  '+55': { code: 'BR', name: 'Brazil', pattern: /^\+55\d{10,11}$/ },
  '+61': { code: 'AU', name: 'Australia', pattern: /^\+61\d{9}$/ },
  '+7': { code: 'RU', name: 'Russia', pattern: /^\+7\d{10}$/ },
  '+39': { code: 'IT', name: 'Italy', pattern: /^\+39\d{9,10}$/ },
  '+34': { code: 'ES', name: 'Spain', pattern: /^\+34\d{9}$/ },
  '+82': { code: 'KR', name: 'South Korea', pattern: /^\+82\d{9,10}$/ },
  '+31': { code: 'NL', name: 'Netherlands', pattern: /^\+31\d{9}$/ },
  '+46': { code: 'SE', name: 'Sweden', pattern: /^\+46\d{9}$/ },
  '+41': { code: 'CH', name: 'Switzerland', pattern: /^\+41\d{9}$/ },
  '+48': { code: 'PL', name: 'Poland', pattern: /^\+48\d{9}$/ },
  '+52': { code: 'MX', name: 'Mexico', pattern: /^\+52\d{10}$/ },
  '+971': { code: 'AE', name: 'UAE', pattern: /^\+971\d{8,9}$/ },
  '+972': { code: 'IL', name: 'Israel', pattern: /^\+972\d{9}$/ },
  '+966': { code: 'SA', name: 'Saudi Arabia', pattern: /^\+966\d{9}$/ },
  '+65': { code: 'SG', name: 'Singapore', pattern: /^\+65\d{8}$/ },
  '+852': { code: 'HK', name: 'Hong Kong', pattern: /^\+852\d{8}$/ },
  '+27': { code: 'ZA', name: 'South Africa', pattern: /^\+27\d{9}$/ },
};

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the start
  if (cleaned.includes('+') && cleaned.indexOf('+') !== 0) {
    cleaned = cleaned.replace(/\+/g, '');
    cleaned = '+' + cleaned;
  }
  
  // Auto-add + if starts with country code without it
  if (/^\d{1,3}/.test(cleaned) && cleaned.length > 3) {
    // Check if it looks like an international number
    const possiblePrefix = '+' + cleaned.slice(0, 3);
    const possiblePrefix2 = '+' + cleaned.slice(0, 2);
    const possiblePrefix1 = '+' + cleaned.slice(0, 1);
    
    if (COUNTRY_PREFIXES[possiblePrefix] || COUNTRY_PREFIXES[possiblePrefix2] || COUNTRY_PREFIXES[possiblePrefix1]) {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
};

const detectCountry = (phone: string): CountryInfo | null => {
  for (const [prefix, info] of Object.entries(COUNTRY_PREFIXES)) {
    if (phone.startsWith(prefix)) {
      return info;
    }
  }
  return null;
};

const validatePhone = (phone: string): boolean => {
  if (!phone || phone.length < 8) return false;
  
  // Check against known patterns
  const country = detectCountry(phone);
  if (country && country.pattern.test(phone)) {
    return true;
  }
  
  // Generic international format validation
  const genericPattern = /^\+\d{8,15}$/;
  return genericPattern.test(phone);
};

export const SmartPhoneInput = forwardRef<HTMLInputElement, SmartPhoneInputProps>(
  ({ value = '', onChange, onValidChange, showCountryBadge = true, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null);

    useEffect(() => {
      setInternalValue(value);
      const formatted = formatPhoneNumber(value);
      setDetectedCountry(detectCountry(formatted));
      if (formatted.length >= 8) {
        setIsValid(validatePhone(formatted));
      } else {
        setIsValid(null);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formatted = formatPhoneNumber(rawValue);
      
      setInternalValue(formatted);
      setDetectedCountry(detectCountry(formatted));
      
      const valid = formatted.length >= 8 ? validatePhone(formatted) : null;
      setIsValid(valid);
      onValidChange?.(valid === true);
      
      onChange?.(formatted);
    };

    return (
      <div className="relative">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            type="tel"
            value={internalValue}
            onChange={handleChange}
            className={cn(
              "pl-9 pr-20",
              isValid === true && "border-green-500 focus-visible:ring-green-500",
              isValid === false && "border-destructive focus-visible:ring-destructive",
              className
            )}
            placeholder="+1 234 567 8900"
            {...props}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showCountryBadge && detectedCountry && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {detectedCountry.code}
              </Badge>
            )}
            {isValid === true && <Check className="h-4 w-4 text-green-500" />}
            {isValid === false && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        {isValid === false && internalValue.length >= 8 && (
          <p className="text-xs text-destructive mt-1">
            Invalid phone format. Use international format (+1234567890)
          </p>
        )}
      </div>
    );
  }
);

SmartPhoneInput.displayName = 'SmartPhoneInput';
