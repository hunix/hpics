/**
 * Local LLM Client
 * 
 * Connects to self-hosted LLM servers (Ollama, vLLM, LocalAI)
 * for private, unlimited AI inference on your GPU cluster.
 * 
 * Supports:
 * - DeepSeek-V3 (671B) on RTX Pro 6000 (96GB) with FP4
 * - Llama-3-70B unquantized across 3090Ti cluster
 * - Mixtral 8x7B, Qwen2.5, Phi-3, etc.
 */

export interface LocalLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // Base64 encoded images for multimodal
}

export interface LocalLLMConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  keepAlive?: string; // e.g., "5m" to keep model loaded
}

export interface LocalLLMResponse {
  message: LocalLLMMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface LocalLLMStreamChunk {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
}

const DEFAULT_CONFIG: LocalLLMConfig = {
  endpoint: 'http://localhost:11434',
  model: 'llama3.1:70b',
  temperature: 0.7,
  maxTokens: 4096,
  stream: true,
  keepAlive: '5m',
};

export class LocalLLMClient {
  private config: LocalLLMConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<LocalLLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if the local LLM server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models on the local server
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      console.error('[LocalLLM] Failed to list models:', error);
      return [];
    }
  }

  /**
   * Get model info including size and parameters
   */
  async getModelInfo(modelName?: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName || this.config.model }),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Non-streaming chat completion
   */
  async chat(messages: LocalLLMMessage[], options?: Partial<LocalLLMConfig>): Promise<LocalLLMResponse> {
    const config = { ...this.config, ...options, stream: false };
    
    const response = await fetch(`${config.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
        keep_alive: config.keepAlive,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LocalLLM error: ${error}`);
    }

    return await response.json();
  }

  /**
   * Streaming chat completion
   */
  async *chatStream(
    messages: LocalLLMMessage[],
    options?: Partial<LocalLLMConfig>
  ): AsyncGenerator<LocalLLMStreamChunk> {
    const config = { ...this.config, ...options, stream: true };
    
    this.abortController = new AbortController();

    const response = await fetch(`${config.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
        keep_alive: config.keepAlive,
      }),
      signal: this.abortController.signal,
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      throw new Error(`LocalLLM stream error: ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line) as LocalLLMStreamChunk;
              yield chunk;
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Cancel ongoing stream
   */
  cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Generate embeddings using local model
   */
  async embed(text: string | string[], model?: string): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    const embeddings: number[][] = [];

    for (const t of texts) {
      const response = await fetch(`${this.config.endpoint}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'nomic-embed-text',
          prompt: t,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      embeddings.push(data.embedding);
    }

    return embeddings;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<LocalLLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LocalLLMConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const localLLM = new LocalLLMClient();
