// LinkedIn column mapping utilities
import { normalizeHeader } from './linkedinCsvParser';

export interface ColumnMapping {
  first_name?: number;
  last_name?: number;
  email?: number;
  organization?: number;
  job_title?: number;
  profile_url?: number;
  notes?: number;
  connected_on?: number;
}

export interface MappedContact {
  first_name: string;
  last_name: string;
  email: string;
  organization: string;
  job_title: string;
  notes: string;
  relationship_type: string;
}

// Known LinkedIn header patterns for auto-mapping
const HEADER_PATTERNS: Record<keyof ColumnMapping, string[]> = {
  first_name: ['firstname', 'first', 'prenom', 'vorname', 'nombre'],
  last_name: ['lastname', 'last', 'nom', 'nachname', 'apellido'],
  email: ['email', 'emailaddress', 'mail', 'correo'],
  organization: ['company', 'organization', 'organisation', 'empresa', 'unternehmen', 'entreprise'],
  job_title: ['position', 'title', 'jobtitle', 'puesto', 'poste', 'titel'],
  profile_url: ['url', 'profileurl', 'linkedinurl', 'link', 'enlace'],
  notes: ['notes', 'note', 'notas', 'notizen'],
  connected_on: ['connectedon', 'dateconnected', 'connection', 'fecha']
};

// Auto-suggest column mapping based on headers
export function autoMapColumns(normalizedHeaders: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  for (const [field, patterns] of Object.entries(HEADER_PATTERNS) as [keyof ColumnMapping, string[]][]) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      
      // Check if header matches any pattern
      for (const pattern of patterns) {
        if (header === pattern || header.includes(pattern)) {
          mapping[field] = i;
          break;
        }
      }
      
      if (mapping[field] !== undefined) break;
    }
  }
  
  console.log('[LinkedIn Mapping] Auto-mapped columns:', mapping);
  return mapping;
}

// Check if mapping has at least one identifying field
export function isMappingValid(mapping: ColumnMapping): boolean {
  return (
    mapping.first_name !== undefined ||
    mapping.last_name !== undefined ||
    mapping.email !== undefined ||
    mapping.profile_url !== undefined
  );
}

// Get mapping completeness info
export function getMappingCompleteness(mapping: ColumnMapping): {
  hasIdentifier: boolean;
  mappedFields: string[];
  missingRecommended: string[];
} {
  const mappedFields: string[] = [];
  const missingRecommended: string[] = [];
  
  const identifierFields = ['first_name', 'last_name', 'email', 'profile_url'] as const;
  const recommendedFields = ['first_name', 'last_name', 'email', 'organization'] as const;
  
  let hasIdentifier = false;
  
  for (const field of identifierFields) {
    if (mapping[field] !== undefined) {
      hasIdentifier = true;
      mappedFields.push(field);
    }
  }
  
  for (const field of recommendedFields) {
    if (mapping[field] === undefined) {
      missingRecommended.push(field);
    }
  }
  
  return { hasIdentifier, mappedFields, missingRecommended };
}

// Apply mapping to convert raw row to contact
export function applyMapping(row: string[], mapping: ColumnMapping): MappedContact {
  const getValue = (index: number | undefined): string => {
    if (index === undefined || index < 0 || index >= row.length) return '';
    return row[index]?.trim() || '';
  };
  
  let firstName = getValue(mapping.first_name);
  let lastName = getValue(mapping.last_name);
  const email = getValue(mapping.email).toLowerCase();
  const organization = getValue(mapping.organization);
  const jobTitle = getValue(mapping.job_title);
  const profileUrl = getValue(mapping.profile_url);
  const notes = getValue(mapping.notes);
  const connectedOn = getValue(mapping.connected_on);
  
  // Build notes from various fields
  let combinedNotes = notes;
  if (profileUrl && !combinedNotes.includes(profileUrl)) {
    combinedNotes = combinedNotes ? `${combinedNotes}\nLinkedIn: ${profileUrl}` : `LinkedIn: ${profileUrl}`;
  }
  if (connectedOn) {
    combinedNotes = combinedNotes ? `${combinedNotes}\nConnected: ${connectedOn}` : `Connected: ${connectedOn}`;
  }
  
  // Fallback for display name
  if (!firstName && !lastName) {
    if (email) {
      firstName = email.split('@')[0];
    } else if (profileUrl) {
      // Try to extract name from URL
      const urlMatch = profileUrl.match(/linkedin\.com\/in\/([^/]+)/);
      if (urlMatch) {
        firstName = urlMatch[1].replace(/-/g, ' ');
      } else {
        firstName = 'LinkedIn Contact';
      }
    } else {
      firstName = 'Unknown';
    }
  } else if (!firstName && lastName) {
    firstName = lastName;
    lastName = '';
  }
  
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    organization,
    job_title: jobTitle,
    notes: combinedNotes,
    relationship_type: 'colleague'
  };
}
