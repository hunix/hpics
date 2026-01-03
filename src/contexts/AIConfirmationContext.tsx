import React, { createContext, useContext, ReactNode } from 'react';
import { useAIConfirmation, AIRequestConfig } from '@/hooks/useAIConfirmation';
import { AIConfirmationDialog } from '@/components/ai/AIConfirmationDialog';
import { Json } from '@/integrations/supabase/types';

interface AIConfirmationContextValue {
  requestConfirmation: (config: AIRequestConfig) => Promise<{ approved: boolean; logId?: string }>;
  updateLogWithResult: (
    logId: string,
    result: {
      status: 'completed' | 'failed';
      actualInputTokens?: number;
      actualOutputTokens?: number;
      actualCostCents?: number;
      responseTimeMs?: number;
      errorMessage?: string;
      responseMetadata?: Record<string, Json>;
    }
  ) => Promise<void>;
}

const AIConfirmationContext = createContext<AIConfirmationContextValue | null>(null);

export function AIConfirmationProvider({ children }: { children: ReactNode }) {
  const {
    confirmationState,
    requestConfirmation,
    confirmRequest,
    cancelRequest,
    updateLogWithResult,
  } = useAIConfirmation();

  return (
    <AIConfirmationContext.Provider value={{ requestConfirmation, updateLogWithResult }}>
      {children}
      <AIConfirmationDialog
        state={confirmationState}
        onConfirm={confirmRequest}
        onCancel={cancelRequest}
      />
    </AIConfirmationContext.Provider>
  );
}

export function useAIConfirmationContext() {
  const context = useContext(AIConfirmationContext);
  if (!context) {
    throw new Error('useAIConfirmationContext must be used within AIConfirmationProvider');
  }
  return context;
}
