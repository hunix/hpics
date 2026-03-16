/**
 * @fileoverview Collapsible section for a group of API keys
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { KeyInput } from './KeyInput';
import type { ApiKeySection } from '@/lib/integrations/api-keys-registry';

interface KeySectionProps {
  section: ApiKeySection;
  values: Record<string, string>;
  savedStatus: Record<string, boolean>;
  dirtyKeys: Set<string>;
  isLoading: boolean;
  isSaving: boolean;
  onValueChange: (envVar: string, value: string) => void;
  onSaveSection: () => void;
}

export function KeySection({
  section,
  values,
  savedStatus,
  dirtyKeys,
  isLoading,
  isSaving,
  onValueChange,
  onSaveSection,
}: KeySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalKeys = section.keys.filter((k) => !k.modelOptions).length;
  const savedCount = section.keys.filter((k) => !k.modelOptions && savedStatus[k.envVar]).length;
  const unsavedCount = section.keys.filter((k) => dirtyKeys.has(k.envVar)).length;
  const Icon = section.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border/50 rounded-lg bg-card/30 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
          >
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold flex-1">
              {section.emoji} {section.label}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              {savedCount}/{totalKeys} set
            </Badge>
            {unsavedCount > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 dark:text-amber-400 shrink-0">
                {unsavedCount} unsaved
              </Badge>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {section.keys.map((keyDef) => (
              <KeyInput
                key={keyDef.envVar}
                keyDef={keyDef}
                value={values[keyDef.envVar] ?? ''}
                savedInVault={!!savedStatus[keyDef.envVar]}
                isDirty={dirtyKeys.has(keyDef.envVar)}
                isLoading={isLoading}
                onChange={(val) => onValueChange(keyDef.envVar, val)}
              />
            ))}
            {unsavedCount > 0 && (
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={onSaveSection} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Section
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
