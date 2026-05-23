import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', '..', 'locales');

type TranslationMap = Record<string, string>;

function loadLocale(file: string): TranslationMap {
  try {
    const content = readFileSync(join(localesDir, file), 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

const bundles: Record<string, Record<string, TranslationMap>> = {
  en: {
    errors: loadLocale(join('en', 'errors.json')),
    validation: loadLocale(join('en', 'validation.json')),
  },
  ta: {
    errors: loadLocale(join('ta', 'errors.json')),
    validation: loadLocale(join('ta', 'validation.json')),
  },
};

export function translate(code: string, lang: string = 'en', namespace: 'errors' | 'validation' = 'errors'): string {
  const bundle = bundles[lang]?.[namespace] ?? bundles['en'][namespace];
  return bundle[code] ?? code;
}

export function supportedLanguage(lang: string): string {
  return ['en', 'ta'].includes(lang) ? lang : 'en';
}
