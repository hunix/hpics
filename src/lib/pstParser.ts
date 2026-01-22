// PST Parser Types and Utilities
// Note: Full PST parsing requires server-side processing due to library constraints.
// This module provides types and utilities for email import, supporting both
// PST (via server upload) and alternative formats like Outlook CSV export.

export interface ParsedEmail {
  messageId: string;
  conversationId: string | null;
  subject: string;
  senderEmail: string;
  senderName: string;
  recipients: string[];
  ccRecipients: string[];
  bodyText: string;
  bodyHtml: string;
  sentAt: string;
  receivedAt: string | null;
  hasAttachments: boolean;
  attachments: { name: string; size: number }[];
  importance: 'low' | 'normal' | 'high';
  folder: string;
}

export interface ParseOptions {
  includeSent: boolean;
  includeReceived: boolean;
  includeDrafts: boolean;
  includeDeleted: boolean;
  skipDuplicates: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ParseProgress {
  foldersScanned: number;
  emailsFound: number;
  currentFolder: string;
  phase: 'scanning' | 'extracting' | 'complete';
}

// Parse Outlook CSV export format
// Outlook can export emails to CSV via File > Open & Export > Import/Export > Export to a file
export function parseOutlookCSV(csvText: string): ParsedEmail[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse CSV headers
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const emails: ParsedEmail[] = [];
  
  // Find column indices
  const subjectIdx = headers.findIndex(h => h.includes('subject'));
  const fromIdx = headers.findIndex(h => h.includes('from') || h.includes('sender'));
  const toIdx = headers.findIndex(h => h.includes('to') || h.includes('recipient'));
  const ccIdx = headers.findIndex(h => h.includes('cc'));
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('sent') || h.includes('received'));
  const bodyIdx = headers.findIndex(h => h.includes('body') || h.includes('content') || h.includes('message'));
  const importanceIdx = headers.findIndex(h => h.includes('importance') || h.includes('priority'));
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      const subject = subjectIdx >= 0 ? values[subjectIdx] || '' : '';
      const from = fromIdx >= 0 ? values[fromIdx] || '' : '';
      const to = toIdx >= 0 ? values[toIdx] || '' : '';
      const cc = ccIdx >= 0 ? values[ccIdx] || '' : '';
      const dateStr = dateIdx >= 0 ? values[dateIdx] || '' : '';
      const body = bodyIdx >= 0 ? values[bodyIdx] || '' : '';
      const importance = importanceIdx >= 0 ? values[importanceIdx]?.toLowerCase() || 'normal' : 'normal';
      
      if (!from && !to && !subject) continue;
      
      const { email: senderEmail, name: senderName } = extractEmailParts(from);
      const recipients = to.split(/[;,]/).map(e => extractEmailParts(e).email).filter(Boolean);
      const ccRecipients = cc.split(/[;,]/).map(e => extractEmailParts(e).email).filter(Boolean);
      
      const sentAt = parseDate(dateStr);
      
      emails.push({
        messageId: `outlook-csv-${i}-${Date.now()}`,
        conversationId: null,
        subject,
        senderEmail,
        senderName,
        recipients,
        ccRecipients,
        bodyText: body,
        bodyHtml: '',
        sentAt: sentAt.toISOString(),
        receivedAt: sentAt.toISOString(),
        hasAttachments: false,
        attachments: [],
        importance: importance === 'high' ? 'high' : importance === 'low' ? 'low' : 'normal',
        folder: 'inbox',
      });
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }
  
  return emails;
}

// Parse a single CSV line respecting quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Extract email and name from various RFC 5322 formats including malformed strings.
 * Handles formats like:
 * - "John Doe <john@example.com>"
 * - "john@example.com"
 * - "John Doe <john@example.com <mailto:john@example.com>>" (malformed from PST exports)
 * - "'John Doe' <john@example.com>"
 * - "john@example.com (John Doe)"
 */
export function extractEmailParts(fullAddress: string): { email: string; name: string } {
  const trimmed = fullAddress.trim();
  
  if (!trimmed) {
    return { email: '', name: '' };
  }
  
  // 1. Handle malformed mailto: nested format from PST exports
  // e.g., "Name <email@domain.com <mailto:email@domain.com>>"
  const mailtoMatch = trimmed.match(/<mailto:([^>]+)>/i);
  if (mailtoMatch) {
    const email = mailtoMatch[1].toLowerCase().trim();
    // Extract name from before the first angle bracket
    const nameMatch = trimmed.match(/^([^<]*)/);
    const name = nameMatch ? nameMatch[1].trim().replace(/['"]/g, '') : '';
    return { email, name };
  }
  
  // 2. Handle standard "Name <email>" format - get the innermost valid email
  // Use a more robust pattern that handles nested brackets
  const angleMatches = trimmed.match(/<([^<>]+@[^<>]+)>/g);
  if (angleMatches && angleMatches.length > 0) {
    // Take the last (innermost) email match
    const lastMatch = angleMatches[angleMatches.length - 1];
    const email = lastMatch.replace(/[<>]/g, '').toLowerCase().trim();
    
    // Extract name from before the first angle bracket
    const firstAngleIdx = trimmed.indexOf('<');
    const name = firstAngleIdx > 0 
      ? trimmed.substring(0, firstAngleIdx).trim().replace(/['"]/g, '') 
      : '';
    
    return { email, name };
  }
  
  // 3. Handle "email (Name)" format
  const parenMatch = trimmed.match(/^([^(]+@[^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    return {
      email: parenMatch[1].toLowerCase().trim(),
      name: parenMatch[2].trim().replace(/['"]/g, ''),
    };
  }
  
  // 4. Plain email address
  if (trimmed.includes('@')) {
    // Remove any remaining angle brackets or quotes
    const cleanEmail = trimmed.replace(/[<>"']/g, '').toLowerCase().trim();
    return { email: cleanEmail, name: '' };
  }
  
  // 5. Just a name, no email
  return { email: '', name: trimmed.replace(/['"]/g, '') };
}

// Parse various date formats
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try standard ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  // Try common Outlook formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i,
    /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      try {
        return new Date(dateStr);
      } catch {
        // Continue to next format
      }
    }
  }
  
  return new Date();
}

// Parse EML file format (single email)
export function parseEMLFile(emlContent: string): ParsedEmail | null {
  try {
    const headers: Record<string, string> = {};
    const lines = emlContent.split(/\r?\n/);
    let bodyStart = 0;
    let currentHeader = '';
    
    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line === '') {
        bodyStart = i + 1;
        break;
      }
      
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // Continuation of previous header
        if (currentHeader) {
          headers[currentHeader] += ' ' + line.trim();
        }
      } else {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          currentHeader = line.substring(0, colonIdx).toLowerCase();
          headers[currentHeader] = line.substring(colonIdx + 1).trim();
        }
      }
    }
    
    // Extract body
    const bodyLines = lines.slice(bodyStart);
    const body = bodyLines.join('\n');
    
    const { email: senderEmail, name: senderName } = extractEmailParts(headers['from'] || '');
    const recipients = (headers['to'] || '').split(/[;,]/).map(e => extractEmailParts(e).email).filter(Boolean);
    const ccRecipients = (headers['cc'] || '').split(/[;,]/).map(e => extractEmailParts(e).email).filter(Boolean);
    
    const dateStr = headers['date'] || '';
    const sentAt = parseDate(dateStr);
    
    return {
      messageId: headers['message-id'] || `eml-${Date.now()}`,
      conversationId: headers['references']?.split(/\s+/)[0] || null,
      subject: headers['subject'] || '(No Subject)',
      senderEmail,
      senderName,
      recipients,
      ccRecipients,
      bodyText: body,
      bodyHtml: '',
      sentAt: sentAt.toISOString(),
      receivedAt: sentAt.toISOString(),
      hasAttachments: body.includes('Content-Disposition: attachment'),
      attachments: [],
      importance: headers['importance']?.toLowerCase() === 'high' ? 'high' : 'normal',
      folder: 'inbox',
    };
  } catch (error) {
    console.error('Error parsing EML file:', error);
    return null;
  }
}

// Parse multiple EML files from a ZIP archive
export async function parseEMLZip(zipFile: File): Promise<ParsedEmail[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(zipFile);
  const emails: ParsedEmail[] = [];
  
  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (filename.toLowerCase().endsWith('.eml') && !zipEntry.dir) {
      try {
        const content = await zipEntry.async('string');
        const email = parseEMLFile(content);
        if (email) {
          emails.push(email);
        }
      } catch (error) {
        console.error(`Error parsing ${filename}:`, error);
      }
    }
  }
  
  return emails;
}

// Batch emails for upload
export function batchEmails(emails: ParsedEmail[], batchSize: number = 100): ParsedEmail[][] {
  const batches: ParsedEmail[][] = [];
  for (let i = 0; i < emails.length; i += batchSize) {
    batches.push(emails.slice(i, i + batchSize));
  }
  return batches;
}
