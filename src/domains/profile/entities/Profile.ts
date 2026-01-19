/**
 * Profile Entity
 * 
 * Core entity representing a contact/target profile in the system.
 */

import { BaseEntity } from '@/domains/shared/entities/BaseEntity';

export type RelationshipType = 
  | 'family' | 'friend' | 'colleague' | 'professional'
  | 'acquaintance' | 'target' | 'asset' | 'unknown';

export type ProfileStatus = 
  | 'active' | 'inactive' | 'archived' | 'under_analysis' | 'flagged';

export interface ContactInfo {
  email?: string;
  phone?: string;
  linkedin_url?: string;
}

export interface ProfileMetadata {
  source?: string;
  dataQualityScore?: number;
}

export interface ProfileProps {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  organization?: string;
  jobTitle?: string;
  relationshipType: RelationshipType;
  status: ProfileStatus;
  avatarUrl?: string;
  bio?: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  contactInfo: ContactInfo;
  metadata: ProfileMetadata;
  completenessScore: number;
  lastInteractionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Profile extends BaseEntity<string> {
  private _props: ProfileProps;

  constructor(props: ProfileProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._props = props;
  }

  get firstName(): string { return this._props.firstName; }
  get lastName(): string | undefined { return this._props.lastName; }
  get fullName(): string { return this._props.lastName ? `${this._props.firstName} ${this._props.lastName}` : this._props.firstName; }
  get organization(): string | undefined { return this._props.organization; }
  get jobTitle(): string | undefined { return this._props.jobTitle; }
  get relationshipType(): RelationshipType { return this._props.relationshipType; }
  get status(): ProfileStatus { return this._props.status; }
  get avatarUrl(): string | undefined { return this._props.avatarUrl; }
  get bio(): string | undefined { return this._props.bio; }
  get notes(): string | undefined { return this._props.notes; }
  get tags(): string[] { return [...this._props.tags]; }
  get isFavorite(): boolean { return this._props.isFavorite; }
  get contactInfo(): ContactInfo { return { ...this._props.contactInfo }; }
  get metadata(): ProfileMetadata { return { ...this._props.metadata }; }
  get completenessScore(): number { return this._props.completenessScore; }
  get lastInteractionAt(): Date | undefined { return this._props.lastInteractionAt; }
  get isComplete(): boolean { return this._props.completenessScore >= 0.8; }
  get needsEnrichment(): boolean { return this._props.completenessScore < 0.5; }

  static reconstitute(props: ProfileProps): Profile {
    return new Profile(props);
  }
}
