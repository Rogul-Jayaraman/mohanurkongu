export const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
};
