import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Table categorization for retention policies
const DATA_CATEGORIES: Record<string, string[]> = {
  messages: [
    'chat_messages',
    'email_messages', 
    'communication_history',
    'message_drafts',
  ],
  biometrics: [
    'contact_biometrics',
    'biometric_enrollment_sessions',
    'voice_samples',
    'facial_samples',
    'interaction_biometrics',
    'biometric_templates',
  ],
  financial: [
    'financial_intelligence',
    'economic_profiles',
    'transaction_history',
    'investment_patterns',
  ],
  analytics: [
    'behavioral_patterns',
    'relationship_analytics',
    'engagement_metrics',
    'platform_analytics',
    'ai_analyses',
  ],
  logs: [
    'audit_log',
    'agent_trace_sessions',
    'agent_spans',
    'data_retention_execution_log',
    'api_usage_logs',
  ],
  interactions: [
    'contact_interaction_notes',
    'contact_observations',
    'contact_events',
    'relationship_events',
    'calendar_events',
  ],
};

// Default retention periods (in days) per category - GDPR/CCPA compliant defaults
const DEFAULT_RETENTION_DAYS: Record<string, number> = {
  messages: 730,      // 2 years
  biometrics: 90,     // 90 days (sensitive)
  financial: 2555,    // 7 years (compliance requirement)
  analytics: 365,     // 1 year
  logs: 90,           // 90 days
  interactions: 1095, // 3 years
};

interface RetentionPolicy {
  id: string;
  user_id: string;
  data_category: string;
  table_name: string;
  retention_days: number;
  delete_strategy: 'soft_delete' | 'hard_delete' | 'anonymize';
  is_enabled: boolean;
  records_deleted: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'execute-data-retention',
      timestamp: Date.now(),
      categories: Object.keys(DATA_CATEGORIES),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { userId, dryRun = false, category, tableNames } = body;

    // For scheduled runs (no userId), process all users
    const isScheduledRun = !userId;
    let targetUserIds: string[] = [];

    if (isScheduledRun) {
      // Get all users with enabled retention policies
      const { data: policies } = await supabase
        .from('data_retention_policies')
        .select('user_id')
        .eq('is_enabled', true);
      
      targetUserIds = [...new Set((policies || []).map(p => p.user_id))];
      console.log(`[Scheduled Run] Processing ${targetUserIds.length} users with retention policies`);
    } else {
      targetUserIds = [userId];
    }

    const results: any[] = [];

    for (const targetUserId of targetUserIds) {
      // Get enabled retention policies for this user
      let query = supabase
        .from('data_retention_policies')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_enabled', true);

      if (category) {
        query = query.eq('data_category', category);
      }

      if (tableNames?.length) {
        query = query.in('table_name', tableNames);
      }

      const { data: policies, error: policiesError } = await query;

      if (policiesError) {
        console.error(`Error fetching policies for user ${targetUserId}:`, policiesError);
        continue;
      }

      if (!policies?.length) {
        results.push({
          userId: targetUserId,
          message: 'No enabled retention policies found',
          processed: 0,
        });
        continue;
      }

      for (const policy of policies as RetentionPolicy[]) {
        const startTime = Date.now();
        
        // Create execution log entry
        const { data: logEntry, error: logError } = await supabase
          .from('data_retention_execution_log')
          .insert({
            user_id: targetUserId,
            policy_id: policy.id,
            table_name: policy.table_name,
            execution_status: 'running',
          })
          .select()
          .single();

        if (logError) {
          console.error(`Error creating log entry:`, logError);
          continue;
        }

        try {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);
          const cutoffISO = cutoffDate.toISOString();

          let recordsProcessed = 0;
          let recordsDeleted = 0;
          let recordsAnonymized = 0;

          // Determine the date column for this table
          const dateColumn = getDateColumnForTable(policy.table_name);

          if (dryRun) {
            // Just count records that would be affected
            const { count, error } = await supabase
              .from(policy.table_name)
              .select('*', { count: 'exact', head: true })
              .eq('user_id', targetUserId)
              .lt(dateColumn, cutoffISO);

            if (!error) {
              recordsProcessed = count || 0;
            }
          } else {
            // Execute retention based on strategy
            switch (policy.delete_strategy) {
              case 'hard_delete':
                const { error: deleteError, count: deleteCount } = await supabase
                  .from(policy.table_name)
                  .delete({ count: 'exact' })
                  .eq('user_id', targetUserId)
                  .lt(dateColumn, cutoffISO);

                if (deleteError) {
                  throw deleteError;
                }
                recordsDeleted = deleteCount || 0;
                recordsProcessed = recordsDeleted;
                break;

              case 'soft_delete':
                // Check if table has is_deleted column
                const { error: softDeleteError, count: softCount } = await supabase
                  .from(policy.table_name)
                  .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                  .eq('user_id', targetUserId)
                  .lt(dateColumn, cutoffISO)
                  .is('is_deleted', null);

                if (softDeleteError) {
                  // Fall back to hard delete if soft delete not supported
                  const { error: fallbackError, count: fallbackCount } = await supabase
                    .from(policy.table_name)
                    .delete({ count: 'exact' })
                    .eq('user_id', targetUserId)
                    .lt(dateColumn, cutoffISO);

                  if (fallbackError) throw fallbackError;
                  recordsDeleted = fallbackCount || 0;
                } else {
                  recordsDeleted = softCount || 0;
                }
                recordsProcessed = recordsDeleted;
                break;

              case 'anonymize':
                // Anonymize PII fields instead of deleting
                const { error: anonError, count: anonCount } = await supabase
                  .from(policy.table_name)
                  .update({
                    // Common PII fields to anonymize
                    first_name: '[REDACTED]',
                    last_name: '[REDACTED]',
                    email: '[REDACTED]',
                    phone: '[REDACTED]',
                    notes: '[REDACTED]',
                    content: '[REDACTED]',
                    anonymized_at: new Date().toISOString(),
                  })
                  .eq('user_id', targetUserId)
                  .lt(dateColumn, cutoffISO)
                  .is('anonymized_at', null);

                if (!anonError) {
                  recordsAnonymized = anonCount || 0;
                }
                recordsProcessed = recordsAnonymized;
                break;
            }
          }

          const duration = Date.now() - startTime;

          // Update execution log
          await supabase
            .from('data_retention_execution_log')
            .update({
              execution_status: 'completed',
              records_processed: recordsProcessed,
              records_deleted: recordsDeleted,
              records_anonymized: recordsAnonymized,
              completed_at: new Date().toISOString(),
              duration_ms: duration,
            })
            .eq('id', logEntry.id);

          // Update policy with last executed info
          await supabase
            .from('data_retention_policies')
            .update({
              last_executed_at: new Date().toISOString(),
              records_deleted: (policy.records_deleted || 0) + recordsDeleted + recordsAnonymized,
            })
            .eq('id', policy.id);

          results.push({
            userId: targetUserId,
            policyId: policy.id,
            tableName: policy.table_name,
            category: policy.data_category,
            strategy: policy.delete_strategy,
            retentionDays: policy.retention_days,
            cutoffDate: cutoffISO,
            recordsProcessed,
            recordsDeleted,
            recordsAnonymized,
            durationMs: duration,
            dryRun,
          });

          console.log(`[${policy.table_name}] Processed: ${recordsProcessed}, Deleted: ${recordsDeleted}, Anonymized: ${recordsAnonymized}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing ${policy.table_name}:`, errorMessage);

          // Update execution log with error
          await supabase
            .from('data_retention_execution_log')
            .update({
              execution_status: 'failed',
              error_message: errorMessage,
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            })
            .eq('id', logEntry.id);

          results.push({
            userId: targetUserId,
            policyId: policy.id,
            tableName: policy.table_name,
            error: errorMessage,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      isScheduledRun,
      dryRun,
      totalUsers: targetUserIds.length,
      results,
      summary: {
        totalProcessed: results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0),
        totalDeleted: results.reduce((sum, r) => sum + (r.recordsDeleted || 0), 0),
        totalAnonymized: results.reduce((sum, r) => sum + (r.recordsAnonymized || 0), 0),
        totalErrors: results.filter(r => r.error).length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Data retention execution failed:', errorMessage);

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to determine the date column for a table
function getDateColumnForTable(tableName: string): string {
  // Tables with specific date columns
  const dateColumnMap: Record<string, string> = {
    'contact_observations': 'observation_date',
    'calendar_events': 'event_date',
    'relationship_events': 'event_date',
    'contact_events': 'event_date',
    'biometric_enrollment_sessions': 'enrolled_at',
    'audit_log': 'logged_at',
    'agent_trace_sessions': 'started_at',
    'agent_spans': 'started_at',
  };

  return dateColumnMap[tableName] || 'created_at';
}
