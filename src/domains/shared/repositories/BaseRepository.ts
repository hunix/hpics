/**
 * Base Repository - Abstract data access layer
 * 
 * Provides a consistent interface for data access across all domains.
 * Implementations should use the infrastructure layer (e.g., Supabase).
 */

import { BaseEntity } from '../entities/BaseEntity';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort parameters
 */
export interface SortParams<T> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Filter operators
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains';

/**
 * Filter condition
 */
export interface FilterCondition<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Query specification for complex queries
 */
export interface QuerySpec<T> {
  filters?: FilterCondition<T>[];
  sort?: SortParams<T>[];
  pagination?: PaginationParams;
  includes?: string[];
}

/**
 * Base repository interface
 */
export interface IRepository<TEntity extends BaseEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  findBySpec(spec: QuerySpec<TEntity>): Promise<PaginatedResult<TEntity>>;
  save(entity: TEntity): Promise<TEntity>;
  saveMany(entities: TEntity[]): Promise<TEntity[]>;
  delete(id: TId): Promise<void>;
  deleteMany(ids: TId[]): Promise<void>;
  exists(id: TId): Promise<boolean>;
  count(filters?: FilterCondition<TEntity>[]): Promise<number>;
}

/**
 * User-scoped repository interface
 * Most repositories in our system are user-scoped for security
 */
export interface IUserScopedRepository<TEntity extends BaseEntity, TId = string> 
  extends IRepository<TEntity, TId> {
  findByUserId(userId: string): Promise<TEntity[]>;
  findByUserIdAndSpec(userId: string, spec: QuerySpec<TEntity>): Promise<PaginatedResult<TEntity>>;
}

/**
 * Abstract base repository with common functionality
 */
export abstract class BaseRepository<TEntity extends BaseEntity, TId = string> 
  implements IRepository<TEntity, TId> {
  
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract findAll(): Promise<TEntity[]>;
  abstract save(entity: TEntity): Promise<TEntity>;
  abstract delete(id: TId): Promise<void>;

  async findBySpec(spec: QuerySpec<TEntity>): Promise<PaginatedResult<TEntity>> {
    // Default implementation - override in concrete repositories
    const all = await this.findAll();
    const filtered = this.applyFilters(all, spec.filters || []);
    const sorted = this.applySort(filtered, spec.sort || []);
    return this.applyPagination(sorted, spec.pagination);
  }

  async saveMany(entities: TEntity[]): Promise<TEntity[]> {
    return Promise.all(entities.map(e => this.save(e)));
  }

  async deleteMany(ids: TId[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id)));
  }

  async exists(id: TId): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }

  async count(filters?: FilterCondition<TEntity>[]): Promise<number> {
    const all = await this.findAll();
    if (!filters || filters.length === 0) {
      return all.length;
    }
    return this.applyFilters(all, filters).length;
  }

  protected applyFilters(items: TEntity[], filters: FilterCondition<TEntity>[]): TEntity[] {
    return items.filter(item => 
      filters.every(filter => this.matchesFilter(item, filter))
    );
  }

  protected matchesFilter(item: TEntity, filter: FilterCondition<TEntity>): boolean {
    const value = (item as Record<string, unknown>)[filter.field as string];
    
    switch (filter.operator) {
      case 'eq': return value === filter.value;
      case 'neq': return value !== filter.value;
      case 'gt': return (value as number) > (filter.value as number);
      case 'gte': return (value as number) >= (filter.value as number);
      case 'lt': return (value as number) < (filter.value as number);
      case 'lte': return (value as number) <= (filter.value as number);
      case 'like': return String(value).includes(String(filter.value));
      case 'ilike': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'in': return (filter.value as unknown[]).includes(value);
      case 'contains': return Array.isArray(value) && value.includes(filter.value);
      default: return true;
    }
  }

  protected applySort(items: TEntity[], sorts: SortParams<TEntity>[]): TEntity[] {
    if (sorts.length === 0) return items;

    return [...items].sort((a, b) => {
      for (const sort of sorts) {
        const aVal = (a as Record<string, unknown>)[sort.field as string] as number | string;
        const bVal = (b as Record<string, unknown>)[sort.field as string] as number | string;

        if (aVal === bVal) continue;

        const comparison = aVal < bVal ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }

  protected applyPagination(items: TEntity[], pagination?: PaginationParams): PaginatedResult<TEntity> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 50;
    const totalCount = items.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
