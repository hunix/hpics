import { getCountryFlagWithFallback } from '@/lib/countryFlags';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CountryFlagProps {
  country: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function CountryFlag({ country, size = 'md', showTooltip = true }: CountryFlagProps) {
  if (!country) return null;
  
  const { flag } = getCountryFlagWithFallback(country);
  
  if (!flag) return null;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };
  
  const flagElement = (
    <span 
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-sm`}
      role="img" 
      aria-label={country}
    >
      {flag}
    </span>
  );
  
  if (!showTooltip) return flagElement;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {flagElement}
        </TooltipTrigger>
        <TooltipContent>
          <p>{country}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
