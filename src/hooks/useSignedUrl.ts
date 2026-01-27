import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSignedUrlOptions {
  bucket: 'media' | 'documents' | 'recordings' | 'mosaics';
  path: string | null | undefined;
  expiresIn?: number; // seconds, default 1 hour
}

export function useSignedUrl({ bucket, path, expiresIn = 3600 }: UseSignedUrlOptions) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    let mounted = true;

    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

        if (!mounted) return;
        if (signError) throw signError;
        setSignedUrl(data.signedUrl);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error('Failed to get signed URL'));
        setSignedUrl(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSignedUrl();
    
    return () => {
      mounted = false;
    };
  }, [bucket, path, expiresIn]);

  return { signedUrl, isLoading, error };
}

// Utility function to get signed URL imperatively (for downloads, etc.)
export async function getSignedUrl(
  bucket: 'media' | 'documents' | 'recordings' | 'mosaics',
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Batch function for multiple files
export async function getSignedUrls(
  bucket: 'media' | 'documents' | 'recordings' | 'mosaics',
  paths: string[],
  expiresIn = 3600
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, expiresIn);

  if (error || !data) {
    console.error('Failed to get signed URLs:', error);
    return urlMap;
  }

  data.forEach((item, index) => {
    if (item.signedUrl) {
      urlMap.set(paths[index], item.signedUrl);
    }
  });

  return urlMap;
}
