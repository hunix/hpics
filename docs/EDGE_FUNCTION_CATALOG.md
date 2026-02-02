# HPICS Edge Function Catalog
> Complete API Reference for 407+ Edge Functions

---

## Table of Contents

1. [Overview](#overview)
2. [AI Analysis Functions](#1-ai-analysis-functions)
3. [Intelligence Functions](#2-intelligence-functions)
4. [Prediction Functions](#3-prediction-functions)
5. [Biometric Functions](#4-biometric-functions)
6. [Warfare Functions](#5-warfare-functions)
7. [AGIS Functions](#6-agis-functions)
8. [Hardware Functions](#7-hardware-functions)
9. [Utility Functions](#8-utility-functions)

---

## Overview

### Authentication Pattern

All edge functions use the dual-auth pattern:

```typescript
// User token (browser calls)
Authorization: Bearer <user_jwt>

// Service role (backend-to-backend)
Authorization: Bearer <service_role_key>
Body: { userId: 'uuid', ...params }
```

### Health Check

All functions support health check:
```typescript
GET /function-name?healthCheck=1
// or
POST { "healthCheck": true }

// Response
{ "ok": true, "function": "function-name", "timestamp": 1234567890 }
```

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "executionTime": 1234,
    "model": "gemini-2.5-flash"
  }
}
```

**Error:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

# 1. AI Analysis Functions

## `ai-chat-query`

Conversational AI interface for natural language queries about contacts.

**Input:**
```json
{
  "userId": "uuid",
  "message": "What do I know about John's investment preferences?",
  "profileId": "uuid (optional)",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "options": {
    "includeRelated": true,
    "maxSources": 10
  }
}
```

**Output:**
```json
{
  "response": "Based on 12 conversations with John...",
  "sources": [
    {
      "type": "communication",
      "id": "uuid",
      "relevance": 0.92,
      "excerpt": "..."
    }
  ],
  "confidence": 0.87,
  "followUpSuggestions": [
    "Ask about risk tolerance",
    "Review recent market discussions"
  ],
  "tokensUsed": 1234,
  "costCents": 0.12
}
```

---

## `analyze-profile`

Comprehensive profile intelligence analysis.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "analysisTypes": [
    "personality",
    "communication",
    "network",
    "risk",
    "psychological"
  ],
  "depth": "comprehensive | standard | quick",
  "timeRange": "30d | 90d | 1y | all"
}
```

**Output:**
```json
{
  "personality": {
    "ocean": {
      "openness": 0.72,
      "conscientiousness": 0.85,
      "extraversion": 0.45,
      "agreeableness": 0.68,
      "neuroticism": 0.32
    },
    "communicationStyle": "analytical",
    "decisionMaking": "deliberate",
    "riskTolerance": "moderate"
  },
  "communication": {
    "preferredChannel": "email",
    "bestTime": "morning",
    "responseTimeAvg": "4.2 hours",
    "initiationRatio": 0.4
  },
  "network": {
    "connectionCount": 47,
    "centrality": 0.34,
    "communities": ["tech_startup", "investors"]
  },
  "risk": {
    "churnProbability": 0.12,
    "trustLevel": 0.78,
    "relationshipHealth": "strong"
  },
  "confidence": 0.89,
  "dataPointsAnalyzed": 234
}
```

---

## `analyze-behavioral`

Behavioral pattern analysis and personality profiling.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "analysisDepth": "comprehensive | standard",
  "includeTimeline": true
}
```

**Output:**
```json
{
  "personality": {
    "traits": [
      { "trait": "analytical", "strength": 0.85, "evidence": "Uses data in 78% of arguments" }
    ],
    "ocean": { ... }
  },
  "communicationPatterns": {
    "averageResponseTime": 3.5,
    "preferredHours": [9, 10, 11, 14, 15],
    "formalityLevel": 0.7,
    "emojiUsage": 0.1
  },
  "emotionalBaseline": {
    "averageSentiment": 0.35,
    "volatility": 0.15,
    "triggers": ["deadlines", "recognition"]
  },
  "timeline": [
    { "date": "2024-01-15", "metric": "sentiment", "value": 0.6, "event": "promotion" }
  ]
}
```

---

## `analyze-conversation-deep`

Deep analysis of conversation transcripts.

**Input:**
```json
{
  "userId": "uuid",
  "conversationId": "uuid (optional)",
  "transcript": "string (alternative to conversationId)",
  "analysisTypes": [
    "topics",
    "entities",
    "sentiment",
    "actionItems",
    "deception",
    "powerDynamics"
  ]
}
```

**Output:**
```json
{
  "topics": [
    { "topic": "Q4 budget", "mentions": 5, "sentiment": 0.2 }
  ],
  "entities": {
    "people": ["John Smith", "CEO"],
    "organizations": ["Acme Corp"],
    "dates": ["next Friday", "Q4"],
    "amounts": ["$50,000"]
  },
  "sentiment": {
    "overall": 0.3,
    "trajectory": [0.5, 0.3, 0.1, 0.4],
    "keyShifts": [
      { "timestamp": 120, "shift": -0.4, "trigger": "budget cuts mentioned" }
    ]
  },
  "actionItems": [
    { "action": "Send proposal", "owner": "John", "deadline": "next Friday" }
  ],
  "deceptionIndicators": {
    "probability": 0.15,
    "markers": []
  },
  "powerDynamics": {
    "dominantSpeaker": "user",
    "interruptionRatio": 0.3,
    "questionRatio": 0.6
  }
}
```

---

## `analyze-deception`

Multi-modal deception detection.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid (optional)",
  "content": {
    "text": "transcript or message",
    "audioUrl": "url (optional)",
    "videoUrl": "url (optional)"
  },
  "baselineProfileId": "uuid for comparison (optional)"
}
```

**Output:**
```json
{
  "deceptionProbability": 0.34,
  "confidence": 0.82,
  "indicators": [
    {
      "type": "linguistic",
      "marker": "excessive_detail",
      "weight": 0.3,
      "example": "specific unnecessary details about timeline"
    },
    {
      "type": "vocal",
      "marker": "pitch_variance",
      "weight": 0.2,
      "timestamp": 45.2
    }
  ],
  "baselineDeviation": 0.28,
  "assessment": "low_concern | elevated | high_concern",
  "recommendations": [
    "Follow up with specific questions about timeline"
  ]
}
```

---

## `analyze-vocal`

Voice analysis for emotion, stress, and speaker characteristics.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "audioUrl": "url",
  "analysisTypes": ["emotion", "stress", "speaker_id", "deception"]
}
```

**Output:**
```json
{
  "emotion": {
    "primary": "neutral",
    "secondary": "anxious",
    "confidence": 0.78,
    "timeline": [
      { "timestamp": 0, "emotion": "neutral", "intensity": 0.6 }
    ]
  },
  "stress": {
    "level": 0.45,
    "indicators": ["tremor", "pitch_elevation"],
    "baseline_deviation": 0.2
  },
  "speakerId": {
    "matchedProfileId": "uuid",
    "confidence": 0.92,
    "embedding": [0.123, -0.456, ...]
  },
  "deception": {
    "probability": 0.23,
    "markers": []
  }
}
```

---

## `analyze-facial`

Facial analysis for emotion, identity, and micro-expressions.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "imageUrl": "url (for single image)",
  "videoUrl": "url (for video analysis)",
  "analysisTypes": ["emotion", "identity", "microexpressions", "age", "attributes"]
}
```

**Output:**
```json
{
  "faces": [
    {
      "boundingBox": { "x": 100, "y": 50, "width": 200, "height": 250 },
      "emotion": {
        "primary": "happy",
        "scores": {
          "happy": 0.8,
          "neutral": 0.15,
          "sad": 0.05
        }
      },
      "identity": {
        "matchedProfileId": "uuid",
        "confidence": 0.94,
        "embedding": [...]
      },
      "microexpressions": [
        { "timestamp": 2.3, "expression": "contempt", "duration": 0.2, "confidence": 0.7 }
      ],
      "attributes": {
        "age": 35,
        "gender": "male",
        "glasses": true,
        "beard": false
      }
    }
  ],
  "videoSummary": {
    "dominantEmotion": "neutral",
    "emotionTrajectory": [...],
    "microexpressionCount": 3
  }
}
```

---

## `analyze-body-language`

Body language and non-verbal communication analysis.

**Input:**
```json
{
  "userId": "uuid",
  "videoUrl": "url",
  "analysisTypes": ["posture", "gestures", "engagement", "deception"]
}
```

**Output:**
```json
{
  "posture": {
    "openness": 0.7,
    "confidence": 0.6,
    "discomfort_indicators": []
  },
  "gestures": [
    { "timestamp": 12.5, "type": "illustrator", "description": "hand emphasis" },
    { "timestamp": 45.2, "type": "adaptor", "description": "face touch", "significance": "possible discomfort" }
  ],
  "engagement": {
    "level": 0.75,
    "trajectory": [...],
    "leaning": "forward"
  },
  "deceptionIndicators": {
    "probability": 0.2,
    "markers": [
      { "timestamp": 45.2, "type": "face_touch", "weight": 0.3 }
    ]
  },
  "overallAssessment": {
    "openToPersuasion": 0.6,
    "trustLevel": 0.7,
    "stressLevel": 0.3
  }
}
```

---

# 2. Intelligence Functions

## `intelligence-session-runner`

Orchestrates multi-task intelligence sessions with 94+ analysis types.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "sessionType": "comprehensive | quick | custom",
  "tasks": [
    "behavioral_baseline",
    "personality_ocean",
    "network_position",
    "psychological_profile",
    "mice_assessment",
    "sacred_values",
    "betrayal_risk"
  ],
  "priority": "high | normal | low",
  "options": {
    "parallelExecution": true,
    "maxConcurrent": 5,
    "timeout": 300
  }
}
```

**Output:**
```json
{
  "sessionId": "uuid",
  "status": "completed",
  "results": {
    "behavioral_baseline": { ... },
    "personality_ocean": { ... }
  },
  "summary": {
    "tasksCompleted": 7,
    "tasksFailed": 0,
    "totalDuration": 45000,
    "totalCost": 0.85
  },
  "errors": []
}
```

**Available Tasks (94+):**
| Category | Tasks |
|----------|-------|
| Behavioral | behavioral_baseline, communication_patterns, decision_analysis |
| Personality | personality_ocean, dark_triad, attachment_style |
| Psychological | cognitive_style, emotional_triggers, defense_mechanisms |
| Vulnerability | mice_assessment, trauma_indicators, addiction_patterns |
| Loyalty | betrayal_risk, sacred_values, trust_trajectory |
| Network | network_position, influence_score, community_membership |
| Prediction | churn_risk, opportunity_detection, life_events |

---

## `deep-intelligence-engine`

Multi-source intelligence fusion and comprehensive analysis.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "sources": ["communications", "social", "osint", "behavioral", "network"],
  "depth": "maximum",
  "includeContradictions": true
}
```

**Output:**
```json
{
  "synthesis": {
    "executiveSummary": "...",
    "keyInsights": [...],
    "blindSpots": [...],
    "contradictions": [
      {
        "topic": "income level",
        "sources": ["linkedin", "lifestyle"],
        "description": "LinkedIn shows mid-level role but lifestyle suggests higher income",
        "resolution": "Possible secondary income or family wealth"
      }
    ]
  },
  "sourceQuality": {
    "communications": { "recency": "7d", "volume": 45, "quality": 0.9 },
    "social": { "recency": "1d", "volume": 200, "quality": 0.7 }
  },
  "confidence": 0.85,
  "recommendedActions": [...]
}
```

---

## `mosaic-intelligence-fuser`

Combines fragmentary intelligence into coherent picture using Dempster-Shafer fusion.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "fragments": [
    {
      "source": "email",
      "claim": "works_at_acme",
      "confidence": 0.9,
      "timestamp": "2024-01-15"
    },
    {
      "source": "linkedin",
      "claim": "works_at_acme",
      "confidence": 0.95,
      "timestamp": "2024-01-10"
    }
  ],
  "fusionMethod": "dempster_shafer | bayesian | weighted_average"
}
```

**Output:**
```json
{
  "fusedBeliefs": [
    {
      "claim": "works_at_acme",
      "fusedConfidence": 0.995,
      "supportingSources": 2,
      "conflictingEvidence": false
    }
  ],
  "conflicts": [],
  "uncertainties": [
    { "topic": "income_level", "uncertainty": 0.4, "reason": "conflicting signals" }
  ]
}
```

---

## `behavioral-dna-sequencer`

Creates unique behavioral signature from communication patterns.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "sampleSize": 100,
  "includeComparison": true
}
```

**Output:**
```json
{
  "behavioralDNA": {
    "communicationGenome": [
      "morning_person",
      "formal_writer",
      "quick_responder",
      "detail_oriented"
    ],
    "decisionGenome": [
      "risk_averse",
      "data_driven",
      "consensus_seeker"
    ],
    "emotionalGenome": [
      "stable",
      "achievement_oriented",
      "family_focused"
    ],
    "socialGenome": [
      "introvert",
      "selective_networker",
      "deep_relationships"
    ]
  },
  "uniquenessScore": 0.94,
  "similarProfiles": [
    { "profileId": "uuid", "similarity": 0.72 }
  ],
  "fingerprint": "ABC123XYZ..."
}
```

---

## `cross-modal-correlator`

Correlates insights across different data modalities.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "modalities": ["text", "voice", "facial", "behavioral"],
  "correlationType": "consistency | contradiction | pattern"
}
```

**Output:**
```json
{
  "correlations": [
    {
      "finding": "elevated_stress",
      "modalities": ["voice", "facial", "text"],
      "agreement": 0.85,
      "evidence": {
        "voice": "tremor detected",
        "facial": "increased blink rate",
        "text": "shorter responses"
      }
    }
  ],
  "contradictions": [
    {
      "topic": "emotional_state",
      "text_indicates": "positive",
      "voice_indicates": "stressed",
      "explanation": "possible masking behavior"
    }
  ],
  "overallConsistency": 0.78
}
```

---

# 3. Prediction Functions

## `predict-churn-enhanced`

Relationship health and churn prediction.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "timeHorizon": "30d | 90d | 180d",
  "includeInterventions": true
}
```

**Output:**
```json
{
  "churnProbability": 0.35,
  "riskLevel": "moderate",
  "predictedDaysToChurn": 45,
  "contributingFactors": [
    {
      "factor": "communication_frequency_decline",
      "impact": 0.4,
      "trend": "worsening",
      "details": "50% drop in last 30 days"
    },
    {
      "factor": "sentiment_decline",
      "impact": 0.3,
      "trend": "stable",
      "details": "Sentiment dropped from 0.6 to 0.3"
    }
  ],
  "interventions": [
    {
      "action": "Schedule personal check-in call",
      "urgency": "this_week",
      "expectedImpact": 0.25,
      "script": "Hey [Name], I noticed we haven't connected lately..."
    }
  ],
  "confidence": 0.82
}
```

---

## `betrayal-likelihood-scorer`

Loyalty and betrayal risk assessment.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "includeWarningSignals": true,
  "includeMitigations": true
}
```

**Output:**
```json
{
  "defectionProbability": 0.23,
  "trustScore": 0.77,
  "trustHalfLife": 180,
  "warningSignals": [
    {
      "signal": "increased_secrecy",
      "severity": "low",
      "evidence": "Less sharing about work lately",
      "firstDetected": "2024-01-10"
    }
  ],
  "gottmanIndicators": {
    "criticism": 0.1,
    "contempt": 0.05,
    "defensiveness": 0.2,
    "stonewalling": 0.1,
    "overallRisk": "low"
  },
  "loyaltyBindingFactors": [
    { "factor": "shared_history", "strength": 0.8 },
    { "factor": "mutual_benefit", "strength": 0.7 }
  ],
  "mitigationStrategies": [
    {
      "strategy": "increase_transparency",
      "expectedImpact": 0.15,
      "implementation": "Share more about your own challenges"
    }
  ]
}
```

---

## `breaking-point-calculator`

Stress threshold and resilience analysis.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "currentStressors": ["work_deadline", "family_illness"]
}
```

**Output:**
```json
{
  "breakingPointScore": 0.72,
  "currentStressLevel": 0.55,
  "capacityRemaining": 0.17,
  "primaryStressors": [
    { "stressor": "work_deadline", "impact": 0.3 },
    { "stressor": "family_illness", "impact": 0.25 }
  ],
  "resilienceFactors": [
    { "factor": "strong_support_network", "impact": -0.15 },
    { "factor": "financial_stability", "impact": -0.1 }
  ],
  "estimatedThreshold": "1-2 additional major stressors",
  "warningIndicators": [
    { "indicator": "sleep_disruption", "present": true },
    { "indicator": "communication_withdrawal", "present": false }
  ],
  "recommendations": [
    "Avoid adding pressure in next 2 weeks",
    "Consider offering support with family situation"
  ]
}
```

---

## `life-sequence-predictor`

Major life event prediction.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "timeHorizon": "1y",
  "eventTypes": ["career", "relationship", "financial", "location", "health"]
}
```

**Output:**
```json
{
  "predictions": [
    {
      "event": "job_change",
      "probability": 0.65,
      "predictedTimeframe": "3-6 months",
      "indicators": [
        "LinkedIn activity increased",
        "Complaints about current role",
        "Industry average tenure approaching"
      ],
      "implications": [
        "May have less availability",
        "Opportunity for referral"
      ]
    },
    {
      "event": "relocation",
      "probability": 0.30,
      "predictedTimeframe": "6-12 months",
      "indicators": [
        "Mentioned partner's job opportunity",
        "Housing market research"
      ]
    }
  ],
  "timelineView": [
    { "month": "March", "likelyEvents": ["job_change"] },
    { "month": "August", "likelyEvents": ["relocation"] }
  ]
}
```

---

## `predict-behavioral-scenarios`

Monte Carlo simulation of future behaviors.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "scenarios": [
    { "event": "job_loss", "probability": 0.15 },
    { "event": "promotion", "probability": 0.30 },
    { "event": "relationship_change", "probability": 0.10 }
  ],
  "timeHorizon": "6_months",
  "iterations": 1000
}
```

**Output:**
```json
{
  "scenarios": [
    {
      "name": "career_advancement",
      "probability": 0.35,
      "conditions": ["promotion", "no job_loss"],
      "behavioralChanges": [
        { "behavior": "confidence", "change": "+25%" },
        { "behavior": "networking", "change": "+40%" }
      ],
      "relationshipImpact": "positive",
      "optimalApproach": "Congratulatory outreach, request for advice"
    },
    {
      "name": "career_setback",
      "probability": 0.15,
      "conditions": ["job_loss"],
      "behavioralChanges": [
        { "behavior": "stress", "change": "+60%" },
        { "behavior": "openness", "change": "-20%" }
      ],
      "relationshipImpact": "opportunity_for_support",
      "optimalApproach": "Empathetic outreach, offer help without being asked"
    }
  ],
  "confidenceInterval": 0.95,
  "simulationQuality": "high"
}
```

---

# 4. Biometric Functions

## `extract-facial-biometrics`

Face detection and embedding extraction.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "imageUrl": "url",
  "options": {
    "detectMultiple": false,
    "minFaceSize": 50,
    "returnLandmarks": true,
    "enrollmentType": "reference | probe"
  }
}
```

**Output:**
```json
{
  "faces": [
    {
      "boundingBox": { "x": 100, "y": 50, "width": 200, "height": 250 },
      "embedding": [0.123, -0.456, ...],
      "quality": {
        "overall": 0.92,
        "sharpness": 0.95,
        "lighting": 0.88,
        "pose": 0.93
      },
      "landmarks": {
        "leftEye": { "x": 150, "y": 120 },
        "rightEye": { "x": 230, "y": 118 },
        "nose": { "x": 190, "y": 180 },
        "leftMouth": { "x": 155, "y": 240 },
        "rightMouth": { "x": 225, "y": 238 }
      },
      "pose": {
        "yaw": 5.2,
        "pitch": -3.1,
        "roll": 1.8
      }
    }
  ],
  "enrollmentId": "uuid (if enrollment type = reference)"
}
```

---

## `extract-voice-biometrics`

Voice signature extraction.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "audioUrl": "url",
  "options": {
    "minDuration": 3,
    "removeNoise": true,
    "enrollmentType": "reference | probe"
  }
}
```

**Output:**
```json
{
  "embedding": [0.234, -0.567, ...],
  "quality": {
    "overall": 0.88,
    "signalToNoise": 25.5,
    "speechDuration": 12.4,
    "clarity": 0.91
  },
  "characteristics": {
    "pitchMean": 120.5,
    "pitchVariance": 15.2,
    "speakingRate": 145,
    "pauseRatio": 0.15
  },
  "enrollmentId": "uuid (if enrollment type = reference)"
}
```

---

## `match-biometrics`

1:N identity matching across enrolled biometrics.

**Input:**
```json
{
  "userId": "uuid",
  "modalityType": "facial | voice | gait | signature",
  "probeEmbedding": [0.123, -0.456, ...],
  "threshold": 0.75,
  "maxResults": 10,
  "searchScope": "all | recent | favorites"
}
```

**Output:**
```json
{
  "matches": [
    {
      "profileId": "uuid",
      "name": "John Smith",
      "confidence": 0.94,
      "enrollmentId": "uuid",
      "enrollmentDate": "2024-01-15"
    },
    {
      "profileId": "uuid",
      "name": "Unknown",
      "confidence": 0.78,
      "enrollmentId": "uuid"
    }
  ],
  "searchedCount": 1234,
  "processingTime": 450
}
```

---

## `cross-modal-fusion-realtime`

Real-time multi-modal identity verification.

**Input:**
```json
{
  "userId": "uuid",
  "modalities": {
    "facial": {
      "embedding": [0.123, ...],
      "confidence": 0.92
    },
    "voice": {
      "embedding": [0.234, ...],
      "confidence": 0.88
    },
    "gait": {
      "embedding": [0.345, ...],
      "confidence": 0.76
    }
  },
  "fusionMethod": "weighted_bayesian | dempster_shafer | voting",
  "candidateProfileIds": ["uuid1", "uuid2"]
}
```

**Output:**
```json
{
  "identity": {
    "profileId": "uuid",
    "name": "John Smith",
    "overallConfidence": 0.98,
    "modalityContributions": {
      "facial": 0.45,
      "voice": 0.35,
      "gait": 0.20
    }
  },
  "alternativeCandidates": [
    { "profileId": "uuid", "confidence": 0.23 }
  ],
  "fusionDetails": {
    "method": "weighted_bayesian",
    "priorDistribution": "uniform",
    "posteriorConfidence": 0.98
  }
}
```

---

## `analyze-gait-pattern`

Walking pattern identification from video.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "videoUrl": "url",
  "options": {
    "minWalkingDuration": 3,
    "analysisType": "identification | health | behavior"
  }
}
```

**Output:**
```json
{
  "embedding": [0.456, ...],
  "characteristics": {
    "strideLength": 0.72,
    "cadence": 112,
    "armSwingSymmetry": 0.94,
    "headPosition": "neutral",
    "shoulderSway": 0.08,
    "hipMovement": 0.12
  },
  "quality": {
    "overall": 0.85,
    "visibility": 0.9,
    "consistency": 0.8
  },
  "healthIndicators": {
    "normalcy": 0.95,
    "fatigue": 0.1,
    "injury": 0.05
  },
  "behavioralState": {
    "confidence": 0.7,
    "urgency": 0.3,
    "alertness": 0.8
  }
}
```

---

# 5. Warfare Functions

## `cognitive-warfare-engine`

Cognitive operation planning and execution.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "operationType": "perception_shift | belief_modification | decision_influence",
  "objective": "accept_proposal",
  "constraints": ["ethical", "legal", "professional"],
  "timeframe": "30d"
}
```

**Output:**
```json
{
  "operation": {
    "name": "Proposal Acceptance Campaign",
    "phases": [
      {
        "phase": 1,
        "name": "Foundation",
        "duration": "7d",
        "actions": [
          {
            "action": "Establish shared concerns",
            "method": "Conversational framing",
            "script": "I've been thinking about the challenges we discussed..."
          }
        ]
      },
      {
        "phase": 2,
        "name": "Reframing",
        "duration": "14d",
        "actions": [...]
      }
    ],
    "keyMessages": [
      { "message": "...", "psychologicalPrinciple": "scarcity", "timing": "phase_2" }
    ],
    "successProbability": 0.72,
    "riskAssessment": {
      "detectionRisk": 0.1,
      "backfireRisk": 0.15,
      "ethicalConcerns": []
    }
  }
}
```

---

## `memetic-propagation-engine`

Information spread modeling and viral idea engineering.

**Input:**
```json
{
  "userId": "uuid",
  "meme": {
    "content": "Core message or idea",
    "format": "story | statistic | question | meme_image",
    "emotionalPayload": ["outrage", "hope"]
  },
  "targetNetwork": "contact_network | custom_nodes",
  "seedNodes": ["uuid1", "uuid2"],
  "simulationParams": {
    "duration": 30,
    "model": "SIR | SEIR | custom"
  }
}
```

**Output:**
```json
{
  "metrics": {
    "r0": 2.4,
    "peakInfectionDay": 7,
    "totalReach": 0.67,
    "viralCoefficient": 1.8
  },
  "spreadPattern": [
    { "day": 1, "infected": 2, "recovered": 0, "susceptible": 98 },
    { "day": 7, "infected": 45, "recovered": 12, "susceptible": 43 }
  ],
  "keyNodes": {
    "superSpreaders": ["uuid1", "uuid3"],
    "bridgeNodes": ["uuid5"],
    "resistantNodes": ["uuid8"]
  },
  "optimization": {
    "optimalSeedSet": ["uuid1", "uuid4", "uuid7"],
    "expectedReachIncrease": 0.15
  }
}
```

---

## `sacred-value-predictor`

Non-negotiable belief identification and mapping.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "analysisDepth": "comprehensive"
}
```

**Output:**
```json
{
  "sacredValues": [
    {
      "value": "family_protection",
      "domain": "kinship",
      "intensity": 0.95,
      "evidence": [
        "Always prioritizes family events",
        "Defensive when family questioned"
      ],
      "violationResponse": "extreme_defensive",
      "leveragePotential": 0.9,
      "tabooTopics": ["parenting criticism", "family loyalty questioning"]
    },
    {
      "value": "professional_integrity",
      "domain": "career",
      "intensity": 0.8,
      "evidence": [...],
      "violationResponse": "withdrawal",
      "leveragePotential": 0.6
    }
  ],
  "moralFoundations": {
    "care": 0.8,
    "fairness": 0.7,
    "loyalty": 0.9,
    "authority": 0.5,
    "sanctity": 0.4,
    "liberty": 0.7
  },
  "manipulationVectors": [
    {
      "approach": "Appeal to family benefit",
      "effectiveness": 0.85,
      "example": "This would give you more time with your kids"
    }
  ]
}
```

---

## `mice-recruitment-analyzer`

CIA-style MICE vulnerability assessment.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "assessmentDepth": "comprehensive"
}
```

**Output:**
```json
{
  "miceProfile": {
    "money": {
      "score": 0.7,
      "indicators": [
        "Discussed financial stress in 3 conversations",
        "Interest in investment opportunities",
        "Lifestyle appears stretched"
      ],
      "approachEffectiveness": 0.8,
      "suggestedApproaches": [
        "Consulting opportunity",
        "Investment tip sharing"
      ]
    },
    "ideology": {
      "score": 0.3,
      "indicators": [
        "Strong political views but satisfied with status quo"
      ],
      "approachEffectiveness": 0.4
    },
    "compromise": {
      "score": 0.2,
      "indicators": [
        "Clean background",
        "No visible vulnerabilities"
      ],
      "approachEffectiveness": 0.2
    },
    "ego": {
      "score": 0.6,
      "indicators": [
        "Seeks recognition",
        "Sensitive to criticism",
        "Values status symbols"
      ],
      "approachEffectiveness": 0.7
    }
  },
  "optimalApproach": "money_ego_blend",
  "recruitmentProbability": 0.65,
  "recommendedSequence": [
    { "step": 1, "approach": "ego_flattery", "duration": "2 weeks" },
    { "step": 2, "approach": "money_opportunity", "duration": "4 weeks" }
  ]
}
```

---

## `trauma-exploitation-engine`

Trauma pattern analysis and vulnerability mapping.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "analysisType": "comprehensive | indicators_only"
}
```

**Output:**
```json
{
  "traumaProfile": {
    "identifiedTraumas": [
      {
        "type": "abandonment",
        "severity": 0.7,
        "origin": "childhood",
        "evidence": [
          "Fear of rejection patterns",
          "Attachment anxiety indicators"
        ],
        "triggers": [
          "Perceived rejection",
          "Lack of response"
        ],
        "copingMechanisms": [
          "Overachievement",
          "People pleasing"
        ]
      }
    ],
    "attachmentWounds": {
      "style": "anxious",
      "primaryFear": "abandonment",
      "secondaryFear": "inadequacy"
    },
    "defenseMechanisms": [
      { "mechanism": "projection", "frequency": "high" },
      { "mechanism": "rationalization", "frequency": "medium" }
    ]
  },
  "vulnerabilityMap": {
    "emotionalVulnerabilities": [
      { "area": "need_for_approval", "intensity": 0.8 }
    ],
    "cognitiveVulnerabilities": [
      { "area": "black_white_thinking", "intensity": 0.5 }
    ]
  },
  "leveragePoints": [
    {
      "point": "Approval seeking",
      "approach": "Provide validation followed by requests",
      "effectiveness": 0.75,
      "ethicalRating": "medium_concern"
    }
  ]
}
```

---

# 6. AGIS Functions

## `agis-cascade-orchestrator`

Cross-phase cascade rule execution.

**Input:**
```json
{
  "userId": "uuid",
  "action": "trigger | evaluate | configure",
  "triggerEvent": {
    "sourcePhase": 3,
    "eventType": "high_betrayal_risk",
    "sourceId": "uuid",
    "data": { "riskScore": 0.8 }
  }
}
```

**Output:**
```json
{
  "cascadeId": "uuid",
  "executedRules": [
    {
      "ruleId": "uuid",
      "ruleName": "betrayal_risk_escalation",
      "sourcePhase": 3,
      "targetPhase": 5,
      "action": "activate_monitoring",
      "status": "success",
      "result": { "monitoringCampaignId": "uuid" }
    }
  ],
  "affectedPhases": [3, 5, 19],
  "cascadePath": [
    { "phase": 3, "event": "trigger" },
    { "phase": 5, "event": "monitoring_activated" },
    { "phase": 19, "event": "state_updated" }
  ],
  "completionTime": 1234
}
```

---

## `autonomous-intelligence-orchestrator`

Autonomous campaign management and execution.

**Input:**
```json
{
  "userId": "uuid",
  "action": "create_campaign | execute | pause | status | full_sweep",
  "campaignConfig": {
    "name": "Relationship Nurture Q1",
    "campaignType": "relationship_maintenance | intelligence_gathering | influence",
    "targetProfileIds": ["uuid1", "uuid2"],
    "objectives": [
      { "goal": "maintain_engagement", "metric": "monthly_touchpoint" },
      { "goal": "increase_trust", "target": 0.8, "metric": "trust_score" }
    ],
    "constraints": {
      "maxContactsPerWeek": 3,
      "approvedChannels": ["email", "linkedin"],
      "contentApprovalRequired": true,
      "escalationThreshold": 0.3
    },
    "duration": 90
  }
}
```

**Output:**
```json
{
  "campaignId": "uuid",
  "status": "active",
  "progress": {
    "daysElapsed": 15,
    "daysRemaining": 75,
    "objectiveProgress": [
      { "goal": "maintain_engagement", "progress": 0.8, "onTrack": true },
      { "goal": "increase_trust", "progress": 0.45, "onTrack": true }
    ]
  },
  "executedActions": [
    { "date": "2024-01-20", "action": "email_sent", "profileId": "uuid1", "outcome": "opened" }
  ],
  "upcomingActions": [
    { "scheduledDate": "2024-01-25", "action": "linkedin_message", "profileId": "uuid2" }
  ],
  "metrics": {
    "engagementRate": 0.75,
    "responseRate": 0.6,
    "sentimentTrend": "improving"
  }
}
```

---

## `genesis-engine`

Phase 22 reality creation and causal origination operations.

**Input:**
```json
{
  "userId": "uuid",
  "operationType": "timeline_analysis | causal_chain | probability_collapse",
  "parameters": {
    "targetState": { ... },
    "constraints": { ... },
    "depth": "maximum"
  }
}
```

**Output:**
```json
{
  "genesisOperation": {
    "id": "uuid",
    "type": "causal_chain",
    "analysis": {
      "causalNodes": [...],
      "interventionPoints": [...],
      "probabilityDistribution": [...],
      "optimalPath": [...]
    },
    "recommendations": [...],
    "confidence": 0.75
  }
}
```

---

## `akashic-query-engine`

Universal memory access and meta-knowledge synthesis (Phase 21).

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid (optional)",
  "queryType": "historical_pattern | universal_truth | meta_synthesis",
  "query": "What patterns exist across all similar profiles?",
  "scope": "user | global | universal"
}
```

**Output:**
```json
{
  "queryResult": {
    "patterns": [
      {
        "pattern": "career_transition_before_40",
        "prevalence": 0.67,
        "relevantProfiles": 234,
        "confidence": 0.89
      }
    ],
    "universalTruths": [...],
    "synthesis": "Based on analysis of 234 similar profiles...",
    "confidence": 0.82,
    "sources": {
      "historical": 45,
      "cross_user": 189,
      "inferred": 23
    }
  }
}
```

---

# 7. Hardware Functions

## `hardware-gateway`

Central device coordination and management.

**Input:**
```json
{
  "userId": "uuid",
  "action": "register | command | status | list",
  "deviceId": "uuid (for command/status)",
  "deviceConfig": {
    "deviceType": "raspberry_pi | flipper_zero | drone | gopro | sdr | lora",
    "deviceName": "Office Hub",
    "capabilities": ["bluetooth", "wifi", "sensors"],
    "location": { "lat": 37.7749, "lng": -122.4194 }
  },
  "command": {
    "type": "scan | capture | transmit | configure",
    "parameters": { ... }
  }
}
```

**Output:**
```json
{
  "deviceId": "uuid",
  "status": "online",
  "lastSeen": "2024-01-20T15:30:00Z",
  "commandResult": {
    "success": true,
    "data": { ... },
    "executionTime": 1234
  },
  "devices": [
    {
      "id": "uuid",
      "name": "Office Hub",
      "type": "raspberry_pi",
      "status": "online",
      "capabilities": [...]
    }
  ]
}
```

---

## `aerial-intelligence`

Drone operation management and aerial surveillance.

**Input:**
```json
{
  "userId": "uuid",
  "action": "plan_mission | execute | abort | status | analyze",
  "droneId": "uuid",
  "mission": {
    "waypoints": [
      { "lat": 37.7749, "lng": -122.4194, "altitude": 50, "action": "photo" },
      { "lat": 37.7750, "lng": -122.4190, "altitude": 50, "action": "video_start" }
    ],
    "settings": {
      "speed": 5,
      "cameraMode": "auto",
      "returnOnLowBattery": true,
      "geofence": { ... }
    }
  }
}
```

**Output:**
```json
{
  "missionId": "uuid",
  "status": "in_progress",
  "progress": {
    "waypointsCompleted": 2,
    "waypointsTotal": 5,
    "batteryRemaining": 0.65,
    "currentPosition": { "lat": 37.7751, "lng": -122.4186, "altitude": 50 }
  },
  "captures": [
    {
      "id": "uuid",
      "type": "photo",
      "timestamp": "2024-01-20T15:30:00Z",
      "location": { ... },
      "url": "https://..."
    }
  ],
  "telemetry": {
    "speed": 4.8,
    "heading": 45,
    "windSpeed": 3.2
  }
}
```

---

## `rf-signal-intelligence`

Radio frequency analysis and signal intelligence.

**Input:**
```json
{
  "userId": "uuid",
  "deviceId": "uuid",
  "action": "scan | capture | analyze | identify | replay",
  "scanConfig": {
    "startFreq": 400000000,
    "endFreq": 500000000,
    "sampleRate": 2400000,
    "duration": 60
  },
  "captureConfig": {
    "frequency": 433920000,
    "bandwidth": 100000,
    "duration": 10
  }
}
```

**Output:**
```json
{
  "scanResults": {
    "activeFrequencies": [
      {
        "frequency": 433920000,
        "signalStrength": -45,
        "modulation": "ASK",
        "estimatedProtocol": "garage_door"
      }
    ],
    "duration": 60,
    "samplesProcessed": 144000000
  },
  "captureId": "uuid",
  "identification": {
    "protocol": "garage_door_fixed_code",
    "manufacturer": "LiftMaster",
    "codeLength": 12,
    "frequency": 433.92
  }
}
```

---

# 8. Utility Functions

## `generate-intelligence-dossier`

Generate comprehensive intelligence reports.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "template": "comprehensive | executive | background | tactical",
  "sections": [
    "executive_summary",
    "background",
    "psychological_profile",
    "network_analysis",
    "risk_assessment",
    "recommendations"
  ],
  "classification": "unclassified | confidential | secret",
  "format": "pdf | markdown | json"
}
```

**Output:**
```json
{
  "dossierId": "uuid",
  "status": "completed",
  "documentUrl": "https://...",
  "sections": {
    "executive_summary": { ... },
    "background": { ... }
  },
  "metadata": {
    "generatedAt": "2024-01-20T15:30:00Z",
    "pageCount": 24,
    "classification": "confidential",
    "dataPointsUsed": 456
  }
}
```

---

## `deep-osint-scan`

Open-source intelligence gathering.

**Input:**
```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "searchTerms": ["name", "email", "phone"],
  "sources": [
    "linkedin",
    "twitter",
    "facebook",
    "instagram",
    "news",
    "public_records",
    "court_records",
    "corporate_filings"
  ],
  "depth": "standard | deep | maximum"
}
```

**Output:**
```json
{
  "findings": {
    "socialProfiles": [
      { "platform": "linkedin", "url": "...", "verified": true, "data": { ... } }
    ],
    "newsArticles": [
      { "title": "...", "source": "...", "date": "...", "sentiment": 0.3 }
    ],
    "publicRecords": [
      { "type": "property", "data": { ... } }
    ],
    "corporateAffiliations": [
      { "company": "...", "role": "...", "dates": "..." }
    ]
  },
  "summary": {
    "sourcesSearched": 12,
    "findingsCount": 45,
    "confidence": 0.89,
    "lastUpdated": "2024-01-20"
  },
  "risks": [
    { "type": "reputation", "finding": "Negative press in 2022", "severity": "low" }
  ]
}
```

---

## `send-push-notification`

Send push notifications for alerts and updates.

**Input:**
```json
{
  "userId": "uuid",
  "notification": {
    "title": "High Priority Alert",
    "body": "Betrayal risk elevated for John Smith",
    "data": {
      "type": "alert",
      "profileId": "uuid",
      "priority": "high"
    }
  },
  "channels": ["push", "email", "sms"]
}
```

**Output:**
```json
{
  "sent": true,
  "channels": {
    "push": { "success": true, "deliveredAt": "..." },
    "email": { "success": true, "messageId": "..." }
  }
}
```

---

## `health-check`

System health verification.

**Input:**
```json
{
  "components": ["database", "ai", "biometrics", "hardware"]
}
```

**Output:**
```json
{
  "status": "healthy",
  "components": {
    "database": { "status": "healthy", "latency": 12 },
    "ai": { "status": "healthy", "modelsAvailable": 8 },
    "biometrics": { "status": "healthy", "enrollments": 1234 },
    "hardware": { "status": "degraded", "onlineDevices": 3, "totalDevices": 5 }
  },
  "timestamp": "2024-01-20T15:30:00Z"
}
```

---

# Function Index (A-Z)

| Function | Category | Purpose |
|----------|----------|---------|
| `action-intelligence-engine` | Intelligence | Action recommendation generation |
| `action-recommendation-engine` | Intelligence | Proactive action suggestions |
| `active-defense-orchestrator` | Warfare | Counter-intelligence operations |
| `adversary-profiler` | Intelligence | Adversary analysis |
| `aerial-intelligence` | Hardware | Drone operations |
| `affective-manipulation-detector` | Analysis | Emotional manipulation detection |
| `aggregate-bulk-results` | Utility | Batch result aggregation |
| `aggregate-contact-intelligence` | Intelligence | Multi-source intel fusion |
| `agis-api` | AGIS | AGIS system API |
| `agis-cascade-orchestrator` | AGIS | Cross-phase cascade execution |
| `ai-chat-query` | AI | Conversational AI interface |
| `akashic-query-engine` | AGIS | Universal memory queries |
| `analyze-behavioral` | AI | Behavioral pattern analysis |
| `analyze-body-language` | AI | Body language interpretation |
| `analyze-conversation-deep` | AI | Deep conversation analysis |
| `analyze-deception` | AI | Multi-modal deception detection |
| `analyze-facial` | AI | Facial analysis |
| `analyze-network-graph` | Intelligence | Network structure analysis |
| `analyze-profile` | AI | Comprehensive profile analysis |
| `analyze-vocal` | AI | Voice analysis |
| `autonomous-intelligence-orchestrator` | AGIS | Autonomous campaign management |
| `behavioral-dna-sequencer` | Intelligence | Behavioral signature creation |
| `betrayal-likelihood-scorer` | Prediction | Loyalty risk assessment |
| `biometric-behavioral-fusion` | Biometric | Cross-modal biometric fusion |
| `breaking-point-calculator` | Prediction | Stress threshold analysis |
| `cognitive-warfare-engine` | Warfare | Cognitive operations |
| `cross-modal-correlator` | Intelligence | Cross-modal insight correlation |
| `cross-modal-fusion-realtime` | Biometric | Real-time multi-modal verification |
| `deep-intelligence-engine` | Intelligence | Multi-source intel synthesis |
| `deep-osint-scan` | Intelligence | OSINT gathering |
| `extract-facial-biometrics` | Biometric | Face embedding extraction |
| `extract-voice-biometrics` | Biometric | Voice signature extraction |
| `generate-intelligence-dossier` | Utility | Report generation |
| `genesis-engine` | AGIS | Phase 22 operations |
| `hardware-gateway` | Hardware | Device coordination |
| `intelligence-session-runner` | Intelligence | 94-task orchestration |
| `life-sequence-predictor` | Prediction | Life event forecasting |
| `match-biometrics` | Biometric | Identity matching |
| `memetic-propagation-engine` | Warfare | Viral idea modeling |
| `mice-recruitment-analyzer` | Warfare | MICE vulnerability assessment |
| `mosaic-intelligence-fuser` | Intelligence | Fragment fusion |
| `predict-behavioral-scenarios` | Prediction | Behavior simulation |
| `predict-churn-enhanced` | Prediction | Relationship health |
| `rf-signal-intelligence` | Hardware | RF analysis |
| `sacred-value-predictor` | Warfare | Sacred value mapping |
| `trauma-exploitation-engine` | Warfare | Trauma analysis |

---

*HPICS Edge Function Catalog v3.8.0 | 407+ Functions*
