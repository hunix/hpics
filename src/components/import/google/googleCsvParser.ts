// Google Contacts / Outlook CSV Parser
// Handles the "Google CSV" format exported from Google Contacts

import { ParseResult, ParseWarning, normalizeHeader as baseNormalizeHeader } from '../linkedin/linkedinCsvParser';

// Google CSV has different header patterns than LinkedIn
const GOOGLE_HEADER_PATTERNS = {
  first_name: ['givenname', 'firstname', 'first', 'name'],
  last_name: ['familyname', 'lastname', 'last', 'surname'],
  email: ['email', 'e-mail', 'emailaddress', 'email1value'],
  phone: ['phone', 'telephone', 'mobile', 'phone1value', 'primaryphone'],
  organization: ['organization', 'company', 'organization1name', 'companyname'],
  job_title: ['jobtitle', 'title', 'organization1title', 'position'],
  notes: ['notes', 'note'],
  address: ['address', 'streetaddress', 'address1formatted'],
  birthday: ['birthday', 'dateofbirth', 'dob'],
  website: ['website', 'url', 'webpage'],
  nickname: ['nickname', 'shortname'],
};

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

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[\s_-]+/g, '')
    .replace(/\d+/g, '') // Remove numbers like "Email 1 - Value" -> "emailvalue"
    .trim();
}

export interface GoogleContact {
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  notes?: string;
  address?: string;
  birthday?: string;
  website?: string;
  nickname?: string;
}

export interface GoogleParseResult extends ParseResult {
  contacts: GoogleContact[];
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
      contacts: []
    };
  }
  
  // Detect delimiter
  const { delimiter, confidence: delimiterConfidence } = detectDelimiter(nonEmptyLines);
  
  // Parse headers (first line)
  const headers = parseCSVLine(nonEmptyLines[0], delimiter);
  const normalizedHeaders = headers.map(normalizeHeader);
  
  // Build column mapping
  const columnMap: Record<string, number> = {};
  
  for (const [field, patterns] of Object.entries(GOOGLE_HEADER_PATTERNS)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      for (const pattern of patterns) {
        if (header === pattern || header.includes(pattern)) {
          if (columnMap[field] === undefined) {
            columnMap[field] = i;
          }
          break;
        }
      }
    }
  }
  
  console.log('[Google Parser] Column mapping:', columnMap);
  console.log('[Google Parser] Headers:', headers.slice(0, 10));
  
  // Parse data rows
  const rows: string[][] = [];
  const contacts: GoogleContact[] = [];
  
  for (let i = 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];
    const row = parseCSVLine(line, delimiter);
    rows.push(row);
    
    const getValue = (field: string): string => {
      const idx = columnMap[field];
      if (idx === undefined || idx >= row.length) return '';
      return row[idx]?.replace(/['"]/g, '').trim() || '';
    };
    
    let firstName = getValue('first_name');
    let lastName = getValue('last_name');
    const email = getValue('email').toLowerCase();
    const phone = getValue('phone');
    const organization = getValue('organization');
    const jobTitle = getValue('job_title');
    const notes = getValue('notes');
    const address = getValue('address');
    const birthday = getValue('birthday');
    const website = getValue('website');
    const nickname = getValue('nickname');
    
    // Skip empty rows
    if (!firstName && !lastName && !email && !phone) {
      warnings.push({ type: 'empty_line', line: i + 1, message: 'Empty contact row' });
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
    
    contacts.push({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      organization,
      job_title: jobTitle,
      notes,
      address,
      birthday,
      website,
      nickname,
      full_name: `${firstName} ${lastName}`.trim()
    });
  }
  
  console.log('[Google Parser] Parsed contacts:', contacts.length);
  
  return {
    success: true,
    headers,
    normalizedHeaders,
    delimiter,
    delimiterConfidence,
    headerLineIndex: 0,
    rawLineCount,
    parsedRowCount: rows.length,
    warnings,
    sampleRawLines,
    rows,
    bomDetected,
    lineEndingStyle,
    contacts
  };
}
