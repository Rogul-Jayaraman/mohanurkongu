export const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  if (url.startsWith('/media/')) return `${base}${url}`;
  if (url.startsWith('/')) return `${base}${url}`;
  if (/^upl_[0-9a-f]{12}$/i.test(url)) return `${base}/media/by-token/${url}`;
  return `${base}/media/${url}`;
};
