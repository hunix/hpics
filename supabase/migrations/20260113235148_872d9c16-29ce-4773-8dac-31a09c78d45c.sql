-- Insert RAG configuration keys into platform_config
INSERT INTO public.platform_config (config_key, config_value, display_name, description, category, value_type, is_sensitive, default_value)
VALUES 
  ('rag.max_results', '20', 'RAG Max Results', 'Maximum number of results to return from RAG queries', 'ai', 'number', false, '20'),
  ('rag.similarity_threshold', '0.7', 'RAG Similarity Threshold', 'Minimum similarity score for RAG results (0-1)', 'ai', 'number', false, '0.7'),
  ('rag.rerank_enabled', 'true', 'Enable Re-ranking', 'Whether to use cross-encoder re-ranking for better search quality', 'ai', 'boolean', false, 'true'),
  ('rag.cross_encoder_model', '"cross-encoder/ms-marco-MiniLM-L-6-v2"', 'Cross-Encoder Model', 'Model used for re-ranking search results', 'ai', 'string', false, '"cross-encoder/ms-marco-MiniLM-L-6-v2"'),
  ('rag.hybrid_search_alpha', '0.5', 'Hybrid Search Alpha', 'Weight between vector (1.0) and keyword (0.0) search', 'ai', 'number', false, '0.5'),
  ('rag.context_window_tokens', '8000', 'Context Window Tokens', 'Maximum tokens for RAG context in AI prompts', 'ai', 'number', false, '8000'),
  ('rag.citation_required', 'true', 'Require Citations', 'Whether AI responses must include source citations', 'ai', 'boolean', false, 'true')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  value_type = EXCLUDED.value_type,
  default_value = EXCLUDED.default_value;