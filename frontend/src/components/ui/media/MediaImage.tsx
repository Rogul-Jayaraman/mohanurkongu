import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

interface MediaImageProps {
  uploadId: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  uploadId,
  alt = '',
  className = '',
  fallback,
  onClick,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const revoke = (url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!uploadId) {
      revoke(objectUrlRef.current);
      objectUrlRef.current = null;
      setObjectUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    api
      .get(`/media/${uploadId}`, { responseType: 'blob' })
      .then((res: any) => {
        if (cancelled) return;
        const blob = res instanceof Blob ? res : (res.data instanceof Blob ? res.data : null);
        if (!blob) {
          setError(true);
          setLoading(false);
          return;
        }
        revoke(objectUrlRef.current);
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setObjectUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uploadId]);

  useEffect(() => {
    return () => {
      revoke(objectUrlRef.current);
      objectUrlRef.current = null;
    };
  }, []);

  if (!uploadId || error) {
    return fallback ? <>{fallback}</> : null;
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-ivory/50 ${className}`}>
        <div className="size-8 rounded-full border-2 border-rosewood/20 border-t-rosewood animate-spin" />
      </div>
    );
  }

  if (!objectUrl) return null;

  return <img src={objectUrl} alt={alt} className={className} onClick={onClick} />;
};
