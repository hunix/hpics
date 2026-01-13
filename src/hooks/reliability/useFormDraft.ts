import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface FormDraftOptions<T> {
  formType: string;
  formKey: string;
  debounceMs?: number;
  expiryDays?: number;
  onRestore?: (data: T) => void;
}

interface DraftMeta {
  savedAt: string;
  expiresAt: string;
  formType: string;
  formKey: string;
}

interface StoredDraft<T> {
  data: T;
  meta: DraftMeta;
}

const STORAGE_PREFIX = 'form_draft_';

function getDraftKey(formType: string, formKey: string): string {
  return `${STORAGE_PREFIX}${formType}_${formKey}`;
}

export function useFormDraft<T extends Record<string, unknown>>({
  formType,
  formKey,
  debounceMs = 1000,
  expiryDays = 30,
  onRestore,
}: FormDraftOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = getDraftKey(formType, formKey);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredDraft<T> = JSON.parse(stored);
        const expiresAt = new Date(parsed.meta.expiresAt);
        
        if (expiresAt > new Date()) {
          setHasDraft(true);
          setData(parsed.data);
          setLastSaved(new Date(parsed.meta.savedAt));
        } else {
          // Draft expired, clean up
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Error loading form draft:', error);
    }
  }, [storageKey]);

  // Debounced save function
  const saveDraft = useCallback((newData: T) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        const draft: StoredDraft<T> = {
          data: newData,
          meta: {
            savedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            formType,
            formKey,
          },
        };

        localStorage.setItem(storageKey, JSON.stringify(draft));
        setHasDraft(true);
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error) {
        console.error('Error saving form draft:', error);
        setIsSaving(false);
      }
    }, debounceMs);
  }, [storageKey, debounceMs, expiryDays, formType, formKey]);

  // Update data and trigger auto-save
  const updateData = useCallback((newData: T | ((prev: T | null) => T)) => {
    const resolvedData = typeof newData === 'function' 
      ? (newData as (prev: T | null) => T)(data)
      : newData;
    setData(resolvedData);
    saveDraft(resolvedData);
  }, [data, saveDraft]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredDraft<T> = JSON.parse(stored);
        setData(parsed.data);
        onRestore?.(parsed.data);
        toast.success('Draft restored successfully');
        return parsed.data;
      }
    } catch (error) {
      console.error('Error restoring form draft:', error);
      toast.error('Failed to restore draft');
    }
    return null;
  }, [storageKey, onRestore]);

  // Discard draft
  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setData(null);
      setLastSaved(null);
      toast.success('Draft discarded');
    } catch (error) {
      console.error('Error discarding form draft:', error);
    }
  }, [storageKey]);

  // Force save immediately
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (data) {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        const draft: StoredDraft<T> = {
          data,
          meta: {
            savedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            formType,
            formKey,
          },
        };

        localStorage.setItem(storageKey, JSON.stringify(draft));
        setLastSaved(new Date());
        toast.success('Draft saved');
      } catch (error) {
        console.error('Error force saving form draft:', error);
      }
    }
  }, [data, storageKey, expiryDays, formType, formKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Warn on page leave if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);

  return {
    data,
    setData: updateData,
    hasDraft,
    isSaving,
    lastSaved,
    restoreDraft,
    discardDraft,
    forceSave,
  };
}

// Utility to get all drafts for a form type
export function getAllDrafts(formType: string): Array<{ key: string; meta: DraftMeta }> {
  const drafts: Array<{ key: string; meta: DraftMeta }> = [];
  const prefix = `${STORAGE_PREFIX}${formType}_`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          drafts.push({ key: key.replace(prefix, ''), meta: parsed.meta });
        }
      } catch {
        // Skip invalid entries
      }
    }
  }

  return drafts;
}

// Utility to clear all expired drafts
export function clearExpiredDrafts(): number {
  let cleared = 0;
  const now = new Date();

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (new Date(parsed.meta.expiresAt) < now) {
            localStorage.removeItem(key);
            cleared++;
          }
        }
      } catch {
        // Remove invalid entries
        if (key) localStorage.removeItem(key);
        cleared++;
      }
    }
  }

  return cleared;
}
