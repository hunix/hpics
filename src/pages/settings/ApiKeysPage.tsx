/**
 * @fileoverview Production-grade API Keys & Integrations management page
 * Vault-backed persistence with readback verification
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { checkApiKeys, saveApiKeys } from '@/lib/vault';
import { API_KEY_SECTIONS, getSecretKeyNames } from '@/lib/integrations/api-keys-registry';
import { KeySection } from '@/components/settings/KeySection';
import type { VaultSaveResult } from '@/lib/vault';

export default function ApiKeysPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check which keys are stored in Vault
  const allKeyNames = useMemo(() => getSecretKeyNames(), []);
  const { data: savedStatus, isLoading } = useQuery({
    queryKey: ['vault-key-status', user?.id],
    queryFn: () => checkApiKeys(allKeyNames),
    enabled: !!user,
    staleTime: 30_000,
  });

  const handleValueChange = useCallback((envVar: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [envVar]: value }));
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      if (value) next.add(envVar);
      else next.delete(envVar);
      return next;
    });
    setSaveResult(null);
  }, []);

  const handleSave = useCallback(async (keysToSave: string[]) => {
    const entries = keysToSave
      .filter((k) => dirtyKeys.has(k) && localValues[k])
      .map((k) => ({ name: k, value: localValues[k] }));

    if (entries.length === 0) return;
    setIsSaving(true);
    setSaveResult(null);

    try {
      const results: VaultSaveResult[] = await saveApiKeys(entries);
      const failures = results.filter((r) => !r.success);

      if (failures.length === 0) {
        setSaveResult({ type: 'success', message: `${results.length} key(s) saved and verified` });
        setDirtyKeys((prev) => {
          const next = new Set(prev);
          entries.forEach((e) => next.delete(e.name));
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ['vault-key-status'] });
        toast({ title: 'Keys saved', description: `${results.length} key(s) saved and verified` });
      } else {
        const failNames = failures.map((f) => f.name).join(', ');
        setSaveResult({ type: 'error', message: `Failed to verify: ${failNames}. ${failures[0]?.error ?? 'Try again.'}` });
        toast({ title: 'Save issue', description: `Some keys failed verification: ${failNames}`, variant: 'destructive' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSaveResult({ type: 'error', message: msg });
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
      setSavingSection(null);
    }
  }, [dirtyKeys, localValues, queryClient, toast]);

  const handleSaveAll = () => handleSave(Array.from(dirtyKeys));

  const handleSaveSection = (sectionId: string) => {
    const section = API_KEY_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    setSavingSection(sectionId);
    const sectionKeys = section.keys.map((k) => k.envVar);
    handleSave(sectionKeys);
  };

  const totalDirty = dirtyKeys.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">API Keys & Integrations</h1>
            <p className="text-sm text-muted-foreground">
              Manage provider credentials — stored encrypted in Vault
            </p>
          </div>
        </div>
        {totalDirty > 0 && (
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All ({totalDirty})
          </Button>
        )}
      </div>

      {/* Status Overview */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {API_KEY_SECTIONS.map((s) => (
            <Skeleton key={s.id} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {API_KEY_SECTIONS.map((section) => {
            const total = section.keys.filter((k) => !k.modelOptions).length;
            const set = section.keys.filter((k) => !k.modelOptions && savedStatus?.[k.envVar]).length;
            const ratio = total > 0 ? set / total : 0;
            return (
              <div
                key={section.id}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/30 bg-card/30 text-center"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      ratio === 1 ? 'bg-emerald-500' : ratio > 0 ? 'bg-amber-500' : 'bg-muted-foreground/30'
                    }`}
                  />
                  <span className="text-xs font-medium truncate">{section.emoji}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {set}/{total}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Save result alert */}
      {saveResult && (
        <Alert variant={saveResult.type === 'error' ? 'destructive' : 'default'}>
          {saveResult.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{saveResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {API_KEY_SECTIONS.map((section) => (
          <KeySection
            key={section.id}
            section={section}
            values={localValues}
            savedStatus={savedStatus ?? {}}
            dirtyKeys={dirtyKeys}
            isLoading={isLoading}
            isSaving={isSaving && (savingSection === section.id || savingSection === null)}
            onValueChange={handleValueChange}
            onSaveSection={() => handleSaveSection(section.id)}
          />
        ))}
      </div>
    </div>
  );
}
