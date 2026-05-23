import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/lib/api';

export interface ContactAIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  saved?: boolean;
}

export interface SaveInsightInput {
  profileId: string;
  question: string;
  content: string;
  saveAs: string;
  category?: string;
  importance: string;
  tags?: string[];
}

export interface StreamAnswerInput {
  profileId: string;
  question: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  /**
   * Invoked for every partial assistant token. The component owns message
   * state — this callback is how the hook returns deltas without holding
   * its own React state.
   */
  onDelta: (partial: string) => void;
}

async function authBearer(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

/**
 * Stream an answer from contact-ai-agent. Resolves to the full assistant
 * message once the SSE stream completes.
 */
export function useStreamContactAIAnswer() {
  return useCallback(async (input: StreamAnswerInput): Promise<string> => {
    const accessToken = await authBearer();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

    const response = await fetch(`${supabaseUrl}/functions/v1/contact-ai-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        profileId: input.profileId,
        question: input.question,
        conversationHistory: input.conversationHistory,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let assistantContent = '';
    let buffer = '';

    const consume = (line: string) => {
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) return;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') return;
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') {
          assistantContent += delta;
          input.onDelta(assistantContent);
        }
      } catch {
        // partial JSON; defer to next chunk
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        consume(line);
      }
    }
    if (buffer.trim()) {
      for (const raw of buffer.split('\n')) consume(raw);
    }
    return assistantContent;
  }, []);
}

/**
 * Persist an assistant message as a structured insight via the
 * save-ai-insight edge function.
 */
export function useSaveAIInsight() {
  return useCallback(async (input: SaveInsightInput) => {
    const { data, error } = await invokeFunction('save-ai-insight', {
        profileId: input.profileId,
        content: input.content,
        question: input.question,
        saveAs: input.saveAs,
        category: input.category,
        importance: input.importance,
        tags: input.tags,
      },);
    if (error) throw error;
    return data;
  }, []);
}
