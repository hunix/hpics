// Country code to flag emoji mapping using ISO 3166-1 alpha-2 codes
// Flag emojis are created from regional indicator symbols

// Common country name to ISO code mapping
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // English names
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'germany': 'DE',
  'france': 'FR',
  'spain': 'ES',
  'italy': 'IT',
  'japan': 'JP',
  'china': 'CN',
  'india': 'IN',
  'brazil': 'BR',
  'mexico': 'MX',
  'russia': 'RU',
  'south korea': 'KR',
  'korea': 'KR',
  'netherlands': 'NL',
  'holland': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'poland': 'PL',
  'portugal': 'PT',
  'greece': 'GR',
  'turkey': 'TR',
  'ireland': 'IE',
  'new zealand': 'NZ',
  'singapore': 'SG',
  'hong kong': 'HK',
  'taiwan': 'TW',
  'thailand': 'TH',
  'vietnam': 'VN',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'philippines': 'PH',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'egypt': 'EG',
  'south africa': 'ZA',
  'nigeria': 'NG',
  'kenya': 'KE',
  'morocco': 'MA',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'venezuela': 'VE',
  'saudi arabia': 'SA',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'dubai': 'AE',
  'israel': 'IL',
  'jordan': 'JO',
  'lebanon': 'LB',
  'kuwait': 'KW',
  'qatar': 'QA',
  'bahrain': 'BH',
  'oman': 'OM',
  'iraq': 'IQ',
  'iran': 'IR',
  'ukraine': 'UA',
  'romania': 'RO',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'hungary': 'HU',
  'slovakia': 'SK',
  'croatia': 'HR',
  'serbia': 'RS',
  'bulgaria': 'BG',
  'slovenia': 'SI',
  'luxembourg': 'LU',
  'iceland': 'IS',
  'cyprus': 'CY',
  'malta': 'MT',
  'estonia': 'EE',
  'latvia': 'LV',
  'lithuania': 'LT',
  // Arabic names
  'الإمارات': 'AE',
  'السعودية': 'SA',
  'مصر': 'EG',
  'الأردن': 'JO',
  'لبنان': 'LB',
  'الكويت': 'KW',
  'قطر': 'QA',
  'البحرين': 'BH',
  'عمان': 'OM',
  'العراق': 'IQ',
  'سوريا': 'SY',
  'فلسطين': 'PS',
  'المغرب': 'MA',
  'تونس': 'TN',
  'الجزائر': 'DZ',
  'ليبيا': 'LY',
  'السودان': 'SD',
  'اليمن': 'YE',
};

// Convert ISO code to flag emoji
export function getCountryFlag(countryInput: string | null | undefined): string | null {
  if (!countryInput) return null;
  
  const input = countryInput.trim().toLowerCase();
  
  // Try to find the ISO code
  let code = COUNTRY_NAME_TO_CODE[input];
  
  // If not found in mapping, check if input is already an ISO code (2 letters)
  if (!code && countryInput.length === 2) {
    code = countryInput.toUpperCase();
  }
  
  if (!code) return null;
  
  // Convert to regional indicator symbols
  // Each letter is converted to its regional indicator (🇦 = 0x1F1E6 for A)
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
  
  return String.fromCodePoint(...codePoints);
}

// Get country code from country name
export function getCountryCode(countryName: string | null | undefined): string | null {
  if (!countryName) return null;
  const input = countryName.trim().toLowerCase();
  return COUNTRY_NAME_TO_CODE[input] || (countryName.length === 2 ? countryName.toUpperCase() : null);
}

// Component-friendly flag with fallback
export function getCountryFlagWithFallback(country: string | null | undefined): { flag: string | null; code: string | null } {
  const flag = getCountryFlag(country);
  const code = getCountryCode(country);
  return { flag, code };
}
