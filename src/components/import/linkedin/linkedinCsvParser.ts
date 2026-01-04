// LinkedIn CSV Parser with full diagnostics
// This module handles robust CSV parsing with delimiter detection, preamble skipping, and detailed error tracking

export interface ParseWarning {
  type: 'column_mismatch' | 'unclosed_quote' | 'empty_line' | 'parse_error';
  line: number;
  message: string;
}

export interface ParseResult {
  success: boolean;
  headers: string[];
  normalizedHeaders: string[];
  delimiter: string;
  delimiterConfidence: 'high' | 'medium' | 'low';
  headerLineIndex: number;
  rawLineCount: number;
  parsedRowCount: number;
  warnings: ParseWarning[];
  sampleRawLines: string[];
  rows: string[][];
  bomDetected: boolean;
  lineEndingStyle: 'crlf' | 'lf' | 'cr' | 'mixed';
  error?: string;
}

const DELIMITERS = [',', ';', '\t', '|'] as const;

// Known LinkedIn/CSV header keywords for detection
const HEADER_KEYWORDS = [
  'first', 'last', 'name', 'email', 'company', 'organization', 
  'position', 'title', 'url', 'connected', 'date', 'notes', 'address',
  'phone', 'mobile', 'linkedin', 'twitter', 'facebook', 'website',
  'location', 'city', 'state', 'country', 'zip', 'postal', 'street',
  'department', 'industry', 'bio', 'summary', 'profile', 'contact'
];

// Parse a single CSV line respecting quotes
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
          // Escaped quote
          current += '"';
          i++;
        } else {
          // End of quoted field
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

// Detect line ending style
function detectLineEnding(content: string): 'crlf' | 'lf' | 'cr' | 'mixed' {
  const hasCRLF = content.includes('\r\n');
  const hasLF = content.includes('\n') && !hasCRLF;
  const hasCR = content.includes('\r') && !content.includes('\r\n');
  
  if (hasCRLF && !hasLF && !hasCR) return 'crlf';
  if (hasLF && !hasCRLF && !hasCR) return 'lf';
  if (hasCR && !hasCRLF && !hasLF) return 'cr';
  return 'mixed';
}

// Detect delimiter by analyzing line consistency
function detectDelimiter(lines: string[]): { delimiter: string; confidence: 'high' | 'medium' | 'low' } {
  const scores: Record<string, { count: number; consistency: number }> = {};
  
  // Sample first 10 non-empty lines
  const sampleLines = lines.filter(l => l.trim()).slice(0, 10);
  
  for (const delim of DELIMITERS) {
    const counts = sampleLines.map(line => {
      // Count delimiters outside quotes
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
    
    // Check consistency - all lines should have similar delimiter count
    const avgCount = nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;
    const variance = nonZeroCounts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / nonZeroCounts.length;
    
    scores[delim] = {
      count: avgCount,
      consistency: variance < 1 ? 1 : 1 / variance
    };
  }
  
  // Pick delimiter with highest count * consistency
  let bestDelim = ',';
  let bestScore = 0;
  
  for (const [delim, { count, consistency }] of Object.entries(scores)) {
    const score = count * consistency;
    if (score > bestScore) {
      bestScore = score;
      bestDelim = delim;
    }
  }
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestScore > 5) confidence = 'high';
  else if (bestScore > 2) confidence = 'medium';
  
  return { delimiter: bestDelim, confidence };
}

// Check if a value looks like data (not a header)
function looksLikeData(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return false;
  
  // Email pattern
  if (/@/.test(trimmed)) return true;
  
  // URL pattern
  if (/^https?:\/\//.test(trimmed) || /linkedin\.com/.test(trimmed)) return true;
  
  // Date patterns (various formats)
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(trimmed)) return true;
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(trimmed)) return true;
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(trimmed)) return true;
  
  // Phone number patterns
  if (/^[\+\d\(\)\-\s]{7,}$/.test(trimmed)) return true;
  
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
        score += 10; // Strong signal
        break;
      }
    }
    
    // Check for data patterns (negative signal)
    if (looksLikeData(col)) {
      dataPatternMatches++;
      score -= 15; // Strong negative signal
    }
    
    // Short text-only values are more likely headers
    if (/^[a-zA-Z\s]+$/.test(col.trim()) && col.trim().length < 30) {
      score += 1;
    }
  }
  
  return score;
}

// Find header line (skip preamble if present)
function findHeaderLine(lines: string[], delimiter: string): number {
  // Only check first 5 lines for header
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
  
  // Sort by score (highest first), then by column count, then by index (prefer earlier)
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.columnCount !== a.columnCount) return b.columnCount - a.columnCount;
    return a.index - b.index; // Prefer earlier lines as tie-breaker
  });
  
  // If the best candidate has a positive score, use it
  // Otherwise, prefer line 0 (most CSVs have headers on first line)
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

// Normalize header for matching
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[\s_-]+/g, '')
    .trim();
}

export function parseLinkedInCSV(content: string): ParseResult {
  const warnings: ParseWarning[] = [];
  
  // Detect and strip BOM
  const bomDetected = content.charCodeAt(0) === 0xFEFF;
  if (bomDetected) {
    content = content.slice(1);
  }
  
  // Detect line ending style
  const lineEndingStyle = detectLineEnding(content);
  
  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into lines
  const allLines = normalizedContent.split('\n');
  const rawLineCount = allLines.length;
  
  // Store sample raw lines for diagnostics
  const sampleRawLines = allLines.slice(0, 15);
  
  // Filter empty lines for processing (but keep track for line numbers)
  const nonEmptyLineIndices: number[] = [];
  const nonEmptyLines: string[] = [];
  
  allLines.forEach((line, index) => {
    if (line.trim()) {
      nonEmptyLineIndices.push(index);
      nonEmptyLines.push(line);
    }
  });
  
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
      warnings: [{ type: 'parse_error', line: 0, message: 'File is empty or contains only whitespace' }],
      sampleRawLines,
      rows: [],
      bomDetected,
      lineEndingStyle,
      error: 'File is empty'
    };
  }
  
  // Detect delimiter
  const { delimiter, confidence: delimiterConfidence } = detectDelimiter(nonEmptyLines);
  
  // Find header line
  const headerLineIndex = findHeaderLine(nonEmptyLines, delimiter);
  
  // Parse headers
  const headers = parseCSVLine(nonEmptyLines[headerLineIndex], delimiter);
  const normalizedHeaders = headers.map(normalizeHeader);
  
  // Parse data rows
  const rows: string[][] = [];
  const expectedColumnCount = headers.length;
  
  for (let i = headerLineIndex + 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];
    const originalLineNum = nonEmptyLineIndices[i] + 1; // 1-indexed for user display
    
    try {
      const row = parseCSVLine(line, delimiter);
      
      if (row.length !== expectedColumnCount) {
        warnings.push({
          type: 'column_mismatch',
          line: originalLineNum,
          message: `Expected ${expectedColumnCount} columns, got ${row.length}`
        });
      }
      
      // Pad or trim row to match header count
      while (row.length < expectedColumnCount) row.push('');
      if (row.length > expectedColumnCount) row.length = expectedColumnCount;
      
      rows.push(row);
    } catch (e) {
      warnings.push({
        type: 'parse_error',
        line: originalLineNum,
        message: `Failed to parse line: ${e instanceof Error ? e.message : 'Unknown error'}`
      });
    }
  }
  
  console.log('[LinkedIn Parser] Parsed result:', {
    delimiter,
    delimiterConfidence,
    headerCount: headers.length,
    headers: headers.slice(0, 5),
    normalizedHeaders: normalizedHeaders.slice(0, 5),
    rowCount: rows.length,
    warningCount: warnings.length
  });
  
  return {
    success: true,
    headers,
    normalizedHeaders,
    delimiter,
    delimiterConfidence,
    headerLineIndex: nonEmptyLineIndices[headerLineIndex],
    rawLineCount,
    parsedRowCount: rows.length,
    warnings,
    sampleRawLines,
    rows,
    bomDetected,
    lineEndingStyle
  };
}
