import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_TTL = 3600; // 1 hour

const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Resolve a storage reference to a usable URL.
 * Accepts either a full http(s) URL (legacy) or a storage path.
 * Returns a signed URL for paths in private buckets.
 */
export async function resolveStorageUrl(
  bucket: string,
  pathOrUrl: string | null | undefined,
): Promise<string | null> {
  if (!pathOrUrl) return null;
  // Legacy: full URL already stored
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    // Try to extract storage path from a Supabase URL so we can sign it
    const m = pathOrUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/[^/]+\/(.+?)(?:\?.*)?$/);
    if (!m) return pathOrUrl;
    pathOrUrl = decodeURIComponent(m[1]);
  }

  const cacheKey = `${bucket}:${pathOrUrl}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now + 60_000) return cached.url;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathOrUrl, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return null;

  cache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: now + SIGNED_URL_TTL * 1000,
  });
  return data.signedUrl;
}

export function useSignedStorageUrl(
  bucket: string,
  pathOrUrl: string | null | undefined,
): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    resolveStorageUrl(bucket, pathOrUrl).then(u => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [bucket, pathOrUrl]);
  return url;
}
