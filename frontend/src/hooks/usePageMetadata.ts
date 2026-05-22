import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import logoSrc from '@/assets/images/metadata-logo.png';

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const parts = selector.match(/\[(\w+)=['"]([^'"]+)['"]\]/);
    if (parts) {
      el.setAttribute(parts[1], parts[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function usePageMetadata(namespace: string, key: string) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!t) return;
    const title = t(`${namespace}:${key}.title`);
    const desc = t(`${namespace}:${key}.desc`);

    if (title) {
      document.title = title;
      setMeta('meta[property="og:title"]', 'content', title);
    }

    if (desc) {
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[property="og:description"]', 'content', desc);
    }

    setMeta('meta[property="og:image"]', 'content', logoSrc);
    setMeta('meta[name="twitter:image"]', 'content', logoSrc);

    const icon = document.querySelector('link[rel="icon"]');
    if (icon) {
      icon.setAttribute('href', logoSrc);
      icon.setAttribute('type', 'image/png');
    }
  }, [namespace, key, t]);
}
