/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function similarityScore(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  if (aLower === bLower) return 1;
  
  const maxLen = Math.max(aLower.length, bLower.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(aLower, bLower);
  return 1 - distance / maxLen;
}

/**
 * Check if a string contains another with fuzzy matching
 */
export function fuzzyContains(text: string, query: string, threshold = 0.7): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match
  if (textLower.includes(queryLower)) return true;
  
  // Check each word
  const words = textLower.split(/\s+/);
  for (const word of words) {
    if (similarityScore(word, queryLower) >= threshold) {
      return true;
    }
  }
  
  return false;
}

/**
 * Soundex algorithm for phonetic matching
 */
export function soundex(s: string): string {
  const a = s.toLowerCase().split('');
  const firstLetter = a.shift();
  
  const codes: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };

  const result = a
    .map(char => codes[char] || '')
    .filter((code, index, arr) => code !== arr[index - 1])
    .join('');

  return (firstLetter + result + '000').slice(0, 4).toUpperCase();
}

/**
 * Check if two names sound similar (phonetic matching)
 */
export function soundsLike(a: string, b: string): boolean {
  return soundex(a) === soundex(b);
}

/**
 * Fuzzy search through an array of items
 */
export interface FuzzySearchOptions {
  threshold?: number;
  keys?: string[];
  useSoundex?: boolean;
}

export function fuzzySearch<T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions = {}
): T[] {
  const { threshold = 0.6, keys = [], useSoundex = true } = options;
  
  if (!query.trim()) return items;
  
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);
  
  return items.filter(item => {
    let textToSearch: string;
    
    if (keys.length > 0) {
      textToSearch = keys
        .map(key => {
          const value = (item as any)[key];
          return value != null ? String(value) : '';
        })
        .join(' ');
    } else {
      textToSearch = String(item);
    }
    
    const textLower = textToSearch.toLowerCase();
    
    // Check if all query terms match
    return queryTerms.every(term => {
      // Exact substring match
      if (textLower.includes(term)) return true;
      
      // Fuzzy match on individual words
      const words = textLower.split(/\s+/);
      for (const word of words) {
        if (similarityScore(word, term) >= threshold) return true;
        if (useSoundex && soundsLike(word, term)) return true;
      }
      
      return false;
    });
  });
}

/**
 * Rank search results by relevance
 */
export function rankByRelevance<T>(
  items: T[],
  query: string,
  keys: string[]
): T[] {
  const queryLower = query.toLowerCase();
  
  return [...items].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    for (const key of keys) {
      const valueA = String((a as any)[key] || '').toLowerCase();
      const valueB = String((b as any)[key] || '').toLowerCase();
      
      // Exact match at start gets highest score
      if (valueA.startsWith(queryLower)) scoreA += 100;
      if (valueB.startsWith(queryLower)) scoreB += 100;
      
      // Contains match
      if (valueA.includes(queryLower)) scoreA += 50;
      if (valueB.includes(queryLower)) scoreB += 50;
      
      // Similarity score
      scoreA += similarityScore(valueA, queryLower) * 30;
      scoreB += similarityScore(valueB, queryLower) * 30;
    }
    
    return scoreB - scoreA;
  });
}
