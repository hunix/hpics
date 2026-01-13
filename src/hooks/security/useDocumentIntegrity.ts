// Document Integrity Hook - SHA-256 hash verification
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IntegrityResult {
  isValid: boolean;
  storedHash: string | null;
  computedHash: string;
  verifiedAt: string;
  documentId: string;
}

interface DocumentHash {
  id: string;
  documentId: string;
  hash: string;
  algorithm: string;
  createdAt: string;
  createdBy: string;
}

// Compute SHA-256 hash of file
async function computeHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Read file as ArrayBuffer
async function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function useDocumentIntegrity() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<IntegrityResult | null>(null);

  // Hash a document and store the hash
  const hashDocument = useCallback(async (
    documentId: string,
    file: File | Blob
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const hash = await computeHash(arrayBuffer);
      
      // Store hash in app_settings or a dedicated table
      // Using app_settings with a special key pattern for simplicity
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          setting_key: `document_hash_${documentId}`,
          setting_value: hash,
          metadata: {
            algorithm: 'SHA-256',
            createdAt: new Date().toISOString(),
            fileSize: file.size,
            fileType: file.type,
          },
        });

      if (error) {
        console.error('Failed to store document hash:', error);
        throw error;
      }

      return hash;
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  // Verify document against stored hash
  const verifyDocument = useCallback(async (
    documentId: string,
    file: File | Blob
  ): Promise<IntegrityResult> => {
    if (!user) throw new Error('User not authenticated');
    
    setIsProcessing(true);
    
    try {
      // Compute current hash
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const computedHash = await computeHash(arrayBuffer);
      
      // Get stored hash
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', `document_hash_${documentId}`)
        .single();

      const storedHash = error ? null : data?.setting_value;
      const isValid = storedHash === computedHash;
      
      const result: IntegrityResult = {
        isValid,
        storedHash,
        computedHash,
        verifiedAt: new Date().toISOString(),
        documentId,
      };

      setLastResult(result);
      
      // Log verification attempt
      if (!isValid && storedHash) {
        console.warn('Document integrity check failed:', {
          documentId,
          storedHash,
          computedHash,
        });
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  // Get stored hash for a document
  const getStoredHash = useCallback(async (
    documentId: string
  ): Promise<DocumentHash | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('setting_key', `document_hash_${documentId}`)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      documentId,
      hash: data.setting_value || '',
      algorithm: (data.metadata as Record<string, string>)?.algorithm || 'SHA-256',
      createdAt: (data.metadata as Record<string, string>)?.createdAt || data.created_at || '',
      createdBy: data.user_id,
    };
  }, [user]);

  // Remove hash (when document is deleted)
  const removeHash = useCallback(async (documentId: string): Promise<void> => {
    if (!user) return;

    await supabase
      .from('app_settings')
      .delete()
      .eq('user_id', user.id)
      .eq('setting_key', `document_hash_${documentId}`);
  }, [user]);

  // Batch verify multiple documents
  const verifyMultiple = useCallback(async (
    documents: Array<{ id: string; file: File | Blob }>
  ): Promise<IntegrityResult[]> => {
    const results: IntegrityResult[] = [];
    
    for (const doc of documents) {
      const result = await verifyDocument(doc.id, doc.file);
      results.push(result);
    }
    
    return results;
  }, [verifyDocument]);

  // Compute hash without storing (for comparison)
  const computeFileHash = useCallback(async (file: File | Blob): Promise<string> => {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    return computeHash(arrayBuffer);
  }, []);

  return {
    hashDocument,
    verifyDocument,
    getStoredHash,
    removeHash,
    verifyMultiple,
    computeFileHash,
    isProcessing,
    lastResult,
  };
}

// Utility function for hashing strings
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return computeHash(data.buffer);
}

// Utility for comparing hashes safely
export function hashesMatch(hash1: string, hash2: string): boolean {
  if (hash1.length !== hash2.length) return false;
  
  let result = 0;
  for (let i = 0; i < hash1.length; i++) {
    result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
  }
  return result === 0;
}
