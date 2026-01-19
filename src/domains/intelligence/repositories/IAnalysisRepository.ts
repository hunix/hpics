/**
 * Analysis Repository Interface - DDD Repository Contract
 * 
 * Defines the contract for analysis and intelligence data persistence.
 */

import { Analysis, AnalysisType, AnalysisStatus } from '../entities/Analysis';
import { Dossier, DossierTemplate, DossierStatus } from '../entities/Dossier';
import { Insight, InsightCategory, InsightPriority } from '../entities/Insight';
import { 
  IUserScopedRepository, 
  QuerySpec, 
  PaginatedResult 
} from '@/domains/shared/repositories/BaseRepository';

/**
 * Analysis query options
 */
export interface AnalysisQueryOptions {
  types?: AnalysisType[];
  statuses?: AnalysisStatus[];
  minConfidence?: number;
  maxAgeHours?: number;
}

/**
 * Dossier query options
 */
export interface DossierQueryOptions {
  templates?: DossierTemplate[];
  statuses?: DossierStatus[];
  includeArchived?: boolean;
}

/**
 * Insight query options
 */
export interface InsightQueryOptions {
  categories?: InsightCategory[];
  priorities?: InsightPriority[];
  includeAcknowledged?: boolean;
  includeExpired?: boolean;
}

/**
 * Analysis Repository Interface
 */
export interface IAnalysisRepository extends IUserScopedRepository<Analysis, string> {
  /**
   * Find analyses for a profile
   */
  findByProfile(
    userId: string,
    profileId: string,
    options?: AnalysisQueryOptions
  ): Promise<Analysis[]>;

  /**
   * Find the latest analysis of a specific type
   */
  findLatestByType(
    userId: string,
    profileId: string,
    type: AnalysisType
  ): Promise<Analysis | null>;

  /**
   * Find stale analyses that need refresh
   */
  findStaleAnalyses(
    userId: string,
    maxAgeHours: number
  ): Promise<Analysis[]>;

  /**
   * Count analyses by type for a profile
   */
  countByType(
    userId: string,
    profileId: string
  ): Promise<Map<AnalysisType, number>>;
}

/**
 * Dossier Repository Interface
 */
export interface IDossierRepository extends IUserScopedRepository<Dossier, string> {
  /**
   * Find dossiers for a profile
   */
  findByProfile(
    userId: string,
    profileId: string,
    options?: DossierQueryOptions
  ): Promise<Dossier[]>;

  /**
   * Find the latest dossier for a profile
   */
  findLatest(
    userId: string,
    profileId: string
  ): Promise<Dossier | null>;

  /**
   * Find dossiers by template
   */
  findByTemplate(
    userId: string,
    template: DossierTemplate
  ): Promise<Dossier[]>;

  /**
   * Archive old dossiers
   */
  archiveOldDossiers(
    userId: string,
    profileId: string,
    keepLatest?: number
  ): Promise<number>;
}

/**
 * Insight Repository Interface
 */
export interface IInsightRepository extends IUserScopedRepository<Insight, string> {
  /**
   * Find insights for a profile
   */
  findByProfile(
    userId: string,
    profileId: string,
    options?: InsightQueryOptions
  ): Promise<Insight[]>;

  /**
   * Find active (unacknowledged, unexpired) insights
   */
  findActive(
    userId: string,
    profileId: string
  ): Promise<Insight[]>;

  /**
   * Find high priority insights across all profiles
   */
  findHighPriority(
    userId: string,
    limit?: number
  ): Promise<Insight[]>;

  /**
   * Acknowledge an insight
   */
  acknowledge(
    insightId: string,
    userId: string
  ): Promise<void>;

  /**
   * Bulk acknowledge insights
   */
  acknowledgeMany(
    insightIds: string[],
    userId: string
  ): Promise<number>;

  /**
   * Count active insights for a profile
   */
  countActive(
    userId: string,
    profileId: string
  ): Promise<number>;
}
