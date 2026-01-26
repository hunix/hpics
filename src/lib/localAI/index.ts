/**
 * Local AI Infrastructure
 * 
 * Enables GPU-accelerated AI capabilities using local hardware:
 * - Self-hosted LLM inference (Ollama, vLLM)
 * - GPU-accelerated Whisper transcription
 * - GPU-powered vector search (Faiss)
 * - Real-time video analytics
 */

export { LocalLLMClient, localLLM, type LocalLLMConfig, type LocalLLMMessage } from './localLLMClient';
export { GPUWhisperClient, gpuWhisper, type WhisperBatchConfig, type WhisperJobStatus } from './gpuWhisperClient';
export { GPUVectorStore, gpuVectorStore, type VectorSearchResult, type IndexConfig } from './gpuVectorStore';
export { VideoAnalyticsClient, videoAnalytics, type VideoIntelligence, type DetectedFace, type DetectedObject } from './videoAnalytics';
export { LocalAIManager, localAI, type LocalAIStatus, type GPUClusterStatus, type LocalAIConfig } from './localAIManager';
