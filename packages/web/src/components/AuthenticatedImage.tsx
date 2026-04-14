import { useEffect, useState } from 'react';
import { API_ORIGIN } from '@/api/client.js';
import { getAccessToken } from '@/auth/tokenStorage.js';

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Fetches an image from the authenticated API endpoint (adds Bearer token),
 * converts the response to a blob URL, and renders a standard <img>.
 *
 * Why: <img src> tags don't send Authorization headers, so photos served by
 * the authenticated GET /collections/photos/:filename endpoint can't be loaded
 * directly. This component bridges that gap without exposing the token in URLs.
 *
 * Blob URL is revoked on unmount to prevent memory leaks.
 */
export function AuthenticatedImage({ src, alt, className, fallback }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    let objectUrl: string | null = null;
    const token = getAccessToken();

    fetch(`${API_ORIGIN}/api${src}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Photo load failed');
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setBlobUrl(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!blobUrl) return fallback ? <>{fallback}</> : null;
  return <img src={blobUrl} alt={alt} className={className} />;
}
