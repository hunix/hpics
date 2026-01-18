/**
 * Type definitions for AI-generated insights and analysis results
 */

export interface VoiceSpeaker {
    id: string;
    name?: string;
    role?: string;
    speakingTime?: number;
}

export interface VoiceTopic {
    topic: string;
    confidence: number;
    keywords: string[];
}

export interface NamedEntities {
    people?: string[];
    organizations?: string[];
    locations?: string[];
    dates?: string[];
    [key: string]: string[] | undefined;
}

export interface SentimentTimelinePoint {
    timestamp: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    text?: string;
}

export interface StressPoint {
    timestamp: number;
    level: number;
    indicators: string[];
}

export interface MoodPattern {
    mood: string;
    frequency: number;
    duration: number;
    contexts: string[];
}

export interface ActionItem {
    id: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assignedTo?: string;
}

export interface VoiceInsight {
    id: string;
    speakers?: VoiceSpeaker[];
    topics_discussed?: VoiceTopic[];
    named_entities?: NamedEntities;
    sentiment_timeline?: SentimentTimelinePoint[];
    stress_points?: StressPoint[];
    mood_patterns?: MoodPattern[];
    detected_keywords?: string[];
    mentioned_contacts?: string[];
    action_items?: ActionItem[];
    overall_sentiment?: 'positive' | 'negative' | 'neutral';
    confidence_score?: number;
}

export interface KeyValuePair {
    key: string;
    value: string;
    confidence?: number;
}

export interface ExtractedTable {
    headers: string[];
    rows: string[][];
    title?: string;
}

export interface ContactInfo {
    emails?: string[];
    phones?: string[];
    addresses?: string[];
    websites?: string[];
    [key: string]: string[] | undefined;
}

export interface DateFound {
    date: string;
    context?: string;
    type?: 'deadline' | 'meeting' | 'event' | 'other';
}

export interface Reminder {
    id: string;
    description: string;
    date?: string;
    priority: 'low' | 'medium' | 'high';
}

export interface DetectedPattern {
    pattern: string;
    occurrences: number;
    samples: string[];
}

export interface Anomaly {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    location?: string;
}

export interface DocumentInsight {
    id: string;
    document_type?: string;
    key_value_pairs?: KeyValuePair[];
    tables_extracted?: ExtractedTable[];
    contact_info_extracted?: ContactInfo;
    suggested_contacts?: string[];
    dates_found?: DateFound[];
    suggested_reminders?: Reminder[];
    summary?: string;
    patterns_detected?: Record<string, DetectedPattern[]>;
    anomalies?: Anomaly[];
    confidence_score?: number;
}
