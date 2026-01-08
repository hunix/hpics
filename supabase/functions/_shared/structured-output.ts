// Structured Output Extraction using Tool Calling
// Provides type-safe, reliable JSON extraction from AI responses

import { callAI, parseAIJson, type AIMessage } from './ai-client.ts';

interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface StructuredOutputOptions {
  model?: string;
  messages: AIMessage[];
  schema: ToolSchema;
  userId: string;
  functionName: string;
  profileId?: string;
  temperature?: number;
  enforceBudget?: boolean;
}

/**
 * Extract structured output using tool calling for reliable JSON
 * This is more reliable than asking the model to return JSON directly
 */
export async function extractStructuredOutput<T>(
  options: StructuredOutputOptions
): Promise<T> {
  const response = await callAI({
    model: options.model || 'google/gemini-2.5-flash',
    messages: options.messages,
    userId: options.userId,
    functionName: options.functionName,
    profileId: options.profileId,
    temperature: options.temperature ?? 0.3,
    enforceBudget: options.enforceBudget,
    tools: [
      {
        type: 'function',
        function: {
          name: options.schema.name,
          description: options.schema.description,
          parameters: options.schema.parameters,
        },
      },
    ],
    toolChoice: { type: 'function', function: { name: options.schema.name } },
  });

  // Parse the tool call response
  return parseAIJson<T>(response.content, {} as T);
}

// Pre-defined schemas for common analysis types

export const RELATIONSHIP_ANALYSIS_SCHEMA: ToolSchema = {
  name: 'analyze_relationship',
  description: 'Analyze the relationship between two people and provide structured insights',
  parameters: {
    type: 'object',
    properties: {
      relationship_type: {
        type: 'string',
        enum: ['professional', 'personal', 'family', 'romantic', 'acquaintance'],
      },
      strength_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Overall relationship strength from 0-100',
      },
      trust_level: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'very_high'],
      },
      communication_quality: {
        type: 'string',
        enum: ['poor', 'fair', 'good', 'excellent'],
      },
      risk_factors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            factor: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            mitigation: { type: 'string' },
          },
          required: ['factor', 'severity', 'mitigation'],
        },
      },
      opportunities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            opportunity: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            action: { type: 'string' },
          },
          required: ['opportunity', 'priority', 'action'],
        },
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 5,
      },
    },
    required: ['relationship_type', 'strength_score', 'trust_level', 'communication_quality', 'recommendations'],
    additionalProperties: false,
  },
};

export const BEHAVIORAL_ANALYSIS_SCHEMA: ToolSchema = {
  name: 'analyze_behavior',
  description: 'Analyze behavioral patterns and psychological indicators',
  parameters: {
    type: 'object',
    properties: {
      personality_traits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            trait: { type: 'string' },
            strength: { type: 'number', minimum: 0, maximum: 100 },
            evidence: { type: 'string' },
          },
          required: ['trait', 'strength', 'evidence'],
        },
      },
      communication_style: {
        type: 'object',
        properties: {
          primary_style: { type: 'string', enum: ['analytical', 'driver', 'expressive', 'amiable'] },
          formality_level: { type: 'string', enum: ['very_formal', 'formal', 'neutral', 'informal', 'very_informal'] },
          preferred_channels: { type: 'array', items: { type: 'string' } },
        },
        required: ['primary_style', 'formality_level'],
      },
      emotional_indicators: {
        type: 'object',
        properties: {
          baseline_sentiment: { type: 'number', minimum: -1, maximum: 1 },
          emotional_stability: { type: 'string', enum: ['low', 'medium', 'high'] },
          stress_indicators: { type: 'array', items: { type: 'string' } },
        },
        required: ['baseline_sentiment', 'emotional_stability'],
      },
      influence_susceptibility: {
        type: 'object',
        properties: {
          overall_score: { type: 'number', minimum: 0, maximum: 100 },
          effective_approaches: { type: 'array', items: { type: 'string' } },
          ineffective_approaches: { type: 'array', items: { type: 'string' } },
        },
        required: ['overall_score', 'effective_approaches'],
      },
      confidence_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Confidence in this analysis',
      },
    },
    required: ['personality_traits', 'communication_style', 'emotional_indicators', 'confidence_score'],
    additionalProperties: false,
  },
};

export const CHURN_PREDICTION_SCHEMA: ToolSchema = {
  name: 'predict_churn',
  description: 'Predict relationship churn risk and provide intervention recommendations',
  parameters: {
    type: 'object',
    properties: {
      churn_probability: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Probability of relationship ending in next 90 days',
      },
      risk_level: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
      },
      predicted_days_to_churn: {
        type: 'number',
        nullable: true,
        description: 'Estimated days until relationship ends, if high risk',
      },
      contributing_factors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            factor: { type: 'string' },
            impact: { type: 'number', minimum: 0, maximum: 1 },
            trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
          },
          required: ['factor', 'impact', 'trend'],
        },
      },
      recommended_interventions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            urgency: { type: 'string', enum: ['immediate', 'this_week', 'this_month'] },
            expected_impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['action', 'urgency', 'expected_impact'],
        },
      },
      confidence_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },
    },
    required: ['churn_probability', 'risk_level', 'contributing_factors', 'recommended_interventions', 'confidence_score'],
    additionalProperties: false,
  },
};

export const NETWORK_ANALYSIS_SCHEMA: ToolSchema = {
  name: 'analyze_network',
  description: 'Analyze network structure and identify opportunities',
  parameters: {
    type: 'object',
    properties: {
      network_health_score: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },
      key_metrics: {
        type: 'object',
        properties: {
          total_connections: { type: 'number' },
          active_connections: { type: 'number' },
          dormant_connections: { type: 'number' },
          at_risk_connections: { type: 'number' },
          average_connection_strength: { type: 'number' },
        },
        required: ['total_connections', 'active_connections', 'dormant_connections'],
      },
      structural_insights: {
        type: 'object',
        properties: {
          clusters_identified: { type: 'number' },
          bridge_connectors: { type: 'array', items: { type: 'string' } },
          isolated_nodes: { type: 'array', items: { type: 'string' } },
          network_density: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['clusters_identified', 'network_density'],
      },
      growth_opportunities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            opportunity: { type: 'string' },
            potential_value: { type: 'string', enum: ['low', 'medium', 'high'] },
            suggested_action: { type: 'string' },
          },
          required: ['opportunity', 'potential_value', 'suggested_action'],
        },
      },
      risk_areas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            risk: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            mitigation: { type: 'string' },
          },
          required: ['risk', 'severity', 'mitigation'],
        },
      },
    },
    required: ['network_health_score', 'key_metrics', 'structural_insights', 'growth_opportunities'],
    additionalProperties: false,
  },
};
