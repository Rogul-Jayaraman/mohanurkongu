import React from 'react';

interface ImageObject {
  url: string;
  width?: number | null;
  height?: number | null;
}

interface MediaImageProps {
  image?: ImageObject | null;
  uploadId?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
}

const resolveUrl = (url: string): string => {
  if (/^(https?:\/\/)/.test(url)) return url;
  if (url.startsWith('/media/')) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    return `${API_BASE}${url}`;
  }
  return url;
};

const getMediaUrl = (uploadId: string): string => {
  if (/^(https?:\/\/)/.test(uploadId)) return uploadId;
  if (uploadId.startsWith('/media/')) return resolveUrl(uploadId);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return `${API_BASE}/media/${uploadId}.webp`;
};

export const MediaImage: React.FC<MediaImageProps> = ({
  image,
  uploadId,
  alt = '',
  className = '',
  fallback,
  onClick,
}) => {
  const rawSrc = image?.url || (uploadId ? getMediaUrl(uploadId) : null);
  const src = rawSrc ? resolveUrl(rawSrc) : null;

  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={image?.width ?? undefined}
      height={image?.height ?? undefined}
      className={className}
      loading="lazy"
      decoding="async"
      onClick={onClick}
    />
  );
};
