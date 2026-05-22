
-- ============================================================
-- BATCH 1: DB SECURITY CLOSEOUT
-- ============================================================

-- ----------- Part A: Restrict "Service role" policies to service_role role -----------

DO $$
DECLARE
  pol RECORD;
  sql TEXT;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
    FROM pg_policies
    WHERE schemaname='public'
      AND policyname ILIKE 'Service role%' OR policyname ILIKE '%manage%' AND policyname ILIKE 'constitutional_rules_manage'
  LOOP
    -- only act on policies that currently apply to PUBLIC (the cause of the lint)
    IF pol.roles = '{public}'::name[] THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
      sql := format('CREATE POLICY %I ON public.%I AS PERMISSIVE FOR %s TO service_role',
                    pol.policyname, pol.tablename,
                    CASE pol.cmd WHEN 'ALL' THEN 'ALL' ELSE pol.cmd END);
      IF pol.qual IS NOT NULL THEN
        sql := sql || format(' USING (%s)', pol.qual);
      END IF;
      IF pol.with_check IS NOT NULL THEN
        sql := sql || format(' WITH CHECK (%s)', pol.with_check);
      END IF;
      EXECUTE sql;
    END IF;
  END LOOP;
END $$;

-- Also lock constitutional_rules_manage explicitly
DROP POLICY IF EXISTS constitutional_rules_manage ON public.constitutional_rules;
CREATE POLICY constitutional_rules_manage ON public.constitutional_rules
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------- Part B: REVOKE EXECUTE on all public SECURITY DEFINER funcs, then GRANT allowlist -----------

DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                     f.proname, f.args);
    EXCEPTION WHEN OTHERS THEN
      -- swallow; some funcs may be owned by other roles
      NULL;
    END;
  END LOOP;
END $$;

-- Re-grant client-callable allowlist to authenticated
DO $$
DECLARE
  fn TEXT;
  r RECORD;
  allowlist TEXT[] := ARRAY[
    -- role / clearance / membership
    'has_role','has_clearance','has_compartment','get_user_clearance','owns_profile',
    'check_workspace_membership','is_workspace_admin','bootstrap_first_admin',
    -- vault / api keys
    'check_api_keys','delete_api_key','get_api_key','store_api_key',
    -- mutations callers use directly
    'toggle_contact_active_status','track_navigation_access',
    -- access logs (called from UI)
    'log_profile_access','log_contact_method_access','log_email_access',
    'log_security_event','log_budget_change',
    -- counts, filters, storage stats
    'get_contact_counts','get_contact_filter_options','get_contact_letter_counts',
    'get_contact_media_counts','get_contact_media_paginated','get_contact_storage_stats',
    'get_contacts_for_selection','get_document_folders','get_media_folders',
    'get_database_health_metrics','get_storage_summary','get_single_contact_storage',
    'get_account_storage_summary','get_shared_organizations','get_entity_mentions_cross_contact',
    'get_unread_alerts_count','get_or_set_cache','get_media_ids_for_analysis',
    -- search / match
    'search_contacts_v5','search_messages_v2','search_document_embeddings',
    'match_documents','match_documents_v2','match_facial_embeddings',
    'keyword_search_documents',
    -- network / duplicates
    'find_connection_path','find_cross_reference_matches','find_duplicate_profile',
    'count_duplicate_profiles','batch_merge_duplicates','merge_duplicate_profiles',
    -- housekeeping
    'cleanup_stale_bulk_items','archive_old_messages','clean_expired_cache',
    'create_storage_snapshot','increment_bulk_session_progress','increment_voice_session_progress',
    'increment_automation_counters','claim_pending_tasks','check_bulk_session_completion',
    'verify_audit_chain_segment','bulk_update_thread_counts','relink_email_threads_to_profiles',
    'refresh_contact_storage_stats'
  ];
BEGIN
  FOREACH fn IN ARRAY allowlist LOOP
    FOR r IN
      SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname='public' AND p.proname = fn
    LOOP
      BEGIN
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', fn, r.args);
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END LOOP;
END $$;
