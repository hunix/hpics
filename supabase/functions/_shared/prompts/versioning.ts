/**
 * Prompt Versioning and A/B Testing System
 * 
 * Implements Enhancement Roadmap Phase 6: Prompt Library with versioning,
 * A/B testing, and performance tracking.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { PROMPT_REGISTRY, PromptTemplate, PromptContext, renderPrompt } from './index.ts';

export interface PromptVersion {
  id: string;
  promptKey: string;
  version: string;
  systemPrompt: string;
  userTemplate: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  isBaseline: boolean;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface ABTestAssignment {
  testId: string;
  promptKey: string;
  assignedVersion: string;
  userId: string;
  profileId?: string;
  assignedAt: Date;
}

export interface PromptPerformanceMetrics {
  versionId: string;
  totalCalls: number;
  avgLatencyMs: number;
  avgTokens: number;
  avgCostCents: number;
  successRate: number;
  userSatisfactionScore?: number;
  conversionRate?: number;
}

/**
 * Get the appropriate prompt version for a user/profile based on A/B tests
 */
export async function getVersionedPrompt(
  supabase: ReturnType<typeof createClient>,
  promptKey: string,
  userId: string,
  profileId?: string
): Promise<{ prompt: PromptTemplate; versionId: string; isABTest: boolean }> {
  try {
    // Check for active A/B test assignment
    const { data: assignment } = await supabase
      .from('ab_test_assignments')
      .select(`
        id,
        test_id,
        assigned_variant,
        ab_tests!inner(
          id,
          prompt_key,
          test_status
        )
      `)
      .eq('user_id', userId)
      .eq('ab_tests.prompt_key', promptKey)
      .eq('ab_tests.test_status', 'running')
      .maybeSingle();

    if (assignment) {
      // Get the assigned version from prompt_versions table
      const { data: version } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', assignment.assigned_variant)
        .single();

      if (version) {
        return {
          prompt: {
            version: version.version,
            description: version.description || '',
            system: version.system_prompt,
            userTemplate: version.user_template,
            temperature: version.temperature ?? 0.7,
            maxTokens: version.max_tokens ?? 4000,
          },
          versionId: version.id,
          isABTest: true,
        };
      }
    }

    // No A/B test - get latest active version
    const { data: latestVersion } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion) {
      return {
        prompt: {
          version: latestVersion.version,
          description: latestVersion.description || '',
          system: latestVersion.system_prompt,
          userTemplate: latestVersion.user_template,
          temperature: latestVersion.temperature ?? 0.7,
          maxTokens: latestVersion.max_tokens ?? 4000,
        },
        versionId: latestVersion.id,
        isABTest: false,
      };
    }

    // Fallback to hardcoded prompts
    const prompts = PROMPT_REGISTRY[promptKey];
    if (prompts) {
      const versions = Object.keys(prompts);
      const latestKey = versions[versions.length - 1];
      return {
        prompt: prompts[latestKey],
        versionId: `local:${promptKey}:${latestKey}`,
        isABTest: false,
      };
    }

    throw new Error(`No prompt found for key: ${promptKey}`);
  } catch (error) {
    console.error('Error getting versioned prompt:', error);
    // Fallback to local registry
    const prompts = PROMPT_REGISTRY[promptKey];
    if (prompts) {
      const versions = Object.keys(prompts);
      const latestKey = versions[versions.length - 1];
      return {
        prompt: prompts[latestKey],
        versionId: `fallback:${promptKey}:${latestKey}`,
        isABTest: false,
      };
    }
    throw error;
  }
}

/**
 * Assign a user to an A/B test variant
 */
export async function assignToABTest(
  supabase: ReturnType<typeof createClient>,
  testId: string,
  userId: string,
  profileId?: string
): Promise<ABTestAssignment | null> {
  try {
    // Get test configuration
    const { data: test } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .eq('test_status', 'running')
      .single();

    if (!test) return null;

    // Check for existing assignment
    const { data: existing } = await supabase
      .from('ab_test_assignments')
      .select('*')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return {
        testId: existing.test_id,
        promptKey: test.prompt_key,
        assignedVersion: existing.assigned_variant,
        userId: existing.user_id,
        profileId: existing.profile_id,
        assignedAt: new Date(existing.assigned_at),
      };
    }

    // Parse traffic split to determine assignment
    const trafficSplit = test.traffic_split as Record<string, number>;
    const random = Math.random() * 100;
    let cumulative = 0;
    let assignedVariant = test.control_version_id;

    for (const [variant, percentage] of Object.entries(trafficSplit)) {
      cumulative += percentage;
      if (random <= cumulative) {
        if (variant === 'control') {
          assignedVariant = test.control_version_id;
        } else if (variant === 'variant') {
          assignedVariant = test.variant_version_id;
        } else {
          assignedVariant = variant; // Direct version ID
        }
        break;
      }
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('ab_test_assignments')
      .insert({
        test_id: testId,
        user_id: userId,
        profile_id: profileId,
        assigned_variant: assignedVariant,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      testId: assignment.test_id,
      promptKey: test.prompt_key,
      assignedVersion: assignment.assigned_variant,
      userId: assignment.user_id,
      profileId: assignment.profile_id,
      assignedAt: new Date(assignment.assigned_at),
    };
  } catch (error) {
    console.error('Error assigning to A/B test:', error);
    return null;
  }
}

/**
 * Track prompt performance metrics
 */
export async function trackPromptPerformance(
  supabase: ReturnType<typeof createClient>,
  versionId: string,
  metrics: {
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    costCents: number;
    success: boolean;
    userRating?: number;
    converted?: boolean;
  }
): Promise<void> {
  try {
    // Skip local/fallback versions
    if (versionId.startsWith('local:') || versionId.startsWith('fallback:')) {
      return;
    }

    await supabase
      .from('prompt_performance_metrics')
      .insert({
        version_id: versionId,
        latency_ms: metrics.latencyMs,
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        cost_cents: metrics.costCents,
        success: metrics.success,
        user_rating: metrics.userRating,
        converted: metrics.converted,
        recorded_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error tracking prompt performance:', error);
  }
}

/**
 * Record A/B test conversion
 */
export async function recordConversion(
  supabase: ReturnType<typeof createClient>,
  testId: string,
  userId: string
): Promise<void> {
  try {
    await supabase
      .from('ab_test_assignments')
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
      })
      .eq('test_id', testId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error recording conversion:', error);
  }
}

/**
 * Get A/B test results with statistical significance
 */
export async function getABTestResults(
  supabase: ReturnType<typeof createClient>,
  testId: string
): Promise<{
  control: { count: number; conversions: number; rate: number };
  variant: { count: number; conversions: number; rate: number };
  pValue: number;
  isSignificant: boolean;
  winner: 'control' | 'variant' | 'inconclusive';
}> {
  const { data: assignments } = await supabase
    .from('ab_test_assignments')
    .select('assigned_variant, converted')
    .eq('test_id', testId);

  const { data: test } = await supabase
    .from('ab_tests')
    .select('control_version_id, variant_version_id')
    .eq('id', testId)
    .single();

  if (!assignments || !test) {
    return {
      control: { count: 0, conversions: 0, rate: 0 },
      variant: { count: 0, conversions: 0, rate: 0 },
      pValue: 1,
      isSignificant: false,
      winner: 'inconclusive',
    };
  }

  const controlAssignments = assignments.filter(a => a.assigned_variant === test.control_version_id);
  const variantAssignments = assignments.filter(a => a.assigned_variant === test.variant_version_id);

  const controlConversions = controlAssignments.filter(a => a.converted).length;
  const variantConversions = variantAssignments.filter(a => a.converted).length;

  const controlRate = controlAssignments.length > 0 ? controlConversions / controlAssignments.length : 0;
  const variantRate = variantAssignments.length > 0 ? variantConversions / variantAssignments.length : 0;

  // Simplified z-test for statistical significance
  const n1 = controlAssignments.length;
  const n2 = variantAssignments.length;
  const p1 = controlRate;
  const p2 = variantRate;

  if (n1 < 30 || n2 < 30) {
    return {
      control: { count: n1, conversions: controlConversions, rate: controlRate },
      variant: { count: n2, conversions: variantConversions, rate: variantRate },
      pValue: 1,
      isSignificant: false,
      winner: 'inconclusive',
    };
  }

  const pooledP = (controlConversions + variantConversions) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
  const z = se > 0 ? Math.abs(p1 - p2) / se : 0;
  
  // Approximate p-value from z-score
  const pValue = 2 * (1 - normalCDF(z));
  const isSignificant = pValue < 0.05;

  let winner: 'control' | 'variant' | 'inconclusive' = 'inconclusive';
  if (isSignificant) {
    winner = variantRate > controlRate ? 'variant' : 'control';
  }

  return {
    control: { count: n1, conversions: controlConversions, rate: controlRate },
    variant: { count: n2, conversions: variantConversions, rate: variantRate },
    pValue,
    isSignificant,
    winner,
  };
}

// Standard normal CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}
