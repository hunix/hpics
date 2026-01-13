// Document Integrity Hook - SHA-256 hash verification with DB persistence
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
  fileSize?: number;
  fileName?: string;
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

  // Hash a document and store the hash in document_hashes table
  const hashDocument = useCallback(async (
    documentId: string,
    file: File | Blob,
    metadata?: { fileName?: string }
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const hash = await computeHash(arrayBuffer);
      
      // Store hash in document_hashes table
      const { error } = await supabase
        .from('document_hashes')
        .upsert({
          user_id: user.id,
          document_id: documentId,
          document_type: 'file',
          hash: hash,
          algorithm: 'SHA-256',
          file_size: file.size,
          is_valid: true,
          metadata: { fileName: metadata?.fileName || (file instanceof File ? file.name : null) },
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,document_id'
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
      
      // Get stored hash from document_hashes table
      const { data, error } = await supabase
        .from('document_hashes')
        .select('hash, created_at')
        .eq('user_id', user.id)
        .eq('document_id', documentId)
        .maybeSingle();

      const storedHash = error ? null : data?.hash;
      const isValid = storedHash !== null && hashesMatch(storedHash, computedHash);
      
      const result: IntegrityResult = {
        isValid,
        storedHash,
        computedHash,
        verifiedAt: new Date().toISOString(),
        documentId,
      };

      setLastResult(result);

      // Update last_verified_at timestamp
      if (data && !error) {
        await supabase
          .from('document_hashes')
          .update({ last_verified_at: result.verifiedAt, is_valid: isValid })
          .eq('user_id', user.id)
          .eq('document_id', documentId);
      }
      
      if (!isValid && storedHash) {
        console.warn('Document integrity check failed:', { documentId });
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
      .from('document_hashes')
      .select('id, document_id, hash, algorithm, file_size, metadata, created_at')
      .eq('user_id', user.id)
      .eq('document_id', documentId)
      .maybeSingle();

    if (error || !data) return null;

    const metadata = data.metadata as Record<string, string> | null;
    return {
      id: data.id,
      documentId: data.document_id,
      hash: data.hash,
      algorithm: data.algorithm,
      createdAt: data.created_at,
      createdBy: user.id,
      fileSize: data.file_size || undefined,
      fileName: metadata?.fileName || undefined,
    };
  }, [user]);

  // Remove hash (when document is deleted)
  const removeHash = useCallback(async (documentId: string): Promise<void> => {
    if (!user) return;

    await supabase
      .from('document_hashes')
      .delete()
      .eq('user_id', user.id)
      .eq('document_id', documentId);
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
