# HPICS API Reference

> Edge Functions and API Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [AI Analysis Functions](#ai-analysis-functions)
4. [Contact Functions](#contact-functions)
5. [Biometric Functions](#biometric-functions)
6. [Intelligence Functions](#intelligence-functions)
7. [AGIS Functions](#agis-functions)
8. [Hardware Functions](#hardware-functions)
9. [Utility Functions](#utility-functions)
10. [Error Handling](#error-handling)

---

## Overview

### Base URL

All edge functions are accessed via:
```
https://yibszncvwmefwamayfty.supabase.co/functions/v1/{function-name}
```

### Request Format

```typescript
// Standard request
const response = await supabase.functions.invoke('function-name', {
  body: {
    // Request parameters
  }
});
```

### Response Format

```typescript
interface StandardResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    processingTime: number;
    cost?: number;
    model?: string;
  };
}
```

---

## Authentication

All edge functions require authentication via JWT token:

```typescript
// Automatic with Supabase client
import { supabase } from '@/integrations/supabase/client';

// Token is automatically included
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* params */ }
});
```

### Manual Authentication

```bash
curl -X POST \
  'https://yibszncvwmefwamayfty.supabase.co/functions/v1/function-name' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

---

## AI Analysis Functions

### `ai-analyze`

General-purpose AI analysis for text, images, and documents.

**Request:**
```typescript
interface AIAnalyzeRequest {
  content: string;           // Text content or base64 image
  contentType: 'text' | 'image' | 'document';
  analysisTypes: string[];   // ['sentiment', 'entities', 'summary']
  model?: string;            // Optional model override
  profileId?: string;        // Associate with contact
}
```

**Response:**
```typescript
interface AIAnalyzeResponse {
  results: {
    [analysisType: string]: any;
  };
  confidence: number;
  tokensUsed: number;
  cost: number;
}
```

**Example:**
```typescript
const { data } = await supabase.functions.invoke('ai-analyze', {
  body: {
    content: "Meeting went well, discussed partnership opportunities.",
    contentType: 'text',
    analysisTypes: ['sentiment', 'entities', 'summary'],
    profileId: 'contact-uuid'
  }
});
```

---

### `ai-image-analysis`

Specialized image analysis including facial recognition.

**Request:**
```typescript
interface ImageAnalysisRequest {
  imageUrl?: string;         // URL to image
  imageBase64?: string;      // Base64 encoded image
  analyses: string[];        // ['faces', 'objects', 'text', 'scene']
  profileId?: string;
  matchAgainstContacts?: boolean;
}
```

**Response:**
```typescript
interface ImageAnalysisResponse {
  faces: {
    boundingBox: BoundingBox;
    confidence: number;
    matchedProfileId?: string;
    matchConfidence?: number;
    emotions: EmotionScores;
    age: number;
    gender: string;
  }[];
  objects: DetectedObject[];
  text: ExtractedText[];
  scene: SceneDescription;
}
```

---

### `ai-video-analysis`

Frame-by-frame video analysis.

**Request:**
```typescript
interface VideoAnalysisRequest {
  videoUrl: string;
  analysisDepth: 'quick' | 'standard' | 'deep';
  analyses: string[];
  profileId?: string;
  trackPersons?: boolean;
}
```

**Response:**
```typescript
interface VideoAnalysisResponse {
  duration: number;
  framesAnalyzed: number;
  timeline: {
    timestamp: number;
    faces: FaceDetection[];
    events: DetectedEvent[];
    objects: DetectedObject[];
  }[];
  persons: TrackedPerson[];
  summary: string;
}
```

---

### `ai-personality-analysis`

Personality assessment from text content.

**Request:**
```typescript
interface PersonalityAnalysisRequest {
  profileId: string;
  texts: string[];           // Array of text samples
  includeTraits: string[];   // ['big5', 'dark_triad', 'attachment']
}
```

**Response:**
```typescript
interface PersonalityAnalysisResponse {
  big5: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  darkTriad?: {
    narcissism: number;
    machiavellianism: number;
    psychopathy: number;
  };
  attachment?: {
    style: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
    scores: AttachmentScores;
  };
  confidence: number;
}
```

---

### `ai-deception-analysis`

Multi-modal deception detection.

**Request:**
```typescript
interface DeceptionAnalysisRequest {
  profileId?: string;
  text?: string;
  audioUrl?: string;
  videoUrl?: string;
  contextType?: 'interview' | 'casual' | 'high_stakes';
}
```

**Response:**
```typescript
interface DeceptionAnalysisResponse {
  overallScore: number;      // 0-1, higher = more likely deceptive
  linguistic: {
    score: number;
    indicators: string[];
  };
  vocal?: {
    score: number;
    stressMarkers: StressMarker[];
  };
  facial?: {
    score: number;
    microExpressions: MicroExpression[];
  };
  crossModalConflicts: Conflict[];
  confidence: number;
}
```

---

## Contact Functions

### `create-contact`

Create a new contact profile.

**Request:**
```typescript
interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  notes?: string;
  tags?: string[];
  groupIds?: string[];
}
```

**Response:**
```typescript
interface CreateContactResponse {
  profileId: string;
  created: boolean;
}
```

---

### `update-contact`

Update existing contact.

**Request:**
```typescript
interface UpdateContactRequest {
  profileId: string;
  updates: Partial<ContactFields>;
}
```

---

### `enrich-contact`

Enrich contact with external data.

**Request:**
```typescript
interface EnrichContactRequest {
  profileId: string;
  sources: string[];  // ['linkedin', 'clearbit', 'hunter']
}
```

**Response:**
```typescript
interface EnrichContactResponse {
  enrichedFields: string[];
  newData: Record<string, any>;
  confidence: number;
}
```

---

### `analyze-relationship`

Analyze relationship between contacts.

**Request:**
```typescript
interface RelationshipAnalysisRequest {
  profileId1: string;
  profileId2: string;
  includeMetrics: string[];
}
```

**Response:**
```typescript
interface RelationshipAnalysisResponse {
  relationshipType: string;
  strength: number;
  communicationFrequency: number;
  sentimentTrend: number[];
  recommendations: string[];
}
```

---

## Biometric Functions

### `biometric-enroll`

Enroll biometric samples for a contact.

**Request:**
```typescript
interface BiometricEnrollRequest {
  profileId: string;
  modality: 'face' | 'voice' | 'gait' | 'keystroke' | 'signature';
  samples: string[];  // Base64 or URLs
}
```

**Response:**
```typescript
interface BiometricEnrollResponse {
  enrollmentId: string;
  qualityScores: number[];
  embedding: string;  // Encrypted embedding
}
```

---

### `biometric-match`

Match biometric sample against enrolled profiles.

**Request:**
```typescript
interface BiometricMatchRequest {
  modality: 'face' | 'voice' | 'gait';
  sample: string;
  threshold?: number;
  maxResults?: number;
}
```

**Response:**
```typescript
interface BiometricMatchResponse {
  matches: {
    profileId: string;
    confidence: number;
    modality: string;
  }[];
}
```

---

### `cross-modal-fusion`

Combine multiple biometric modalities for matching.

**Request:**
```typescript
interface CrossModalFusionRequest {
  samples: {
    modality: string;
    data: string;
  }[];
  profileId?: string;  // Optional: match against specific contact
}
```

**Response:**
```typescript
interface CrossModalFusionResponse {
  matches: FusedMatch[];
  confidenceBreakdown: {
    modality: string;
    contribution: number;
    confidence: number;
  }[];
  overallConfidence: number;
}
```

---

## Intelligence Functions

### `network-analysis`

Analyze contact network structure.

**Request:**
```typescript
interface NetworkAnalysisRequest {
  profileIds?: string[];     // Specific contacts or all
  metrics: string[];         // ['pagerank', 'betweenness', 'communities']
  depth?: number;            // Relationship depth
}
```

**Response:**
```typescript
interface NetworkAnalysisResponse {
  nodes: {
    id: string;
    metrics: Record<string, number>;
    community?: number;
  }[];
  edges: {
    source: string;
    target: string;
    weight: number;
    type: string;
  }[];
  communities: {
    id: number;
    members: string[];
    label?: string;
  }[];
}
```

---

### `influence-path`

Find optimal influence path between contacts.

**Request:**
```typescript
interface InfluencePathRequest {
  sourceProfileId: string;
  targetProfileId: string;
  maxHops?: number;
  optimizeFor?: 'shortest' | 'strongest' | 'fastest';
}
```

**Response:**
```typescript
interface InfluencePathResponse {
  paths: {
    nodes: string[];
    totalStrength: number;
    estimatedTime: number;
    riskScore: number;
  }[];
  recommendation: string;
}
```

---

### `mice-analysis`

MICE vulnerability assessment.

**Request:**
```typescript
interface MICEAnalysisRequest {
  profileId: string;
  includeHistory?: boolean;
}
```

**Response:**
```typescript
interface MICEAnalysisResponse {
  scores: {
    money: number;
    ideology: number;
    coercion: number;
    ego: number;
  };
  primaryVulnerability: string;
  indicators: MICEIndicator[];
  recommendations: string[];
}
```

---

### `betrayal-prediction`

Predict likelihood of betrayal.

**Request:**
```typescript
interface BetrayalPredictionRequest {
  profileId: string;
  timeframe?: number;  // Days
}
```

**Response:**
```typescript
interface BetrayalPredictionResponse {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: BetrayalIndicator[];
  mitigationStrategies: string[];
}
```

---

## AGIS Functions

### `agis-analyze`

Run AGIS phase-specific analysis.

**Request:**
```typescript
interface AGISAnalyzeRequest {
  profileId: string;
  phase: number;             // 1-18
  analysisType: string;      // Phase-specific analysis
  options?: Record<string, any>;
}
```

**Response:**
```typescript
interface AGISAnalyzeResponse {
  phase: number;
  analysisType: string;
  results: any;
  cascadeTriggered?: CascadeEvent[];
  recommendations: string[];
}
```

---

### `agis-cascade`

Trigger cross-phase cascade.

**Request:**
```typescript
interface AGISCascadeRequest {
  sourcePhase: number;
  eventType: string;
  profileId?: string;
  data: Record<string, any>;
}
```

**Response:**
```typescript
interface AGISCascadeResponse {
  cascadeId: string;
  triggeredActions: {
    phase: number;
    action: string;
    status: string;
  }[];
}
```

---

### `agis-global-state`

Get/update AGIS global state.

**Request:**
```typescript
interface AGISGlobalStateRequest {
  action: 'get' | 'update';
  updates?: Partial<GlobalState>;
}
```

---

## Hardware Functions

### `hardware-command`

Send command to hardware device.

**Request:**
```typescript
interface HardwareCommandRequest {
  deviceId: string;
  command: string;
  parameters?: Record<string, any>;
}
```

**Response:**
```typescript
interface HardwareCommandResponse {
  commandId: string;
  status: 'sent' | 'acknowledged' | 'completed' | 'failed';
  result?: any;
}
```

---

### `hardware-status`

Get hardware device status.

**Request:**
```typescript
interface HardwareStatusRequest {
  deviceId?: string;  // Specific or all
  includeMetrics?: boolean;
}
```

**Response:**
```typescript
interface HardwareStatusResponse {
  devices: {
    id: string;
    name: string;
    type: string;
    online: boolean;
    lastSeen: string;
    metrics?: DeviceMetrics;
  }[];
}
```

---

## Utility Functions

### `generate-report`

Generate intelligence report.

**Request:**
```typescript
interface GenerateReportRequest {
  profileIds: string[];
  reportType: 'summary' | 'detailed' | 'executive';
  sections: string[];
  format: 'pdf' | 'docx' | 'json';
}
```

**Response:**
```typescript
interface GenerateReportResponse {
  reportId: string;
  downloadUrl: string;
  expiresAt: string;
}
```

---

### `semantic-search`

Search across all contact data.

**Request:**
```typescript
interface SemanticSearchRequest {
  query: string;
  filters?: {
    profileIds?: string[];
    dateRange?: DateRange;
    types?: string[];
  };
  limit?: number;
}
```

**Response:**
```typescript
interface SemanticSearchResponse {
  results: {
    id: string;
    type: string;
    profileId: string;
    content: string;
    relevance: number;
    highlights: string[];
  }[];
}
```

---

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | No valid authentication |
| `AUTH_EXPIRED` | Token expired |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request parameters |
| `RATE_LIMITED` | Too many requests |
| `BUDGET_EXCEEDED` | AI budget limit reached |
| `PROCESSING_ERROR` | Analysis failed |
| `HARDWARE_OFFLINE` | Device not connected |

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
    retryAfter?: number;  // Seconds
  };
}
```

### Retry Strategy

```typescript
async function invokeWithRetry(
  functionName: string,
  body: any,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    
    if (!error) return data;
    
    if (!error.retryable) throw error;
    
    await sleep(error.retryAfter * 1000 || 1000 * Math.pow(2, i));
  }
  throw new Error('Max retries exceeded');
}
```

---

*For feature details, see [FEATURES_CATALOG.md](./FEATURES_CATALOG.md)*  
*For database schema, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)*
