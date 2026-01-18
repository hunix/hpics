/**
 * @fileoverview Central Type Exports
 * 
 * PERFORMANCE OPTIMIZED: Only essential types are re-exported here.
 * For database types, import from '@/types/database-helpers' directly.
 * For specialized types, import from their source files.
 */

// Database helpers - the primary source for DB types
export type {
  Profile,
  ExtendedProfile,
  Communication,
  CommunicationWithProfile,
  Event,
  EventWithProfile,
  Media,
  MediaWithProfile,
  Document,
  DocumentWithProfile,
  ContactMethod,
  VoiceInsight,
  DocumentInsight,
  AIAnalysis,
  MeetingRecording,
  RecordingWithProfile,
} from './database-helpers';

// Network types - commonly used
export type {
  NetworkNode,
  NetworkLink,
  NetworkMetrics,
  CentralityMap,
  ClusterMap,
} from './network.types';

// Intelligence types - commonly used
export type {
  RelationshipAnalysis,
  BehavioralAnalysis,
  IntelligenceReport,
} from './intelligence.types';
