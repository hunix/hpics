// Duplicate detection with fuzzy matching
// Uses Levenshtein distance for name similarity

export interface ExistingContact {
  id: string;
  first_name: string;
  last_name: string | null;
  email?: string;
  organization?: string;
  job_title?: string;
  notes?: string;
}

export interface DuplicateMatch {
  existingContact: ExistingContact;
  matchType: 'email' | 'name_exact' | 'name_fuzzy';
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

// Find duplicates for a single contact
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
        continue; // Don't check name if email already matches
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

// Check all contacts for duplicates
export function checkAllDuplicates(
  contacts: Array<{ rowIndex: number; contact: ImportContact }>,
  existingContacts: ExistingContact[],
  fuzzyThreshold: number = 80
): DuplicateCheckResult[] {
  const results: DuplicateCheckResult[] = [];
  
  for (const { rowIndex, contact } of contacts) {
    const duplicates = findDuplicates(contact, existingContacts, fuzzyThreshold);
    
    // Determine default action based on duplicates
    let action: 'create' | 'merge' | 'skip' = 'create';
    let mergeTargetId: string | undefined;
    
    if (duplicates.length > 0) {
      const topMatch = duplicates[0];
      
      // Email match = high confidence, default to merge
      if (topMatch.matchType === 'email' || topMatch.confidence >= 95) {
        action = 'merge';
        mergeTargetId = topMatch.existingContact.id;
      } else if (topMatch.confidence >= 80) {
        // Name fuzzy match = suggest merge but allow override
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
