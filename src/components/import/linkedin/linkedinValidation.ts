// LinkedIn import validation
import { ColumnMapping, applyMapping, MappedContact } from './linkedinMapping';

export interface ValidationIssue {
  rowIndex: number;
  lineNumber: number;
  reason: 'empty_row' | 'no_identifier' | 'duplicate_email' | 'duplicate_url' | 'invalid_email';
  details?: string;
}

export interface ValidationResult {
  totalRows: number;
  importableCount: number;
  skippedCount: number;
  issues: ValidationIssue[];
  importableContacts: Array<{ rowIndex: number; contact: MappedContact }>;
  duplicateEmails: Set<string>;
  duplicateUrls: Set<string>;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  if (!email) return true; // Empty is okay, not required
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if row has any meaningful data
function isEmptyRow(row: string[]): boolean {
  return row.every(cell => !cell || !cell.trim());
}

// Check if contact has at least one identifier
function hasIdentifier(contact: MappedContact): boolean {
  return !!(
    contact.first_name?.trim() ||
    contact.last_name?.trim() ||
    contact.email?.trim() ||
    contact.notes?.includes('linkedin.com')
  );
}

export function validateRows(
  rows: string[][],
  mapping: ColumnMapping,
  headerLineIndex: number
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const importableContacts: Array<{ rowIndex: number; contact: MappedContact }> = [];
  const seenEmails = new Set<string>();
  const seenUrls = new Set<string>();
  const duplicateEmails = new Set<string>();
  const duplicateUrls = new Set<string>();
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = headerLineIndex + i + 2; // +1 for header, +1 for 1-indexing
    
    // Check for empty row
    if (isEmptyRow(row)) {
      issues.push({ rowIndex: i, lineNumber, reason: 'empty_row' });
      continue;
    }
    
    // Apply mapping
    const contact = applyMapping(row, mapping);
    
    // Check for identifier
    if (!hasIdentifier(contact)) {
      issues.push({ 
        rowIndex: i, 
        lineNumber, 
        reason: 'no_identifier',
        details: 'No name, email, or LinkedIn URL found'
      });
      continue;
    }
    
    // Validate email format
    if (contact.email && !isValidEmail(contact.email)) {
      issues.push({ 
        rowIndex: i, 
        lineNumber, 
        reason: 'invalid_email',
        details: contact.email
      });
      continue;
    }
    
    // Check for duplicate email
    if (contact.email) {
      const normalizedEmail = contact.email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        duplicateEmails.add(normalizedEmail);
        issues.push({ 
          rowIndex: i, 
          lineNumber, 
          reason: 'duplicate_email',
          details: contact.email
        });
        continue;
      }
      seenEmails.add(normalizedEmail);
    }
    
    // Check for duplicate URL
    const urlMatch = contact.notes?.match(/linkedin\.com\/in\/([^\s]+)/);
    if (urlMatch) {
      const profileId = urlMatch[1].toLowerCase();
      if (seenUrls.has(profileId)) {
        duplicateUrls.add(profileId);
        issues.push({ 
          rowIndex: i, 
          lineNumber, 
          reason: 'duplicate_url',
          details: profileId
        });
        continue;
      }
      seenUrls.add(profileId);
    }
    
    // Row is valid
    importableContacts.push({ rowIndex: i, contact });
  }
  
  console.log('[LinkedIn Validation] Result:', {
    totalRows: rows.length,
    importable: importableContacts.length,
    skipped: issues.length,
    issueBreakdown: {
      empty: issues.filter(i => i.reason === 'empty_row').length,
      noId: issues.filter(i => i.reason === 'no_identifier').length,
      dupEmail: issues.filter(i => i.reason === 'duplicate_email').length,
      dupUrl: issues.filter(i => i.reason === 'duplicate_url').length,
      invalidEmail: issues.filter(i => i.reason === 'invalid_email').length
    }
  });
  
  return {
    totalRows: rows.length,
    importableCount: importableContacts.length,
    skippedCount: issues.length,
    issues,
    importableContacts,
    duplicateEmails,
    duplicateUrls
  };
}

// Generate downloadable diagnostics JSON
export function generateDiagnosticsReport(
  parseResult: {
    headers: string[];
    delimiter: string;
    bomDetected: boolean;
    lineEndingStyle: string;
    rawLineCount: number;
    parsedRowCount: number;
    warnings: Array<{ type: string; line: number; message: string }>;
  },
  mapping: ColumnMapping,
  validation: ValidationResult
): string {
  const report = {
    timestamp: new Date().toISOString(),
    parsing: {
      headers: parseResult.headers,
      delimiter: parseResult.delimiter,
      bomDetected: parseResult.bomDetected,
      lineEndingStyle: parseResult.lineEndingStyle,
      rawLineCount: parseResult.rawLineCount,
      parsedRowCount: parseResult.parsedRowCount,
      warnings: parseResult.warnings
    },
    mapping,
    validation: {
      totalRows: validation.totalRows,
      importableCount: validation.importableCount,
      skippedCount: validation.skippedCount,
      issuesByReason: {
        empty_row: validation.issues.filter(i => i.reason === 'empty_row').length,
        no_identifier: validation.issues.filter(i => i.reason === 'no_identifier').length,
        duplicate_email: validation.issues.filter(i => i.reason === 'duplicate_email').length,
        duplicate_url: validation.issues.filter(i => i.reason === 'duplicate_url').length,
        invalid_email: validation.issues.filter(i => i.reason === 'invalid_email').length
      },
      first20Issues: validation.issues.slice(0, 20)
    }
  };
  
  return JSON.stringify(report, null, 2);
}
