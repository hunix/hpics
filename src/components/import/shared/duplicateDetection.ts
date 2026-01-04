// Duplicate detection with fuzzy matching
// Uses Levenshtein distance for name similarity and phone number normalization

export interface ExistingContact {
  id: string;
  first_name: string;
  last_name: string | null;
  email?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  notes?: string;
}

export interface DuplicateMatch {
  existingContact: ExistingContact;
  matchType: 'email' | 'phone' | 'name_exact' | 'name_fuzzy';
  confidence: number; // 0-100
  matchDetails: string;
}

export interface ImportContact {
  first_name: string;
  last_name: string;
  email: string;
  organization?: string;
  job_title?: string;
  notes?: string;
  phone?: string;
  [key: string]: string | undefined;
}

export interface DuplicateCheckResult {
  contact: ImportContact;
  rowIndex: number;
  duplicates: DuplicateMatch[];
  action: 'create' | 'merge' | 'skip';
  mergeTargetId?: string;
}

export interface WithinFileDuplicate {
  indices: number[];
  mergedContact: ImportContact;
  matchType: 'email' | 'phone' | 'name';
}

// Levenshtein distance for fuzzy name matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Calculate similarity score (0-100)
function nameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  
  if (n1 === n2) return 100;
  if (!n1 || !n2) return 0;
  
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(n1, n2);
  return Math.round((1 - distance / maxLen) * 100);
}

// Normalize phone number for comparison
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits, then take last 10 digits (handles country codes)
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
}

// Check if two phones match
function phonesMatch(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  if (!normalized1 || !normalized2) return false;
  // Match if last 7+ digits are same (handles various formats)
  if (normalized1.length >= 7 && normalized2.length >= 7) {
    return normalized1.slice(-7) === normalized2.slice(-7);
  }
  return normalized1 === normalized2;
}

// Check if two names are similar enough to be considered a match
function areNamesSimilar(
  firstName1: string,
  lastName1: string | null,
  firstName2: string,
  lastName2: string | null,
  threshold: number = 80
): { similar: boolean; confidence: number; type: 'exact' | 'fuzzy' } {
  const fullName1 = `${firstName1} ${lastName1 || ''}`.trim().toLowerCase();
  const fullName2 = `${firstName2} ${lastName2 || ''}`.trim().toLowerCase();
  
  // Exact match
  if (fullName1 === fullName2) {
    return { similar: true, confidence: 100, type: 'exact' };
  }
  
  // Check first name + last name separately
  const firstNameSim = nameSimilarity(firstName1, firstName2);
  const lastNameSim = lastName1 && lastName2 
    ? nameSimilarity(lastName1, lastName2)
    : (lastName1 === lastName2 ? 100 : 50);
  
  // Weighted average (first name matters more for matching)
  const avgSim = Math.round(firstNameSim * 0.6 + lastNameSim * 0.4);
  
  if (avgSim >= threshold) {
    return { similar: true, confidence: avgSim, type: 'fuzzy' };
  }
  
  // Also check full name similarity
  const fullNameSim = nameSimilarity(fullName1, fullName2);
  if (fullNameSim >= threshold) {
    return { similar: true, confidence: fullNameSim, type: 'fuzzy' };
  }
  
  return { similar: false, confidence: Math.max(avgSim, fullNameSim), type: 'fuzzy' };
}

// Deduplicate contacts within the import file itself
export function deduplicateImportFile(
  contacts: ImportContact[]
): { deduplicated: ImportContact[]; duplicateGroups: WithinFileDuplicate[] } {
  const emailMap = new Map<string, number[]>();
  const phoneMap = new Map<string, number[]>();
  const processedIndices = new Set<number>();
  const duplicateGroups: WithinFileDuplicate[] = [];
  
  // Index by email and phone
  contacts.forEach((contact, index) => {
    if (contact.email) {
      const email = contact.email.toLowerCase().trim();
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(index);
    }
    if (contact.phone) {
      const phone = normalizePhone(contact.phone);
      if (phone) {
        if (!phoneMap.has(phone)) phoneMap.set(phone, []);
        phoneMap.get(phone)!.push(index);
      }
    }
  });
  
  // Find and merge email duplicates
  for (const [email, indices] of emailMap) {
    if (indices.length > 1 && !processedIndices.has(indices[0])) {
      const merged = mergeMultipleContacts(indices.map(i => contacts[i]));
      duplicateGroups.push({
        indices,
        mergedContact: merged,
        matchType: 'email'
      });
      indices.forEach(i => processedIndices.add(i));
    }
  }
  
  // Find and merge phone duplicates (excluding already processed)
  for (const [phone, indices] of phoneMap) {
    const unprocessed = indices.filter(i => !processedIndices.has(i));
    if (unprocessed.length > 1) {
      const merged = mergeMultipleContacts(unprocessed.map(i => contacts[i]));
      duplicateGroups.push({
        indices: unprocessed,
        mergedContact: merged,
        matchType: 'phone'
      });
      unprocessed.forEach(i => processedIndices.add(i));
    }
  }
  
  // Build deduplicated list
  const deduplicated: ImportContact[] = [];
  const usedInGroup = new Set<number>();
  
  for (const group of duplicateGroups) {
    deduplicated.push(group.mergedContact);
    group.indices.forEach(i => usedInGroup.add(i));
  }
  
  // Add contacts that weren't in any duplicate group
  contacts.forEach((contact, index) => {
    if (!usedInGroup.has(index)) {
      deduplicated.push(contact);
    }
  });
  
  console.log('[Deduplication] Within-file duplicates:', duplicateGroups.length);
  console.log('[Deduplication] Original count:', contacts.length, '→ Deduplicated:', deduplicated.length);
  
  return { deduplicated, duplicateGroups };
}

// Merge multiple contacts into one (for within-file duplicates)
function mergeMultipleContacts(contacts: ImportContact[]): ImportContact {
  if (contacts.length === 0) throw new Error('No contacts to merge');
  if (contacts.length === 1) return contacts[0];
  
  const merged: ImportContact = {
    first_name: '',
    last_name: '',
    email: ''
  };
  
  // For each field, prefer non-empty and longer values
  const fields = ['first_name', 'last_name', 'email', 'phone', 'organization', 'job_title', 'notes'] as const;
  
  for (const field of fields) {
    let bestValue = '';
    for (const contact of contacts) {
      const value = contact[field] || '';
      if (value && (!bestValue || value.length > bestValue.length)) {
        bestValue = value;
      }
    }
    if (bestValue) {
      merged[field] = bestValue;
    }
  }
  
  return merged;
}

// Find duplicates for a single contact against existing contacts
export function findDuplicates(
  contact: ImportContact,
  existingContacts: ExistingContact[],
  fuzzyThreshold: number = 80
): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = [];
  
  for (const existing of existingContacts) {
    // Check email match (highest priority)
    if (contact.email && existing.email) {
      const emailMatch = contact.email.toLowerCase() === existing.email.toLowerCase();
      if (emailMatch) {
        duplicates.push({
          existingContact: existing,
          matchType: 'email',
          confidence: 100,
          matchDetails: `Email match: ${contact.email}`
        });
        continue; // Don't check other criteria if email matches
      }
    }
    
    // Check phone match (high priority)
    if (contact.phone && existing.phone) {
      if (phonesMatch(contact.phone, existing.phone)) {
        duplicates.push({
          existingContact: existing,
          matchType: 'phone',
          confidence: 95,
          matchDetails: `Phone match: ${contact.phone}`
        });
        continue;
      }
    }
    
    // Check name similarity
    const nameMatch = areNamesSimilar(
      contact.first_name,
      contact.last_name || null,
      existing.first_name,
      existing.last_name,
      fuzzyThreshold
    );
    
    if (nameMatch.similar) {
      duplicates.push({
        existingContact: existing,
        matchType: nameMatch.type === 'exact' ? 'name_exact' : 'name_fuzzy',
        confidence: nameMatch.confidence,
        matchDetails: `Name ${nameMatch.type === 'exact' ? 'exact' : 'similar'} match (${nameMatch.confidence}%): ${existing.first_name} ${existing.last_name || ''}`
      });
    }
  }
  
  // Sort by confidence (highest first)
  return duplicates.sort((a, b) => b.confidence - a.confidence);
}

// Check all contacts for duplicates with optimized lookup
export function checkAllDuplicates(
  contacts: Array<{ rowIndex: number; contact: ImportContact }>,
  existingContacts: ExistingContact[],
  fuzzyThreshold: number = 80,
  onProgress?: (processed: number, total: number) => void
): DuplicateCheckResult[] {
  // Build indexes for faster lookup
  const emailIndex = new Map<string, ExistingContact[]>();
  const phoneIndex = new Map<string, ExistingContact[]>();
  
  for (const existing of existingContacts) {
    if (existing.email) {
      const email = existing.email.toLowerCase();
      if (!emailIndex.has(email)) emailIndex.set(email, []);
      emailIndex.get(email)!.push(existing);
    }
    if (existing.phone) {
      const phone = normalizePhone(existing.phone);
      if (phone) {
        if (!phoneIndex.has(phone)) phoneIndex.set(phone, []);
        phoneIndex.get(phone)!.push(existing);
      }
    }
  }
  
  const results: DuplicateCheckResult[] = [];
  const batchSize = 100;
  
  for (let i = 0; i < contacts.length; i++) {
    const { rowIndex, contact } = contacts[i];
    
    // Quick lookup using indexes first
    const duplicates: DuplicateMatch[] = [];
    
    // Check email index
    if (contact.email) {
      const emailMatches = emailIndex.get(contact.email.toLowerCase());
      if (emailMatches) {
        for (const existing of emailMatches) {
          duplicates.push({
            existingContact: existing,
            matchType: 'email',
            confidence: 100,
            matchDetails: `Email match: ${contact.email}`
          });
        }
      }
    }
    
    // Check phone index (if no email match)
    if (duplicates.length === 0 && contact.phone) {
      const normalizedPhone = normalizePhone(contact.phone);
      const phoneMatches = phoneIndex.get(normalizedPhone);
      if (phoneMatches) {
        for (const existing of phoneMatches) {
          duplicates.push({
            existingContact: existing,
            matchType: 'phone',
            confidence: 95,
            matchDetails: `Phone match: ${contact.phone}`
          });
        }
      }
    }
    
    // If no quick matches, do fuzzy name search
    if (duplicates.length === 0) {
      const nameMatches = findDuplicates(contact, existingContacts, fuzzyThreshold);
      duplicates.push(...nameMatches.filter(m => m.matchType === 'name_exact' || m.matchType === 'name_fuzzy'));
    }
    
    // Determine default action
    let action: 'create' | 'merge' | 'skip' = 'create';
    let mergeTargetId: string | undefined;
    
    if (duplicates.length > 0) {
      const topMatch = duplicates[0];
      
      // Email or phone match = high confidence, default to merge
      if (topMatch.matchType === 'email' || topMatch.matchType === 'phone' || topMatch.confidence >= 95) {
        action = 'merge';
        mergeTargetId = topMatch.existingContact.id;
      } else if (topMatch.confidence >= 80) {
        action = 'merge';
        mergeTargetId = topMatch.existingContact.id;
      }
    }
    
    results.push({
      contact,
      rowIndex,
      duplicates,
      action,
      mergeTargetId
    });
    
    // Report progress
    if (onProgress && (i + 1) % batchSize === 0) {
      onProgress(i + 1, contacts.length);
    }
  }
  
  console.log('[Duplicate Check] Results:', {
    total: results.length,
    withDuplicates: results.filter(r => r.duplicates.length > 0).length,
    toMerge: results.filter(r => r.action === 'merge').length,
    toCreate: results.filter(r => r.action === 'create').length
  });
  
  return results;
}

// Smart merge: combine new data with existing, preferring more complete data
export function smartMerge(
  existing: ExistingContact,
  incoming: ImportContact
): Partial<ExistingContact> {
  const updates: Partial<ExistingContact> = {};
  
  // For each field, prefer non-empty and longer values
  const mergeField = (
    existingVal: string | null | undefined,
    incomingVal: string | undefined,
    fieldName: keyof ExistingContact
  ) => {
    const existingStr = existingVal?.trim() || '';
    const incomingStr = incomingVal?.trim() || '';
    
    if (!existingStr && incomingStr) {
      // Existing is empty, use incoming
      (updates as any)[fieldName] = incomingStr;
    } else if (existingStr && incomingStr && incomingStr.length > existingStr.length) {
      // Both have values, prefer longer (more complete) data
      (updates as any)[fieldName] = incomingStr;
    }
    // Otherwise keep existing
  };
  
  mergeField(existing.organization, incoming.organization, 'organization');
  mergeField(existing.job_title, incoming.job_title, 'job_title');
  
  // For notes, append rather than replace
  if (incoming.notes && incoming.notes.trim()) {
    const existingNotes = existing.notes?.trim() || '';
    const incomingNotes = incoming.notes.trim();
    
    if (!existingNotes) {
      updates.notes = incomingNotes;
    } else if (!existingNotes.includes(incomingNotes)) {
      updates.notes = `${existingNotes}\n\n--- Imported ---\n${incomingNotes}`;
    }
  }
  
  return updates;
}
