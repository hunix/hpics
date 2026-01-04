// Google Contacts / Outlook CSV Parser
// Handles Google CSV and Outlook CSV formats with smart header detection

import { ParseResult, ParseWarning } from '../linkedin/linkedinCsvParser';

// Expanded header patterns for both Google CSV and Outlook CSV formats
const GOOGLE_HEADER_PATTERNS: Record<string, string[]> = {
  first_name: ['firstname', 'givenname', 'first', 'given'],
  middle_name: ['middlename', 'middle'],
  last_name: ['lastname', 'familyname', 'surname', 'family'],
  // Email patterns - handle numbered emails
  email: ['emailaddress', 'email', 'primaryemail', 'emailvalue'],
  email2: ['email2address', 'email2value'],
  email3: ['email3address', 'email3value'],
  // Phone patterns
  phone: ['primaryphone', 'phone', 'mainphone', 'phonevalue'],
  mobile_phone: ['mobilephone', 'cellphone', 'mobile', 'mobilenumber'],
  home_phone: ['homephone', 'homenumber'],
  business_phone: ['businessphone', 'workphone', 'officephone', 'businessnumber'],
  // Organization
  organization: ['company', 'organization', 'companyname', 'organizationname', 'employer'],
  job_title: ['jobtitle', 'title', 'position', 'role', 'organizationtitle'],
  department: ['department', 'businessdepartment'],
  // Personal
  notes: ['notes', 'note'],
  birthday: ['birthday', 'dateofbirth', 'birthdate'],
  anniversary: ['anniversary'],
  website: ['webpage', 'website', 'url', 'personalwebpage', 'businesswebpage'],
  nickname: ['nickname', 'shortname'],
  // Address fields
  home_address: ['homeaddress', 'homestreet', 'homestreetaddress'],
  home_city: ['homecity'],
  home_state: ['homestate', 'homestateprovince'],
  home_country: ['homecountry', 'homecountryregion'],
  home_postal: ['homepostalcode', 'homezip'],
  business_address: ['businessaddress', 'businessstreet', 'businessstreetaddress'],
  business_city: ['businesscity'],
  business_state: ['businessstate', 'businessstateprovince'],
  business_country: ['businesscountry', 'businesscountryregion'],
};

// Known header keywords for detection
const HEADER_KEYWORDS = [
  'first', 'last', 'name', 'email', 'company', 'organization',
  'phone', 'mobile', 'address', 'city', 'state', 'country', 'postal', 'zip',
  'title', 'department', 'notes', 'birthday', 'anniversary', 'website',
  'business', 'home', 'primary', 'middle', 'nickname', 'given', 'family'
];

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  result.push(current.trim());
  return result;
}

function detectDelimiter(lines: string[]): { delimiter: string; confidence: 'high' | 'medium' | 'low' } {
  const delimiters = [',', ';', '\t', '|'];
  const scores: Record<string, { count: number; consistency: number }> = {};
  
  const sampleLines = lines.filter(l => l.trim()).slice(0, 10);
  
  for (const delim of delimiters) {
    const counts = sampleLines.map(line => {
      let count = 0;
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === delim && !inQuotes) count++;
      }
      return count;
    });
    
    const nonZeroCounts = counts.filter(c => c > 0);
    if (nonZeroCounts.length === 0) continue;
    
    const avgCount = nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;
    const variance = nonZeroCounts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / nonZeroCounts.length;
    
    scores[delim] = {
      count: avgCount,
      consistency: variance < 1 ? 1 : 1 / variance
    };
  }
  
  let bestDelim = ',';
  let bestScore = 0;
  
  for (const [delim, { count, consistency }] of Object.entries(scores)) {
    const score = count * consistency;
    if (score > bestScore) {
      bestScore = score;
      bestDelim = delim;
    }
  }
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestScore > 5) confidence = 'high';
  else if (bestScore > 2) confidence = 'medium';
  
  return { delimiter: bestDelim, confidence };
}

// Normalize header - preserve numbers for multi-value fields
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[\s_-]+/g, '')  // Remove spaces, underscores, dashes
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
    .trim();
}

// Check if a value looks like data (not a header)
function looksLikeData(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  
  // Email pattern
  if (/@/.test(trimmed)) return true;
  
  // URL pattern
  if (/^https?:\/\//.test(trimmed)) return true;
  
  // Phone number patterns (7+ digits with optional formatting)
  if (/^[\+\d\(\)\-\s\.]{7,}$/.test(trimmed)) return true;
  
  // Date patterns
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(trimmed)) return true;
  if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(trimmed)) return true;
  
  return false;
}

// Score a row to determine if it's likely a header row
function scoreHeaderRow(columns: string[]): number {
  let score = 0;
  let headerKeywordMatches = 0;
  let dataPatternMatches = 0;
  
  for (const col of columns) {
    const normalized = col.toLowerCase().replace(/['"_\-\s]/g, '');
    
    // Check for header keywords
    for (const keyword of HEADER_KEYWORDS) {
      if (normalized.includes(keyword)) {
        headerKeywordMatches++;
        score += 10;
        break;
      }
    }
    
    // Check for data patterns (negative signal)
    if (looksLikeData(col)) {
      dataPatternMatches++;
      score -= 15;
    }
    
    // Short text-only values are more likely headers
    if (/^[a-zA-Z\s\d]+$/.test(col.trim()) && col.trim().length < 40) {
      score += 1;
    }
  }
  
  return score;
}

// Find header line (skip preamble if present)
function findHeaderLine(lines: string[], delimiter: string): number {
  const candidates: { index: number; score: number; columnCount: number }[] = [];
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line, delimiter);
    const score = scoreHeaderRow(columns);
    
    candidates.push({
      index: i,
      score,
      columnCount: columns.length
    });
  }
  
  if (candidates.length === 0) return 0;
  
  // Sort by score (highest first), then by column count, then by index
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.columnCount !== a.columnCount) return b.columnCount - a.columnCount;
    return a.index - b.index;
  });
  
  const best = candidates[0];
  if (best.score > 0) {
    return best.index;
  }
  
  // Fallback: use line 0 if it has at least 3 columns
  const line0 = candidates.find(c => c.index === 0);
  if (line0 && line0.columnCount >= 3) {
    return 0;
  }
  
  return best.index;
}

export interface GoogleContact {
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name?: string;
  email: string;
  email2?: string;
  email3?: string;
  phone?: string;
  mobile_phone?: string;
  home_phone?: string;
  business_phone?: string;
  organization?: string;
  job_title?: string;
  department?: string;
  notes?: string;
  address?: string;
  birthday?: string;
  anniversary?: string;
  website?: string;
  nickname?: string;
}

export interface GoogleParseResult extends ParseResult {
  contacts: GoogleContact[];
  headerLineIndex: number;
  columnMapping: Record<string, number>;
}

export function parseGoogleCSV(content: string): GoogleParseResult {
  const warnings: ParseWarning[] = [];
  
  // Detect and strip BOM
  const bomDetected = content.charCodeAt(0) === 0xFEFF;
  if (bomDetected) {
    content = content.slice(1);
  }
  
  // Detect line ending style
  const hasCRLF = content.includes('\r\n');
  const lineEndingStyle = hasCRLF ? 'crlf' : 'lf';
  
  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const allLines = normalizedContent.split('\n');
  const rawLineCount = allLines.length;
  const sampleRawLines = allLines.slice(0, 15);
  
  // Filter empty lines
  const nonEmptyLines = allLines.filter(line => line.trim());
  
  if (nonEmptyLines.length === 0) {
    return {
      success: false,
      headers: [],
      normalizedHeaders: [],
      delimiter: ',',
      delimiterConfidence: 'low',
      headerLineIndex: 0,
      rawLineCount,
      parsedRowCount: 0,
      warnings: [{ type: 'parse_error', line: 0, message: 'File is empty' }],
      sampleRawLines,
      rows: [],
      bomDetected,
      lineEndingStyle,
      error: 'File is empty',
      contacts: [],
      columnMapping: {}
    };
  }
  
  // Detect delimiter
  const { delimiter, confidence: delimiterConfidence } = detectDelimiter(nonEmptyLines);
  
  // Find header line using smart detection
  const headerLineIndex = findHeaderLine(nonEmptyLines, delimiter);
  
  // Parse headers
  const headers = parseCSVLine(nonEmptyLines[headerLineIndex], delimiter);
  const normalizedHeaders = headers.map(normalizeHeader);
  
  console.log('[Google Parser] Header line index:', headerLineIndex);
  console.log('[Google Parser] Raw headers:', headers.slice(0, 15));
  console.log('[Google Parser] Normalized headers:', normalizedHeaders.slice(0, 15));
  
  // Build column mapping with priority for first match
  const columnMapping: Record<string, number> = {};
  
  for (const [field, patterns] of Object.entries(GOOGLE_HEADER_PATTERNS)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      for (const pattern of patterns) {
        // Exact match first, then contains match
        if (header === pattern || header.includes(pattern)) {
          if (columnMapping[field] === undefined) {
            columnMapping[field] = i;
            break;
          }
        }
      }
      if (columnMapping[field] !== undefined) break;
    }
  }
  
  console.log('[Google Parser] Column mapping:', columnMapping);
  
  // Parse data rows (skip header and any preamble)
  const rows: string[][] = [];
  const contacts: GoogleContact[] = [];
  
  for (let i = headerLineIndex + 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];
    const row = parseCSVLine(line, delimiter);
    rows.push(row);
    
    const getValue = (field: string): string => {
      const idx = columnMapping[field];
      if (idx === undefined || idx >= row.length) return '';
      return row[idx]?.replace(/^["']|["']$/g, '').trim() || '';
    };
    
    // Get all potential values
    let firstName = getValue('first_name');
    const middleName = getValue('middle_name');
    let lastName = getValue('last_name');
    const email = getValue('email').toLowerCase();
    const email2 = getValue('email2').toLowerCase();
    const email3 = getValue('email3').toLowerCase();
    
    // Get best phone (priority: primary > mobile > business > home)
    const primaryPhone = getValue('phone');
    const mobilePhone = getValue('mobile_phone');
    const businessPhone = getValue('business_phone');
    const homePhone = getValue('home_phone');
    const phone = primaryPhone || mobilePhone || businessPhone || homePhone;
    
    const organization = getValue('organization');
    const jobTitle = getValue('job_title');
    const department = getValue('department');
    const notes = getValue('notes');
    const birthday = getValue('birthday');
    const anniversary = getValue('anniversary');
    const website = getValue('website');
    const nickname = getValue('nickname');
    
    // Build address from parts
    const homeAddress = getValue('home_address');
    const homeCity = getValue('home_city');
    const homeState = getValue('home_state');
    const homeCountry = getValue('home_country');
    const homePostal = getValue('home_postal');
    const address = [homeAddress, homeCity, homeState, homePostal, homeCountry]
      .filter(Boolean).join(', ');
    
    // Skip empty rows
    if (!firstName && !lastName && !email && !phone && !organization) {
      continue;
    }
    
    // Handle name fallbacks
    if (!firstName && !lastName && email) {
      firstName = email.split('@')[0];
    } else if (!firstName && lastName) {
      firstName = lastName;
      lastName = '';
    }
    
    if (!firstName) {
      firstName = 'Unknown Contact';
    }
    
    // Build full name with middle name
    const fullNameParts = [firstName, middleName, lastName].filter(Boolean);
    
    contacts.push({
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      full_name: fullNameParts.join(' '),
      email: email || email2 || email3,
      email2,
      email3,
      phone,
      mobile_phone: mobilePhone,
      home_phone: homePhone,
      business_phone: businessPhone,
      organization,
      job_title: jobTitle,
      department,
      notes,
      address,
      birthday,
      anniversary,
      website,
      nickname
    });
  }
  
  console.log('[Google Parser] Parsed contacts:', contacts.length);
  if (contacts.length > 0) {
    console.log('[Google Parser] Sample contact:', contacts[0]);
  }
  
  return {
    success: true,
    headers,
    normalizedHeaders,
    delimiter,
    delimiterConfidence,
    headerLineIndex,
    rawLineCount,
    parsedRowCount: rows.length,
    warnings,
    sampleRawLines,
    rows,
    bomDetected,
    lineEndingStyle,
    contacts,
    columnMapping
  };
}
