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

// Find header line (skip preamble if present)
function findHeaderLine(lines: string[], delimiter: string): number {
  // Heuristic: header line has the most columns OR first line with >= 3 columns
  let bestIndex = 0;
  let bestColumnCount = 0;
  
  // Only check first 5 lines for header
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line, delimiter);
    
    // LinkedIn CSVs typically have headers like "First Name", "Last Name", "Email", etc.
    // Check if this looks like a header (contains text fields, not data)
    const looksLikeHeader = columns.some(col => 
      /^[a-zA-Z\s]+$/.test(col) && col.length < 50
    );
    
    if (columns.length > bestColumnCount || (columns.length === bestColumnCount && looksLikeHeader)) {
      bestColumnCount = columns.length;
      bestIndex = i;
    }
  }
  
  return bestIndex;
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
