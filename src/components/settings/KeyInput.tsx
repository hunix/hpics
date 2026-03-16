/**
 * @fileoverview Individual API key input with show/hide, instructions, test button
 */

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ApiKeyDef } from '@/lib/integrations/api-keys-registry';
import { invokeFunction } from '@/lib/api';

interface KeyInputProps {
  keyDef: ApiKeyDef;
  value: string;
  savedInVault: boolean;
  isDirty: boolean;
  isLoading: boolean;
  onChange: (value: string) => void;
}

export function KeyInput({ keyDef, value, savedInVault, isDirty, isLoading, onChange }: KeyInputProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const isModelSelector = !!keyDef.modelOptions;
  const isPasswordType = keyDef.isSecret && !keyDef.isUrl && !isModelSelector;

  const handleTest = async () => {
    setTestState('testing');
    try {
      const result = await invokeFunction('test-api-key', {
        provider: keyDef.envVar,
        apiKey: value,
      });
      
      const data = result as unknown as { success?: boolean; message?: string };
      if (data?.success) {
        setTestState('success');
        setTestMessage(data.message ?? 'Connected');
      } else {
        setTestState('failed');
        setTestMessage(data?.message ?? 'Invalid key');
      }
    } catch (err: unknown) {
      setTestState('failed');
      setTestMessage(err instanceof Error ? err.message : 'Test failed');
    }
    setTimeout(() => setTestState('idle'), 5000);
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-card/50">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-card/50">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-sm font-medium truncate" htmlFor={keyDef.envVar}>
            {keyDef.label}
          </label>
          {isDirty ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 dark:text-amber-400 shrink-0">
              Unsaved
            </Badge>
          ) : savedInVault ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              Saved
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {keyDef.portalUrl && (
            <a
              href={keyDef.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              Get key <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Input */}
      {isModelSelector ? (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger id={keyDef.envVar} className="w-full">
            <SelectValue placeholder="Select model..." />
          </SelectTrigger>
          <SelectContent>
            {keyDef.modelOptions!.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={keyDef.envVar}
              type={isPasswordType && !showSecret ? 'password' : 'text'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={savedInVault ? '••••••••••••' : 'Not configured'}
              className="pr-10"
              aria-label={keyDef.label}
            />
            {isPasswordType && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10"
                onClick={() => setShowSecret(!showSecret)}
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
          {keyDef.testable && value && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testState === 'testing'}
              className={cn(
                'shrink-0 min-w-[80px]',
                testState === 'success' && 'border-emerald-500/50 text-emerald-600',
                testState === 'failed' && 'border-destructive/50 text-destructive'
              )}
            >
              {testState === 'testing' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {testState === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {testState === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
              {testState === 'testing' ? 'Testing' : testState === 'success' ? 'Valid' : testState === 'failed' ? 'Failed' : 'Test'}
            </Button>
          )}
        </div>
      )}

      {/* Test error message */}
      {testState === 'failed' && testMessage && (
        <p className="text-xs text-destructive">{testMessage}</p>
      )}

      {/* Instructions toggle */}
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        {showInstructions ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        How to generate
      </button>
      {showInstructions && (
        <p className="text-xs text-muted-foreground pl-4 leading-relaxed">
          {keyDef.howToGet}
        </p>
      )}
    </div>
  );
}
