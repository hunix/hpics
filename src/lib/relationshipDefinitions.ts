// Comprehensive relationship definitions for contact-to-contact relationships

export interface RelationshipDefinition {
  value: string;
  label: string;
  inverseLabel: string; // What the other person's relationship is
  isBidirectional: boolean;
  type: 'family' | 'professional' | 'social' | 'custom';
}

export const RELATIONSHIP_DEFINITIONS: RelationshipDefinition[] = [
  // Family relationships
  { value: 'father', label: 'Father', inverseLabel: 'Child', isBidirectional: false, type: 'family' },
  { value: 'mother', label: 'Mother', inverseLabel: 'Child', isBidirectional: false, type: 'family' },
  { value: 'parent', label: 'Parent', inverseLabel: 'Child', isBidirectional: false, type: 'family' },
  { value: 'son', label: 'Son', inverseLabel: 'Parent', isBidirectional: false, type: 'family' },
  { value: 'daughter', label: 'Daughter', inverseLabel: 'Parent', isBidirectional: false, type: 'family' },
  { value: 'child', label: 'Child', inverseLabel: 'Parent', isBidirectional: false, type: 'family' },
  { value: 'brother', label: 'Brother', inverseLabel: 'Sibling', isBidirectional: false, type: 'family' },
  { value: 'sister', label: 'Sister', inverseLabel: 'Sibling', isBidirectional: false, type: 'family' },
  { value: 'sibling', label: 'Sibling', inverseLabel: 'Sibling', isBidirectional: true, type: 'family' },
  { value: 'spouse', label: 'Spouse', inverseLabel: 'Spouse', isBidirectional: true, type: 'family' },
  { value: 'husband', label: 'Husband', inverseLabel: 'Wife', isBidirectional: false, type: 'family' },
  { value: 'wife', label: 'Wife', inverseLabel: 'Husband', isBidirectional: false, type: 'family' },
  { value: 'grandfather', label: 'Grandfather', inverseLabel: 'Grandchild', isBidirectional: false, type: 'family' },
  { value: 'grandmother', label: 'Grandmother', inverseLabel: 'Grandchild', isBidirectional: false, type: 'family' },
  { value: 'grandparent', label: 'Grandparent', inverseLabel: 'Grandchild', isBidirectional: false, type: 'family' },
  { value: 'grandson', label: 'Grandson', inverseLabel: 'Grandparent', isBidirectional: false, type: 'family' },
  { value: 'granddaughter', label: 'Granddaughter', inverseLabel: 'Grandparent', isBidirectional: false, type: 'family' },
  { value: 'grandchild', label: 'Grandchild', inverseLabel: 'Grandparent', isBidirectional: false, type: 'family' },
  { value: 'uncle', label: 'Uncle', inverseLabel: 'Nephew/Niece', isBidirectional: false, type: 'family' },
  { value: 'aunt', label: 'Aunt', inverseLabel: 'Nephew/Niece', isBidirectional: false, type: 'family' },
  { value: 'nephew', label: 'Nephew', inverseLabel: 'Uncle/Aunt', isBidirectional: false, type: 'family' },
  { value: 'niece', label: 'Niece', inverseLabel: 'Uncle/Aunt', isBidirectional: false, type: 'family' },
  { value: 'cousin', label: 'Cousin', inverseLabel: 'Cousin', isBidirectional: true, type: 'family' },
  { value: 'in-law', label: 'In-Law', inverseLabel: 'In-Law', isBidirectional: true, type: 'family' },
  { value: 'father-in-law', label: 'Father-in-Law', inverseLabel: 'Son/Daughter-in-Law', isBidirectional: false, type: 'family' },
  { value: 'mother-in-law', label: 'Mother-in-Law', inverseLabel: 'Son/Daughter-in-Law', isBidirectional: false, type: 'family' },
  { value: 'son-in-law', label: 'Son-in-Law', inverseLabel: 'Parent-in-Law', isBidirectional: false, type: 'family' },
  { value: 'daughter-in-law', label: 'Daughter-in-Law', inverseLabel: 'Parent-in-Law', isBidirectional: false, type: 'family' },
  { value: 'brother-in-law', label: 'Brother-in-Law', inverseLabel: 'In-Law', isBidirectional: false, type: 'family' },
  { value: 'sister-in-law', label: 'Sister-in-Law', inverseLabel: 'In-Law', isBidirectional: false, type: 'family' },
  { value: 'stepfather', label: 'Stepfather', inverseLabel: 'Stepchild', isBidirectional: false, type: 'family' },
  { value: 'stepmother', label: 'Stepmother', inverseLabel: 'Stepchild', isBidirectional: false, type: 'family' },
  { value: 'stepson', label: 'Stepson', inverseLabel: 'Stepparent', isBidirectional: false, type: 'family' },
  { value: 'stepdaughter', label: 'Stepdaughter', inverseLabel: 'Stepparent', isBidirectional: false, type: 'family' },
  { value: 'stepsibling', label: 'Stepsibling', inverseLabel: 'Stepsibling', isBidirectional: true, type: 'family' },
  { value: 'ex-spouse', label: 'Ex-Spouse', inverseLabel: 'Ex-Spouse', isBidirectional: true, type: 'family' },
  
  // Professional relationships
  { value: 'manager', label: 'Manager', inverseLabel: 'Direct Report', isBidirectional: false, type: 'professional' },
  { value: 'direct-report', label: 'Direct Report', inverseLabel: 'Manager', isBidirectional: false, type: 'professional' },
  { value: 'colleague', label: 'Colleague', inverseLabel: 'Colleague', isBidirectional: true, type: 'professional' },
  { value: 'mentor', label: 'Mentor', inverseLabel: 'Mentee', isBidirectional: false, type: 'professional' },
  { value: 'mentee', label: 'Mentee', inverseLabel: 'Mentor', isBidirectional: false, type: 'professional' },
  { value: 'business-partner', label: 'Business Partner', inverseLabel: 'Business Partner', isBidirectional: true, type: 'professional' },
  { value: 'client', label: 'Client', inverseLabel: 'Service Provider', isBidirectional: false, type: 'professional' },
  { value: 'service-provider', label: 'Service Provider', inverseLabel: 'Client', isBidirectional: false, type: 'professional' },
  { value: 'investor', label: 'Investor', inverseLabel: 'Investee', isBidirectional: false, type: 'professional' },
  { value: 'advisor', label: 'Advisor', inverseLabel: 'Advisee', isBidirectional: false, type: 'professional' },
  { value: 'employee', label: 'Employee', inverseLabel: 'Employer', isBidirectional: false, type: 'professional' },
  { value: 'employer', label: 'Employer', inverseLabel: 'Employee', isBidirectional: false, type: 'professional' },
  { value: 'assistant', label: 'Assistant', inverseLabel: 'Principal', isBidirectional: false, type: 'professional' },
  { value: 'cofounder', label: 'Co-Founder', inverseLabel: 'Co-Founder', isBidirectional: true, type: 'professional' },
  
  // Social relationships
  { value: 'friend', label: 'Friend', inverseLabel: 'Friend', isBidirectional: true, type: 'social' },
  { value: 'best-friend', label: 'Best Friend', inverseLabel: 'Best Friend', isBidirectional: true, type: 'social' },
  { value: 'neighbor', label: 'Neighbor', inverseLabel: 'Neighbor', isBidirectional: true, type: 'social' },
  { value: 'roommate', label: 'Roommate', inverseLabel: 'Roommate', isBidirectional: true, type: 'social' },
  { value: 'classmate', label: 'Classmate', inverseLabel: 'Classmate', isBidirectional: true, type: 'social' },
  { value: 'teammate', label: 'Teammate', inverseLabel: 'Teammate', isBidirectional: true, type: 'social' },
  { value: 'partner', label: 'Partner', inverseLabel: 'Partner', isBidirectional: true, type: 'social' },
  { value: 'ex-partner', label: 'Ex-Partner', inverseLabel: 'Ex-Partner', isBidirectional: true, type: 'social' },
  { value: 'acquaintance', label: 'Acquaintance', inverseLabel: 'Acquaintance', isBidirectional: true, type: 'social' },
  
  // Custom
  { value: 'other', label: 'Other', inverseLabel: 'Other', isBidirectional: true, type: 'custom' },
];

export const RELATIONSHIP_TYPE_COLORS: Record<string, string> = {
  family: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  social: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export function getRelationshipDefinition(value: string): RelationshipDefinition | undefined {
  return RELATIONSHIP_DEFINITIONS.find(r => r.value === value);
}

export function getRelationshipsByType(type: 'family' | 'professional' | 'social' | 'custom'): RelationshipDefinition[] {
  return RELATIONSHIP_DEFINITIONS.filter(r => r.type === type);
}
