/**
 * Dossier Entity
 * 
 * Represents a comprehensive intelligence dossier for a profile.
 */

import { AggregateRoot, ConfidenceScore, ProfileId, Timestamp } from '@/domains/shared';

export type DossierTemplate = 
  | 'executive'
  | 'operational'
  | 'full'
  | 'surveillance'
  | 'warfare'
  | 'psychological'
  | 'data-fusion';

export type DossierStatus = 'draft' | 'generating' | 'complete' | 'archived';

export type RiskLevel = 'minimal' | 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export interface DossierSection {
  sectionId: string;
  title: string;
  category: 'core' | 'intelligence' | 'warfare' | 'analysis' | 'fusion';
  content: Record<string, unknown>;
  confidence: number;
  lastUpdated: Date;
}

export interface ExecutiveSummary {
  overview: string;
  keyFindings: string[];
  riskAssessment: string;
  recommendations: string[];
}

export interface ThreatAssessment {
  overallRisk: RiskLevel;
  riskFactors: Array<{ factor: string; severity: RiskLevel; mitigation?: string }>;
  vulnerabilities: string[];
  leveragePoints: string[];
}

export class Dossier extends AggregateRoot<string> {
  private _profileId: ProfileId;
  private _userId: string;
  private _template: DossierTemplate;
  private _status: DossierStatus;
  private _overallConfidence: ConfidenceScore;
  private _executiveSummary: ExecutiveSummary | null;
  private _threatAssessment: ThreatAssessment | null;
  private _sections: Map<string, DossierSection>;
  private _sourcesUsed: string[];
  private _generatedAt: Date | null;
  private _version: number;

  constructor(
    id: string,
    profileId: string,
    userId: string,
    template: DossierTemplate = 'full',
    status: DossierStatus = 'draft',
    overallConfidence: number = 0,
    executiveSummary: ExecutiveSummary | null = null,
    threatAssessment: ThreatAssessment | null = null,
    sections: DossierSection[] = [],
    sourcesUsed: string[] = [],
    generatedAt: Date | null = null,
    version: number = 1,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this._profileId = ProfileId.create(profileId);
    this._userId = userId;
    this._template = template;
    this._status = status;
    this._overallConfidence = ConfidenceScore.create(Math.max(0, Math.min(1, overallConfidence)));
    this._executiveSummary = executiveSummary;
    this._threatAssessment = threatAssessment;
    this._sections = new Map(sections.map(s => [s.sectionId, s]));
    this._sourcesUsed = sourcesUsed;
    this._generatedAt = generatedAt;
    this._version = version;
  }

  // Getters
  get profileId(): string { return this._profileId.value; }
  get userId(): string { return this._userId; }
  get template(): DossierTemplate { return this._template; }
  get status(): DossierStatus { return this._status; }
  get overallConfidence(): ConfidenceScore { return this._overallConfidence; }
  get confidenceValue(): number { return this._overallConfidence.value; }
  get executiveSummary(): ExecutiveSummary | null { return this._executiveSummary ? { ...this._executiveSummary } : null; }
  get threatAssessment(): ThreatAssessment | null { return this._threatAssessment ? { ...this._threatAssessment } : null; }
  get sectionCount(): number { return this._sections.size; }
  get sourcesUsed(): readonly string[] { return [...this._sourcesUsed]; }
  get generatedAt(): Date | null { return this._generatedAt; }
  get version(): number { return this._version; }

  // Domain Methods

  /**
   * Start generating the dossier
   */
  startGeneration(): void {
    this._status = 'generating';
    this.markUpdated();
  }

  /**
   * Complete dossier generation
   */
  completeGeneration(
    executiveSummary: ExecutiveSummary,
    threatAssessment: ThreatAssessment,
    overallConfidence: number
  ): void {
    this._status = 'complete';
    this._executiveSummary = executiveSummary;
    this._threatAssessment = threatAssessment;
    this._overallConfidence = ConfidenceScore.create(overallConfidence);
    this._generatedAt = new Date();
    this._version++;
    this.markUpdated();
  }

  /**
   * Add or update a section
   */
  upsertSection(section: Omit<DossierSection, 'lastUpdated'>): void {
    this._sections.set(section.sectionId, {
      ...section,
      lastUpdated: new Date(),
    });
    this.markUpdated();
  }

  /**
   * Get a section by ID
   */
  getSection(sectionId: string): DossierSection | undefined {
    return this._sections.get(sectionId);
  }

  /**
   * Get all sections
   */
  getAllSections(): DossierSection[] {
    return Array.from(this._sections.values());
  }

  /**
   * Get sections by category
   */
  getSectionsByCategory(category: DossierSection['category']): DossierSection[] {
    return this.getAllSections().filter(s => s.category === category);
  }

  /**
   * Add a source
   */
  addSource(sourceId: string): void {
    if (!this._sourcesUsed.includes(sourceId)) {
      this._sourcesUsed.push(sourceId);
      this.markUpdated();
    }
  }

  /**
   * Archive the dossier
   */
  archive(): void {
    this._status = 'archived';
    this.markUpdated();
  }

  /**
   * Check if dossier is stale
   */
  isStale(maxAgeHours: number = 24): boolean {
    if (!this._generatedAt) return true;
    const now = Timestamp.now();
    const generated = Timestamp.create(this._generatedAt);
    return now.diffInHours(generated) > maxAgeHours;
  }

  /**
   * Get the overall risk level
   */
  getRiskLevel(): RiskLevel {
    return this._threatAssessment?.overallRisk || 'minimal';
  }

  /**
   * Check if dossier needs refresh
   */
  needsRefresh(staleDays: number = 1): boolean {
    return this.isStale(staleDays * 24) || this._status === 'draft';
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const expectedSections = this.getExpectedSectionCount();
    return Math.min(100, (this._sections.size / expectedSections) * 100);
  }

  private getExpectedSectionCount(): number {
    const sectionCounts: Record<DossierTemplate, number> = {
      'executive': 15,
      'operational': 25,
      'full': 47,
      'surveillance': 20,
      'warfare': 30,
      'psychological': 25,
      'data-fusion': 64,
    };
    return sectionCounts[this._template] || 47;
  }

  /**
   * Serialize to plain object
   */
  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      profileId: this.profileId,
      userId: this.userId,
      template: this.template,
      status: this.status,
      overallConfidence: this.confidenceValue,
      executiveSummary: this.executiveSummary,
      threatAssessment: this.threatAssessment,
      sections: this.getAllSections(),
      sectionCount: this.sectionCount,
      sourcesUsed: [...this.sourcesUsed],
      generatedAt: this.generatedAt?.toISOString(),
      version: this.version,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
