/**
 * GPU Vector Store
 * 
 * GPU-accelerated vector search using local Faiss server
 * with cuVS/CAGRA for sub-millisecond search on 1M+ vectors.
 * 
 * Optimized for:
 * - RTX Pro 6000 Blackwell (96GB) for massive indexes
 * - 3090Ti cluster for parallel index building
 */

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
  text?: string;
}

export interface IndexConfig {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'inner_product';
  indexType: 'flat' | 'ivf' | 'hnsw' | 'cagra'; // CAGRA is GPU-optimized
  gpuIndex?: number;
}

export interface IndexStats {
  name: string;
  vectorCount: number;
  dimension: number;
  memoryUsageMb: number;
  gpuMemoryUsageMb?: number;
  indexType: string;
  searchLatencyMs?: number;
}

export interface Document {
  id: string;
  text: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

const DEFAULT_ENDPOINT = 'http://localhost:8001';

export class GPUVectorStore {
  private endpoint: string;
  private currentIndex: string | null = null;

  constructor(endpoint: string = DEFAULT_ENDPOINT) {
    this.endpoint = endpoint;
  }

  /**
   * Check if the vector store server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List all indexes
   */
  async listIndexes(): Promise<IndexStats[]> {
    const response = await fetch(`${this.endpoint}/indexes`);
    if (!response.ok) throw new Error('Failed to list indexes');
    return await response.json();
  }

  /**
   * Create a new vector index
   */
  async createIndex(config: IndexConfig): Promise<void> {
    const response = await fetch(`${this.endpoint}/indexes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create index: ${error}`);
    }

    this.currentIndex = config.name;
  }

  /**
   * Delete an index
   */
  async deleteIndex(name: string): Promise<void> {
    const response = await fetch(`${this.endpoint}/indexes/${name}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete index');
    }

    if (this.currentIndex === name) {
      this.currentIndex = null;
    }
  }

  /**
   * Add documents to the index
   * Documents will be embedded if embeddings not provided
   */
  async addDocuments(
    documents: Document[],
    indexName?: string
  ): Promise<{ added: number; errors: string[] }> {
    const index = indexName || this.currentIndex;
    if (!index) throw new Error('No index selected');

    const response = await fetch(`${this.endpoint}/indexes/${index}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add documents: ${error}`);
    }

    return await response.json();
  }

  /**
   * Search the vector index
   * Query will be embedded if string is provided
   */
  async search(
    query: string | number[],
    options?: {
      indexName?: string;
      k?: number;
      filter?: Record<string, unknown>;
      includeMetadata?: boolean;
      includeText?: boolean;
    }
  ): Promise<VectorSearchResult[]> {
    const index = options?.indexName || this.currentIndex;
    if (!index) throw new Error('No index selected');

    const response = await fetch(`${this.endpoint}/indexes/${index}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        k: options?.k || 10,
        filter: options?.filter,
        includeMetadata: options?.includeMetadata ?? true,
        includeText: options?.includeText ?? true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Search failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Batch search multiple queries
   */
  async batchSearch(
    queries: Array<string | number[]>,
    options?: {
      indexName?: string;
      k?: number;
      filter?: Record<string, unknown>;
    }
  ): Promise<VectorSearchResult[][]> {
    const index = options?.indexName || this.currentIndex;
    if (!index) throw new Error('No index selected');

    const response = await fetch(`${this.endpoint}/indexes/${index}/batch-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries,
        k: options?.k || 10,
        filter: options?.filter,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch search failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Delete documents by ID
   */
  async deleteDocuments(ids: string[], indexName?: string): Promise<number> {
    const index = indexName || this.currentIndex;
    if (!index) throw new Error('No index selected');

    const response = await fetch(`${this.endpoint}/indexes/${index}/documents`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete documents');
    }

    const data = await response.json();
    return data.deleted;
  }

  /**
   * Get index statistics
   */
  async getIndexStats(indexName?: string): Promise<IndexStats> {
    const index = indexName || this.currentIndex;
    if (!index) throw new Error('No index selected');

    const response = await fetch(`${this.endpoint}/indexes/${index}/stats`);
    if (!response.ok) throw new Error('Failed to get stats');
    return await response.json();
  }

  /**
   * Optimize index for faster search (rebuilds GPU index)
   */
  async optimizeIndex(indexName?: string): Promise<void> {
    const index = indexName || this.currentIndex;
    if (!index) throw new Error('No index selected');

    const response = await fetch(`${this.endpoint}/indexes/${index}/optimize`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to optimize index');
    }
  }

  /**
   * Set current working index
   */
  setIndex(name: string): void {
    this.currentIndex = name;
  }

  /**
   * Get current index name
   */
  getCurrentIndex(): string | null {
    return this.currentIndex;
  }

  /**
   * Update endpoint
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }
}

// Singleton instance
export const gpuVectorStore = new GPUVectorStore();
