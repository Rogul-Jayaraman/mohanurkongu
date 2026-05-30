import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const SITE_URL = 'https://mohanurkongu.com';

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

function ensureLink(rel: string, href: string, extra?: Record<string, string>) {
  const existing = document.querySelector(`link[rel="${rel}"]`);
  if (existing) {
    existing.setAttribute('href', href);
    return;
  }
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      link.setAttribute(k, v);
    }
  }
  document.head.appendChild(link);
}

function setCanonical(pathname: string) {
  const url = `${SITE_URL}${pathname}`;
  ensureLink('canonical', url);
}

function setHreflang(pathname: string) {
  ensureLink('alternate', `${SITE_URL}${pathname}`, { hreflang: 'x-default' });
}

function injectSchema(id: string, data: Record<string, unknown>) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data });
  document.head.appendChild(script);
}

function removeSchema(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function segmentToName(segment: string): string {
  const map: Record<string, string> = {
    'maaligai': 'Maaligai',
    'manamaalai': 'Manamaalai',
    'about': 'About',
    'facilities': 'Facilities',
    'gallery': 'Gallery',
    'packages': 'Packages',
    'contact': 'Contact',
    'hall-availability': 'Hall Availability',
    'login': 'Login',
    'signup': 'Sign Up',
    'forgot-password': 'Forgot Password',
    'view-profile': 'View Profile',
    'plan-upgrade': 'Plan Upgrade',
    'dashboard': 'Dashboard',
    'browse-profiles': 'Browse Profiles',
    'shortlist': 'Shortlist',
    'my-profiles': 'My Profiles',
    'my-account': 'My Account',
    'new-profile': 'New Profile',
  };
  return map[segment] || segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function injectOrganizationSchema() {
  injectSchema('organization-schema', {
    '@type': 'Organization',
    name: 'Mohanur Kongu',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description: 'Kongu Velala Goundarkal Samudhaya Nala Arakkattalai - Mohanur',
    foundingDate: '2024',
  });
}

function injectWebSiteSchema() {
  injectSchema('website-schema', {
    '@type': 'WebSite',
    name: 'Mohanur Kongu',
    url: SITE_URL,
    description: 'Kongu Velala Goundarkal Samudhaya Nala Arakkattalai - Mohanur',
    inLanguage: ['en', 'ta'],
  });
}

function injectBreadcrumbSchema(pathname: string) {
  removeSchema('breadcrumb-schema');
  if (pathname === '/' || pathname === '') return;

  const parts = pathname.split('/').filter(Boolean);
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
  ];

  let cumulative = '';
  for (let i = 0; i < parts.length; i++) {
    cumulative += '/' + parts[i];
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: segmentToName(parts[i]),
      item: SITE_URL + cumulative,
    });
  }

  const script = document.createElement('script');
  script.id = 'breadcrumb-schema';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  });
  document.head.appendChild(script);
}

function injectLocalBusinessSchema() {
  injectSchema('localbusiness-schema', {
    '@type': 'LocalBusiness',
    name: 'Mohanur Kongu Maaligai',
    url: `${SITE_URL}/maaligai`,
    image: `${SITE_URL}/og-image.png`,
    description: 'Kongu Velala Goundarkal Samudhaya Nala Arakkattalai - Wedding Hall & Event Venue in Mohanur',
    foundingDate: '2024',
  });
}

function injectWeddingVenueSchema() {
  injectSchema('weddingvenue-schema', {
    '@type': 'EventVenue',
    name: 'Mohanur Kongu Maaligai',
    url: `${SITE_URL}/maaligai`,
    image: `${SITE_URL}/og-image.png`,
    description: 'Kongu Velala Goundarkal Samudhaya Nala Arakkattalai - Wedding Hall & Event Venue in Mohanur',
  });
}

function injectContactPointSchema() {
  injectSchema('contactpoint-schema', {
    '@type': 'Organization',
    name: 'Mohanur Kongu',
    url: SITE_URL,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'general',
      telephone: '+91-',
      availableLanguage: ['en', 'ta'],
    },
  });
}

export function usePageMetadata(namespace: string, key: string) {
  const { t, language } = useLanguage();

  useEffect(() => {
    injectOrganizationSchema();
    injectWebSiteSchema();
    injectContactPointSchema();
  }, []);

  useEffect(() => {
    if (!t) return;
    const title = t(`${namespace}:${key}.title`);
    const desc = t(`${namespace}:${key}.desc`);

    if (title) {
      document.title = title;
      setMeta('meta[property="og:title"]', 'content', title);
      setMeta('meta[name="twitter:title"]', 'content', title);
    }

    if (desc) {
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[property="og:description"]', 'content', desc);
      setMeta('meta[name="twitter:description"]', 'content', desc);
    }

    const ogUrl = `${SITE_URL}${window.location.pathname}`;
    setMeta('meta[property="og:image"]', 'content', `${SITE_URL}/og-image.png`);
    setMeta('meta[name="twitter:image"]', 'content', `${SITE_URL}/og-image.png`);
    setMeta('meta[property="og:url"]', 'content', ogUrl);

    setCanonical(window.location.pathname);
    setHreflang(window.location.pathname);
    injectBreadcrumbSchema(window.location.pathname);
  }, [namespace, key, t, language]);

  useEffect(() => {
    if (!namespace.startsWith('maaligai')) return;
    injectLocalBusinessSchema();
    injectWeddingVenueSchema();
  }, [namespace, language]);
}
