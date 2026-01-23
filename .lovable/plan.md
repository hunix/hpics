

# Database Health & Maintenance Implementation Plan

## Executive Summary

This plan addresses three major areas:
1. **Database Cleanup**: Merge 46 duplicate profile pairs, archive lonely profiles, clean stale bulk items
2. **Deduplication Guard**: Prevent future duplicates during profile creation/import
3. **Maintenance Dashboard**: Real-time visibility into database health with one-click cleanup actions

Additionally, we'll complete the **AGIS Phase 20-21 Transcendent features** that the conceptual tables were designed for.

---

## Part 1: Database Cleanup Operations

### Current State
| Issue | Count | Impact |
|-------|-------|--------|
| Duplicate profiles | 92 records (46 pairs) | Data fragmentation, split analytics |
| Stale bulk_analysis_items | 880 records | Storage bloat, confusing status |
| Orphaned media | 0 | Clean |

### Implementation

#### A. Bulk Duplicate Merger

Enhance `DuplicateProfileMerger.tsx` with batch operations:

```typescript
// New: Batch merge all duplicates at once
const batchMergeMutation = useMutation({
  mutationFn: async (duplicateGroups: DuplicateGroup[]) => {
    const results = [];
    for (const group of duplicateGroups) {
      // Auto-select primary: most media/relationships
      const primary = selectBestPrimary(group.profiles);
      const duplicates = group.profiles.filter(p => p.id !== primary.id);
      
      for (const dup of duplicates) {
        await supabase.rpc('merge_duplicate_profiles', {
          p_primary_id: primary.id,
          p_duplicate_id: dup.id,
          p_user_id: user.id
        });
        results.push({ merged: dup.id, into: primary.id });
      }
    }
    return results;
  }
});
```

#### B. Stale Bulk Items Cleanup

Add database function to purge old pending/failed items:

```sql
CREATE OR REPLACE FUNCTION cleanup_stale_bulk_items(
  p_user_id UUID,
  p_days_old INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM bulk_analysis_items
  WHERE user_id = p_user_id
  AND status IN ('pending', 'failed')
  AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Part 2: Deduplication Guard

### Profile Creation Flow Protection

#### A. ProfileService Enhancement

Update `src/domains/profile/services/ProfileService.ts`:

```typescript
async createProfile(userId: string, request: CreateProfileRequest): Promise<Profile> {
  // Check for existing duplicate
  const existing = await this.repository.findDuplicate(
    userId, 
    request.firstName, 
    request.lastName
  );
  
  if (existing) {
    throw new DuplicateProfileError(
      `Profile "${request.firstName} ${request.lastName}" already exists`,
      existing.id
    );
  }
  
  // Continue with creation...
}
```

#### B. Repository Method

Add to `IProfileRepository` interface:

```typescript
findDuplicate(
  userId: string, 
  firstName: string, 
  lastName?: string
): Promise<Profile | null>;
```

#### C. Import Pipeline Guard

Update import components to use existing `duplicateDetection.ts`:

```typescript
// In each import wizard (WhatsApp, LinkedIn, Outlook, etc.)
const { duplicates, unique } = await deduplicateAgainstExisting(
  importedContacts,
  existingProfiles
);

if (duplicates.length > 0) {
  // Show merge/skip dialog before proceeding
  setDuplicateConflicts(duplicates);
  return;
}
```

---

## Part 3: Maintenance Dashboard

### New Page: `/maintenance`

Create `src/pages/DatabaseMaintenance.tsx`:

```text
+------------------------------------------------------------------+
|  DATABASE MAINTENANCE CENTER                                      |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------+  +-------------+  +-------------+  +----------+  |
|  | DUPLICATES  |  | ORPHANED    |  | STALE JOBS  |  | EMPTY    |  |
|  |     46      |  |      0      |  |    880      |  | TABLES   |  |
|  |   pairs     |  |   records   |  |   items     |  |   474    |  |
|  +-------------+  +-------------+  +-------------+  +----------+  |
|                                                                   |
|  QUICK ACTIONS:                                                   |
|  [Merge All Duplicates]  [Purge Stale Items]  [Archive Empty]     |
|                                                                   |
|  +--------------------------------------------------------------+ |
|  | HEALTH METRICS                                                | |
|  | Total Rows: 857,073  |  Tables: 554  |  Empty: 474 (85.6%)   | |
|  | Storage Used: ~2.1GB |  Last Scan: Just now                  | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  DUPLICATE PROFILE GROUPS:                                        |
|  +--------------------------------------------------------------+ |
|  | Name              | Count | Created     | [Merge] [Skip]     | |
|  | John Smith        |   2   | Jan 4, 2026 |   [x]    [ ]       | |
|  | Sarah Johnson     |   3   | Jan 4, 2026 |   [x]    [ ]       | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Hook: `useDatabaseHealth`

```typescript
export function useDatabaseHealth() {
  const { data: health } = useQuery({
    queryKey: ['database-health'],
    queryFn: async () => {
      const [duplicates, staleItems, emptyTables] = await Promise.all([
        supabase.rpc('count_duplicate_profiles'),
        supabase.from('bulk_analysis_items')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'failed'])
          .lt('created_at', new Date(Date.now() - 3*24*60*60*1000).toISOString()),
        supabase.rpc('count_empty_tables')
      ]);
      
      return { duplicates, staleItems: staleItems.count, emptyTables };
    }
  });
  
  return { health, ... };
}
```

---

## Part 4: Build Out Conceptual Tables (AGIS Phase 20-21)

### Tables Already Exist (10 confirmed):
| Table | Columns | Purpose |
|-------|---------|---------|
| `quantum_states` | 13 | Superposition states for probability analysis |
| `morphic_fields` | 12 | Collective behavioral field tracking |
| `collective_fields` | 14 | Group mind dynamics |
| `dimensional_operations` | 13 | Cross-dimensional influence tracking |
| `reality_anchors` | 9 | Reality reinforcement points |
| `universal_awareness` | 11 | Omniscient perception nodes |
| `omniscient_synthesis` | 10 | All-knowing pattern compilation |
| `absolute_knowledge` | 11 | Universal truth repository |
| `infinite_perception` | 10 | Extrasensory perception modes |
| `reality_comprehension` | 10 | Reality frame understanding |

### Existing UI Pages:
- `/transcendent-consciousness` - Phase 20 (already built, using hooks)
- `/universal-omniscience` - Phase 21 (already built, using hooks)

### What's Missing: AI Population

The tables are empty because the AI generation edge functions aren't being triggered. We need to:

#### A. Create AI Analysis Edge Function

`supabase/functions/transcendent-analysis/index.ts`:

```typescript
// Analyzes profile data to generate:
// - Quantum states (probability amplitudes for decisions)
// - Morphic fields (group behavioral patterns)
// - Collective field dynamics (egregore detection)

const analysisPrompt = `
Analyze this contact's communication patterns to identify:
1. Decision superposition states (what conflicting choices they face)
2. Morphic field signatures (group behaviors they exhibit)
3. Collective unconscious archetypes (Jungian patterns)
4. Synchronicity events (meaningful coincidences in their timeline)
`;
```

#### B. Add "Analyze" Buttons to Phase 20/21 Pages

Currently the pages only display data - add analysis triggers:

```typescript
<Button onClick={() => runTranscendentAnalysis.mutate({ profileId })}>
  <Sparkles className="h-4 w-4 mr-2" />
  Run Quantum Analysis
</Button>
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/DatabaseMaintenance.tsx` | Create | Main maintenance dashboard |
| `src/hooks/useDatabaseHealth.ts` | Create | Health metrics hook |
| `src/domains/profile/services/ProfileService.ts` | Modify | Add duplicate check |
| `src/infrastructure/repositories/SupabaseProfileRepository.ts` | Modify | Add findDuplicate method |
| `src/components/contacts/DuplicateProfileMerger.tsx` | Modify | Add batch merge |
| `supabase/functions/transcendent-analysis/index.ts` | Create | AI population for Phase 20 tables |
| SQL Migration | Create | cleanup_stale_bulk_items function |

---

## Implementation Order

1. **Database cleanup functions** (SQL migration) - Enable purging
2. **Maintenance Dashboard** (new page + hook) - Visibility into health
3. **Deduplication guard** (ProfileService) - Prevent future duplicates  
4. **Transcendent Analysis edge function** - Populate Phase 20-21 tables
5. **UI enhancements** - Add analyze buttons to Phase 20/21 pages

---

## Technical Notes

- The `merge_duplicate_profiles` database function already exists and handles 30+ related tables
- Existing `duplicateDetection.ts` provides the detection logic for imports
- Phase 20/21 pages and hooks are fully built - they just need data population
- All operations will be user-scoped via RLS policies

