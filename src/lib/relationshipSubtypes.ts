// Relationship subtypes and hierarchy levels

export interface RelationshipSubtype {
  value: string;
  label: string;
}

export interface HierarchyLevel {
  value: string;
  label: string;
}

export const RELATIONSHIP_SUBTYPES: Record<string, RelationshipSubtype[]> = {
  family: [
    { value: 'father', label: 'Father' },
    { value: 'mother', label: 'Mother' },
    { value: 'son', label: 'Son' },
    { value: 'daughter', label: 'Daughter' },
    { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' },
    { value: 'grandfather', label: 'Grandfather' },
    { value: 'grandmother', label: 'Grandmother' },
    { value: 'grandson', label: 'Grandson' },
    { value: 'granddaughter', label: 'Granddaughter' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'aunt', label: 'Aunt' },
    { value: 'nephew', label: 'Nephew' },
    { value: 'niece', label: 'Niece' },
    { value: 'cousin', label: 'Cousin' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'partner', label: 'Partner' },
    { value: 'in-law', label: 'In-Law' },
    { value: 'step-parent', label: 'Step-Parent' },
    { value: 'step-child', label: 'Step-Child' },
    { value: 'step-sibling', label: 'Step-Sibling' },
    { value: 'other-family', label: 'Other Family' },
  ],
  friend: [
    { value: 'childhood-friend', label: 'Childhood Friend' },
    { value: 'school-friend', label: 'School Friend' },
    { value: 'university-friend', label: 'University Friend' },
    { value: 'work-friend', label: 'Work Friend' },
    { value: 'neighbor', label: 'Neighbor' },
    { value: 'online-friend', label: 'Online Friend' },
    { value: 'hobby-friend', label: 'Hobby/Interest Friend' },
    { value: 'sports-friend', label: 'Sports Friend' },
    { value: 'travel-friend', label: 'Travel Friend' },
    { value: 'mutual-friend', label: 'Mutual Friend' },
    { value: 'best-friend', label: 'Best Friend' },
    { value: 'close-friend', label: 'Close Friend' },
    { value: 'casual-friend', label: 'Casual Friend' },
    { value: 'other-friend', label: 'Other' },
  ],
  colleague: [
    { value: 'current-colleague', label: 'Current Colleague' },
    { value: 'former-colleague', label: 'Former Colleague' },
    { value: 'team-member', label: 'Team Member' },
    { value: 'department-colleague', label: 'Same Department' },
    { value: 'cross-department', label: 'Cross-Department' },
    { value: 'project-partner', label: 'Project Partner' },
    { value: 'other-colleague', label: 'Other' },
  ],
  client: [
    { value: 'active-client', label: 'Active Client' },
    { value: 'past-client', label: 'Past Client' },
    { value: 'potential-client', label: 'Potential Client' },
    { value: 'key-account', label: 'Key Account' },
    { value: 'enterprise-client', label: 'Enterprise Client' },
    { value: 'small-business-client', label: 'Small Business Client' },
    { value: 'individual-client', label: 'Individual Client' },
    { value: 'referral-client', label: 'Referral Client' },
    { value: 'other-client', label: 'Other' },
  ],
  mentor: [
    { value: 'career-mentor', label: 'Career Mentor' },
    { value: 'technical-mentor', label: 'Technical Mentor' },
    { value: 'business-mentor', label: 'Business Mentor' },
    { value: 'life-mentor', label: 'Life Mentor' },
    { value: 'academic-mentor', label: 'Academic Mentor' },
    { value: 'industry-mentor', label: 'Industry Mentor' },
    { value: 'other-mentor', label: 'Other' },
  ],
  mentee: [
    { value: 'career-mentee', label: 'Career Mentee' },
    { value: 'technical-mentee', label: 'Technical Mentee' },
    { value: 'business-mentee', label: 'Business Mentee' },
    { value: 'academic-mentee', label: 'Academic Mentee' },
    { value: 'intern', label: 'Intern' },
    { value: 'other-mentee', label: 'Other' },
  ],
  acquaintance: [
    { value: 'networking-contact', label: 'Networking Contact' },
    { value: 'event-contact', label: 'Event Contact' },
    { value: 'conference-contact', label: 'Conference Contact' },
    { value: 'social-acquaintance', label: 'Social Acquaintance' },
    { value: 'professional-acquaintance', label: 'Professional Acquaintance' },
    { value: 'business-contact', label: 'Business Contact' },
    { value: 'vendor', label: 'Vendor/Supplier' },
    { value: 'service-provider', label: 'Service Provider' },
    { value: 'other-acquaintance', label: 'Other' },
  ],
  other: [
    { value: 'investor', label: 'Investor' },
    { value: 'advisor', label: 'Advisor' },
    { value: 'board-member', label: 'Board Member' },
    { value: 'competitor', label: 'Competitor' },
    { value: 'partner', label: 'Business Partner' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'journalist', label: 'Journalist/Media' },
    { value: 'influencer', label: 'Influencer' },
    { value: 'candidate', label: 'Candidate' },
    { value: 'other', label: 'Other' },
  ],
};

export const HIERARCHY_LEVELS: HierarchyLevel[] = [
  { value: 'ceo', label: 'CEO / Owner' },
  { value: 'c-level', label: 'C-Level Executive' },
  { value: 'vp', label: 'VP / Director' },
  { value: 'senior-manager', label: 'Senior Manager' },
  { value: 'manager', label: 'Manager' },
  { value: 'team-lead', label: 'Team Lead' },
  { value: 'senior', label: 'Senior Individual Contributor' },
  { value: 'mid-level', label: 'Mid-Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'intern', label: 'Intern' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'peer', label: 'Peer (Same Level)' },
  { value: 'reports-to-me', label: 'Reports to Me' },
  { value: 'i-report-to', label: 'I Report To' },
  { value: 'skip-level-above', label: 'Skip-Level (Above)' },
  { value: 'skip-level-below', label: 'Skip-Level (Below)' },
  { value: 'other', label: 'Other' },
];

export const getSubtypesForRelationship = (relationshipType: string): RelationshipSubtype[] => {
  return RELATIONSHIP_SUBTYPES[relationshipType] || [];
};

export const needsHierarchy = (relationshipType: string): boolean => {
  return ['colleague', 'client', 'mentor', 'mentee'].includes(relationshipType);
};
