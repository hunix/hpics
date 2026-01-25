/**
 * Constitutional AI Layer
 * 
 * Provides ethical and operational guardrails for AI self-defense.
 * All rules are stored in the database for dynamic management.
 * 
 * @version 3.9.0
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { callLovableAI } from './ai-client.ts';

export interface ConstitutionalRule {
  id: string;
  rule_key: string;
  rule_category: string;
  rule_name: string;
  rule_text: string;
  evaluation_prompt: string | null;
  severity: 'info' | 'warning' | 'block' | 'escalate';
  action_on_violation: 'log' | 'warn' | 'block' | 'rewrite' | 'escalate';
  applies_to_functions: string[];
  applies_to_categories: string[];
  priority: number;
  is_active: boolean;
}

export interface Violation {
  rule: ConstitutionalRule;
  reason: string;
  confidence: number;
  suggestedRewrite?: string;
}

export interface EvaluationResult {
  passed: boolean;
  violations: Violation[];
  blockedByRule: string | null;
  warnings: string[];
}

/**
 * Load applicable constitutional rules from database
 */
export async function loadConstitutionalRules(
  supabase: SupabaseClient,
  functionName?: string,
  category?: string
): Promise<ConstitutionalRule[]> {
  let query = supabase
    .from('constitutional_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('[ConstitutionalAI] Failed to load rules:', error.message);
    return [];
  }

  // Filter rules that apply to this function/category
  const rules = (data || []) as ConstitutionalRule[];
  
  return rules.filter(rule => {
    // If no specific functions/categories, rule applies to all
    const noFunctionFilter = !rule.applies_to_functions || rule.applies_to_functions.length === 0;
    const noCategoryFilter = !rule.applies_to_categories || rule.applies_to_categories.length === 0;
    
    if (noFunctionFilter && noCategoryFilter) {
      return true;
    }
    
    // Check if rule applies to specific function
    if (functionName && rule.applies_to_functions?.includes(functionName)) {
      return true;
    }
    
    // Check if rule applies to function category
    if (category && rule.applies_to_categories?.includes(category)) {
      return true;
    }
    
    // If filters exist but don't match, skip this rule
    return noFunctionFilter && noCategoryFilter;
  });
}

/**
 * Evaluate content against a single constitutional rule
 */
async function evaluateSingleRule(
  content: string,
  rule: ConstitutionalRule,
  context?: Record<string, unknown>
): Promise<{ passed: boolean; reason?: string; confidence: number }> {
  const prompt = rule.evaluation_prompt || `
Evaluate if the following content violates this rule:

RULE: ${rule.rule_name}
DESCRIPTION: ${rule.rule_text}

CONTENT TO EVALUATE:
${content}

Respond with a JSON object:
{
  "violates": boolean,
  "reason": "explanation if violates",
  "confidence": number between 0 and 1
}
`;

  try {
    const response = await callLovableAI({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'system',
          content: 'You are a constitutional AI evaluator. Assess content against ethical and operational rules. Be strict but fair. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      maxTokens: 500
    });

    const text = response.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        passed: !result.violates,
        reason: result.reason,
        confidence: result.confidence || 0.5
      };
    }
    
    // Default to passed if parsing fails
    return { passed: true, confidence: 0.3 };
  } catch (error) {
    console.error(`[ConstitutionalAI] Evaluation error for rule ${rule.rule_key}:`, error);
    // Fail open for non-critical rules, fail closed for blocking rules
    return {
      passed: rule.severity !== 'block',
      reason: 'Evaluation failed',
      confidence: 0.1
    };
  }
}

/**
 * Evaluate content against all applicable constitutional rules
 */
export async function evaluateConstitutionalRules(
  supabase: SupabaseClient,
  content: string,
  functionName?: string,
  category?: string,
  context?: Record<string, unknown>
): Promise<EvaluationResult> {
  const rules = await loadConstitutionalRules(supabase, functionName, category);
  
  const violations: Violation[] = [];
  const warnings: string[] = [];
  let blockedByRule: string | null = null;

  // Evaluate rules in priority order
  for (const rule of rules) {
    const result = await evaluateSingleRule(content, rule, context);
    
    if (!result.passed) {
      const violation: Violation = {
        rule,
        reason: result.reason || 'Rule violated',
        confidence: result.confidence
      };
      
      violations.push(violation);
      
      // Handle based on severity
      switch (rule.severity) {
        case 'block':
          blockedByRule = rule.rule_key;
          break;
        case 'escalate':
          blockedByRule = rule.rule_key;
          // Trigger escalation workflow asynchronously
          try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            
            // Fire and forget escalation - don't await to avoid blocking
            fetch(`${supabaseUrl}/functions/v1/trigger-escalation`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ruleId: rule.id,
                ruleKey: rule.rule_key,
                violationReason: result.reason,
                severity: 'critical',
                context,
                functionName,
              }),
            }).catch(err => {
              console.error('[ConstitutionalAI] Escalation trigger failed:', err);
            });
          } catch (escErr) {
            console.error('[ConstitutionalAI] Escalation setup failed:', escErr);
          }
          break;
        case 'warning':
          warnings.push(`${rule.rule_name}: ${result.reason}`);
          break;
        case 'info':
          // Just log, don't add to warnings
          console.info(`[ConstitutionalAI] Info: ${rule.rule_name} - ${result.reason}`);
          break;
      }
      
      // Stop on blocking violation
      if (blockedByRule) {
        break;
      }
    }
  }

  return {
    passed: violations.length === 0 || !blockedByRule,
    violations,
    blockedByRule,
    warnings
  };
}

/**
 * Log a constitutional violation to the database
 */
export async function logViolation(
  supabase: SupabaseClient,
  violation: {
    ruleId: string;
    userId: string;
    functionName: string;
    inputContent?: string;
    outputContent?: string;
    violationReason: string;
    severity: string;
    actionTaken: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('constitutional_violations')
    .insert({
      rule_id: violation.ruleId,
      user_id: violation.userId,
      function_name: violation.functionName,
      input_content: violation.inputContent,
      output_content: violation.outputContent,
      violation_reason: violation.violationReason,
      severity: violation.severity,
      action_taken: violation.actionTaken
    });

  if (error) {
    console.error('[ConstitutionalAI] Failed to log violation:', error.message);
  }
}

/**
 * Quick check for common violation patterns without AI
 */
export function quickSafetyCheck(content: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();

  // Patterns that should always be blocked
  const blockPatterns = [
    { pattern: /how to (make|create|build) (a |an )?(bomb|explosive|weapon)/i, issue: 'Potential weapons manufacturing' },
    { pattern: /ways to (kill|harm|hurt) (someone|people|a person)/i, issue: 'Potential violence' },
    { pattern: /how to (hack|break into|compromise)/i, issue: 'Potential hacking instruction' },
    { pattern: /(credit card|ssn|social security) (number|fraud)/i, issue: 'Potential financial fraud' },
  ];

  for (const { pattern, issue } of blockPatterns) {
    if (pattern.test(content)) {
      issues.push(issue);
    }
  }

  return {
    safe: issues.length === 0,
    issues
  };
}

/**
 * Wrapper to apply constitutional checks before and after AI calls
 */
export async function withConstitutionalGuard<T>(
  supabase: SupabaseClient,
  userId: string,
  functionName: string,
  input: string,
  operation: () => Promise<T>
): Promise<{ result: T | null; blocked: boolean; violations: Violation[] }> {
  // Pre-check input
  const quickCheck = quickSafetyCheck(input);
  if (!quickCheck.safe) {
    return {
      result: null,
      blocked: true,
      violations: quickCheck.issues.map(issue => ({
        rule: {
          id: 'quick-check',
          rule_key: 'quick_safety_check',
          rule_category: 'safety',
          rule_name: 'Quick Safety Check',
          rule_text: 'Automated pattern-based safety check',
          evaluation_prompt: null,
          severity: 'block',
          action_on_violation: 'block',
          applies_to_functions: [],
          applies_to_categories: [],
          priority: 1,
          is_active: true
        },
        reason: issue,
        confidence: 1.0
      }))
    };
  }

  // Full constitutional evaluation
  const inputEval = await evaluateConstitutionalRules(supabase, input, functionName);
  if (!inputEval.passed) {
    // Log violation
    for (const violation of inputEval.violations) {
      await logViolation(supabase, {
        ruleId: violation.rule.id,
        userId,
        functionName,
        inputContent: input.substring(0, 1000),
        violationReason: violation.reason,
        severity: violation.rule.severity,
        actionTaken: 'blocked'
      });
    }
    
    return {
      result: null,
      blocked: true,
      violations: inputEval.violations
    };
  }

  // Execute operation
  const result = await operation();

  return {
    result,
    blocked: false,
    violations: []
  };
}
