/**
 * Contact Scope Utilities
 * 
 * This module provides a centralized way to enforce the "Active Contacts Only" invariant
 * across the application. All dashboard insights, metrics, alerts, suggestions, AI analysis,
 * and automation operate on active contacts only.
 * 
 * ALLOWED EXCEPTIONS (features that may access inactive contacts):
 * 1. Address Book views (explicitly toggled/tabbed)
 * 2. Contact selector/search by text (when assigning/tagging/linking)
 * 3. Import/dedup/sync utilities (if they must operate over everything)
 * 
 * All other features should use the `activeContactsOnly` filter.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Standard filter to apply to all profile queries for active-only scope.
 * Use this in Supabase queries: `.eq('is_active', true)`
 */
export const ACTIVE_CONTACTS_FILTER = { is_active: true } as const;

/**
 * Features that are explicitly allowed to access inactive contacts.
 * This list is used for documentation and potential audit logging.
 */
export const INACTIVE_CONTACT_EXCEPTIONS = [
  'address_book_list',
  'address_book_toggle',
  'contact_selector_search',
  'contact_assignment',
  'import_utility',
  'deduplication_utility',
  'sync_utility',
  'merge_contacts',
  'bulk_activation',
  // Analysis selectors - user explicitly selects a contact for analysis
  'cross_modal_synthesis_selector',
  'bulk_enrichment_selector',
  'capture_contact_linker',
  'media_upload_assignment',
  'unknown_persons_queue',
  // Single-profile operations - user explicitly selected the profile
  'single_profile_analysis',
] as const;

export type InactiveContactException = typeof INACTIVE_CONTACT_EXCEPTIONS[number];

/**
 * Helper to check if a feature is an allowed exception for inactive contact access.
 */
export function isInactiveContactException(feature: string): boolean {
  return INACTIVE_CONTACT_EXCEPTIONS.includes(feature as InactiveContactException);
}

/**
 * Document when a feature intentionally accesses inactive contacts.
 * In production, logs to database for audit purposes.
 */
export async function logInactiveContactAccess(
  feature: InactiveContactException,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Always log to console in development
  if (import.meta.env.DEV) {
    console.info(`[ContactScope] Inactive access: ${feature} - ${reason}`, metadata);
  }
  
  // In production, log to database audit table
  if (!import.meta.env.DEV) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      await supabase.from('error_logs').insert({
        user_id: userId || null,
        reference_id: `scope_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        code: 'CONTACT_SCOPE_AUDIT',
        message: `Inactive contact access: ${feature}`,
        context: {
          feature,
          reason,
          metadata,
          timestamp: new Date().toISOString(),
        } as unknown as Record<string, unknown>,
        severity: 'info',
        category: 'audit',
      } as never);
    } catch (error) {
      // Silently fail - don't break the feature for audit logging
      console.error('[ContactScope] Failed to log audit:', error);
    }
  }
}
